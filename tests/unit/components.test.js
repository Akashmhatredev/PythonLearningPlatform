import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'
import { memoryAdapter, setStorageAdapter } from '../../src/services/storage.js'
import QuizQuestion from '../../src/components/quiz/QuizQuestion.vue'
import RichText from '../../src/components/learning/RichText.vue'
import AnimationControls from '../../src/components/diagrams/AnimationControls.vue'
import CompletionPanel from '../../src/components/learning/CompletionPanel.vue'
import QuestionCard from '../../src/components/interview/QuestionCard.vue'
import { useStepPlayer } from '../../src/composables/useStepPlayer.js'
import { useProgressStore } from '../../src/stores/progress.js'
import { useInterviewStore } from '../../src/stores/interview.js'
import { usePreferencesStore } from '../../src/stores/preferences.js'
import { createAppRouter } from '../../src/router/index.js'

let pinia
beforeEach(() => {
  setStorageAdapter(memoryAdapter())
  pinia = createPinia()
  setActivePinia(pinia)
})
const global = () => ({ plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } })

describe('QuizQuestion', () => {
  const q = {
    id: 'q',
    type: 'mcq',
    prompt: 'Pick B',
    options: [{ text: 'A', why: 'A is wrong because reasons.' }, { text: 'B' }],
    answer: 1,
    explanation: 'B is right.',
  }

  it('explains a wrong pick without revealing the answer, and grades only the first try', async () => {
    const w = mount(QuizQuestion, { props: { question: q, number: 1 }, global: global() })
    await w.findAll('input[type=radio]')[0].setValue()
    await w.find('button.btn--ink').trigger('click')
    expect(w.text()).toContain('A is wrong because reasons.')
    expect(w.text()).not.toContain('B is right.')
    expect(w.emitted('graded')[0][0]).toMatchObject({ id: 'q', correct: false })
    // try again and get it right: no second "graded" event
    await w.findAll('button').find((b) => b.text().includes('Try again')).trigger('click')
    await w.findAll('input[type=radio]')[1].setValue()
    await w.find('button.btn--ink').trigger('click')
    expect(w.text()).toContain('B is right.')
    expect(w.emitted('graded')).toHaveLength(1)
  })

  it('reveals the answer only on request', async () => {
    const w = mount(QuizQuestion, { props: { question: q, number: 1 }, global: global() })
    await w.findAll('input[type=radio]')[0].setValue()
    await w.find('button.btn--ink').trigger('click')
    await w.findAll('button').find((b) => b.text().includes('Reveal answer')).trigger('click')
    expect(w.text()).toContain('answer:')
    expect(w.text()).toContain('B is right.')
  })
})

describe('RichText', () => {
  it('renders markdown as elements and never injects HTML', () => {
    const w = mount(RichText, { props: { value: 'Hello **bold** `code` <img src=x onerror=alert(1)>' }, global: global() })
    expect(w.find('strong').text()).toBe('bold')
    expect(w.find('code').text()).toBe('code')
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toContain('<img src=x onerror=alert(1)>')
  })
})

describe('step player + AnimationControls', () => {
  it('steps forward/back and plays manually when motion is reduced', async () => {
    const Host = defineComponent({
      setup() {
        const player = useStepPlayer(() => ['a', 'b', 'c'], { interval: 10 })
        return () => h('div', [h(AnimationControls, { player }), h('p', { class: 'frame' }, player.frame.value)])
      },
    })
    const w = mount(Host, { global: global() })
    const btn = (label) => w.find(`button[aria-label="${label}"]`)
    expect(w.find('.frame').text()).toBe('a')
    await btn('Step forward').trigger('click')
    expect(w.find('.frame').text()).toBe('b')
    await btn('Step back').trigger('click')
    expect(w.find('.frame').text()).toBe('a')
    usePreferencesStore().setMotion('reduced')
    await w.vm.$nextTick()
    await btn('Next step').trigger('click') // play becomes "next step" with reduced motion
    expect(w.find('.frame').text()).toBe('b')
  })
})

describe('CompletionPanel', () => {
  it('stays disabled until requirements are met', async () => {
    const w = mount(CompletionPanel, { props: { lessonId: 'variables-and-names' }, global: global() })
    const button = () => w.find('button')
    expect(button().attributes('disabled')).toBeDefined()
    const p = useProgressStore()
    p.recordRun('variables-and-names')
    p.recordQuizAttempt('variables-and-names', { correct: 5, total: 5, ratio: 1 })
    p.recordExercise('variables-and-names', 'swap-cups', 'tests')
    await w.vm.$nextTick()
    expect(button().attributes('disabled')).toBeUndefined()
    await button().trigger('click')
    expect(p.isComplete('variables-and-names')).toBe(true)
  })
})

describe('QuestionCard', () => {
  const q = {
    id: 'demo-q',
    difficulty: 'beginner',
    type: 'conceptual',
    minutes: 2,
    question: 'What is a variable in Python?',
    answer: 'A name bound to an object.',
    explanation: 'It wraps a value.',
    whyAsked: 'Basics.',
    mistakes: ['Forgetting .value'],
    followUps: ['What does assignment copy?'],
    modelAnswer: 'MODEL ANSWER TEXT',
  }
  it('hides the model answer until revealed and records self-assessment as self-graded', async () => {
    const w = mount(QuestionCard, { props: { question: q }, global: global() })
    expect(w.text()).not.toContain('MODEL ANSWER TEXT')
    await w.findAll('button').find((b) => b.text().includes('Reveal answer')).trigger('click')
    expect(w.text()).toContain('MODEL ANSWER TEXT')
    await w.findAll('button').find((b) => b.text() === 'Partly there').trigger('click')
    const stat = useInterviewStore().state.stats['demo-q']
    expect(stat.lastResult).toBe('partial')
    expect(stat.results[0].grading).toBe('self')
  })
})

describe('router', () => {
  it('resolves lessons, redirects levels and sends unknown or mismatched paths to 404', async () => {
    const router = createAppRouter(createMemoryHistory())
    await router.push('/learn/basics/variables-and-names')
    expect(router.currentRoute.value.name).toBe('lesson')
    await router.push('/learn/getting-started/variables-and-names') // lesson exists, wrong level
    expect(router.currentRoute.value.name).toBe('not-found')
    await router.push('/learn/basics')
    expect(router.currentRoute.value.name).toBe('course')
    expect(router.currentRoute.value.hash).toBe('#basics')
    await router.push('/definitely/not/here')
    expect(router.currentRoute.value.name).toBe('not-found')
    await flushPromises()
  })
})
