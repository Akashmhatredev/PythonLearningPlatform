import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedState } from '../composables/usePersistedState.js'
import { contentIndex } from '../content/index.js'
import { computeStreak, dayKey } from '../utils/dates.js'
import { canComplete, learnerLevel, recommendNext, requirementsFor } from '../utils/learning.js'

const DEFAULTS = {
  lessons: {}, // id -> LessonProgress (see `entry`)
  bookmarks: [], // lesson ids
  recent: [], // lesson ids, most recent first
  activeDays: {}, // 'YYYY-MM-DD' -> number of meaningful actions
}

const MAX_RECENT = 12
const MAX_QUIZ_ATTEMPTS = 20

export const useProgressStore = defineStore('progress', () => {
  const { state, reset } = usePersistedState('progress', DEFAULTS)

  function entry(id) {
    return (state.lessons[id] ??= {
      firstVisitedAt: null,
      lastVisitedAt: null,
      visits: 0,
      ranExample: false,
      experiments: {}, // expId -> { at, grading }
      quiz: { attempts: [], best: null },
      exercises: {}, // exId -> { at, grading }
      visualized: false,
      completedAt: null,
      revisit: false,
    })
  }

  function touchDay() {
    const k = dayKey()
    state.activeDays[k] = (state.activeDays[k] ?? 0) + 1
  }

  // ----- actions -----
  function visit(id) {
    const e = entry(id)
    const now = Date.now()
    e.firstVisitedAt ??= now
    e.lastVisitedAt = now
    e.visits++
    state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, MAX_RECENT)
  }

  function recordRun(id) {
    const e = entry(id)
    if (!e.ranExample) touchDay()
    e.ranExample = true
  }

  function recordExperiment(id, expId, grading) {
    const e = entry(id)
    if (!e.experiments[expId]) touchDay()
    e.experiments[expId] = { at: Date.now(), grading }
  }

  function recordVisualizer(id) {
    entry(id).visualized = true
  }

  /** result: { correct, total, ratio, firstTry: { [qid]: bool }, selfRated } */
  function recordQuizAttempt(id, result) {
    const e = entry(id)
    e.quiz.attempts = [...e.quiz.attempts, { at: Date.now(), ...result }].slice(-MAX_QUIZ_ATTEMPTS)
    e.quiz.best = Math.max(e.quiz.best ?? 0, result.ratio)
    touchDay()
  }

  function recordExercise(id, exId, grading) {
    const e = entry(id)
    if (!e.exercises[exId]) touchDay()
    e.exercises[exId] = { at: Date.now(), grading }
  }

  function markComplete(id) {
    const meta = contentIndex.lessons[id]
    const e = entry(id)
    if (!canComplete(meta, e)) return false
    e.completedAt = Date.now()
    e.revisit = false
    touchDay()
    return true
  }

  function markIncomplete(id) {
    entry(id).completedAt = null
  }

  function toggleBookmark(id) {
    state.bookmarks = state.bookmarks.includes(id)
      ? state.bookmarks.filter((x) => x !== id)
      : [id, ...state.bookmarks]
  }

  function toggleRevisit(id) {
    const e = entry(id)
    e.revisit = !e.revisit
  }

  // ----- getters -----
  const readyIds = computed(() => contentIndex.order.filter((id) => contentIndex.lessons[id].status === 'ready'))
  const completedIds = computed(() => readyIds.value.filter((id) => state.lessons[id]?.completedAt))
  const completion = computed(() => ({
    done: completedIds.value.length,
    total: readyIds.value.length,
    ratio: readyIds.value.length ? completedIds.value.length / readyIds.value.length : 0,
  }))
  const streak = computed(() => computeStreak(Object.keys(state.activeDays)))
  const quizStats = computed(() => {
    const attempted = Object.entries(state.lessons).filter(([, l]) => l.quiz?.attempts?.length)
    const attempts = attempted.reduce((n, [, l]) => n + l.quiz.attempts.length, 0)
    const avgBest = attempted.length ? attempted.reduce((n, [, l]) => n + (l.quiz.best ?? 0), 0) / attempted.length : null
    return { quizzesTaken: attempted.length, attempts, avgBest }
  })
  const exerciseCount = computed(() =>
    Object.values(state.lessons).reduce((n, l) => n + Object.keys(l.exercises ?? {}).length, 0),
  )
  const recommended = computed(() => recommendNext(contentIndex, state))
  const level = computed(() => learnerLevel(contentIndex, completedIds.value))

  const isComplete = (id) => !!state.lessons[id]?.completedAt
  const isBookmarked = (id) => state.bookmarks.includes(id)
  const lessonState = (id) => state.lessons[id] ?? null
  const requirements = (id) => requirementsFor(contentIndex.lessons[id], state.lessons[id])

  return {
    state,
    // actions
    visit,
    recordRun,
    recordExperiment,
    recordVisualizer,
    recordQuizAttempt,
    recordExercise,
    markComplete,
    markIncomplete,
    toggleBookmark,
    toggleRevisit,
    reset,
    // getters
    completedIds,
    completion,
    streak,
    quizStats,
    exerciseCount,
    recommended,
    level,
    isComplete,
    isBookmarked,
    lessonState,
    requirements,
  }
})
