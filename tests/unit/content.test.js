// Validates every lesson file:
//  1. schema (see src/content/schema.js and CONTENT_GUIDE.md)
//  2. every runnable file set and every test snippet compiles with CPython
//  3. every playground / variant / project solution runs without crashing
//  4. every exercise / coding question / project: the solution passes its tests,
//     and the starter fails at least one (so the tests actually test something)
//  5. experiment tests fail on the untouched playground (the learner must change something)
//  6. every code-tracer visual traces without crashing
//
// Python runs in Pyodide (the same engine + harness as the browser playground).
// Limit to some lessons with:  LESSONS=lists,sets npx vitest run tests/unit/content.test.js
// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { loadContent } from '../../plugins/content-index.js'
import { validateCurriculum, validateLesson } from '../../src/content/schema.js'
import { compile, runApp, runProjectTests, stopPython, traceProgram } from './python-runner.js'

const content = await loadContent(process.cwd())
const only = process.env.LESSONS ? process.env.LESSONS.split(',').map((s) => s.trim()) : null
const lessonIds = content.levels.flatMap((l) => l.lessons.map((x) => x.id))
const selected = Object.entries(content.lessons).filter(([id]) => !only || only.includes(id))

const failing = (r) => (r.results ?? []).filter((x) => !x.pass).map((x) => `${x.name}: ${x.error}`)
const crashed = (r) => (['error', 'timeout', 'stopped', 'internal'].includes(r.status) ? `${r.status}: ${r.error ?? ''} ${r.where ?? ''}`.trim() : null)

afterAll(() => stopPython())

// Python shown in prose (code objects with lang python and ```python fences) must be valid
// Python. Fragments opt out with `static: true` (or use lang 'pycon' / 'text').
const PY = ['python', 'py', 'python3']
function proseSnippets(lesson) {
  const out = []
  const walk = (v, path) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(/```(?:python|py|python3)\n([\s\S]*?)```/g)) out.push({ name: `${path} (markdown fence)`, code: m[1] })
      return
    }
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`))
    if (!v || typeof v !== 'object') return
    if (typeof v.code === 'string' && PY.includes(String(v.lang ?? '').toLowerCase()) && !v.static) out.push({ name: path, code: v.code })
    for (const [k, x] of Object.entries(v)) {
      if (['files', 'tests', 'starter', 'variants'].includes(k)) continue
      if (k === 'code' && typeof x === 'string') continue
      walk(x, path ? `${path}.${k}` : k)
    }
  }
  walk(lesson, '')
  return out
}

describe('curriculum', () => {
  it('every lesson file can be imported', () => {
    expect(content.failures.filter((f) => !only || only.some((id) => f.file.endsWith(`/${id}.js`)))).toEqual([])
  })

  it('has consistent ids, folders and unique interview question ids', () => {
    expect(validateCurriculum(content)).toEqual([])
  })
})

describe.each(selected)('lesson %s', (id, lesson) => {
  it('matches the content schema', () => {
    expect(validateLesson(lesson, { fileId: id, lessonIds })).toEqual([])
  })

  it('every runnable example and test compiles', async () => {
    const sets = []
    const testsOf = (list) => (list ?? []).map((t) => ({ name: `test "${t.name}"`, code: t.code }))
    if (lesson.playground) {
      sets.push(['playground', lesson.playground.files, [...testsOf(lesson.playground.tests), ...(lesson.playground.experiments ?? []).flatMap((x) => testsOf(x.tests))]])
    }
    for (const v of lesson.playground?.variants ?? []) sets.push([`variant ${v.id}`, v.files, []])
    for (const ex of lesson.exercises ?? []) {
      sets.push([`exercise ${ex.id} starter`, ex.files, testsOf(ex.tests)])
      if (ex.solution?.files) sets.push([`exercise ${ex.id} solution`, ex.solution.files, []])
    }
    for (const q of lesson.interview ?? []) {
      if (q.starter?.files) sets.push([`question ${q.id} starter`, q.starter.files, testsOf(q.tests)])
      if (q.solution?.files) sets.push([`question ${q.id} solution`, q.solution.files, []])
    }
    if (lesson.solution?.files) sets.push(['project solution', lesson.solution.files, []])
    const problems = []
    for (const [label, files, snippets] of sets) {
      const res = await compile(files, snippets)
      for (const e of res.errors ?? []) problems.push(`${label} › ${e.file}:${e.line} ${e.message}`)
      if (res.status === 'internal') problems.push(`${label} › ${res.error}`)
    }
    expect(problems).toEqual([])
  })

  it('every python code block in the text compiles', async () => {
    const res = await compile({ 'main.py': 'pass' }, proseSnippets(lesson))
    expect((res.errors ?? []).map((e) => `${e.file}: line ${e.line} ${e.message}`)).toEqual([])
  })

  it('the playground, its variants and the project solution run without crashing', async () => {
    const runs = []
    if (lesson.playground && lesson.kind !== 'project') runs.push(['playground', lesson.playground.files, lesson.playground.entry, lesson.playground.stdin])
    for (const v of lesson.playground?.variants ?? []) runs.push([`variant ${v.id}`, v.files, lesson.playground.entry, v.stdin ?? lesson.playground.stdin])
    if (lesson.solution?.files) runs.push(['project solution', lesson.solution.files, lesson.solution.entry, lesson.solution.stdin ?? lesson.playground?.stdin])
    const problems = []
    for (const [label, files, entry, stdin] of runs) {
      const r = await runApp(files, entry, stdin)
      const c = crashed(r)
      if (c && !lesson.playground?.expectError) problems.push(`${label} › ${c}`)
    }
    expect(problems).toEqual([])
  })

  const graded = []
  for (const ex of lesson.exercises ?? []) {
    if (ex.tests?.length) graded.push([`exercise ${ex.id}`, ex.files, ex.solution?.files, ex.tests])
  }
  for (const q of lesson.interview ?? []) {
    if (q.starter?.files && q.tests?.length) graded.push([`question ${q.id}`, q.starter.files, q.solution?.files, q.tests])
  }
  if (lesson.kind === 'project' && lesson.playground?.tests?.length) {
    graded.push(['project', lesson.playground.files, lesson.solution?.files, lesson.playground.tests, lesson.solution?.entry, lesson.playground.stdin])
  }

  for (const [label, starter, solution, tests, entry, stdin] of graded) {
    it(`${label}: solution passes every test`, async () => {
      expect(solution, 'solution files are missing').toBeTruthy()
      const r = await runProjectTests(solution, tests, entry, stdin)
      expect(r.status, `the test run itself failed: ${r.error ?? ''}`).toBe('ok')
      expect(failing(r), 'failing tests on the solution').toEqual([])
    })
    it(`${label}: starter fails at least one test`, async () => {
      const r = await runProjectTests(starter, tests, entry, stdin)
      expect((r.results ?? []).some((x) => !x.pass), 'every test already passes on the starter code').toBe(true)
    })
  }

  for (const exp of lesson.playground?.experiments ?? []) {
    if (!exp.tests?.length) continue
    it(`experiment ${exp.id}: needs a change to pass`, async () => {
      const r = await runProjectTests(lesson.playground.files, exp.tests, lesson.playground.entry, lesson.playground.stdin)
      expect((r.results ?? []).some((x) => !x.pass), 'experiment already passes without any change').toBe(true)
    })
  }

  const traces = [lesson.visual, lesson.animation].filter((v) => v?.type === 'code-tracer' && typeof v.props?.code === 'string')
  for (const [i, v] of traces.entries()) {
    it(`code-tracer ${i + 1} traces without crashing`, async () => {
      const r = await traceProgram({ 'main.py': v.props.code }, { inline: v.props.inline ?? true, stdin: v.props.stdin, maxSteps: v.props.maxSteps ?? 300 })
      expect(['ok', 'truncated', ...(v.props.expectError ? ['error'] : [])], `trace status ${r.status}: ${r.error ?? ''}`).toContain(r.status)
      expect(r.steps.length, 'no steps were recorded').toBeGreaterThan(1)
    })
  }
})
