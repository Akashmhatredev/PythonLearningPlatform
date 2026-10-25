// @vitest-environment node
// The Python sandbox: the same engine + harness the browser worker runs, driven
// through a Node worker thread. Covers running programs, input(), tracebacks,
// the test helpers, interrupts, tracing and the curated playground examples.
import { afterAll, describe, expect, it } from 'vitest'
import { compile, pythonInfo, runApp, runProjectTests, runPython, stopPython, traceProgram } from './python-runner.js'
import { playgroundExamples } from '../../src/content/playground-examples.js'
import { PERFORMANCE_DEMOS } from '../../src/components/diagrams/performanceDemos.js'

afterAll(() => stopPython())

const text = (r) => r.output.map(([, t]) => t).join('')
const failing = (r) => r.results.filter((x) => !x.pass).map((x) => `${x.name}: ${x.error}`)

describe('runtime', () => {
  it('is CPython 3.14 running in Pyodide', async () => {
    const info = await pythonInfo()
    expect(info.python).toMatch(/^3\.14\./)
  })
})

describe('running programs', () => {
  it('runs multi-file projects, streams stdout and reports globals', async () => {
    const r = await runApp({
      'main.py': 'from shop import total\nprices = [1.5, 2.5]\nprint("total:", total(prices))\n',
      'shop.py': 'def total(xs):\n    return sum(xs)\n',
    })
    expect(r.status).toBe('ok')
    expect(r.stdout).toBe('total: 4.0\n')
    expect(r.variables.find((v) => v.name === 'prices')).toMatchObject({ type: 'list', value: '[1.5, 2.5]' })
  })

  it('feeds input() from stdin lines and echoes them', async () => {
    const r = await runApp({ 'main.py': 'name = input("Name? ")\nage = int(input("Age? "))\nprint(f"{name} is {age}")\n' }, 'main.py', 'Ada\n36')
    expect(r.stdout).toBe('Name? Age? Ada is 36\n')
    expect(r.output.filter(([s]) => s === 'stdin').map(([, t]) => t)).toEqual(['Ada\n', '36\n'])
  })

  it('reports real tracebacks without harness frames, plus a hint for EOF on input()', async () => {
    const r = await runApp({ 'main.py': 'def div(a, b):\n    return a / b\n\nprint(div(1, 0))\n' })
    expect(r.status).toBe('error')
    expect(r.error).toBe('ZeroDivisionError: division by zero')
    expect(r.where).toBe('main.py line 2')
    expect(text(r)).toContain('Traceback (most recent call last):\n  File "main.py", line 4, in <module>')
    expect(text(r)).not.toContain('_plp_harness')
    const eof = await runApp({ 'main.py': 'input("n: ")\n' })
    expect(text(eof)).toContain('[hint] input() had no line left to read')
  })

  it('reports syntax errors with the file and line', async () => {
    const r = await runApp({ 'main.py': 'x = 1\nif x > 0\n    print(x)\n' })
    expect(r.status).toBe('error')
    expect(text(r)).toContain("SyntaxError: expected ':'")
    expect(r.where).toBe('main.py line 2')
  })

  it('handles sys.exit and files on the in-memory filesystem', async () => {
    const r = await runApp({
      'main.py': 'import csv, sys\nrows = list(csv.DictReader(open("people.csv", encoding="utf-8")))\nprint(rows[0]["name"])\nsys.exit(2)\n',
      'people.csv': 'name,age\nAda,36\n',
    })
    expect(r.status).toBe('exit')
    expect(r.exitCode).toBe(2)
    expect(r.stdout).toBe('Ada\n')
  })

  it('runs asyncio.run() and keeps time.sleep() blocking like CPython', async () => {
    const r = await runApp({
      'main.py': `import asyncio, time
async def a():
    print("a start"); await asyncio.sleep(0.01); print("a end")
async def b():
    time.sleep(0.05); print("b slept")
async def main():
    await asyncio.gather(a(), b())
asyncio.run(main())
`,
    })
    expect(r.stdout).toBe('a start\nb slept\na end\n')
  })

  it('without JSPI, runs top-level asyncio.run(main()) as an awaited coroutine', async () => {
    const r = await runPython({
      mode: 'app',
      jspi: false,
      files: { 'main.py': 'import asyncio\nasync def main():\n    await asyncio.sleep(0.01)\n    return 42\n\nif __name__ == "__main__":\n    result = asyncio.run(main())\n    print("result", result)\n' },
    })
    expect(r.status, r.error ?? '').toBe('ok')
    expect(r.stdout).toBe('result 42\n')
  })

  it('stops runaway code with KeyboardInterrupt and keeps the runtime usable', async () => {
    const r = await runPython({ mode: 'app', files: { 'main.py': 'print("start")\nwhile True:\n    pass\n' } })
    expect(r.status).toBe('stopped')
    expect(r.stdout).toBe('start\n')
    const after = await runApp({ 'main.py': 'print("alive")' })
    expect(after.stdout).toBe('alive\n')
  }, 30_000)

  it('resets global state between runs (logging, warnings, environ, builtins)', async () => {
    await runApp({
      'main.py': 'import logging, warnings, os, builtins\nlogging.basicConfig(level=logging.INFO)\nwarnings.simplefilter("error")\nos.environ["MODE"] = "x"\nbuiltins.secret = 1\n',
    })
    const r = await runApp({
      'main.py': 'import logging, warnings, os\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")\nlogging.info("hello")\nwarnings.warn("careful")\nprint(os.environ.get("MODE"), "secret" in dir(__builtins__))\n',
    })
    expect(r.status).toBe('ok')
    expect(r.stdout).toBe('None False\n')
    expect(text(r)).toContain('INFO hello')
    expect(text(r)).toContain('UserWarning: careful')
  })

  it('survives objects that raise when inspected (a dead weakref.proxy)', async () => {
    const code = 'import weakref\nclass Box:\n    pass\nb = Box()\np = weakref.proxy(b)\ndel b\nprint("done")\n'
    const r = await runApp({ 'main.py': code })
    expect(r.status).toBe('ok')
    expect(r.variables.find((v) => v.name === 'p').value).toContain('dead')
    const t = await traceProgram({ 'main.py': code })
    expect(t.status).toBe('ok')
  })

  it('forgets project modules between runs', async () => {
    await runApp({ 'main.py': 'import helper\nprint(helper.X)', 'helper.py': 'X = 1' })
    const r = await runApp({ 'main.py': 'import helper\nprint(helper.X)', 'helper.py': 'X = 2' })
    expect(r.stdout).toBe('2\n')
  })
})

describe('test mode', () => {
  const files = { 'main.py': 'def add(a, b):\n    return a - b\n\nprint("hi", add(2, 2))\n' }

  it('runs each test against a fresh program with helpers and pytest-style failure detail', async () => {
    const r = await runProjectTests(files, [
      { name: 'add', code: 'assert add(2, 3) == 5' },
      { name: 'output', code: 'assert "hi" in output' },
      { name: 'raises', code: 'with raises(ZeroDivisionError):\n    1 / 0' },
      { name: 'capture', code: 'assert capture(print, "x") == "x\\n"' },
      { name: 'run_program', code: 'assert run_program().startswith("hi")' },
      { name: 'approx', code: 'assert 0.1 + 0.2 == approx(0.3)' },
      { name: 'ns', code: 'assert ns.get("missing") is None and callable(ns["add"])' },
      { name: 'missing name', code: 'assert average([1]) == 1' },
    ])
    expect(r.status).toBe('ok')
    expect(failing(r)).toEqual([
      'add: assert add(2, 3) == 5\n  left side:  -1\n  right side: 5',
      "missing name: NameError: name 'average' is not defined",
    ])
  })

  it('runs tests with the program as __main__, so pickling its classes works', async () => {
    const r = await runProjectTests(
      { 'main.py': 'import pickle\nfrom dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: int\n    y: int\n' },
      [{ name: 'round-trips', code: 'assert pickle.loads(pickle.dumps(Point(1, 2))) == Point(1, 2)' }],
    )
    expect(failing(r)).toEqual([])
  })

  it('gives each test its own stdin and reports program crashes', async () => {
    const prog = { 'main.py': 'n = int(input())\nprint(n * 2)\n' }
    const r = await runProjectTests(prog, [
      { name: 'doubles 4', code: 'assert output.strip() == "8"', stdin: '4' },
      { name: 'no input', code: 'assert True' },
    ])
    expect(r.results[0].pass).toBe(true)
    expect(r.results[1].error).toContain('Your program crashed before this check could run: EOFError')
  })
})

describe('compile and trace', () => {
  it('compiles files and snippets, reporting syntax errors', async () => {
    const r = await compile({ 'main.py': 'def f(:\n  pass' }, [{ name: 'a test', code: 'assert x ==' }])
    expect(r.errors.map((e) => e.file)).toEqual(['main.py', 'a test'])
  })

  it('records frames, objects, closures, generators and the final state', async () => {
    const r = await traceProgram(
      { 'main.py': 'def make():\n    n = 0\n    def inc():\n        nonlocal n\n        n += 1\n        return n\n    return inc\n\nc = make()\nc()\nitems = [1, 2]\nalias = items\ndef gen():\n    yield 1\ng = gen()\nnext(g)\n' },
      { inline: true },
    )
    expect(r.status).toBe('ok')
    const last = r.steps.at(-1)
    expect(last.e).toBe('end')
    const vars = Object.fromEntries(last.stack[0].vars)
    expect(vars.items).toEqual(vars.alias) // same object, same label
    const fn = last.heap[vars.c.r]
    expect(fn).toMatchObject({ k: 'func', name: 'make.<locals>.inc' })
    expect(fn.closure[0][0]).toBe('n')
    expect(last.heap[vars.g.r]).toMatchObject({ k: 'gen', state: 'suspended' })
    expect(r.steps.some((s) => s.e === 'return' && s.yield)).toBe(true)
    expect(r.steps.some((s) => s.e === 'call' && s.stack.at(-1).name === 'inc')).toBe(true)
  })

  it('stops tracing at the step limit', async () => {
    const r = await traceProgram({ 'main.py': 'total = 0\nfor i in range(1000):\n    total += i\n' }, { maxSteps: 50 })
    expect(r.status).toBe('truncated')
    expect(r.steps).toHaveLength(50)
  })
})

describe('curated content runs for real', () => {
  for (const ex of playgroundExamples) {
    for (const v of [{ id: 'main', files: ex.files }, ...(ex.variants ?? [])]) {
      it(`playground example ${ex.id} (${v.id}) runs`, async () => {
        const r = await runApp(v.files, ex.entry, ex.stdin)
        expect(r.status, r.error ?? '').toBe('ok')
        expect(text(r).length).toBeGreaterThan(0)
      })
    }
  }
  for (const [id, demo] of Object.entries(PERFORMANCE_DEMOS)) {
    it(`performance demo ${id} prints a JSON result`, async () => {
      const r = await runPython({ mode: 'app', files: { 'main.py': demo.code } })
      expect(r.status, r.error ?? '').toBe('ok')
      const rows = JSON.parse(r.stdout.trim().split('\n').at(-1))
      expect(rows.length).toBeGreaterThan(1)
      for (const s of demo.series) expect(typeof rows[0][s.key]).toBe('number')
    }, 60_000)
  }
})
