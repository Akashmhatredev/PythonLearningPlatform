import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, safeHref, toPlainText } from '../../src/utils/markdown.js'
import { gradeQuizAnswer, isAutoGradable, normalizeCode, scoreQuiz } from '../../src/utils/grading.js'
import { computeStreak, dayKey, formatDuration } from '../../src/utils/dates.js'
import { canComplete, learnerLevel, lessonsNeedingRevision, recommendNext, requirementsFor, revisionQueue, weakTopics } from '../../src/utils/learning.js'
import { groupResults, searchIndex } from '../../src/utils/search.js'

describe('markdown', () => {
  it('parses blocks: paragraphs, lists, fences, quotes, tables', () => {
    const md = `Hello **world**\n\n- one\n- two\n\n\`\`\`js\nconst a = 1\n\`\`\`\n\n> **Tip:** be kind\n\n| a | b |\n|---|---|\n| 1 | 2 |`
    expect(parseMarkdown(md).map((b) => b.type)).toEqual(['p', 'ul', 'code', 'quote', 'table'])
    expect(parseMarkdown(md)[3].tone).toBe('tip')
  })
  it('tokenizes inline code, emphasis and links safely', () => {
    const t = parseInline('Use `ref()` and **bold _it_** [docs](https://vuejs.org) [x](javascript:alert(1)) [l](lesson:computed#syntax)')
    expect(t.find((x) => x.t === 'code').v).toBe('ref()')
    expect(t.find((x) => x.t === 'strong').c.some((x) => x.t === 'em')).toBe(true)
    const links = t.filter((x) => x.t === 'link')
    expect(links.map((l) => l.link.kind)).toEqual(['external', 'lesson'])
    expect(t.some((x) => x.t === 'span')).toBe(true) // javascript: link degraded to plain text
  })
  it('never treats snake_case as emphasis', () => {
    expect(parseInline('my_var_name').every((x) => x.t === 'text')).toBe(true)
  })
  it('rejects unsafe hrefs', () => {
    expect(safeHref('javascript:alert(1)')).toBe(null)
    expect(safeHref('/learn')).toEqual({ kind: 'internal', href: '/learn' })
  })
  it('flattens to plain text', () => {
    expect(toPlainText('A [link](https://x.y) with `code`')).toBe('A link with code')
  })
})

describe('grading', () => {
  it('grades multiple choice, multi-select, output text, bug lines and fill-ins', () => {
    expect(gradeQuizAnswer({ type: 'mcq', options: ['a', 'b'], answer: 1 }, 1).correct).toBe(true)
    expect(gradeQuizAnswer({ type: 'mcq', options: ['a', 'b', 'c'], answer: [0, 2] }, [2, 0]).correct).toBe(true)
    expect(gradeQuizAnswer({ type: 'output', answer: 'Hello\nWorld' }, '  hello \n world ').correct).toBe(true)
    expect(gradeQuizAnswer({ type: 'bug', code: 'a\nb', answerLine: 2 }, 2).correct).toBe(true)
    expect(gradeQuizAnswer({ type: 'bug', code: 'a\nb\nc', answerLine: [2, 3] }, 3).correct).toBe(true)
    const fill = gradeQuizAnswer({ type: 'fill', code: '___(0) ___', answer: [['ref'], ['.value', 'value']] }, ['ref', 'value'])
    expect(fill.correct).toBe(true)
    expect(fill.perBlank).toEqual([true, true])
  })
  it('never auto-grades short answers', () => {
    expect(isAutoGradable({ type: 'short', answer: 'x' })).toBe(false)
    expect(gradeQuizAnswer({ type: 'short', answer: 'x' }, 'x').grading).toBe('self')
  })
  it('normalizes code whitespace and quotes', () => {
    expect(normalizeCode(' count.value ++ ;')).toBe(normalizeCode('count.value++'))
    expect(normalizeCode(`import x from "vue"`)).toBe(normalizeCode(`import x from 'vue'`))
  })
  it('scores first tries over auto-gradable questions only', () => {
    const qs = [
      { id: 'a', type: 'mcq', options: ['x'], answer: 0 },
      { id: 'b', type: 'mcq', options: ['x'], answer: 0 },
      { id: 'c', type: 'short', answer: 'x' },
    ]
    expect(scoreQuiz(qs, { a: true, b: false })).toEqual({ correct: 1, total: 2, ratio: 0.5 })
  })
})

describe('dates & streaks', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const today = new Date(2026, 9, 21)
    const d = (n) => dayKey(new Date(2026, 9, 21 - n))
    expect(computeStreak([d(0), d(1), d(2)], today)).toBe(3)
    expect(computeStreak([d(1), d(2)], today)).toBe(2) // not broken until today ends
    expect(computeStreak([d(2), d(3)], today)).toBe(0)
    expect(computeStreak([], today)).toBe(0)
  })
  it('formats durations', () => {
    expect(formatDuration(61_000)).toBe('1:01')
  })
})

const index = {
  order: ['a', 'b', 'c', 'd'],
  lessons: {
    a: { id: 'a', title: 'A', order: 0, status: 'ready', difficulty: 'beginner', prerequisites: [], hasPlayground: true, counts: { quiz: 4, exercises: 2, questions: 3 } },
    b: { id: 'b', title: 'B', order: 1, status: 'ready', difficulty: 'beginner', prerequisites: ['a'], hasPlayground: false, counts: { quiz: 0, exercises: 0, questions: 0 } },
    c: { id: 'c', title: 'C', order: 2, status: 'ready', difficulty: 'intermediate', prerequisites: ['b'], hasPlayground: true, counts: { quiz: 4, exercises: 1, questions: 2 } },
    d: { id: 'd', title: 'D', order: 3, status: 'planned', difficulty: 'advanced', prerequisites: [], counts: { quiz: 0, exercises: 0, questions: 0 } },
  },
}

describe('learning analytics', () => {
  it('derives completion requirements from real activity', () => {
    const meta = index.lessons.a
    expect(requirementsFor(meta, {}).map((r) => [r.key, r.met])).toEqual([
      ['run', false],
      ['quiz', false],
      ['exercise', false],
    ])
    const lp = { ranExample: true, quiz: { best: 0.75 }, exercises: { x: { grading: 'tests' } } }
    expect(canComplete(meta, lp)).toBe(true)
    expect(canComplete(meta, { ...lp, quiz: { best: 0.5 } })).toBe(false)
    expect(requirementsFor(index.lessons.d, {})).toEqual([]) // planned lessons have no requirements
  })
  it('recommends the first unfinished lesson, respecting prerequisites', () => {
    expect(recommendNext(index, { lessons: {}, recent: [] }).id).toBe('a')
    const p = { lessons: { a: { completedAt: 1 } }, recent: ['c'] }
    // c was started but its prerequisite b is unfinished -> recommend b
    expect(recommendNext(index, p).id).toBe('b')
    const all = { lessons: { a: { completedAt: 1 }, b: { completedAt: 2 }, c: { completedAt: 3 } }, recent: [] }
    expect(recommendNext(index, all).id).toBe(null)
  })
  it('lists lessons needing revision with reasons', () => {
    const p = { lessons: { a: { quiz: { best: 0.5 } }, c: { revisit: true } } }
    const r = lessonsNeedingRevision(index, p, { questionStats: { q1: { lastResult: 'incorrect' } }, questionLesson: { q1: 'a' } })
    expect(r[0].id).toBe('a')
    expect(r.find((x) => x.id === 'c').reasons).toContain('You flagged it for revision')
  })
  it('computes learner level from completed lessons', () => {
    expect(learnerLevel(index, []).level).toBe('Newcomer')
    expect(learnerLevel(index, ['a']).level).toBe('Beginner')
    expect(learnerLevel(index, ['a', 'b']).level).toBe('Intermediate')
  })
  it('prioritises the revision queue and names weak topics', () => {
    const qs = [
      { id: 'q1', lesson: 'a', lessonTitle: 'A', difficulty: 'beginner' },
      { id: 'q2', lesson: 'a', lessonTitle: 'A', difficulty: 'advanced' },
      { id: 'q3', lesson: 'c', lessonTitle: 'C', difficulty: 'beginner' },
    ]
    const stats = { q1: { attempts: 1, lastResult: 'incorrect' }, q3: { attempts: 1, lastResult: 'got', review: true } }
    const queue = revisionQueue(qs, { questionStats: stats, progress: { lessons: { a: { completedAt: 1 } } } })
    expect(queue.map((x) => x.question.id)).toEqual(['q1', 'q3', 'q2'])
    expect(weakTopics(qs, stats).map((t) => t.lesson)).toEqual(['a'])
  })
})

describe('search', () => {
  const entries = [
    { id: '1', type: 'lesson', title: 'watchEffect() and watch', subtitle: '', text: 'reactivity' },
    { id: '2', type: 'api', title: 'watch()', subtitle: 'reacting to changes', text: '' },
    { id: '3', type: 'question', title: 'What is a composable?', subtitle: '', text: 'reuse logic' },
  ]
  it('ranks title prefix matches first and requires every word', () => {
    expect(searchIndex(entries, 'watch')[0].id).toBe('2')
    expect(searchIndex(entries, 'reuse composable').map((e) => e.id)).toEqual(['3'])
    expect(searchIndex(entries, 'nothing-matches')).toEqual([])
  })
  it('groups by type in a stable order', () => {
    expect(groupResults(entries).map((g) => g.type)).toEqual(['lesson', 'api', 'question'])
  })
})
