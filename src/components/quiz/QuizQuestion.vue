<script setup>
// One quiz question. Feedback is immediate, but the correct answer is only
// shown after a correct attempt or when the learner explicitly asks for it.
import { computed, reactive, ref, useId } from 'vue'
import { Check, Eye, RotateCcw, X } from 'lucide-vue-next'
import RichText from '../learning/RichText.vue'
import CodeBlock from '../code/CodeBlock.vue'
import { countBlanks, gradeQuizAnswer, isAutoGradable } from '../../utils/grading.js'
import { highlightLines, plainLines } from '../../services/highlight.js'

const props = defineProps({
  question: { type: Object, required: true },
  number: { type: Number, required: true },
})
const emit = defineEmits(['graded'])

const q = computed(() => props.question)
const uid = useId()
const auto = computed(() => isAutoGradable(q.value))
const multi = computed(() => Array.isArray(q.value.options) && Array.isArray(q.value.answer))
const options = computed(() => (q.value.options ?? []).map((o) => (typeof o === 'string' ? { text: o } : o)))

const choice = ref(null) // number | number[]
const multiChoice = ref([])
const text = ref('')
const blanks = reactive(Array.from({ length: countBlanks(q.value.code?.code ?? q.value.code ?? '') }, () => ''))
const line = ref(null)

const status = ref('idle') // idle | correct | wrong | revealed | self
const attempts = ref(0)
const lastWrongWhy = ref('')
const perBlank = ref(null)
const selfRating = ref(null)

const codeText = computed(() => (typeof q.value.code === 'string' ? q.value.code : q.value.code?.code) ?? '')
const codeLang = computed(() => (typeof q.value.code === 'object' ? q.value.code?.lang : null) ?? 'python')

// Pre-highlighted lines for the clickable bug view
const bugLines = ref(plainLines(codeText.value))
if (q.value.type === 'bug' && typeof q.value.answerLine !== 'undefined') {
  highlightLines(codeText.value, codeLang.value).then((l) => (bugLines.value = l))
}

// Fill-in: split code around ___ for inline inputs
const fillParts = computed(() => codeText.value.split('___'))

const response = computed(() => {
  if (Array.isArray(q.value.options)) return multi.value ? multiChoice.value : choice.value
  if (q.value.type === 'bug') return line.value
  if (q.value.type === 'fill') return [...blanks]
  return text.value
})
const canCheck = computed(() => {
  const r = response.value
  if (Array.isArray(r)) return q.value.type === 'fill' ? r.every((x) => String(x).trim()) : r.length > 0
  return r !== null && r !== undefined && String(r).trim() !== ''
})
const locked = computed(() => ['correct', 'revealed'].includes(status.value))

function check() {
  if (!auto.value) return
  const res = gradeQuizAnswer(q.value, response.value)
  attempts.value++
  perBlank.value = res.perBlank ?? null
  if (res.correct) {
    status.value = 'correct'
  } else {
    status.value = 'wrong'
    const picked = typeof choice.value === 'number' ? options.value[choice.value] : null
    lastWrongWhy.value = picked?.why ?? q.value.hint ?? ''
  }
  if (attempts.value === 1) emit('graded', { id: q.value.id, correct: !!res.correct, grading: 'auto' })
}

function reveal() {
  if (attempts.value === 0) emit('graded', { id: q.value.id, correct: false, grading: 'auto' })
  attempts.value = Math.max(attempts.value, 1)
  status.value = 'revealed'
}

function tryAgain() {
  status.value = 'idle'
  lastWrongWhy.value = ''
}

function showModel() {
  status.value = 'self'
}
function rate(r) {
  selfRating.value = r
  emit('graded', { id: q.value.id, correct: null, grading: 'self', rating: r })
}

const correctText = computed(() => {
  const a = q.value.answer
  if (Array.isArray(q.value.options)) {
    const idx = Array.isArray(a) ? a : [a]
    return idx.map((i) => options.value[i]?.text).join(' + ')
  }
  if (q.value.type === 'bug') return `Line ${Array.isArray(q.value.answerLine) ? q.value.answerLine.join(', ') : q.value.answerLine}`
  if (q.value.type === 'fill') return a.map((x) => (Array.isArray(x) ? x[0] : x)).join(' · ')
  return a
})
const typeLabel = { mcq: 'multiple choice', output: 'predict the output', bug: 'find the bug', fill: 'fill the blank', short: 'explain it' }
const isOptionCorrect = (i) => (Array.isArray(q.value.answer) ? q.value.answer.includes(i) : q.value.answer === i)
</script>

<template>
  <article class="qq" :class="`qq--${status}`">
    <header class="qq__head">
      <span class="qq__num mono">Q{{ number }}</span>
      <span class="label qq__type">{{ typeLabel[q.type] || q.type }}</span>
      <span v-if="!auto" class="chip chip--ghost">self-assessed</span>
    </header>
    <RichText class="qq__prompt" :value="q.prompt" />

    <!-- code display for output / mcq-with-code / bug-with-options -->
    <CodeBlock
      v-if="codeText && q.type !== 'fill' && !(q.type === 'bug' && q.answerLine !== undefined)"
      :code="codeText"
      :lang="codeLang"
      title="read carefully"
      class="qq__code"
    />

    <!-- options -->
    <fieldset v-if="options.length" class="qq__options" :disabled="locked">
      <legend class="visually-hidden">Answer options</legend>
      <label
        v-for="(opt, i) in options"
        :key="i"
        class="opt"
        :class="{
          'opt--picked': multi ? multiChoice.includes(i) : choice === i,
          'opt--right': locked && isOptionCorrect(i),
        }"
      >
        <input v-if="multi" v-model="multiChoice" type="checkbox" :value="i" />
        <input v-else v-model="choice" type="radio" :name="`${uid}-opt`" :value="i" />
        <span class="opt__letter mono" aria-hidden="true">{{ 'ABCDEFG'[i] }}</span>
        <RichText class="opt__text" :value="opt.text" inline />
      </label>
      <p v-if="multi" class="qq__hint-multi label">select all that apply</p>
    </fieldset>

    <!-- clickable code lines for find-the-bug -->
    <div v-else-if="q.type === 'bug' && q.answerLine !== undefined" class="code-panel qq__bug">
      <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" />click the line with the bug</span></div>
      <div class="qq__bug-lines" role="radiogroup" :aria-label="`Lines of code for question ${number}`">
        <button
          v-for="(ln, i) in bugLines"
          :key="i"
          type="button"
          role="radio"
          class="bugline"
          :class="{ 'is-picked': line === i + 1, 'is-answer': locked && (Array.isArray(q.answerLine) ? q.answerLine.includes(i + 1) : q.answerLine === i + 1) }"
          :aria-checked="line === i + 1"
          :disabled="locked"
          @click="line = i + 1"
        >
          <span class="bugline__n">{{ i + 1 }}</span><code><span v-for="(t, j) in ln" :key="j" :class="t.cls">{{ t.text }}</span></code>
        </button>
      </div>
    </div>

    <!-- fill in the blank -->
    <div v-else-if="q.type === 'fill'" class="code-panel qq__fill">
      <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" />fill the blanks</span></div>
      <pre class="code-block code-block--plain"><code><template v-for="(part, i) in fillParts" :key="i">{{ part }}<input
        v-if="i < fillParts.length - 1"
        v-model="blanks[i]"
        class="blank"
        :class="{ 'blank--ok': perBlank && perBlank[i], 'blank--bad': perBlank && !perBlank[i] }"
        :aria-label="`Blank ${i + 1}`"
        :disabled="locked"
        :size="Math.max(6, (blanks[i] || '').length + 1)"
        spellcheck="false"
        autocomplete="off"
        @keydown.enter.prevent="canCheck && check()"
      /></template></code></pre>
    </div>

    <!-- free text: output without options / short answer -->
    <div v-else class="field qq__text">
      <label :for="`${uid}-text`" class="label">{{ q.type === 'output' ? 'What appears / what is logged?' : 'Your answer (in your own words)' }}</label>
      <textarea :id="`${uid}-text`" v-model="text" class="textarea" :rows="q.type === 'output' ? 2 : 4" :disabled="locked || status === 'self'" />
    </div>

    <!-- actions -->
    <div class="qq__actions">
      <template v-if="auto">
        <button v-if="status === 'idle'" type="button" class="btn btn--sm btn--ink" :disabled="!canCheck" @click="check">Check answer</button>
        <template v-if="status === 'wrong'">
          <button type="button" class="btn btn--sm" @click="tryAgain"><RotateCcw :size="14" aria-hidden="true" /> Try again</button>
          <button type="button" class="btn btn--sm btn--ghost" @click="reveal"><Eye :size="14" aria-hidden="true" /> Reveal answer</button>
        </template>
      </template>
      <template v-else>
        <button v-if="status !== 'self'" type="button" class="btn btn--sm btn--ink" @click="showModel">Compare with model answer</button>
      </template>
    </div>

    <!-- feedback -->
    <div class="qq__feedback" aria-live="polite">
      <div v-if="status === 'correct'" class="fb fb--ok">
        <p class="fb__mark hand"><Check :size="20" aria-hidden="true" /> correct{{ attempts > 1 ? ' (after ' + attempts + ' tries)' : '' }}</p>
        <RichText :value="q.explanation" />
      </div>
      <div v-else-if="status === 'wrong'" class="fb fb--bad">
        <p class="fb__mark hand"><X :size="20" aria-hidden="true" /> not quite</p>
        <RichText v-if="lastWrongWhy" :value="lastWrongWhy" />
        <p v-else-if="perBlank">The highlighted blanks are not right yet.</p>
        <p v-else>Have another look — or reveal the answer if you're stuck.</p>
      </div>
      <div v-else-if="status === 'revealed'" class="fb fb--reveal">
        <p class="fb__mark hand"><Eye :size="20" aria-hidden="true" /> answer: <span class="mono">{{ correctText }}</span></p>
        <RichText :value="q.explanation" />
      </div>
      <div v-else-if="status === 'self'" class="fb fb--self">
        <p class="label">Model answer</p>
        <RichText :value="q.answer" />
        <RichText v-if="q.explanation" :value="q.explanation" />
        <div class="qq__rate">
          <span class="label">How did yours compare? (self-assessed)</span>
          <div class="cluster">
            <button type="button" class="btn btn--sm" :aria-pressed="selfRating === 'got'" @click="rate('got')">Got it</button>
            <button type="button" class="btn btn--sm" :aria-pressed="selfRating === 'partial'" @click="rate('partial')">Partly</button>
            <button type="button" class="btn btn--sm" :aria-pressed="selfRating === 'missed'" @click="rate('missed')">Missed it</button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.qq {
  min-width: 0; /* grid items: let long code lines scroll inside their panel instead of widening the page */
  border: var(--border);
  background: var(--surface);
  padding: var(--s-4) var(--s-5) var(--s-5);
  position: relative;
}
.qq--correct {
  box-shadow: 6px 6px 0 var(--green);
}
.qq--wrong {
  box-shadow: 6px 6px 0 var(--red);
}
.qq__head {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-3);
}
.qq__num {
  font-weight: 800;
  background: var(--text);
  color: var(--bg);
  padding: 2px 8px;
}
.qq__type {
  color: var(--muted);
}
.qq__prompt {
  font-weight: 600;
  font-size: 1.05rem;
}
.qq__code,
.qq__bug,
.qq__fill {
  margin: var(--s-4) 0;
}
.qq__options {
  border: 0;
  padding: 0;
  margin: var(--s-4) 0 0;
  display: grid;
  gap: var(--s-2);
}
.opt {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3);
  border: var(--border-thin);
  background: var(--surface);
  cursor: pointer;
}
.opt input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.opt:hover {
  background: var(--surface-2);
}
.opt:focus-within {
  outline: 3px solid var(--cobalt);
  outline-offset: 2px;
}
.opt__letter {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: var(--border-thin);
  font-weight: 800;
  font-size: 0.8rem;
}
.opt--picked {
  background: var(--note-yellow);
  border-color: var(--line);
}
.opt--picked .opt__letter {
  background: var(--text);
  color: var(--bg);
}
.opt--right {
  background: var(--note-green);
  box-shadow: inset 6px 0 0 var(--green);
}
.qq__options:disabled .opt {
  cursor: default;
}
.qq__hint-multi {
  color: var(--muted);
  margin: 0;
}
.qq__bug-lines {
  padding: var(--s-2) 0;
  overflow-x: auto;
}
.bugline {
  display: flex;
  width: 100%;
  min-width: max-content;
  gap: 1.2ch;
  border: 0;
  border-left: 4px solid transparent;
  background: transparent;
  color: var(--code-text);
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  line-height: 1.7;
  padding: 0 var(--s-4) 0 var(--s-2);
  white-space: pre;
}
.bugline code {
  background: none;
  border: 0;
  padding: 0;
  font-size: inherit;
  white-space: pre;
}
.bugline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
}
.bugline.is-picked {
  background: rgba(229, 52, 26, 0.25);
  border-left-color: var(--red);
}
.bugline.is-answer {
  background: rgba(255, 212, 59, 0.18);
  border-left-color: var(--acid);
}
.bugline__n {
  color: var(--code-muted);
  width: 2.5ch;
  text-align: right;
  user-select: none;
}
.blank {
  font: inherit;
  background: #2d2d29;
  color: var(--acid);
  border: 0;
  border-bottom: 2px dashed var(--acid);
  padding: 0 4px;
  min-width: 6ch;
}
.blank:focus {
  outline: 2px solid var(--acid);
}
.blank--ok {
  border-bottom: 2px solid #39d353;
  color: #8ff0a4;
}
.blank--bad {
  border-bottom: 2px solid var(--red);
  color: #ff9a85;
}
.qq__text {
  margin-top: var(--s-4);
}
.qq__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-top: var(--s-4);
}
.fb {
  margin-top: var(--s-4);
  padding: var(--s-3) var(--s-4);
  border: var(--border-thin);
  border-left-width: 8px;
}
.fb > :deep(:last-child) {
  margin-bottom: 0;
}
.fb__mark {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.35rem;
  margin: 0 0 var(--s-2);
}
.fb--ok {
  background: var(--note-green);
  border-left-color: var(--green);
}
.fb--ok .fb__mark {
  color: var(--green);
}
.fb--bad {
  background: #ffe9e3;
  border-left-color: var(--red);
}
:root[data-theme='dark'] .fb--bad {
  background: #2e1a15;
}
.fb--bad .fb__mark {
  color: var(--red-text);
}
.fb--reveal {
  background: var(--note-yellow);
}
.fb--self {
  background: var(--note-blue);
  border-left-color: var(--cobalt);
}
.qq__rate {
  display: grid;
  gap: var(--s-2);
  margin-top: var(--s-3);
}
</style>
