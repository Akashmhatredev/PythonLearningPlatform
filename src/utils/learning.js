// Pure learning-analytics functions. Every number the dashboard shows is
// computed here from saved learner activity — nothing is decorative.
import { daysBetween } from './dates.js'

export const DEFAULT_QUIZ_PASS = 0.6

/**
 * Completion requirements for a lesson, given its metadata (from the content
 * index) and the learner's saved progress for it.
 */
export function requirementsFor(meta, lp = {}) {
  if (!meta || meta.status !== 'ready') return []
  const cfg = meta.completion ?? {}
  const reqs = []
  if (meta.hasPlayground && cfg.requireRun !== false) {
    reqs.push({
      key: 'run',
      label: 'Run the live example at least once',
      met: !!lp.ranExample,
    })
  }
  if (meta.counts.quiz > 0 && cfg.quizPass !== 0) {
    const pass = cfg.quizPass ?? DEFAULT_QUIZ_PASS
    const best = lp.quiz?.best ?? null
    reqs.push({
      key: 'quiz',
      label: `Score at least ${Math.round(pass * 100)}% on the quiz (first tries)`,
      met: best !== null && best >= pass,
      detail: best === null ? 'Not attempted yet' : `Best so far: ${Math.round(best * 100)}%`,
    })
  }
  if (meta.counts.exercises > 0 && cfg.exercises !== 0) {
    const need = Math.min(cfg.exercises ?? 1, meta.counts.exercises)
    const done = Object.keys(lp.exercises ?? {}).length
    reqs.push({
      key: 'exercise',
      label: `Finish ${need} coding exercise${need > 1 ? 's' : ''}`,
      met: done >= need,
      detail: `${done} of ${meta.counts.exercises} finished`,
    })
  }
  return reqs
}

export function canComplete(meta, lp) {
  return requirementsFor(meta, lp).every((r) => r.met)
}

/** How far along a lesson is, 0..1, based on the same requirements. */
export function lessonProgressRatio(meta, lp = {}) {
  if (lp.completedAt) return 1
  const reqs = requirementsFor(meta, lp)
  if (!reqs.length) return lp.lastVisitedAt ? 0.5 : 0
  return reqs.filter((r) => r.met).length / (reqs.length + 1) // +1: the final "mark complete" step
}

export function readyLessons(index) {
  return index.order.map((id) => index.lessons[id]).filter((l) => l.status === 'ready')
}

/**
 * Recommend the next lesson. Rules, in order:
 *  1. continue the module of the most recently visited, unfinished lesson
 *  2. otherwise the first unfinished ready lesson in curriculum order
 *  3. if that lesson has unfinished prerequisites, recommend the first of those
 */
export function recommendNext(index, progress) {
  const done = (id) => !!progress.lessons[id]?.completedAt
  const ready = readyLessons(index)
  if (!ready.length) return null

  const recentUnfinished = (progress.recent ?? []).find((id) => index.lessons[id]?.status === 'ready' && !done(id))
  let pick = recentUnfinished ? index.lessons[recentUnfinished] : null
  let reason = pick ? 'You started this and have not finished it yet.' : ''

  if (!pick) {
    const lastDone = [...ready].filter((l) => done(l.id)).sort(
      (a, b) => (progress.lessons[b.id].completedAt ?? 0) - (progress.lessons[a.id].completedAt ?? 0),
    )[0]
    if (lastDone) {
      pick = ready.find((l) => l.order > lastDone.order && !done(l.id)) ?? null
      if (pick) reason = `Comes right after "${lastDone.title}", which you finished.`
    }
  }
  if (!pick) {
    pick = ready.find((l) => !done(l.id)) ?? null
    if (pick) reason = progress.lessons && Object.keys(progress.lessons).length ? 'The earliest lesson you have not finished.' : 'The very first step of the course.'
  }
  if (!pick) return { id: null, reason: 'You have completed every available lesson.' }

  const missing = (pick.prerequisites ?? []).filter((p) => index.lessons[p]?.status === 'ready' && !done(p))
  if (missing.length) {
    const pre = index.lessons[missing[0]]
    return { id: pre.id, reason: `"${pick.title}" builds on this lesson, which you have not finished yet.` }
  }
  return { id: pick.id, reason }
}

/**
 * Lessons the learner should revisit, each with the concrete reasons.
 * questionStats + questionLesson let interview results feed in.
 */
export function lessonsNeedingRevision(index, progress, { questionStats = {}, questionLesson = {}, now = Date.now() } = {}) {
  const reasons = new Map()
  const add = (id, why, weight) => {
    if (index.lessons[id]?.status !== 'ready') return
    const r = reasons.get(id) ?? { id, reasons: [], weight: 0 }
    r.reasons.push(why)
    r.weight += weight
    reasons.set(id, r)
  }
  for (const [id, lp] of Object.entries(progress.lessons ?? {})) {
    if (lp.revisit) add(id, 'You flagged it for revision', 4)
    const best = lp.quiz?.best
    if (typeof best === 'number' && best < 0.7) add(id, `Quiz best is ${Math.round(best * 100)}%`, 3)
    if (lp.completedAt && lp.lastVisitedAt && daysBetween(lp.lastVisitedAt, now) >= 21) {
      add(id, `Not revisited for ${daysBetween(lp.lastVisitedAt, now)} days`, 1)
    }
  }
  const missedByLesson = {}
  for (const [qid, s] of Object.entries(questionStats)) {
    if (['incorrect', 'missed', 'failed'].includes(s.lastResult)) {
      const lesson = questionLesson[qid]
      if (lesson) missedByLesson[lesson] = (missedByLesson[lesson] ?? 0) + 1
    }
  }
  for (const [id, n] of Object.entries(missedByLesson)) {
    add(id, `${n} interview question${n > 1 ? 's' : ''} missed last time`, 2 + n)
  }
  return [...reasons.values()].sort((a, b) => b.weight - a.weight)
}

/**
 * Learner level from completed lessons per band. A band counts as "cleared"
 * at 60% of its ready lessons.
 */
export function learnerLevel(index, completedIds) {
  const done = new Set(completedIds)
  const bands = ['beginner', 'intermediate', 'advanced']
  const stats = Object.fromEntries(
    bands.map((b) => {
      const ls = readyLessons(index).filter((l) => l.difficulty === b)
      const n = ls.filter((l) => done.has(l.id)).length
      return [b, { done: n, total: ls.length, ratio: ls.length ? n / ls.length : 0 }]
    }),
  )
  const cleared = (b) => stats[b].total > 0 && stats[b].ratio >= 0.6
  let level = 'Newcomer'
  let explain = 'Finish a few beginner lessons to reach Beginner.'
  if (done.size > 0) {
    level = 'Beginner'
    explain = 'Clear 60% of beginner lessons to reach Intermediate.'
  }
  if (cleared('beginner')) {
    level = 'Intermediate'
    explain = 'Clear 60% of intermediate lessons to reach Advanced.'
  }
  if (cleared('beginner') && cleared('intermediate')) {
    level = 'Advanced'
    explain = 'Clear 60% of advanced lessons to reach Professional.'
  }
  if (cleared('beginner') && cleared('intermediate') && cleared('advanced')) {
    level = 'Professional'
    explain = 'You have cleared every band. Keep your interview skills sharp.'
  }
  return { level, explain, stats }
}

/**
 * Personalised interview revision queue. Each question gets a priority
 * score with human-readable reasons; only questions with a reason appear.
 */
export function revisionQueue(questions, { questionStats = {}, progress = { lessons: {} }, now = Date.now() } = {}) {
  const out = []
  for (const q of questions) {
    const s = questionStats[q.id] ?? {}
    const lp = progress.lessons?.[q.lesson] ?? {}
    let score = 0
    const reasons = []
    if (['incorrect', 'failed', 'missed'].includes(s.lastResult)) {
      score += 5
      reasons.push('Answered incorrectly last time')
    } else if (s.lastResult === 'partial') {
      score += 3
      reasons.push('Only partly right last time')
    }
    if (s.review) {
      score += 4
      reasons.push('You marked it for review')
    }
    if (typeof lp.quiz?.best === 'number' && lp.quiz.best < 0.6) {
      score += 3
      reasons.push(`Weak quiz score in "${q.lessonTitle}"`)
    }
    if (lp.lastVisitedAt && daysBetween(lp.lastVisitedAt, now) >= 14 && (s.attempts ?? 0) > 0) {
      score += 2
      reasons.push(`Topic not visited for ${daysBetween(lp.lastVisitedAt, now)} days`)
    }
    if (q.difficulty === 'advanced' && lp.completedAt && !s.attempts) {
      score += 1
      reasons.push('Advanced question on a topic you finished')
    }
    if (s.understood) score -= 3
    if (score > 0 && reasons.length) out.push({ question: q, score, reasons })
  }
  return out.sort((a, b) => b.score - a.score)
}

/** Per-lesson accuracy from interview stats, used to name weak topics. */
export function weakTopics(questions, questionStats) {
  const byLesson = {}
  for (const q of questions) {
    const s = questionStats[q.id]
    if (!s?.attempts) continue
    const t = (byLesson[q.lesson] ??= { lesson: q.lesson, title: q.lessonTitle, good: 0, total: 0 })
    t.total++
    if (['correct', 'passed', 'got'].includes(s.lastResult)) t.good++
    else if (s.lastResult === 'partial') t.good += 0.5
  }
  return Object.values(byLesson)
    .map((t) => ({ ...t, ratio: t.good / t.total }))
    .filter((t) => t.ratio < 0.7)
    .sort((a, b) => a.ratio - b.ratio)
}
