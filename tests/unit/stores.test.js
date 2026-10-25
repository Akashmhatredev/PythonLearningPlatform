import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { memoryAdapter, setStorageAdapter, storage } from '../../src/services/storage.js'
import { useProgressStore } from '../../src/stores/progress.js'
import { summarizeSession, useInterviewStore } from '../../src/stores/interview.js'
import { contentIndex } from '../../src/content/index.js'

beforeEach(() => {
  setStorageAdapter(memoryAdapter())
  setActivePinia(createPinia())
})

describe('progress store', () => {
  it('only completes a lesson once its real requirements are met', () => {
    const p = useProgressStore()
    const id = 'variables-and-names'
    p.visit(id)
    expect(p.state.recent[0]).toBe(id)
    expect(p.markComplete(id)).toBe(false)
    expect(p.requirements(id).every((r) => !r.met)).toBe(true)

    p.recordRun(id)
    p.recordQuizAttempt(id, { correct: 4, total: 5, ratio: 0.8, firstTry: {} })
    expect(p.markComplete(id)).toBe(false) // exercise still missing
    p.recordExercise(id, 'swap-cups', 'tests')
    expect(p.markComplete(id)).toBe(true)
    expect(p.isComplete(id)).toBe(true)
    expect(p.completion.done).toBe(1)
    expect(p.completion.total).toBe(contentIndex.stats.ready)
    expect(p.streak).toBe(1)
  })

  it('keeps the best quiz score and caps stored attempts', () => {
    const p = useProgressStore()
    p.recordQuizAttempt('variables-and-names', { correct: 2, total: 5, ratio: 0.4 })
    p.recordQuizAttempt('variables-and-names', { correct: 5, total: 5, ratio: 1 })
    p.recordQuizAttempt('variables-and-names', { correct: 3, total: 5, ratio: 0.6 })
    expect(p.lessonState('variables-and-names').quiz.best).toBe(1)
    for (let i = 0; i < 30; i++) p.recordQuizAttempt('variables-and-names', { correct: 1, total: 5, ratio: 0.2 })
    expect(p.lessonState('variables-and-names').quiz.attempts.length).toBe(20)
  })

  it('toggles bookmarks and revision flags', () => {
    const p = useProgressStore()
    p.toggleBookmark('variables-and-names')
    expect(p.isBookmarked('variables-and-names')).toBe(true)
    p.toggleBookmark('variables-and-names')
    expect(p.isBookmarked('variables-and-names')).toBe(false)
    p.toggleRevisit('variables-and-names')
    expect(p.lessonState('variables-and-names').revisit).toBe(true)
  })

  it('persists through the storage adapter', async () => {
    vi.useFakeTimers()
    const p = useProgressStore()
    p.toggleBookmark('numbers-and-math')
    await vi.advanceTimersByTimeAsync(300)
    expect(storage().read('progress', {}).bookmarks).toEqual(['numbers-and-math'])
    vi.useRealTimers()
  })
})

describe('interview store', () => {
  it('runs a session, records graded answers on finish and summarises honestly', () => {
    const s = useInterviewStore()
    const id = s.startSession({ mode: 'practice' }, ['q1', 'q2', 'q3', 'q4'])
    expect(s.activeSession.id).toBe(id)
    s.updateAnswer(id, 'q1', { result: 'correct', grading: 'auto' })
    s.updateAnswer(id, 'q2', { result: 'failed', grading: 'tests' })
    s.updateAnswer(id, 'q3', { result: 'got', grading: 'self' })
    s.addTime(id, 'q1', 5000)
    s.finishSession(id)
    expect(s.activeSession).toBe(null)
    expect(s.state.stats.q1.lastResult).toBe('correct')
    expect(s.state.stats.q2.lastResult).toBe('failed')
    expect(s.state.stats.q4).toBeUndefined() // unanswered questions are not recorded
    const sum = summarizeSession(s.getSession(id))
    expect(sum).toMatchObject({ answered: 3, total: 4, auto: { good: 1, total: 1 }, tests: { good: 0, total: 1 }, self: { got: 1, total: 1 } })
    expect(s.totals.objectiveCorrect).toBe(1)
    expect(s.totals.objectiveTotal).toBe(2)
    // self-assessed answers never count as objectively correct
    expect(s.totals.selfGot).toBe(1)
  })

  it('lets you self-rate unanswered questions in review exactly once', () => {
    const s = useInterviewStore()
    const id = s.startSession({ mode: 'mock', minutes: 10 }, ['q1'])
    expect(s.getSession(id).deadline).toBeGreaterThan(Date.now())
    s.finishSession(id)
    s.rateInReview(id, 'q1', 'partial')
    s.rateInReview(id, 'q1', 'got')
    expect(s.state.stats.q1.attempts).toBe(1)
    expect(s.state.stats.q1.lastResult).toBe('partial')
  })

  it('ignores updates to finished sessions', () => {
    const s = useInterviewStore()
    const id = s.startSession({ mode: 'practice' }, ['q1'])
    s.finishSession(id)
    s.updateAnswer(id, 'q1', { result: 'correct', grading: 'auto' })
    expect(s.getSession(id).answers.q1).toBeUndefined()
  })
})
