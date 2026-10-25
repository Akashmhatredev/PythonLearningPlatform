// Content schema validator. Pure JS so it runs in Node (tests, CI) and the browser.
// validateLesson(lesson, ctx) -> string[] of human-readable problems.
// See CONTENT_GUIDE.md for the meaning of every field.
import { visualizers } from './visualizers.js'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const QUIZ_TYPES = ['mcq', 'output', 'bug', 'fill', 'short']
const INTERVIEW_TYPES = ['conceptual', 'output', 'debugging', 'coding', 'scenario', 'comparison', 'architecture']
const CALLOUTS = ['tip', 'warn', 'note', 'version']
export const FILE_EXTS = ['py', 'txt', 'csv', 'json', 'md', 'toml', 'ini', 'cfg', 'log']
const FILE_NAME = new RegExp(`^[\\w./-]+\\.(${FILE_EXTS.join('|')})$`)

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isArr = (v) => Array.isArray(v)
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

export function validateLesson(lesson, ctx = {}) {
  const errors = []
  const where = (path) => `${lesson?.id ?? '?'}: ${path}`
  const err = (path, msg) => errors.push(`${where(path)} — ${msg}`)
  const known = ctx.lessonIds ?? null

  if (!isObj(lesson)) return ['lesson module must default-export an object']
  const isProject = lesson.kind === 'project'

  // ---------- helpers
  const str = (path, v, required = true) => {
    if (v === undefined || v === null) {
      if (required) err(path, 'is required')
      return false
    }
    if (!isStr(v)) {
      err(path, 'must be a non-empty string')
      return false
    }
    return true
  }
  const code = (path, v, required = true) => {
    if (v === undefined) {
      if (required) err(path, 'is required')
      return
    }
    if (typeof v === 'string') return
    if (!isObj(v) || !isStr(v.code)) err(path, 'must be { code, lang?, title? }')
  }
  const rich = (path, v, required = true) => {
    if (v === undefined || v === null) {
      if (required) err(path, 'is required')
      return
    }
    if (typeof v === 'string') {
      if (!v.trim()) err(path, 'is empty')
      return
    }
    if (!isArr(v) || !v.length) return err(path, 'must be a markdown string or a non-empty array')
    v.forEach((item, i) => {
      if (typeof item === 'string') return
      if (isObj(item) && isStr(item.code)) return
      if (isObj(item) && item.callout) {
        if (!CALLOUTS.includes(item.callout)) err(`${path}[${i}]`, `callout must be one of ${CALLOUTS.join(', ')}`)
        if (!isStr(item.text)) err(`${path}[${i}].text`, 'is required')
        return
      }
      err(`${path}[${i}]`, 'must be a markdown string, { code, lang } or { callout, text }')
    })
  }
  const strList = (path, v, min = 0, required = true) => {
    if (v === undefined) {
      if (required) err(path, 'is required')
      return
    }
    if (!isArr(v)) return err(path, 'must be an array of strings')
    if (v.length < min) err(path, `needs at least ${min} item(s), has ${v.length}`)
    v.forEach((s, i) => !isStr(s) && err(`${path}[${i}]`, 'must be a non-empty string'))
  }
  const files = (path, v) => {
    if (!isObj(v) || !Object.keys(v).length) return err(path, 'must be an object of { filename: source }')
    if (!Object.keys(v).some((n) => n.endsWith('.py'))) err(path, 'needs at least one .py file (main.py is the entry by default)')
    for (const [name, src] of Object.entries(v)) {
      if (!FILE_NAME.test(name)) err(`${path}.${name}`, `file names must end in ${FILE_EXTS.map((e) => '.' + e).join(', ')}`)
      if (typeof src !== 'string') err(`${path}.${name}`, 'source must be a string')
      else if (name.endsWith('.py') && !src.trim()) err(`${path}.${name}`, 'Python files must not be empty')
      else if (/\t/.test(src) && name.endsWith('.py')) err(`${path}.${name}`, 'use 4 spaces for indentation, not tab characters')
    }
  }
  // Test code is Python: its syntax is checked by the content test, which compiles
  // and runs it with the real interpreter.
  const tests = (path, v, required = false) => {
    if (v === undefined) {
      if (required) err(path, 'is required')
      return
    }
    if (!isArr(v) || !v.length) return err(path, 'must be a non-empty array of { name, code, stdin? }')
    v.forEach((t, i) => {
      str(`${path}[${i}].name`, t?.name)
      str(`${path}[${i}].code`, t?.code)
      if (t?.stdin !== undefined && typeof t.stdin !== 'string') err(`${path}[${i}].stdin`, 'must be a string (one input line per line)')
    })
  }
  const lessonRef = (path, id) => {
    if (known && !known.includes(id)) err(path, `"${id}" is not a lesson id in curriculum.js`)
  }
  const visual = (path, v) => {
    if (v === undefined) return
    if (!isObj(v)) return err(path, 'must be an object')
    const def = visualizers[v.type]
    if (!def) return err(`${path}.type`, `unknown visualizer "${v.type}". Known: ${Object.keys(visualizers).join(', ')}`)
    str(`${path}.alt`, v.alt)
    rich(`${path}.caption`, v.caption, false)
    if (v.props !== undefined && !isObj(v.props)) err(`${path}.props`, 'must be an object')
    for (const [k, allowed] of Object.entries(def.props)) {
      const val = v.props?.[k]
      if (val === undefined) continue
      if (isArr(allowed) && !allowed.includes(val)) err(`${path}.props.${k}`, `must be one of ${allowed.join(', ')}`)
    }
    if (v.type === 'concept-diagram') validateDiagram(`${path}.props`, v.props, err)
    if (v.type === 'code-tracer') {
      if (!isStr(v.props?.code)) err(`${path}.props.code`, 'code-tracer needs the Python source to trace in props.code')
      if (v.props?.notes !== undefined && !isObj(v.props.notes)) err(`${path}.props.notes`, 'must be an object of { lineNumber: markdown }')
    }
    if (v.type === 'comparison') {
      for (const side of ['left', 'right']) {
        if (!isObj(v.props?.[side]) || !isStr(v.props[side].code) || !isStr(v.props[side].label)) {
          err(`${path}.props.${side}`, 'must be { label, code, lang? }')
        }
      }
    }
  }

  // ---------- identity & meta
  str('id', lesson.id)
  if (ctx.fileId && lesson.id !== ctx.fileId) err('id', `must equal the file name "${ctx.fileId}"`)
  str('title', lesson.title)
  str('summary', lesson.summary)
  if (!DIFFICULTIES.includes(lesson.difficulty)) err('difficulty', `must be one of ${DIFFICULTIES.join(', ')}`)
  if (typeof lesson.minutes !== 'number' || lesson.minutes < 3 || lesson.minutes > 240) err('minutes', 'must be a number of minutes (3–240)')
  if (lesson.kind !== undefined && !['lesson', 'project'].includes(lesson.kind)) err('kind', "must be 'lesson' or 'project'")
  for (const key of ['prerequisites', 'related']) {
    if (lesson[key] === undefined) continue
    if (!isArr(lesson[key])) err(key, 'must be an array of lesson ids')
    else lesson[key].forEach((id, i) => lessonRef(`${key}[${i}]`, id))
  }
  if (lesson.prerequisites?.includes(lesson.id)) err('prerequisites', 'a lesson cannot be its own prerequisite')
  strList('tags', lesson.tags, 1)
  if (lesson.apis !== undefined) {
    if (!isArr(lesson.apis)) err('apis', 'must be an array')
    else lesson.apis.forEach((a, i) => (str(`apis[${i}].name`, a?.name), str(`apis[${i}].summary`, a?.summary)))
  }
  if (!isArr(lesson.docs) || !lesson.docs.length) err('docs', 'needs at least one official documentation link')
  else
    lesson.docs.forEach((d, i) => {
      str(`docs[${i}].label`, d?.label)
      if (!/^https:\/\//.test(d?.url ?? '')) err(`docs[${i}].url`, 'must be an https URL')
    })
  if (lesson.next !== undefined) lessonRef('next', lesson.next)

  // ---------- learn
  rich('intro', lesson.intro)
  rich('why', lesson.why)
  rich('eli15', lesson.eli15)
  if (!isProject || lesson.analogy) {
    if (!isObj(lesson.analogy)) err('analogy', 'is required: { title, body, mapping? }')
    else {
      str('analogy.title', lesson.analogy.title)
      rich('analogy.body', lesson.analogy.body)
      if (lesson.analogy.mapping !== undefined) {
        if (!isArr(lesson.analogy.mapping)) err('analogy.mapping', 'must be an array of [concept, meaning] pairs')
        else lesson.analogy.mapping.forEach((m, i) => (!isArr(m) || m.length !== 2) && err(`analogy.mapping[${i}]`, 'must be a [concept, meaning] pair'))
      }
    }
  }
  visual('visual', lesson.visual)
  visual('animation', lesson.animation)
  if (!isProject && !lesson.visual && !lesson.animation) err('visual/animation', 'every lesson needs at least one visual or animation')
  rich('syntax', lesson.syntax, !isProject)

  if (lesson.walkthrough !== undefined) {
    const w = lesson.walkthrough
    if (!isObj(w) || !isStr(w.code)) err('walkthrough', 'must be { code, lang?, title?, steps }')
    else {
      const lines = w.code.split('\n').length
      if (!isArr(w.steps) || w.steps.length < 2) err('walkthrough.steps', 'needs at least 2 steps')
      else
        w.steps.forEach((s, i) => {
          str(`walkthrough.steps[${i}].text`, s?.text)
          if (!isArr(s?.lines) || !s.lines.length || s.lines.length > 2) err(`walkthrough.steps[${i}].lines`, 'must be [line] or [start, end]')
          else if (s.lines.some((n) => !Number.isInteger(n) || n < 1 || n > lines)) err(`walkthrough.steps[${i}].lines`, `line numbers must be within 1..${lines}`)
          else if (s.lines[1] !== undefined && s.lines[1] < s.lines[0]) err(`walkthrough.steps[${i}].lines`, 'end must be ≥ start')
        })
    }
  }

  // ---------- experiment
  if (lesson.playground !== undefined) {
    const p = lesson.playground
    if (!isObj(p)) err('playground', 'must be an object')
    else {
      str('playground.title', p.title)
      files('playground.files', p.files)
      if (p.entry !== undefined && !(p.entry in (p.files ?? {}))) err('playground.entry', 'must name one of the files')
      rich('playground.expected', p.expected, false)
      if (p.stdin !== undefined && typeof p.stdin !== 'string') err('playground.stdin', 'must be a string (one input line per line)')
      tests('playground.tests', p.tests)
      if (p.experiments !== undefined) {
        if (!isArr(p.experiments)) err('playground.experiments', 'must be an array')
        else {
          const ids = new Set()
          p.experiments.forEach((x, i) => {
            if (str(`playground.experiments[${i}].id`, x?.id) && ids.has(x.id)) err(`playground.experiments[${i}].id`, 'duplicate')
            ids.add(x?.id)
            str(`playground.experiments[${i}].task`, x?.task)
            tests(`playground.experiments[${i}].tests`, x?.tests)
          })
        }
      }
      if (p.variants !== undefined) {
        if (!isArr(p.variants)) err('playground.variants', 'must be an array')
        else
          p.variants.forEach((v, i) => {
            str(`playground.variants[${i}].id`, v?.id)
            str(`playground.variants[${i}].label`, v?.label)
            files(`playground.variants[${i}].files`, v?.files)
          })
      }
    }
  } else if (!isProject) err('playground', 'every lesson needs a live example (playground)')

  // ---------- understand
  if (lesson.internals !== undefined) {
    const i = lesson.internals
    if (isObj(i) && !i.code) {
      rich('internals.beginner', i.beginner)
      rich('internals.technical', i.technical)
      rich('internals.production', i.production)
    } else rich('internals', i)
  }
  if (lesson.mistakes !== undefined) {
    if (!isArr(lesson.mistakes) || !lesson.mistakes.length) err('mistakes', 'must be a non-empty array')
    else
      lesson.mistakes.forEach((m, i) => {
        str(`mistakes[${i}].title`, m?.title)
        code(`mistakes[${i}].wrong`, m?.wrong, false)
        code(`mistakes[${i}].right`, m?.right, false)
        rich(`mistakes[${i}].explanation`, m?.explanation)
      })
  }
  if (lesson.debugging !== undefined) {
    if (!isArr(lesson.debugging)) err('debugging', 'must be an array')
    else lesson.debugging.forEach((d, i) => ['symptom', 'cause', 'fix'].forEach((k) => str(`debugging[${i}].${k}`, d?.[k])))
  }
  strList('bestPractices', lesson.bestPractices, 1, false)
  strList('useCases', lesson.useCases, 1, false)
  if (lesson.whenToUse !== undefined) {
    strList('whenToUse.use', lesson.whenToUse?.use, 1)
    strList('whenToUse.avoid', lesson.whenToUse?.avoid, 1)
  }
  if (lesson.comparison !== undefined) {
    const c = lesson.comparison
    if (!isArr(c?.headers) || c.headers.length < 2) err('comparison.headers', 'needs at least 2 headers')
    else if (!isArr(c.rows) || !c.rows.length) err('comparison.rows', 'is required')
    else c.rows.forEach((r, i) => (!isArr(r) || r.length !== c.headers.length) && err(`comparison.rows[${i}]`, `must have ${c.headers.length} cells`))
  }

  // ---------- quiz
  if (!isArr(lesson.quiz) || lesson.quiz.length < (isProject ? 2 : 4)) err('quiz', `needs at least ${isProject ? 2 : 4} questions`)
  else {
    const ids = new Set()
    lesson.quiz.forEach((q, i) => validateQuiz(q, `quiz[${i}]`, ids, err, str, code, rich))
    if (lesson.quiz.filter((q) => q.type !== 'short').length < 2) err('quiz', 'needs at least 2 auto-graded questions')
  }

  // ---------- exercises
  if (lesson.exercises !== undefined) {
    if (!isArr(lesson.exercises)) err('exercises', 'must be an array')
    else {
      const ids = new Set()
      lesson.exercises.forEach((x, i) => {
        const p = `exercises[${i}]`
        if (str(`${p}.id`, x?.id) && ids.has(x.id)) err(`${p}.id`, 'duplicate exercise id')
        ids.add(x?.id)
        str(`${p}.title`, x?.title)
        if (x?.difficulty !== undefined && !DIFFICULTIES.includes(x.difficulty)) err(`${p}.difficulty`, 'invalid')
        rich(`${p}.prompt`, x?.prompt)
        files(`${p}.files`, x?.files)
        strList(`${p}.hints`, x?.hints, 1)
        if (!isObj(x?.solution)) err(`${p}.solution`, 'is required: { files, explanation? }')
        else files(`${p}.solution.files`, x.solution.files)
        tests(`${p}.tests`, x?.tests)
      })
    }
  }
  if (!isProject && !(lesson.exercises?.length > 0)) err('exercises', 'every lesson needs at least one coding exercise')

  // ---------- interview
  if (!isArr(lesson.interview) || lesson.interview.length < (isProject ? 2 : 4)) err('interview', `needs at least ${isProject ? 2 : 4} questions`)
  else lesson.interview.forEach((q, i) => validateInterview(q, `interview[${i}]`, err, str, code, rich, strList, files, tests))

  // ---------- review
  strList('takeaways', lesson.takeaways, 3)

  // ---------- project
  if (isProject) {
    strList('requirements', lesson.requirements, 2)
    strList('objectives', lesson.objectives, 2)
    if (!isArr(lesson.steps) || lesson.steps.length < 2) err('steps', 'projects need at least 2 implementation steps')
    else lesson.steps.forEach((s, i) => (str(`steps[${i}].title`, s?.title), rich(`steps[${i}].body`, s?.body)))
    strList('challenges', lesson.challenges, 1)
    if (!isObj(lesson.solution)) err('solution', 'projects need { files, explanation? }')
    else files('solution.files', lesson.solution.files)
    if (!lesson.playground) err('playground', 'projects need starter code in playground.files')
    else tests('playground.tests', lesson.playground.tests, true)
  }

  if (lesson.completion !== undefined) {
    const c = lesson.completion
    if (c.quizPass !== undefined && (typeof c.quizPass !== 'number' || c.quizPass < 0 || c.quizPass > 1)) err('completion.quizPass', 'must be 0..1')
  }
  return errors
}

function validateQuiz(q, p, ids, err, str, code, rich) {
  if (str(`${p}.id`, q?.id) && ids.has(q.id)) err(`${p}.id`, 'duplicate quiz id')
  ids.add(q?.id)
  if (!QUIZ_TYPES.includes(q?.type)) return err(`${p}.type`, `must be one of ${QUIZ_TYPES.join(', ')}`)
  rich(`${p}.prompt`, q.prompt)
  code(`${p}.code`, q.code, false)
  const codeText = typeof q.code === 'string' ? q.code : q.code?.code ?? ''
  if (q.type !== 'short') rich(`${p}.explanation`, q.explanation)
  const opts = q.options
  const optionCount = Array.isArray(opts) ? opts.length : 0
  if (Array.isArray(opts)) {
    if (optionCount < 2) err(`${p}.options`, 'needs at least 2 options')
    opts.forEach((o, i) => {
      if (!(typeof o === 'string' && o.trim()) && !(o && typeof o.text === 'string' && o.text.trim())) err(`${p}.options[${i}]`, 'must be a string or { text, why? }')
    })
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer]
    if (!ans.length || ans.some((a) => !Number.isInteger(a) || a < 0 || a >= optionCount)) err(`${p}.answer`, `must be an option index (0..${optionCount - 1}) or an array of indexes`)
  }
  switch (q.type) {
    case 'mcq':
      if (!Array.isArray(opts)) err(`${p}.options`, 'mcq needs options')
      break
    case 'output':
      if (!Array.isArray(opts) && typeof q.answer !== 'string') err(`${p}`, 'output questions need options + answer index, or an expected answer string')
      break
    case 'bug':
      if (!codeText) err(`${p}.code`, 'bug questions need code')
      if (!Array.isArray(opts)) {
        const lines = codeText.split('\n').length
        const al = Array.isArray(q.answerLine) ? q.answerLine : [q.answerLine]
        if (al.some((n) => !Number.isInteger(n) || n < 1 || n > lines)) err(`${p}.answerLine`, `must be a line number within 1..${lines}`)
      }
      break
    case 'fill': {
      const blanks = (codeText.match(/___/g) || []).length
      if (!blanks) err(`${p}.code`, 'fill questions need ___ blanks in the code')
      if (!Array.isArray(q.answer) || q.answer.length !== blanks) err(`${p}.answer`, `must list accepted answers for each of the ${blanks} blank(s)`)
      break
    }
    case 'short':
      if (typeof q.answer !== 'string' || !q.answer.trim()) err(`${p}.answer`, 'short questions need a model answer string')
      break
  }
}

function validateInterview(q, p, err, str, code, rich, strList, files, tests) {
  str(`${p}.id`, q?.id)
  if (!DIFFICULTIES.includes(q?.difficulty)) err(`${p}.difficulty`, `must be one of ${DIFFICULTIES.join(', ')}`)
  if (!INTERVIEW_TYPES.includes(q?.type)) err(`${p}.type`, `must be one of ${INTERVIEW_TYPES.join(', ')}`)
  rich(`${p}.question`, q?.question)
  rich(`${p}.answer`, q?.answer)
  rich(`${p}.explanation`, q?.explanation)
  rich(`${p}.whyAsked`, q?.whyAsked)
  rich(`${p}.modelAnswer`, q?.modelAnswer)
  strList(`${p}.mistakes`, q?.mistakes, 1)
  strList(`${p}.followUps`, q?.followUps, 1)
  if (typeof q?.minutes !== 'number') err(`${p}.minutes`, 'estimated answer time in minutes is required')
  code(`${p}.code`, q?.code, false)
  if (q?.options !== undefined) {
    if (!Array.isArray(q.options) || q.options.length < 2) err(`${p}.options`, 'needs at least 2 options')
    if (!Number.isInteger(q.correctOption) || q.correctOption < 0 || q.correctOption >= (q.options?.length ?? 0)) err(`${p}.correctOption`, 'must be a valid option index')
  }
  if (q?.starter !== undefined) {
    files(`${p}.starter.files`, q.starter?.files)
    tests(`${p}.tests`, q.tests, true)
    if (!q.solution?.files) err(`${p}.solution`, 'coding questions with starter code need solution.files (validated against the tests)')
    else files(`${p}.solution.files`, q.solution.files)
  }
}

function validateDiagram(p, props, err) {
  if (!props || !Array.isArray(props.nodes) || props.nodes.length < 2) return err(`${p}.nodes`, 'needs at least 2 nodes')
  const ids = new Set()
  props.nodes.forEach((n, i) => {
    if (!n?.id || !n?.label) err(`${p}.nodes[${i}]`, 'needs id and label')
    if (ids.has(n?.id)) err(`${p}.nodes[${i}].id`, 'duplicate')
    ids.add(n?.id)
  })
  const edgeIds = new Set()
  ;(props.edges ?? []).forEach((e, i) => {
    if (!ids.has(e?.from) || !ids.has(e?.to)) err(`${p}.edges[${i}]`, 'from/to must reference node ids')
    edgeIds.add(e?.id ?? `${e?.from}->${e?.to}`)
  })
  if (!Array.isArray(props.steps) || !props.steps.length) return err(`${p}.steps`, 'needs at least 1 step')
  props.steps.forEach((s, i) => {
    if (typeof s?.text !== 'string' || !s.text.trim()) err(`${p}.steps[${i}].text`, 'is required')
    ;(s?.focus ?? []).forEach((id) => !ids.has(id) && err(`${p}.steps[${i}].focus`, `unknown node "${id}"`))
    ;(s?.edges ?? []).forEach((id) => !edgeIds.has(id) && err(`${p}.steps[${i}].edges`, `unknown edge "${id}" (use "from->to" or an edge id)`))
  })
}

/** Cross-lesson checks: unique interview ids, orphan files. */
export function validateCurriculum({ levels, lessons, fileOf }) {
  const errors = []
  const ids = levels.flatMap((l) => l.lessons.map((x) => x.id))
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dup.length) errors.push(`curriculum: duplicate lesson ids: ${[...new Set(dup)].join(', ')}`)
  for (const [id, file] of Object.entries(fileOf)) {
    const level = levels.find((l) => l.lessons.some((x) => x.id === id))
    if (!level) errors.push(`${file}: not listed in curriculum.js`)
    else if (!file.includes(`/lessons/${level.id}/`)) errors.push(`${file}: must live in src/content/lessons/${level.id}/`)
  }
  const qids = new Map()
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const q of lesson.interview ?? []) {
      if (qids.has(q.id)) errors.push(`interview id "${q.id}" is used by both ${qids.get(q.id)} and ${id}`)
      qids.set(q.id, id)
    }
  }
  return errors
}
