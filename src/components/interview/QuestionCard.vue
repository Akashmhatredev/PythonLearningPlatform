<script setup>
// An interview question. The learner can draft an answer first; the model
// answer stays hidden until they ask for it. Grading is labelled honestly:
// options → auto-graded, coding with tests → test-graded, otherwise self-assessed.
import { computed, ref, useId } from 'vue'
import { Bookmark, BookmarkCheck, Check, Eye, EyeOff, Flag, Timer, X } from 'lucide-vue-next'
import RichText from '../learning/RichText.vue'
import CodeBlock from '../code/CodeBlock.vue'
import PlaygroundEditor from '../code/PlaygroundEditor.vue'
import AnswerFrame from './AnswerFrame.vue'
import { useInterviewStore } from '../../stores/interview.js'
import { GRADING_LABELS } from '../../utils/grading.js'

const props = defineProps({
  question: { type: Object, required: true },
  compact: { type: Boolean, default: false },
  showLesson: { type: Boolean, default: true },
  startOpen: { type: Boolean, default: false },
})

const interview = useInterviewStore()
const uid = useId()
const q = computed(() => props.question)
const stat = computed(() => interview.state.stats[q.value.id])
const draft = ref('')
const revealed = ref(props.startOpen)
const picked = ref(null)
const optionResult = ref(null)
const testResult = ref(null)
const rated = ref(null)
const startedAt = Date.now()

const hasOptions = computed(() => Array.isArray(q.value.options) && typeof q.value.correctOption === 'number')
const isCoding = computed(() => q.value.type === 'coding' && q.value.starter?.files && q.value.tests?.length)
const typeLabel = {
  conceptual: 'conceptual',
  output: 'code output',
  debugging: 'debugging',
  coding: 'coding challenge',
  scenario: 'scenario',
  comparison: 'comparison',
  architecture: 'architecture',
}

function checkOption() {
  if (picked.value === null) return
  const correct = picked.value === q.value.correctOption
  optionResult.value = correct ? 'correct' : 'incorrect'
  interview.recordResult(q.value.id, { result: optionResult.value, grading: 'auto', timeMs: Date.now() - startedAt })
  revealed.value = true
}

function onTests({ passed }) {
  testResult.value = passed ? 'passed' : 'failed'
  interview.recordResult(q.value.id, { result: testResult.value, grading: 'tests', timeMs: Date.now() - startedAt })
}

function rate(r) {
  rated.value = r
  interview.recordResult(q.value.id, { result: r, grading: 'self', timeMs: Date.now() - startedAt })
}
</script>

<template>
  <article class="qc" :class="{ 'qc--compact': compact }" :id="`q-${q.id}`">
    <header class="qc__head">
      <div class="cluster qc__chips">
        <span class="chip" :class="`chip--${q.difficulty}`">{{ q.difficulty }}</span>
        <span class="chip chip--ghost">{{ typeLabel[q.type] || q.type }}</span>
        <span v-if="q.minutes" class="chip chip--ghost"><Timer :size="12" aria-hidden="true" /> ~{{ q.minutes }} min</span>
        <span v-if="stat?.lastResult" class="chip" :class="['correct', 'passed', 'got'].includes(stat.lastResult) ? 'chip--acid' : ''">
          last: {{ stat.lastResult }}
        </span>
      </div>
      <div class="cluster qc__tools">
        <button
          type="button"
          class="btn btn--sm btn--icon btn--ghost"
          :aria-pressed="!!stat?.review"
          :aria-label="stat?.review ? 'Remove review flag' : 'Flag for review'"
          :title="stat?.review ? 'Flagged for review' : 'Flag for review'"
          @click="interview.toggleReview(q.id)"
        >
          <Flag :size="16" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn btn--sm btn--icon btn--ghost"
          :aria-pressed="!!stat?.bookmarked"
          :aria-label="stat?.bookmarked ? 'Remove bookmark' : 'Bookmark question'"
          @click="interview.toggleBookmark(q.id)"
        >
          <BookmarkCheck v-if="stat?.bookmarked" :size="16" aria-hidden="true" />
          <Bookmark v-else :size="16" aria-hidden="true" />
        </button>
      </div>
    </header>

    <h4 class="qc__q"><RichText :value="q.question" inline /></h4>
    <CodeBlock v-if="q.code && (hasOptions || q.type === 'output' || q.type === 'debugging')" :code="q.code.code" :lang="q.code.lang || 'python'" class="qc__code" />

    <!-- auto-graded options -->
    <fieldset v-if="hasOptions && !revealed" class="qc__options">
      <legend class="label">Pick one</legend>
      <label v-for="(opt, i) in q.options" :key="i" class="qc__opt" :class="{ 'is-picked': picked === i }">
        <input v-model="picked" type="radio" :name="`${uid}-o`" :value="i" />
        <span class="mono">{{ 'ABCDE'[i] }}</span>
        <RichText :value="opt" inline />
      </label>
      <button type="button" class="btn btn--sm btn--ink" :disabled="picked === null" @click="checkOption">Check</button>
    </fieldset>

    <!-- coding challenge with tests -->
    <div v-if="isCoding" class="qc__coding">
      <PlaygroundEditor :files="q.starter.files" :tests="q.tests" title="Your solution" height="380px" @tests="onTests" />
    </div>

    <!-- free-form practice -->
    <div v-if="!hasOptions && !isCoding && !revealed && !compact" class="qc__draft">
      <label :for="`${uid}-draft`" class="label">Practice: answer out loud or type it first</label>
      <textarea :id="`${uid}-draft`" v-model="draft" class="textarea" rows="3" placeholder="Define it, say why it's useful, how it works, give an example, mention a trade-off…" />
      <AnswerFrame />
    </div>

    <div class="qc__actions">
      <button v-if="!revealed" type="button" class="btn btn--sm" @click="revealed = true"><Eye :size="14" aria-hidden="true" /> Reveal answer</button>
      <button v-else type="button" class="btn btn--sm btn--ghost" @click="revealed = false"><EyeOff :size="14" aria-hidden="true" /> Hide answer</button>
      <RouterLink v-if="showLesson && q.lessonPath" :to="q.lessonPath" class="btn btn--sm btn--ghost">Revise: {{ q.lessonTitle }}</RouterLink>
    </div>

    <div v-if="revealed" class="qc__answer">
      <p v-if="optionResult" class="qc__verdict" :class="optionResult === 'correct' ? 'is-ok' : 'is-bad'">
        <Check v-if="optionResult === 'correct'" :size="18" aria-hidden="true" /><X v-else :size="18" aria-hidden="true" />
        {{ optionResult === 'correct' ? 'Correct' : 'Not quite' }} <span class="chip">{{ GRADING_LABELS.auto }}</span>
      </p>
      <p v-if="testResult" class="qc__verdict" :class="testResult === 'passed' ? 'is-ok' : 'is-bad'">
        Tests {{ testResult }} <span class="chip">{{ GRADING_LABELS.tests }}</span>
      </p>

      <section class="qc__block qc__block--answer">
        <p class="label">Direct answer</p>
        <RichText :value="q.answer" />
      </section>
      <section v-if="q.explanation" class="qc__block">
        <p class="label">In plain English</p>
        <RichText :value="q.explanation" />
      </section>
      <CodeBlock v-if="q.code && !(hasOptions || q.type === 'output' || q.type === 'debugging')" :code="q.code.code" :lang="q.code.lang || 'python'" :title="q.code.title || 'example'" />
      <template v-if="q.solution?.files">
        <CodeBlock v-for="(src, name) in q.solution.files" :key="name" :code="src" :lang="name.endsWith('.py') ? 'python' : 'text'" :title="`solution · ${name}`" />
      </template>
      <section class="qc__block qc__block--model">
        <p class="label">Say it like this — model interview answer</p>
        <RichText :value="q.modelAnswer" />
      </section>
      <div class="qc__grid">
        <section v-if="q.whyAsked" class="qc__block">
          <p class="label">Why interviewers ask this</p>
          <RichText :value="q.whyAsked" />
        </section>
        <section v-if="q.mistakes?.length" class="qc__block">
          <p class="label">Common weak answers</p>
          <ul>
            <li v-for="(m, i) in q.mistakes" :key="i"><RichText :value="m" inline /></li>
          </ul>
        </section>
        <section v-if="q.followUps?.length" class="qc__block">
          <p class="label">Likely follow-ups</p>
          <ul>
            <li v-for="(f, i) in q.followUps" :key="i"><RichText :value="f" inline /></li>
          </ul>
        </section>
        <section v-if="q.challenge" class="qc__block qc__block--challenge">
          <p class="label">Challenge yourself</p>
          <RichText :value="q.challenge" />
        </section>
      </div>

      <div v-if="!hasOptions && !isCoding" class="qc__rate">
        <span class="label">Compared with the model answer, yours was… <em>(self-assessed)</em></span>
        <div class="cluster">
          <button type="button" class="btn btn--sm" :aria-pressed="rated === 'got'" @click="rate('got')">Solid</button>
          <button type="button" class="btn btn--sm" :aria-pressed="rated === 'partial'" @click="rate('partial')">Partly there</button>
          <button type="button" class="btn btn--sm" :aria-pressed="rated === 'missed'" @click="rate('missed')">Missed it</button>
          <button type="button" class="btn btn--sm btn--ghost" :aria-pressed="!!stat?.understood" @click="interview.toggleUnderstood(q.id)">
            {{ stat?.understood ? '✓ understood' : 'Mark understood' }}
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.qc {
  min-width: 0; /* grid items: let long code lines scroll inside their panel instead of widening the page */
  border: var(--border);
  border-left: 12px solid var(--cobalt);
  background: var(--surface);
  padding: var(--s-4) var(--s-5);
  box-shadow: var(--shadow-sm);
}
.qc__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--s-2);
  align-items: center;
}
.qc__chips {
  --cluster-gap: 6px;
}
.qc__tools {
  --cluster-gap: 4px;
}
.qc__q {
  font-size: var(--step-1);
  font-stretch: 100%;
  line-height: 1.3;
  margin: var(--s-3) 0;
  letter-spacing: -0.01em;
}
.qc__code {
  margin: var(--s-3) 0;
}
.qc__options {
  border: 0;
  padding: 0;
  margin: 0 0 var(--s-3);
  display: grid;
  gap: var(--s-2);
}
.qc__opt {
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  padding: var(--s-2) var(--s-3);
  border: var(--border-thin);
  cursor: pointer;
}
.qc__opt input {
  margin-top: 5px;
}
.qc__opt.is-picked {
  background: var(--note-blue);
}
.qc__options .btn {
  justify-self: start;
}
.qc__coding {
  margin: var(--s-3) 0;
}
.qc__draft {
  display: grid;
  gap: var(--s-2);
  margin-bottom: var(--s-3);
}
.qc__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
.qc__answer {
  display: grid;
  gap: var(--s-3);
  margin-top: var(--s-4);
  padding-top: var(--s-4);
  border-top: 2px dashed color-mix(in srgb, var(--line) 40%, transparent);
}
.qc__verdict {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  margin: 0;
}
.qc__verdict.is-ok {
  color: var(--green);
}
.qc__verdict.is-bad {
  color: var(--red-text);
}
.qc__block :deep(p:last-child),
.qc__block ul:last-child {
  margin-bottom: 0;
}
.qc__block .label {
  margin-bottom: var(--s-1);
  color: var(--muted);
}
.qc__block--answer {
  font-weight: 600;
}
.qc__block--model {
  padding: var(--s-3) var(--s-4);
  background: var(--note-blue);
  border: var(--border-thin);
  border-radius: var(--sketch-radius);
}
.qc__block--challenge {
  padding: var(--s-3);
  background: var(--note-yellow);
  border: var(--border-thin);
}
.qc__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--s-4);
}
.qc__rate {
  display: grid;
  gap: var(--s-2);
  padding-top: var(--s-3);
  border-top: var(--border-thin);
}
.qc--compact {
  padding: var(--s-3) var(--s-4);
}
</style>
