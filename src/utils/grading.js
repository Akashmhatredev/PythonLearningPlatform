// Grading for quiz and interview questions.
// Three honest grading modes, always reported alongside the result:
//   'auto'  – compared against a known answer (multiple choice, exact output, fill-in)
//   'tests' – the learner's code ran against test cases in the sandbox
//   'self'  – the learner judged their own answer against a model answer

export const GRADING_LABELS = {
  auto: 'Auto-graded',
  tests: 'Test-graded',
  self: 'Self-assessed',
}

export function normalizeCode(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([(){}[\],;:.=<>+\-*/!?&|])\s*/g, '$1')
    .replace(/;$/, '')
    .replace(/"/g, "'")
}

export function normalizeOutput(s) {
  return String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

/** Which questions can be graded without the learner's own judgement. */
export function isAutoGradable(q) {
  switch (q.type) {
    case 'mcq':
      return true
    case 'output':
      return Array.isArray(q.options) || typeof q.answer === 'string'
    case 'bug':
      return Array.isArray(q.options) || typeof q.answerLine === 'number' || Array.isArray(q.answerLine)
    case 'fill':
      return Array.isArray(q.answer)
    default:
      return false
  }
}

function sameSet(a, b) {
  const x = [...a].sort()
  const y = [...b].sort()
  return x.length === y.length && x.every((v, i) => v === y[i])
}

/**
 * Grade one quiz question.
 * response shapes: mcq/output(options)/bug(options) -> number | number[]
 *                  output(text)                     -> string
 *                  bug(line)                        -> number (1-based line)
 *                  fill                             -> string[] (one per blank)
 * Returns { correct: boolean|null, grading, perBlank? }
 */
export function gradeQuizAnswer(q, response) {
  if (!isAutoGradable(q)) return { correct: null, grading: 'self' }
  if (response === undefined || response === null || response === '') return { correct: false, grading: 'auto' }

  if (Array.isArray(q.options)) {
    if (Array.isArray(q.answer)) {
      return { correct: Array.isArray(response) && sameSet(response, q.answer), grading: 'auto' }
    }
    return { correct: Number(response) === Number(q.answer), grading: 'auto' }
  }
  if (q.type === 'bug') {
    const lines = Array.isArray(q.answerLine) ? q.answerLine : [q.answerLine]
    return { correct: lines.includes(Number(response)), grading: 'auto' }
  }
  if (q.type === 'output') {
    const accepted = [q.answer, ...(q.accept ?? [])].map(normalizeOutput)
    return { correct: accepted.includes(normalizeOutput(response)), grading: 'auto' }
  }
  if (q.type === 'fill') {
    const answers = Array.isArray(response) ? response : [response]
    const perBlank = q.answer.map((accepted, i) => {
      const options = Array.isArray(accepted) ? accepted : [accepted]
      return options.map(normalizeCode).includes(normalizeCode(answers[i]))
    })
    return { correct: perBlank.every(Boolean), grading: 'auto', perBlank }
  }
  return { correct: null, grading: 'self' }
}

/** Count `___` blanks in fill-in code. */
export function countBlanks(code = '') {
  return (code.match(/___/g) || []).length
}

/** Quiz score over auto-gradable questions only, using first-try results. */
export function scoreQuiz(questions, firstTry) {
  const gradable = questions.filter(isAutoGradable)
  const correct = gradable.filter((q) => firstTry[q.id] === true).length
  return { correct, total: gradable.length, ratio: gradable.length ? correct / gradable.length : 1 }
}
