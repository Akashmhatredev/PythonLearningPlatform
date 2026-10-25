# Content guide — writing Python Learning Platform lessons

Every lesson is one ES module at `src/content/lessons/<level-id>/<lesson-id>.js` that
`export default`s a plain object. The level and lesson ids come from
`src/content/curriculum.js`. The reference implementation is
`src/content/lessons/basics/variables-and-names.js` — read it first and match its quality.

Lesson files must be **pure data**: no `import` statements, no Vite-only syntax.
Shared code strings and the `py` helper (below) may be declared as `const` at the top.

Validate while you work (Node 20.19+ required, Node 24 is installed via nvm):

```bash
export PATH=~/.nvm/versions/node/v24.18.0/bin:$PATH
LESSONS=lists,sets npm run validate:content
```

The validator checks the schema, compiles every Python file, test and prose code block
with **CPython 3.14** (Pyodide — the exact interpreter the browser playground uses), runs
every playground and project solution, runs every exercise's tests against its
**solution** (must all pass) and its **starter** (must fail at least one), checks that
guided experiments fail on the untouched playground, and traces every `code-tracer`
visual. A lesson is done only when it is green.

---

## 1. Teaching standard

- **Audience:** a curious 15-year-old with no background, who will grow into a
  professional. Define every technical term the first time it appears
  ("a *function* is…"). Never rely on an undefined term.
- **Intuition first, precision second.** Start from the idea and an everyday
  analogy, then the code, then the line-by-line explanation, then what happens
  internally, then edge cases and production practice.
- **Teach, don't list.** Explain *why* each rule exists. Use concrete, realistic
  examples (shopping carts, grade books, playlists, sensor readings, log files) — not `foo`/`bar`.
- **Depth scales with the topic.** Simple topics stay short; advanced topics get a
  genuinely deep `internals` with all three layers (beginner / technical /
  production). Don't pad.
- **Tone:** direct, warm, a little playful, never childish. Short paragraphs.
  No "In this lesson we will…" filler.
- **Pythonic code.** Follow PEP 8 (4-space indents, `snake_case`, `CapWords` classes),
  prefer the idiomatic tool (`enumerate`, comprehensions, `with`, f-strings, `pathlib`).
  Show the non-idiomatic version only to contrast it.

## 2. Accuracy rules (non-negotiable)

- Teach **Python 3** as it is today. The playground runs **CPython 3.14**. Code must run on
  3.10+ unless the lesson is about a newer feature — then say so.
- **Label version-specific features** with a `version` callout or "(3.x+)":
  `match` (3.10), `X | Y` union types (3.10), `zip(strict=True)` (3.10),
  `ExceptionGroup`/`except*`, `asyncio.TaskGroup`, `asyncio.timeout()`, `tomllib`, `typing.Self` (3.11),
  PEP 695 type parameters `def f[T](...)` and the `type` statement, `itertools.batched` (3.12),
  experimental free-threaded build and the new REPL (3.13),
  deferred evaluation of annotations (PEP 649/749), template strings `t"..."` (PEP 750),
  `except A, B:` without brackets (PEP 758), officially supported free-threaded build (3.14).
  If you are not sure which version introduced something, leave the version out or check.
- **Separate three kinds of truth** and say which one you are stating:
  1. *Language guarantees* (true in every Python): e.g. dicts keep insertion order (3.7+).
  2. *CPython implementation details*: small-int cache (-5…256), string interning, reference
     counting, `id()` being a memory address, the GIL, bytecode. Mark them with a callout:
     `{ callout: 'note', title: 'CPython detail', text: '…' }` and say other implementations may differ.
  3. *Conventions*: PEP 8, `_private` names, `__all__`.
- Primary references: [Python docs](https://docs.python.org/3/), [PEPs](https://peps.python.org/),
  [Python Packaging User Guide](https://packaging.python.org/), [pytest](https://docs.pytest.org/),
  [mypy](https://mypy.readthedocs.io/). Every lesson links at least one official page in `docs`.
- Label simplified demonstrations as **simplified** and say what production code
  would add. Never present a toy implementation as production-ready.
- **Never invent numbers** — no fabricated benchmarks, percentages or stats. Timing claims
  are qualitative ("much faster for large lists") unless the learner measures them live.
- Security advice must be correct: parameterised SQL, never `eval` untrusted input,
  never unpickle untrusted data, hash passwords with a slow KDF (argon2/bcrypt/scrypt/PBKDF2).

## 3. Strings, escaping and the `py` helper (the #1 source of broken files)

Lesson text lives in JavaScript template literals, where `\n` would become a real newline
and break Python string literals. **Start every lesson file with this helper** and write
every template literal — code *and* prose — as `` py`…` ``:

```js
// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')
```

Inside `` py`…` ``:

- backslashes are kept exactly as typed: `print("a\nb")`, `r"\d+"`, `"C:\\Users"` all work;
- write `` \` `` for a literal backtick (markdown inline code) and `\${` for a literal `${`
  (e.g. an f-string with a dollar sign: `` py`print(f"\${price:.2f}")` `` prints `$4.50`);
- avoid a backslash directly before `$` or a backtick (e.g. the regex `\$`): the helper would drop
  that backslash. Use `[$]` in regexes instead. In markdown, write inline code containing a backslash
  with double-backtick spans if needed.
- plain `'…'` strings are *not* raw: `'\d'` silently loses its backslash — use `` py`…` `` for anything
  with backslashes.

Short single-line text may use normal `'…'` strings (escape `'` inside them).

## 4. Lesson object

Fields marked * are required for normal lessons. "Rich" means: a markdown string,
or an array mixing markdown strings, code objects `{ code, lang, title?, highlight?, static? }`
and callouts `{ callout: 'tip'|'warn'|'note'|'version', title?, text }`.
Use `lang: 'python'` for Python, `'pycon'` for interactive `>>>` sessions, `'bash'` for terminal
commands, `'toml'`/`'json'`/`'text'` for files. **Every `python` code block (and every
```` ```python ```` fence in markdown) must compile**; mark intentional fragments or broken code with
`static: true` (or use `pycon`/`text`).

| field | type | notes |
|---|---|---|
| `id`* | string | equals the file name |
| `title`*, `summary`* | string | summary is one sentence |
| `difficulty`* | `'beginner'|'intermediate'|'advanced'` | |
| `minutes`* | number | honest reading + doing time |
| `prerequisites`, `related` | lesson id[] | must exist in curriculum.js |
| `tags`* | string[] | search keywords |
| `apis` | `{ name, summary }[]` | API reference entries for search (`'str.split()'`, `'enumerate()'`) |
| `docs`* | `{ label, url }[]` | https official docs |
| `intro`*, `why`*, `eli15`* | Rich | what it is · why it exists · explained to a 15-year-old |
| `analogy`* | `{ title, body: Rich, mapping?: [concept, meaning][] }` | everyday-life analogy |
| `visual` | Visual | static or interactive illustration ("Picture it") |
| `syntax`* | Rich | syntax and rules |
| `walkthrough` | `{ title?, lang: 'python', code, intro?, steps: [{ lines: [n] or [start,end], text }] }` | if `code` equals the playground's `main.py`, the playground's **Guide** mode reuses these steps |
| `playground`* | Playground | the live, editable example |
| `animation` | Visual | animated explanation ("Watch it work") |
| `internals` | Rich, or `{ beginner, technical, production }` | use the 3-layer object for intermediate/advanced topics |
| `mistakes` | `{ title, wrong?: Code, right?: Code, explanation }[]` | Code = `{ code, lang: 'python', title?, static? }` |
| `debugging` | `{ symptom, cause, fix }[]` | symptoms are real error messages where possible |
| `bestPractices`, `useCases` | string[] | |
| `whenToUse` | `{ use: string[], avoid: string[] }` | |
| `comparison` | `{ title?, headers: string[], rows: string[][], note? }` | each row has `headers.length` cells; first cell is the row label |
| `quiz`* | QuizQuestion[] (≥4, ≥2 auto-graded) | |
| `exercises`* | Exercise[] (≥1, usually 2) | |
| `interview`* | InterviewQuestion[] (≥4, usually 5–7) | |
| `takeaways`* | string[] (≥3) | |
| `completion` | `{ requireRun?, quizPass?, exercises? }` | rarely needed |
| `next` | lesson id | only to override curriculum order |

At least one of `visual` / `animation` is required. Prefer a `code-tracer` for anything
about how code executes, plus a second visual where a specialised one fits.

### Playground

```js
playground: {
  title: 'Shopping cart',
  objective: 'One sentence: what to try.',
  files: { 'main.py': py`...`, 'cart.py': py`...`, 'prices.csv': py`...` },  // entry: main.py
  entry: 'main.py',            // optional
  stdin: 'Ada\n3',             // optional: lines pre-typed into the Input tab (one per input() call)
  expected: 'What the learner should see in the output (markdown).',
  experiments: [               // 3–4 guided experiments
    {
      id: 'discount',
      task: 'Change … so that …',          // markdown
      hint: 'Look at line …',              // optional
      tests: [{ name: '…', code: py`assert …` }],   // optional; MUST fail on the original files
      explain: 'Why it worked (shown after completion).',
    },
  ],
  variants: [{ id: 'basic', label: 'Beginner version', files: {…} }, …], // optional alternatives
}
```

Playgrounds and project solutions must run **without crashing** (the validator runs them).
A playground that demonstrates a crash on purpose sets `expectError: true`.

### Visual

```js
visual: { type: 'code-tracer', props: {…}, title?: '…', caption?: Rich, alt: 'Text description of what the visual shows (required, for screen readers)', after?: Rich }
```

### Quiz questions

All need `id` (unique in the lesson, prefix with the lesson id), `type`, `prompt`
(markdown) and `explanation` (except `short`). Options are strings or
`{ text, why }` — **write `why` for every wrong option**: it is the feedback shown
when a learner picks it (the right answer is only revealed on request).

| type | shape |
|---|---|
| `mcq` | `options`, `answer: index` (or `[indexes]` for select-all) |
| `output` | `code`, then `options` + `answer: index`, or `answer: 'expected text'` (+ `accept: []`) — **predict the output** |
| `bug` | `code`, `answerLine: n` (1-based line the learner clicks) — or `options` + `answer` — **find the bug** |
| `fill` | `code` containing `___` blanks, `answer: [['append'], ['len', 'len(']]` (accepted strings per blank) |
| `short` | `answer: 'model answer'` — self-assessed, never counted in the score |

Use a mix in every lesson: at least one `mcq`, one `output`, one `bug`, one `fill`, one `short`.
5–7 questions. **Run every `output` question's code in your head twice** — or better, paste it
into a playground: the expected output must be exactly what CPython prints.

### Exercises (mini coding challenges)

```js
{
  id: 'average-score', title: '…', difficulty: 'beginner',
  prompt: py`…exact requirements: function names, parameters, return values, printed text…`,
  files: { 'main.py': py`starter` },
  hints: ['…', '…', '…'],                 // progressive: nudge → approach → near-answer
  solution: { explanation: py`…why it works…`, files: { 'main.py': py`…` } },
  tests: [{ name: 'averages three scores', code: py`assert average([70, 80, 90]) == 80` }],
}
```

The prompt **must state exactly what the tests check** (names, return types, exact printed text).
The starter must be valid Python that runs (use `pass`, `return None` or `...` placeholders)
and must fail at least one test; the solution must pass all of them.

### Interview questions

```js
{
  id: 'lists-append-vs-extend',        // globally unique: start with the lesson id
  difficulty: 'beginner',              // beginner | intermediate | advanced
  type: 'conceptual',                  // conceptual | output | debugging | coding | scenario | comparison | architecture
  minutes: 2,                          // estimated answer time
  question: '…',
  answer: 'Clear, direct answer (the concise interview-ready response).',
  explanation: 'Simple, fuller explanation.',
  code: { lang: 'python', code: py`…` },    // optional example
  whyAsked: 'Why interviewers ask it.',
  mistakes: ['Common weak answers…'],
  followUps: ['Likely follow-up questions…'],
  modelAnswer: 'What to say out loud in an interview (4–7 sentences): define → why → how → example → trade-off.',
  challenge: 'Optional learner challenge.',
  // auto-graded variant (good for output/debugging/comparison):
  options: ['…', '…', '…'], correctOption: 1,
  // coding variant (test-graded):
  starter: { files: { 'main.py': py`…` } }, tests: [{ name, code }], solution: { files: {…} }, hints: ['…'],
}
```

Per lesson: 5–7 questions spanning beginner → advanced and several types
(always conceptual + at least two of scenario / debugging / output / coding /
comparison / architecture). Include one `coding` question with starter, tests and
solution in most lessons. Include performance and CPython-internals angles where they fit.
Questions must be specific to the topic — no reworded duplicates of questions in other lessons.

### Projects (level `projects`, `kind: 'project'`)

Projects add: `requirements` (string[]), `objectives` (string[]), `steps`
(`{ title, body: Rich }[]` — the step-by-step build), `challenges` (string[]),
`solution` (`{ files, entry?, explanation }` — rendered as the live "finished
app" and the reveal-on-request complete solution), and
`playground` = the **starter** with `playground.tests` (the solution must pass
them; the starter must fail at least one). `analogy`, `syntax`, `visual` and
`exercises` are optional for projects; `quiz` and `interview` need ≥2 each.
Design projects as functions + a small `main()` so tests can call the functions; if `main()`
reads `input()`, give the tests `stdin`.

## 5. Markdown dialect

Paragraphs, `- ` / `1. ` lists, ```` ```lang ```` fences, `> ` quotes (start with
`**Tip:**`, `**Careful:**`, `**Note:**` or `**Version:**` to style them),
`#### headings`, `` `code` ``, `**bold**`, `*italic*`, `[text](https://…)`, pipe tables,
and lesson cross-links `[closures](lesson:closures)` or `(lesson:closures#syntax)`.
Cross-link related lessons generously.

## 6. The sandbox (what runnable code can do)

Runnable code = `playground.files`, `variants`, exercise starters/solutions, interview
`starter`/`solution`, project `solution`. It runs in **CPython 3.14 (Pyodide 314.0.7)** inside a
Web Worker. Facts verified against this runtime:

| works | does not work (show as `static: true` code and explain) |
|---|---|
| the whole **standard library** that is pure Python or built in: `json`, `csv`, `pathlib`, `re`, `datetime`, `collections`, `itertools`, `functools`, `dataclasses`, `enum`, `typing`, `abc`, `contextlib`, `logging`, `unittest`, `unittest.mock`, `argparse`, `tomllib`, `sqlite3` (SQLite 3.39), `decimal`, `fractions`, `random`, `statistics`, `secrets`, `hashlib` (sha256/md5/blake2), `hmac`, `pickle`, `copy`, `weakref`, `gc`, `sys.getrefcount`, `dis`, `timeit`, `cProfile`, `pstats`, `tracemalloc`, `inspect`, `textwrap`, `string`, `heapq`, `bisect`, `graphlib`, `wsgiref`, `urllib.parse`, `http.HTTPStatus`, `email` | **third-party packages** (`requests`, `httpx`, `pytest`, `numpy`, `flask`, `fastapi`, `pydantic`, `sqlalchemy`, `mypy`) — show them as static code |
| `asyncio` incl. `asyncio.run()`, `gather`, `TaskGroup`, `timeout`, `sleep` | **threads**: `threading.Thread.start()` and `ThreadPoolExecutor` raise `RuntimeError: can't start new thread` |
| files: the project is written to the working directory before every run; programs can `open()`, create and delete files (in memory, reset every run) | **processes**: `multiprocessing`, `subprocess`, `os.system` |
| `input()`: live prompt in the browser; tests and the validator use `stdin` | **network**: `urllib.request`, sockets, real HTTP — simulate with a fake client/server function |
| `time.sleep()`, `time.perf_counter()` | `hashlib.pbkdf2_hmac`, `hashlib.scrypt` (no OpenSSL), `zoneinfo` time zones (no tzdata) — use `datetime.timezone.utc`/fixed offsets |

- **Concurrency lessons:** threads/processes can't run here, so show real threading /
  multiprocessing code as `static: true` blocks, and make runnable playgrounds with `asyncio`,
  or a clearly labelled **simplified simulation** (e.g. generators interleaving steps to show a race).
- **Testing lessons:** pytest isn't installed. Show pytest code statically; runnable code uses
  plain `assert`-based `test_*` functions plus a small runner, or `unittest`.
- **HTTP lessons:** simulate the server as a Python function (a WSGI app can be called directly
  with `wsgiref.util.setup_testing_defaults`), or a fake client class with canned responses.
- Time limit: a run is stopped after 10 s (tests: 20 s). Output is capped at 200,000 characters.
- Every run (and every test) starts from a clean state: project files are rewritten, project modules
  re-imported, and global interpreter state a program changed — logging configuration, warning filters,
  `os.environ`, `sys.path`, builtins, the recursion limit, the decimal context — is put back. Experiment
  and project tests receive the playground's `stdin` unless a test sets its own.
- `time.sleep()` blocks the thread exactly like CPython (inside `async` code it freezes the event
  loop — the sandbox reproduces that faithfully).
- Plain Python recursion raises `RecursionError` normally, but infinite recursion that goes through
  C code (a property setter assigning to itself, `__getattr__`/`__setattr__` recursion, `__repr__`
  calling `repr(self)`) can overflow the WebAssembly stack and crash the runtime instead. Show those
  bugs as `static: true` code — never in runnable files, tests or code-tracer visuals.
- Keep runnable programs deterministic (seed `random` or avoid it in tests).
- Make multi-file playgrounds when teaching modules (`main.py` + `inventory.py` + `data.csv`).

### Test API (exercise, experiment, coding-question and project tests)

Each test is `{ name, code, stdin? }` where `code` is **Python**. Before every test the project
runs **fresh** as `__main__` (files rewritten, project modules re-imported) with the test's
`stdin` lines (else the playground's `stdin`, else none). Then `code` runs in a namespace that
contains every global the program defined (call its functions directly), plus:

| helper | does |
|---|---|
| `output` | str — everything the program printed (stdout) during that fresh run |
| `run_program(stdin='')` | runs the program again from scratch with these input lines, returns what it printed |
| `capture(fn, *args, **kwargs)` | calls `fn(...)` and returns what it printed |
| `raises(ExcType, match=None)` | context manager: `with raises(ValueError): parse_age('x')` |
| `approx(x, rel=1e-6, abs=1e-9)` | `assert total == approx(0.3)` (numbers, lists, dicts of numbers) |
| `ns` | the program's namespace dict — `ns.get('average')` checks existence without a NameError |
| `files` | dict of the current source of every project file |
| `module(name)` | imports a project module: `module('inventory').Item` |
| `await …` | top-level `await` works (async exercises); `await run_program_async()` for async programs |

Write plain `assert` statements. On failure the learner automatically sees both sides of a
comparison (`left side: 25 / right side: 30`). Add a message for a friendlier nudge:
`assert callable(ns.get('average')), 'Define a function named average()'`.
If the program itself crashes, every test fails with the crash message.
Each test should check one behaviour and run in well under a second.

## 7. Visualizers (`visual` / `animation`)

| type | props | shows |
|---|---|---|
| `code-tracer` | `code` (required), `inline` (default true), `notes` ({ line: markdown }), `stdin`, `maxSteps`, `expectError` | **Real execution**, one step at a time: the line about to run, every frame on the call stack, each variable and arrows to the objects it refers to, stdout, return values, exceptions. `inline: false` draws ints/strs as separate objects too (identity, immutability, aliasing). Use for variables & references, mutability, lists/dicts/sets, function calls & the call stack, scope & closures, recursion, generators, decorators, classes & instances, exception propagation. Keep it ≤ 25 lines and ≤ 150 steps. Code runs in the validator: it must not crash (unless `expectError: true`). |
| `hash-table` | `preset`: `dict` · `set` · `collision` | interactive simplified hash table: keys → hash → bucket; why `in` on a dict/set doesn't search |
| `exception-flow` | `preset`: `uncaught` · `caught` · `finally` · `reraise` | an exception climbing `main() → load() → parse()`; which handler catches it; `finally` running while unwinding; re-raise / `raise … from` |
| `class-lookup` | `preset`: `single` · `override` · `diamond` · `super` | where `obj.attr` is found: instance `__dict__` → class → bases in MRO order; diamond MRO; cooperative `super()` |
| `memory` | `preset`: `refcount` · `cycle` · `weakref` | CPython reference counts rising/falling, a cycle only the GC can free, weak references that don't keep objects alive |
| `asyncio-loop` | `preset`: `await-order` · `gather` · `create-task` · `blocking` | event loop stepper: running task, ready queue, waiting timers, output — sequential awaits vs `gather`, `create_task` scheduling, `time.sleep` blocking the loop |
| `concurrency` | `preset`: `io-bound` · `cpu-bound` · `race-condition` | timelines comparing sequential / threads / processes / asyncio, who holds the GIL, a lost-update race |
| `performance` | `demo`: `membership` · `string-building` · `memoization` · `generator-memory` | measured live by real Python in the learner's browser: list vs set `in`, `+=` vs `join`, `lru_cache` call counts, list vs generator memory |
| `comparison` | `left: { label, code, lang }`, `right: {…}`, `points: string[]` | side-by-side approaches with the differences called out |
| `concept-diagram` | see below | your own stepped diagram for any concept |

`concept-diagram` props:

```js
{
  nodes: [
    { id: 'src', label: 'main.py', note: 'your source code', tone: 'yellow' }, // tone: paper | yellow | blue | red | ink | kraft
    { id: 'bytecode', label: 'Bytecode', tone: 'blue' },
  ],
  edges: [{ from: 'src', to: 'bytecode', label: 'compile', dashed: false }],  // edge id = 'src->bytecode' unless you set id
  steps: [
    { focus: ['src'], text: 'You write… (markdown)' },
    { focus: ['bytecode'], edges: ['src->bytecode'], text: '…' },
  ],
  layout: 'row',      // row | column | grid  (used when nodes have no x/y)
  cols: 3,            // for grid
  // or give every node x, y (centre) inside width × height (default 760 × 320)
}
```

Use `concept-diagram` freely (import system, packaging, HTTP request/response, clean architecture
layers, venv layout, SQL transactions…). Use the specialised visualizers where they fit exactly.

## 8. Checklist before you call a lesson done

- [ ] `const py = …` helper at the top; every template literal is `` py`…` ``.
- [ ] Every required field present; `LESSONS=<id> npm run validate:content` is green.
- [ ] ELI15 + analogy are genuinely understandable without prior knowledge.
- [ ] The playground runs, prints something meaningful, and has 3–4 experiments (most with tests).
- [ ] 1–2 exercises with tests, 2–3 progressive hints, solution + explanation.
- [ ] Quiz mixes types (mcq, output, bug, fill, short), every wrong option has a `why`, outputs verified.
- [ ] 5–7 interview questions across difficulties and types, model answers speakable in an interview.
- [ ] Version notes where relevant; CPython details labelled; simplified code labelled; no invented numbers.
- [ ] Cross-links to related lessons with `lesson:` links.
