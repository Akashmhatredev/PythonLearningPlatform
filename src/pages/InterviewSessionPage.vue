<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, Eye, Flag, Lightbulb, Timer, X } from 'lucide-vue-next'
import { loadQuestionBank } from '../content/index.js'
import { summarizeSession, useInterviewStore } from '../stores/interview.js'
import { useUiStore } from '../stores/ui.js'
import { GRADING_LABELS } from '../utils/grading.js'
import { formatDuration } from '../utils/dates.js'
import RichText from '../components/learning/RichText.vue'
import CodeBlock from '../components/code/CodeBlock.vue'
import PlaygroundEditor from '../components/code/PlaygroundEditor.vue'
import AnswerFrame from '../components/interview/AnswerFrame.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import StateBlock from '../components/ui/StateBlock.vue'

const route = useRoute()
const router = useRouter()
const interview = useInterviewStore()
const ui = useUiStore()

const id = route.params.sessionId
const session = computed(() => interview.getSession(id))
const bank = shallowRef(null)
const confirmFinish = ref(false)
const now = ref(Date.now())
let ticker = null

onMounted(async () => {
  const all = await loadQuestionBank()
  bank.value = Object.fromEntries(all.map((q) => [q.id, q]))
  ticker = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(ticker))

const questions = computed(() => (bank.value && session.value ? session.value.questionIds.map((qid) => bank.value[qid]).filter(Boolean) : []))
const index = computed(() => Math.min(session.value?.current ?? 0, Math.max(0, questions.value.length - 1)))
const q = computed(() => questions.value[index.value] ?? null)
const answer = computed(() => (q.value ? (session.value.answers[q.value.id] ?? {}) : {}))
const isMock = computed(() => session.value?.config.mode === 'mock')
const finished = computed(() => session.value?.status === 'finished')
const remaining = computed(() => (session.value?.deadline ? Math.max(0, session.value.deadline - now.value) : null))

const hasOptions = computed(() => Array.isArray(q.value?.options) && typeof q.value?.correctOption === 'number')
const isCoding = computed(() => q.value?.type === 'coding' && q.value?.starter?.files && q.value?.tests?.length)
const showCode = computed(() => q.value?.code && (hasOptions.value || ['output', 'debugging'].includes(q.value.type)))

function tick() {
  now.value = Date.now()
  const s = session.value
  if (!s || s.status !== 'active' || !q.value) return
  if (typeof document === 'undefined' || document.visibilityState === 'visible') interview.addTime(id, q.value.id, 1000)
  if (s.deadline && now.value >= s.deadline) {
    interview.finishSession(id)
    ui.toast('Time is up — here is your review.', { tone: 'info' })
  }
}

const update = (patch) => q.value && interview.updateAnswer(id, q.value.id, patch)
const go = (i) => interview.setCurrent(id, Math.max(0, Math.min(i, questions.value.length - 1)))

const picked = ref(null)
watch(q, () => (picked.value = answer.value.choice ?? null), { immediate: true })

function submitOption() {
  if (picked.value === null) return
  update({ choice: picked.value, result: picked.value === q.value.correctOption ? 'correct' : 'incorrect', grading: 'auto' })
}
function onTests({ passed, files }) {
  update({ result: passed ? 'passed' : 'failed', grading: 'tests', code: files })
}
let typing = null
function onText(e) {
  const v = e.target.value
  clearTimeout(typing)
  typing = setTimeout(() => update({ text: v }), 300)
}
function rate(result) {
  update({ result, grading: 'self' })
}
function finish() {
  confirmFinish.value = false
  interview.finishSession(id)
  window.scrollTo({ top: 0 })
}

const status = (qq) => {
  const a = session.value.answers[qq.id]
  if (!a) return 'todo'
  if (a.result) return 'done'
  if (a.text || a.code) return 'draft'
  return 'todo'
}
const unanswered = computed(() => questions.value.filter((x) => status(x) === 'todo').length)

// ----- review
const summary = computed(() => (session.value ? summarizeSession(session.value) : null))
const resultLabel = { correct: 'correct', incorrect: 'incorrect', passed: 'tests passed', failed: 'tests failed', got: 'solid', partial: 'partly there', missed: 'missed' }
const isGood = (r) => ['correct', 'passed', 'got'].includes(r)
function retryMissed() {
  const ids = questions.value.filter((x) => !isGood(session.value.answers[x.id]?.result)).map((x) => x.id)
  if (!ids.length) return
  const nid = interview.startSession({ ...session.value.config, mode: 'practice', minutes: null, source: 'retry' }, ids)
  router.push(`/interview/session/${nid}`)
}
</script>

<template>
  <div class="page ses">
    <StateBlock v-if="!session" kind="error" title="Session not found">
      <p>This session doesn’t exist in this browser (sessions are stored locally).</p>
      <RouterLink to="/interview" class="btn btn--sm">Start a new session</RouterLink>
    </StateBlock>
    <StateBlock v-else-if="!bank" kind="loading" title="Loading questions…" />
    <StateBlock v-else-if="!questions.length" kind="error" title="These questions no longer exist">
      <RouterLink to="/interview" class="btn btn--sm">Start a new session</RouterLink>
    </StateBlock>

    <!-- ================= ACTIVE ================= -->
    <template v-else-if="!finished">
      <header class="ses__bar">
        <div>
          <span class="label">{{ isMock ? 'mock interview' : 'practice session' }}</span>
          <p class="ses__progress mono">question {{ index + 1 }} / {{ questions.length }}</p>
        </div>
        <div class="ses__bar-right">
          <span v-if="remaining !== null" class="ses__timer mono" :class="{ 'is-low': remaining < 60000 }" role="timer" :aria-label="`Time left ${formatDuration(remaining)}`">
            <Timer :size="16" aria-hidden="true" /> {{ formatDuration(remaining) }}
          </span>
          <span class="mono muted">on this question: {{ formatDuration(answer.timeMs ?? 0) }}</span>
          <button type="button" class="btn btn--sm btn--ink" @click="confirmFinish = true">Finish</button>
        </div>
      </header>

      <nav class="ses__nav" aria-label="Questions">
        <button
          v-for="(qq, i) in questions"
          :key="qq.id"
          type="button"
          class="ses__dot"
          :class="[`is-${status(qq)}`, { 'is-current': i === index }]"
          :aria-current="i === index ? 'step' : undefined"
          :aria-label="`Question ${i + 1} (${status(qq)})`"
          @click="go(i)"
        >
          {{ i + 1 }}
        </button>
      </nav>

      <article class="ses__q" :aria-label="`Question ${index + 1}`">
        <div class="cluster ses__chips">
          <span class="chip" :class="`chip--${q.difficulty}`">{{ q.difficulty }}</span>
          <span class="chip chip--ghost">{{ q.type }}</span>
          <span class="chip chip--ghost">~{{ q.minutes }} min</span>
          <span class="chip chip--ghost">{{ q.lessonTitle }}</span>
          <button type="button" class="btn btn--sm btn--ghost" :aria-pressed="!!interview.state.stats[q.id]?.review" @click="interview.toggleReview(q.id)">
            <Flag :size="14" aria-hidden="true" /> flag for review
          </button>
        </div>
        <h2 class="ses__title"><RichText :value="q.question" inline /></h2>
        <CodeBlock v-if="showCode" :code="q.code.code" :lang="q.code.lang || 'python'" />

        <!-- options: auto-graded -->
        <fieldset v-if="hasOptions" class="ses__opts" :disabled="!!answer.result">
          <legend class="visually-hidden">Answer options</legend>
          <label v-for="(opt, i) in q.options" :key="i" class="ses__opt" :class="{ 'is-picked': picked === i, 'is-right': answer.result && !isMock && i === q.correctOption, 'is-wrong': answer.result === 'incorrect' && !isMock && i === answer.choice }">
            <input v-model="picked" type="radio" :name="`opt-${q.id}`" :value="i" />
            <span class="mono">{{ 'ABCDE'[i] }}</span> <RichText :value="opt" inline />
          </label>
          <button v-if="!answer.result" type="button" class="btn btn--sm btn--ink" :disabled="picked === null" @click="submitOption">Submit answer</button>
          <p v-else-if="isMock" class="muted">Answer saved. Feedback comes in the final review.</p>
        </fieldset>

        <!-- coding: test-graded -->
        <div v-else-if="isCoding" class="ses__coding">
          <PlaygroundEditor :key="q.id" :files="answer.code ?? q.starter.files" :tests="q.tests" title="Your solution" height="400px" @tests="onTests" />
          <p v-if="answer.result" class="mono">last test run: {{ answer.result === 'passed' ? 'all tests passed ✓' : 'some tests failed ✗' }} <span class="chip">{{ GRADING_LABELS.tests }}</span></p>
        </div>

        <!-- open answer -->
        <div v-else class="ses__open">
          <label class="label" :for="`ans-${q.id}`">your answer (type it, or say it out loud and jot key points)</label>
          <textarea :id="`ans-${q.id}`" :key="q.id" class="textarea" rows="6" :value="answer.text" :disabled="!!answer.result" @input="onText" />
          <AnswerFrame :key="'f' + q.id" />
        </div>

        <!-- hints -->
        <div v-if="q.hints?.length" class="ses__hints">
          <button v-if="(answer.hintsUsed ?? 0) < q.hints.length" type="button" class="btn btn--sm btn--ghost" @click="update({ hintsUsed: (answer.hintsUsed ?? 0) + 1 })">
            <Lightbulb :size="14" aria-hidden="true" /> hint ({{ answer.hintsUsed ?? 0 }}/{{ q.hints.length }})
          </button>
          <p v-for="(hnt, i) in q.hints.slice(0, answer.hintsUsed ?? 0)" :key="i" class="ses__hint">💡 <RichText :value="hnt" inline /></p>
        </div>

        <!-- practice-mode feedback -->
        <template v-if="!isMock">
          <div v-if="hasOptions && answer.result" class="ses__feedback" :class="isGood(answer.result) ? 'is-good' : 'is-bad'">
            <p class="ses__verdict"><Check v-if="isGood(answer.result)" :size="18" aria-hidden="true" /><X v-else :size="18" aria-hidden="true" /> {{ resultLabel[answer.result] }} <span class="chip">{{ GRADING_LABELS.auto }}</span></p>
            <RichText :value="q.answer" />
            <RichText :value="q.explanation" />
          </div>
          <template v-if="!hasOptions">
            <button v-if="!answer.revealed" type="button" class="btn btn--sm" @click="update({ revealed: true })"><Eye :size="14" aria-hidden="true" /> Reveal model answer</button>
            <div v-else class="ses__feedback">
              <p class="label">direct answer</p>
              <RichText :value="q.answer" />
              <p class="label">say it like this</p>
              <RichText class="ses__model" :value="q.modelAnswer" />
              <template v-if="q.solution?.files">
                <CodeBlock v-for="(src, name) in q.solution.files" :key="name" :code="src" :lang="name.endsWith('.py') ? 'python' : name.endsWith('.json') ? 'json' : 'text'" :title="`solution · ${name}`" />
              </template>
              <div v-if="!isCoding" class="ses__rate">
                <span class="label">how did yours compare? (self-assessed)</span>
                <div class="cluster">
                  <button v-for="r in ['got', 'partial', 'missed']" :key="r" type="button" class="btn btn--sm" :aria-pressed="answer.result === r" @click="rate(r)">{{ resultLabel[r] }}</button>
                </div>
              </div>
            </div>
          </template>
        </template>
      </article>

      <div class="ses__pager">
        <button type="button" class="btn" :disabled="index === 0" @click="go(index - 1)"><ArrowLeft :size="16" aria-hidden="true" /> Previous</button>
        <button v-if="index < questions.length - 1" type="button" class="btn btn--acid" @click="go(index + 1)">Next <ArrowRight :size="16" aria-hidden="true" /></button>
        <button v-else type="button" class="btn btn--acid" @click="confirmFinish = true">Finish &amp; review</button>
      </div>

      <BaseModal v-model:open="confirmFinish" title="Finish this session?" size="sm">
        <p>{{ unanswered ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} still unanswered.` : 'All questions have an answer.' }} You’ll see a full review next.</p>
        <template #footer>
          <button type="button" class="btn btn--ghost" @click="confirmFinish = false">Keep going</button>
          <button type="button" class="btn btn--ink" @click="finish">Finish</button>
        </template>
      </BaseModal>
    </template>

    <!-- ================= REVIEW ================= -->
    <template v-else>
      <header class="page-head">
        <span class="label">session review · {{ isMock ? 'mock interview' : 'practice' }} · {{ new Date(session.finishedAt).toLocaleString() }}</span>
        <h1>How it went.</h1>
      </header>
      <div class="review__stats">
        <div><span class="label">answered</span><strong>{{ summary.answered }}/{{ summary.total }}</strong></div>
        <div><span class="label">auto-graded</span><strong>{{ summary.auto.good }}/{{ summary.auto.total }}</strong></div>
        <div><span class="label">test-graded</span><strong>{{ summary.tests.good }}/{{ summary.tests.total }}</strong></div>
        <div><span class="label">self-assessed</span><strong>{{ summary.self.got }}·{{ summary.self.partial }}·{{ summary.self.missed }}</strong><span class="muted">solid · partly · missed</span></div>
        <div><span class="label">time</span><strong>{{ formatDuration(summary.timeMs) }}</strong><span class="muted">avg {{ formatDuration(summary.timeMs / Math.max(1, summary.total)) }}</span></div>
      </div>
      <p class="muted review__note">Auto- and test-graded results are objective. Self-assessed answers are your own judgement and are never counted as “correct”.</p>
      <div class="cluster review__actions">
        <button type="button" class="btn btn--cobalt" @click="retryMissed">Retry everything not marked correct/solid</button>
        <RouterLink to="/interview" class="btn">New session</RouterLink>
        <RouterLink to="/revision" class="btn btn--ghost">Revision queue</RouterLink>
      </div>

      <ol class="review__list">
        <li v-for="(qq, i) in questions" :key="qq.id" class="rv-item" :class="session.answers[qq.id]?.result ? (isGood(session.answers[qq.id].result) ? 'is-good' : 'is-bad') : 'is-none'">
          <details :open="!isGood(session.answers[qq.id]?.result)">
            <summary class="rv-item__sum">
              <span class="mono">Q{{ i + 1 }}</span>
              <RichText :value="qq.question" inline />
              <span class="rv-item__res">
                <template v-if="session.answers[qq.id]?.result">{{ resultLabel[session.answers[qq.id].result] }} · {{ GRADING_LABELS[session.answers[qq.id].grading] }}</template>
                <template v-else>not graded</template>
              </span>
            </summary>
            <div class="rv-item__body">
              <p class="label">your answer · {{ formatDuration(session.answers[qq.id]?.timeMs ?? 0) }}<template v-if="session.answers[qq.id]?.hintsUsed"> · {{ session.answers[qq.id].hintsUsed }} hint(s)</template></p>
              <p v-if="session.answers[qq.id]?.choice !== null && session.answers[qq.id]?.choice !== undefined && qq.options">
                <RichText :value="qq.options[session.answers[qq.id].choice]" inline /> — correct: <RichText :value="qq.options[qq.correctOption]" inline />
              </p>
              <p v-else-if="session.answers[qq.id]?.text" class="rv-item__text">{{ session.answers[qq.id].text }}</p>
              <p v-else-if="!session.answers[qq.id]?.code" class="muted">(no answer)</p>
              <p class="label">direct answer</p>
              <RichText :value="qq.answer" />
              <p class="label">model interview answer</p>
              <RichText class="ses__model" :value="qq.modelAnswer" />
              <RichText v-if="qq.explanation" :value="qq.explanation" />
              <div class="rv-item__grid">
                <div v-if="qq.mistakes?.length">
                  <p class="label">common weak answers</p>
                  <ul>
                    <li v-for="(m, k) in qq.mistakes" :key="k"><RichText :value="m" inline /></li>
                  </ul>
                </div>
                <div v-if="qq.followUps?.length">
                  <p class="label">follow-ups to prepare</p>
                  <ul>
                    <li v-for="(f, k) in qq.followUps" :key="k"><RichText :value="f" inline /></li>
                  </ul>
                </div>
              </div>
              <div v-if="!session.answers[qq.id]?.result && !(qq.options && typeof qq.correctOption === 'number') && !(qq.type === 'coding' && qq.tests?.length)" class="ses__rate">
                <span class="label">rate your answer (self-assessed)</span>
                <div class="cluster">
                  <button v-for="r in ['got', 'partial', 'missed']" :key="r" type="button" class="btn btn--sm" @click="interview.rateInReview(id, qq.id, r)">{{ resultLabel[r] }}</button>
                </div>
              </div>
              <RouterLink :to="qq.lessonPath" class="btn btn--sm btn--ghost">Revise: {{ qq.lessonTitle }}</RouterLink>
            </div>
          </details>
        </li>
      </ol>
    </template>
  </div>
</template>

<style scoped>
.ses {
  max-width: 1100px;
}
.ses__bar {
  position: sticky;
  top: var(--header-h);
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) 0;
  background: var(--bg);
  border-bottom: var(--border);
}
.ses__progress {
  margin: 0;
  font-weight: 800;
}
.ses__bar-right {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
}
.ses__timer {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 1.3rem;
  font-weight: 800;
  padding: 4px 10px;
  border: var(--border);
  background: var(--acid);
  color: var(--acid-ink);
}
.ses__timer.is-low {
  background: var(--red);
  color: #fff;
  animation: blink 1s steps(2) infinite;
}
@keyframes blink {
  50% {
    opacity: 0.6;
  }
}
.ses__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: var(--s-4) 0;
}
.ses__dot {
  width: 38px;
  height: 38px;
  border: var(--border-thin);
  background: var(--surface);
  font-family: var(--font-mono);
  font-weight: 800;
}
.ses__dot.is-draft {
  background: var(--note-yellow);
}
.ses__dot.is-done {
  background: var(--text);
  color: var(--bg);
}
.ses__dot.is-current {
  outline: 3px solid var(--cobalt);
  outline-offset: 2px;
}
.ses__q {
  border: var(--border);
  border-left: 12px solid var(--cobalt);
  background: var(--surface);
  padding: var(--s-5);
  box-shadow: var(--shadow);
  display: grid;
  gap: var(--s-4);
}
.ses__chips {
  --cluster-gap: 6px;
}
.ses__title {
  font-size: var(--step-2);
  font-stretch: 100%;
  line-height: 1.25;
  margin: 0;
}
.ses__opts {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s-2);
}
.ses__opt {
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  padding: var(--s-3);
  border: var(--border-thin);
  cursor: pointer;
}
.ses__opt input {
  margin-top: 5px;
}
.ses__opt.is-picked {
  background: var(--note-blue);
}
.ses__opt.is-right {
  background: var(--note-green);
  box-shadow: inset 6px 0 0 var(--green);
}
.ses__opt.is-wrong {
  background: #ffe1da;
}
.ses__opts .btn {
  justify-self: start;
}
.ses__open {
  display: grid;
  gap: var(--s-2);
}
.ses__hints {
  display: grid;
  gap: var(--s-2);
  justify-items: start;
}
.ses__hint {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  background: var(--note-yellow);
  border: var(--border-thin);
}
.ses__feedback {
  border-top: 2px dashed color-mix(in srgb, var(--line) 40%, transparent);
  padding-top: var(--s-4);
  display: grid;
  gap: var(--s-2);
}
.ses__feedback .label {
  margin: var(--s-2) 0 0;
  color: var(--muted);
}
.ses__verdict {
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: 800;
  margin: 0;
}
.ses__feedback.is-good .ses__verdict {
  color: var(--green);
}
.ses__feedback.is-bad .ses__verdict {
  color: var(--red-text);
}
.ses__model {
  padding: var(--s-3) var(--s-4);
  background: var(--note-blue);
  border: var(--border-thin);
  border-radius: var(--sketch-radius);
}
.ses__rate {
  display: grid;
  gap: var(--s-2);
  margin-top: var(--s-2);
}
.ses__pager {
  display: flex;
  justify-content: space-between;
  margin-top: var(--s-5);
}
.review__stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.review__stats > div {
  display: grid;
  gap: 2px;
  padding: var(--s-4);
  border-right: var(--border-thin);
}
.review__stats > div:last-child {
  border-right: 0;
}
.review__stats strong {
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-stretch: 120%;
  line-height: 1;
}
.review__stats .muted {
  font-size: 0.72rem;
}
.review__note {
  margin: var(--s-3) 0;
}
.review__actions {
  margin-bottom: var(--s-6);
}
.review__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s-3);
}
.rv-item {
  margin: 0;
  border: var(--border);
  background: var(--surface);
  border-left-width: 10px;
}
.rv-item.is-good {
  border-left-color: var(--green);
}
.rv-item.is-bad {
  border-left-color: var(--red);
}
.rv-item__sum {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  cursor: pointer;
  font-weight: 700;
}
.rv-item__res {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--muted);
}
.rv-item__body {
  padding: 0 var(--s-4) var(--s-4);
  display: grid;
  gap: var(--s-2);
}
.rv-item__body .label {
  margin: var(--s-2) 0 0;
  color: var(--muted);
}
.rv-item__text {
  white-space: pre-wrap;
  background: var(--surface-2);
  padding: var(--s-2) var(--s-3);
  border: var(--border-thin);
}
.rv-item__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}
.rv-item__body .btn {
  justify-self: start;
}
@media (max-width: 800px) {
  .review__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .rv-item__grid {
    grid-template-columns: 1fr;
  }
  .rv-item__sum {
    grid-template-columns: auto 1fr;
  }
  .rv-item__res {
    grid-column: 2;
  }
}
</style>
