import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedState } from '../composables/usePersistedState.js'
import { dayKey } from '../utils/dates.js'
import { useProgressStore } from './progress.js'

const DEFAULTS = {
  stats: {}, // questionId -> QuestionStats
  sessions: [], // newest last
}

const MAX_SESSIONS = 40
const MAX_RESULTS = 10

// Results that mean "the learner got it": used for accuracy numbers.
export const POSITIVE = ['correct', 'passed', 'got']
export const NEGATIVE = ['incorrect', 'failed', 'missed']

export function summarizeSession(session) {
  const answers = Object.values(session.answers ?? {})
  const by = (g) => answers.filter((a) => a.grading === g && a.result)
  const auto = by('auto')
  const tests = by('tests')
  const self = by('self')
  return {
    answered: answers.filter((a) => a.result).length,
    total: session.questionIds.length,
    auto: { good: auto.filter((a) => a.result === 'correct').length, total: auto.length },
    tests: { good: tests.filter((a) => a.result === 'passed').length, total: tests.length },
    self: {
      got: self.filter((a) => a.result === 'got').length,
      partial: self.filter((a) => a.result === 'partial').length,
      missed: self.filter((a) => a.result === 'missed').length,
      total: self.length,
    },
    timeMs: answers.reduce((n, a) => n + (a.timeMs ?? 0), 0),
  }
}

export const useInterviewStore = defineStore('interview', () => {
  const { state, reset } = usePersistedState('interview', DEFAULTS)

  function statFor(qid) {
    return (state.stats[qid] ??= {
      attempts: 0,
      results: [],
      lastResult: null,
      lastAt: null,
      timeMs: 0,
      review: false,
      understood: false,
      bookmarked: false,
    })
  }

  /** result ∈ correct|incorrect|passed|failed|got|partial|missed ; grading ∈ auto|tests|self */
  function recordResult(qid, { result, grading, timeMs = 0 }) {
    const s = statFor(qid)
    s.attempts++
    s.lastResult = result
    s.lastAt = Date.now()
    s.timeMs += timeMs
    s.results = [...s.results, { at: s.lastAt, result, grading }].slice(-MAX_RESULTS)
    if (NEGATIVE.includes(result)) s.understood = false
    // Interview practice is meaningful study time for the streak.
    const progress = useProgressStore()
    const k = dayKey()
    progress.state.activeDays[k] = (progress.state.activeDays[k] ?? 0) + 1
  }

  const toggle = (field) => (qid) => {
    const s = statFor(qid)
    s[field] = !s[field]
  }

  function startSession(config, questionIds) {
    const id = `s${Date.now().toString(36)}`
    const now = Date.now()
    state.sessions = [
      ...state.sessions.filter((s) => s.status === 'finished').slice(-(MAX_SESSIONS - 1)),
      {
        id,
        createdAt: now,
        startedAt: now,
        finishedAt: null,
        status: 'active',
        config,
        questionIds,
        current: 0,
        answers: {},
        deadline: config.mode === 'mock' && config.minutes ? now + config.minutes * 60_000 : null,
      },
    ]
    return id
  }

  const getSession = (id) => state.sessions.find((s) => s.id === id) ?? null

  function answerFor(session, qid) {
    return (session.answers[qid] ??= {
      text: '',
      choice: null,
      code: null,
      result: null,
      grading: null,
      revealed: false,
      hintsUsed: 0,
      timeMs: 0,
      testResults: null,
    })
  }

  function updateAnswer(sessionId, qid, patch) {
    const session = getSession(sessionId)
    if (!session || session.status !== 'active') return
    Object.assign(answerFor(session, qid), patch)
  }

  function addTime(sessionId, qid, ms) {
    const session = getSession(sessionId)
    if (!session || session.status !== 'active' || ms <= 0) return
    answerFor(session, qid).timeMs += ms
  }

  function setCurrent(sessionId, index) {
    const session = getSession(sessionId)
    if (session) session.current = index
  }

  function finishSession(sessionId) {
    const session = getSession(sessionId)
    if (!session || session.status !== 'active') return
    session.status = 'finished'
    session.finishedAt = Date.now()
    for (const qid of session.questionIds) {
      const a = session.answers[qid]
      if (a?.result) recordResult(qid, { result: a.result, grading: a.grading, timeMs: a.timeMs })
    }
  }

  /** Self-assess a question during the review of a finished (mock) session. */
  function rateInReview(sessionId, qid, result) {
    const session = getSession(sessionId)
    if (!session || session.status !== 'finished') return
    const a = answerFor(session, qid)
    if (a.result) return // already graded
    a.result = result
    a.grading = 'self'
    recordResult(qid, { result, grading: 'self', timeMs: a.timeMs })
  }

  function discardSession(sessionId) {
    state.sessions = state.sessions.filter((s) => s.id !== sessionId)
  }

  const activeSession = computed(() => state.sessions.find((s) => s.status === 'active') ?? null)
  const finishedSessions = computed(() => state.sessions.filter((s) => s.status === 'finished'))

  const totals = computed(() => {
    const all = Object.values(state.stats)
    const attempted = all.filter((s) => s.attempts > 0)
    const graded = attempted.filter((s) => ['correct', 'incorrect', 'passed', 'failed'].includes(s.lastResult))
    return {
      attempted: attempted.length,
      attempts: attempted.reduce((n, s) => n + s.attempts, 0),
      objectiveCorrect: graded.filter((s) => POSITIVE.includes(s.lastResult)).length,
      objectiveTotal: graded.length,
      selfGot: attempted.filter((s) => s.lastResult === 'got').length,
      selfTotal: attempted.filter((s) => ['got', 'partial', 'missed'].includes(s.lastResult)).length,
      codingPassed: attempted.filter((s) => s.lastResult === 'passed').length,
      review: all.filter((s) => s.review).length,
      timeMs: attempted.reduce((n, s) => n + s.timeMs, 0),
    }
  })

  return {
    state,
    statFor,
    recordResult,
    toggleReview: toggle('review'),
    toggleUnderstood: toggle('understood'),
    toggleBookmark: toggle('bookmarked'),
    startSession,
    getSession,
    updateAnswer,
    addTime,
    setCurrent,
    finishSession,
    rateInReview,
    discardSession,
    activeSession,
    finishedSessions,
    totals,
    reset,
  }
})
