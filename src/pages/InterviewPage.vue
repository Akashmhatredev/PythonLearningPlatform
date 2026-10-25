<script setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Play, Timer, X } from 'lucide-vue-next'
import { contentIndex, loadQuestionBank } from '../content/index.js'
import { inCategory, interviewCategories, QUESTION_TYPES, shuffle } from '../content/interview-categories.js'
import { useInterviewStore } from '../stores/interview.js'
import { useProgressStore } from '../stores/progress.js'
import { revisionQueue } from '../utils/learning.js'
import StateBlock from '../components/ui/StateBlock.vue'

const route = useRoute()
const router = useRouter()
const interview = useInterviewStore()
const progress = useProgressStore()

const bank = shallowRef([])
const loading = ref(true)
const error = ref('')

const cfg = reactive({
  source: route.query.source === 'weak' ? 'weak' : route.query.source === 'studied' ? 'studied' : 'custom',
  levels: [],
  lessons: route.query.topics ? String(route.query.topics).split(',').filter((id) => contentIndex.lessons[id]) : [],
  categories: [],
  difficulties: ['beginner', 'intermediate', 'advanced'],
  types: QUESTION_TYPES.map((t) => t.id),
  count: 10,
  mode: 'practice',
  minutes: 20,
})

onMounted(async () => {
  try {
    bank.value = await loadQuestionBank()
  } catch (e) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
})

const visited = computed(() => new Set(Object.entries(progress.state.lessons).filter(([, l]) => l.lastVisitedAt).map(([id]) => id)))
const queue = computed(() => revisionQueue(bank.value, { questionStats: interview.state.stats, progress: progress.state }))

const pool = computed(() => {
  let qs = bank.value
  if (cfg.source === 'studied') qs = qs.filter((q) => visited.value.has(q.lesson))
  else if (cfg.source === 'weak') qs = queue.value.map((x) => x.question)
  else if (cfg.lessons.length) qs = qs.filter((q) => cfg.lessons.includes(q.lesson))
  else if (cfg.levels.length) qs = qs.filter((q) => cfg.levels.includes(q.level))
  if (cfg.categories.length) {
    const cats = interviewCategories.filter((c) => cfg.categories.includes(c.id))
    qs = qs.filter((q) => cats.some((c) => inCategory(q, c)))
  }
  return qs.filter((q) => cfg.difficulties.includes(q.difficulty) && cfg.types.includes(q.type))
})

const categoryCounts = computed(() => Object.fromEntries(interviewCategories.map((c) => [c.id, bank.value.filter((q) => inCategory(q, c)).length])))

function toggle(list, value) {
  const i = list.indexOf(value)
  if (i === -1) list.push(value)
  else list.splice(i, 1)
}

function start() {
  if (!pool.value.length) return
  const picked = (cfg.source === 'weak' ? pool.value : shuffle(pool.value)).slice(0, cfg.count)
  const id = interview.startSession(
    {
      mode: cfg.mode,
      minutes: cfg.mode === 'mock' ? cfg.minutes : null,
      source: cfg.source,
      levels: [...cfg.levels],
      lessons: [...cfg.lessons],
      categories: [...cfg.categories],
      difficulties: [...cfg.difficulties],
      types: [...cfg.types],
    },
    picked.map((q) => q.id),
  )
  router.push(`/interview/session/${id}`)
}

const active = computed(() => interview.activeSession)
const FRAME = [
  ['Define it', 'One crisp sentence: what is it?'],
  ['Why it exists', 'The problem it solves.'],
  ['How it works', 'The mechanism, at the right depth.'],
  ['Show an example', 'A tiny snippet or real situation.'],
  ['Trade-offs', 'When not to use it, or what it costs.'],
]
</script>

<template>
  <div class="page iv">
    <header class="page-head">
      <span class="label">interview mode</span>
      <h1>Practise saying it<br />out loud.</h1>
      <p class="iv__lead">Build a session from any topics. Practice mode lets you reveal answers when you’re ready; a mock interview runs on a clock and only shows feedback at the end.</p>
    </header>

    <div v-if="active" class="resume card card--yellow">
      <div>
        <p class="label">unfinished session</p>
        <p>{{ active.config.mode === 'mock' ? 'Mock interview' : 'Practice' }} · {{ Object.values(active.answers).filter((a) => a.result || a.text).length }}/{{ active.questionIds.length }} answered · started {{ new Date(active.startedAt).toLocaleString() }}</p>
      </div>
      <div class="cluster">
        <RouterLink :to="`/interview/session/${active.id}`" class="btn btn--ink">Resume</RouterLink>
        <button type="button" class="btn btn--ghost" @click="interview.discardSession(active.id)">Discard</button>
      </div>
    </div>

    <StateBlock v-if="loading" kind="loading" title="Loading the question bank…" />
    <StateBlock v-else-if="error" kind="error" title="Couldn't load questions"><p>{{ error }}</p></StateBlock>

    <div v-else class="iv__grid">
      <form class="setup" @submit.prevent="start">
        <fieldset class="setup__block">
          <legend class="setup__legend">1 · Where questions come from</legend>
          <div class="seg" role="radiogroup" aria-label="Question source">
            <button
              v-for="s in [
                ['custom', 'Topics I choose'],
                ['studied', `Topics I've studied (${visited.size})`],
                ['weak', `My weak areas (${queue.length})`],
              ]"
              :key="s[0]"
              type="button"
              role="radio"
              class="seg__btn"
              :aria-checked="cfg.source === s[0]"
              @click="cfg.source = s[0]"
            >
              {{ s[1] }}
            </button>
          </div>
          <p v-if="cfg.source === 'weak' && !queue.length" class="muted">Your revision queue is empty — it fills with questions you miss or flag, and topics with weak quiz scores.</p>
          <p v-if="cfg.source === 'studied' && !visited.size" class="muted">You haven’t opened any lessons yet.</p>

          <template v-if="cfg.source === 'custom'">
            <div v-if="cfg.lessons.length" class="picked">
              <span class="label">lessons:</span>
              <span v-for="id in cfg.lessons" :key="id" class="chip chip--acid">
                {{ contentIndex.lessons[id].title }}
                <button type="button" class="picked__x" :aria-label="`Remove ${contentIndex.lessons[id].title}`" @click="toggle(cfg.lessons, id)"><X :size="12" aria-hidden="true" /></button>
              </span>
            </div>
            <p class="setup__hint">{{ cfg.lessons.length ? 'Or pick whole levels instead (clear the lessons above first).' : 'Pick levels (none = everything):' }}</p>
            <div class="levels">
              <label v-for="l in contentIndex.levels" :key="l.id" class="check-chip" :class="{ 'is-on': cfg.levels.includes(l.id) }">
                <input type="checkbox" :checked="cfg.levels.includes(l.id)" :disabled="cfg.lessons.length > 0" @change="toggle(cfg.levels, l.id)" />
                <span class="mono">{{ String(l.number).padStart(2, '0') }}</span> {{ l.short }}
              </label>
            </div>
          </template>
        </fieldset>

        <fieldset class="setup__block">
          <legend class="setup__legend">2 · Categories <span class="muted">(optional)</span></legend>
          <div class="levels">
            <label v-for="c in interviewCategories" :key="c.id" class="check-chip" :class="{ 'is-on': cfg.categories.includes(c.id) }">
              <input type="checkbox" :checked="cfg.categories.includes(c.id)" @change="toggle(cfg.categories, c.id)" />
              {{ c.label }} <span class="muted mono">{{ categoryCounts[c.id] }}</span>
            </label>
          </div>
        </fieldset>

        <fieldset class="setup__block setup__row">
          <legend class="setup__legend">3 · Difficulty &amp; format</legend>
          <div class="levels">
            <label v-for="d in ['beginner', 'intermediate', 'advanced']" :key="d" class="check-chip" :class="{ 'is-on': cfg.difficulties.includes(d) }">
              <input type="checkbox" :checked="cfg.difficulties.includes(d)" @change="toggle(cfg.difficulties, d)" /> {{ d }}
            </label>
          </div>
          <div class="levels">
            <label v-for="t in QUESTION_TYPES" :key="t.id" class="check-chip" :class="{ 'is-on': cfg.types.includes(t.id) }">
              <input type="checkbox" :checked="cfg.types.includes(t.id)" @change="toggle(cfg.types, t.id)" /> {{ t.label }}
            </label>
          </div>
        </fieldset>

        <fieldset class="setup__block">
          <legend class="setup__legend">4 · Session</legend>
          <div class="setup__session">
            <label class="field">
              <span class="label">questions</span>
              <select v-model.number="cfg.count" class="select">
                <option v-for="n in [5, 10, 15, 20, 30]" :key="n" :value="n">{{ n }}</option>
              </select>
            </label>
            <div class="seg" role="radiogroup" aria-label="Mode">
              <button type="button" role="radio" class="seg__btn" :aria-checked="cfg.mode === 'practice'" @click="cfg.mode = 'practice'">Practice (untimed)</button>
              <button type="button" role="radio" class="seg__btn" :aria-checked="cfg.mode === 'mock'" @click="cfg.mode = 'mock'"><Timer :size="14" aria-hidden="true" /> Timed mock</button>
            </div>
            <label v-if="cfg.mode === 'mock'" class="field">
              <span class="label">duration</span>
              <select v-model.number="cfg.minutes" class="select">
                <option v-for="m in [10, 20, 30, 45, 60]" :key="m" :value="m">{{ m }} min</option>
              </select>
            </label>
          </div>
        </fieldset>

        <div class="setup__go">
          <p class="setup__count" role="status">
            <strong>{{ pool.length }}</strong> matching question{{ pool.length === 1 ? '' : 's' }}
            <span v-if="pool.length">· session uses {{ Math.min(cfg.count, pool.length) }}</span>
          </p>
          <button type="submit" class="btn btn--cobalt btn--lg" :disabled="!pool.length"><Play :size="18" aria-hidden="true" /> Start {{ cfg.mode === 'mock' ? 'mock interview' : 'practice' }}</button>
        </div>
      </form>

      <aside class="iv__side">
        <section class="card card--note">
          <p class="label">how to answer — the frame</p>
          <ol class="frame">
            <li v-for="(f, i) in FRAME" :key="i"><strong>{{ f[0] }}.</strong> {{ f[1] }}</li>
          </ol>
          <RouterLink to="/learn/interview-prep/answering-framework" class="btn btn--sm">Lesson: answering technical questions</RouterLink>
        </section>
        <section class="card">
          <p class="label">grading, honestly</p>
          <ul class="grading">
            <li><span class="chip">auto-graded</span> multiple-choice and output questions with a known answer</li>
            <li><span class="chip">test-graded</span> coding questions run against real tests</li>
            <li><span class="chip">self-assessed</span> open answers — you compare with the model answer; never counted as “correct”</li>
          </ul>
        </section>
        <div class="cluster">
          <RouterLink to="/interview/bank" class="btn">Question bank</RouterLink>
          <RouterLink to="/revision" class="btn">Revision queue</RouterLink>
        </div>
        <p class="mono muted">{{ interview.totals.attempted }} questions practised so far · {{ interview.finishedSessions.length }} sessions</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.iv__lead {
  max-width: 62ch;
  font-size: var(--step-1);
  color: var(--text-soft);
}
.resume {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-4);
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--s-6);
}
.resume p {
  margin: 0;
}
.iv__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: var(--s-6);
  align-items: start;
}
.setup {
  display: grid;
  gap: var(--s-4);
}
.setup__block {
  border: var(--border);
  background: var(--surface);
  padding: var(--s-4) var(--s-5);
  margin: 0;
  display: grid;
  gap: var(--s-3);
}
.setup__legend {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-1);
  padding: 0 6px;
  background: var(--bg);
}
.setup__hint {
  margin: 0;
  font-size: 0.88rem;
  color: var(--muted);
}
.seg {
  display: inline-flex;
  flex-wrap: wrap;
  border: var(--border-thin);
  width: fit-content;
}
.seg__btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  border: 0;
  background: var(--surface);
  padding: 8px 14px;
  min-height: 40px;
  font-weight: 700;
  font-size: 0.88rem;
}
.seg__btn + .seg__btn {
  border-left: var(--border-thin);
}
.seg__btn[aria-checked='true'] {
  background: var(--text);
  color: var(--bg);
}
.levels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.check-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: var(--border-thin);
  font-size: 0.85rem;
  cursor: pointer;
  background: var(--surface);
}
.check-chip input {
  position: absolute;
  opacity: 0;
}
.check-chip:focus-within {
  outline: 3px solid var(--cobalt);
}
.check-chip.is-on {
  background: var(--acid);
  color: var(--acid-ink);
}
.check-chip.is-on .muted {
  color: #3d3d2c;
}
.picked {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.picked__x {
  border: 0;
  background: none;
  padding: 0 0 0 4px;
  color: inherit;
}
.setup__session {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-4);
  align-items: flex-end;
}
.setup__session .field {
  width: 140px;
}
.setup__go {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-4) var(--s-5);
  border: var(--border);
  background: var(--note-blue);
  position: sticky;
  bottom: 0;
}
.setup__count {
  margin: 0;
}
.setup__count strong {
  font-family: var(--font-display);
  font-size: var(--step-2);
}
.iv__side {
  display: grid;
  gap: var(--s-4);
  position: sticky;
  top: calc(var(--header-h) + 16px);
}
.frame {
  margin: var(--s-2) 0 var(--s-3);
  padding-left: 1.3em;
}
.grading {
  list-style: none;
  padding: 0;
  margin: var(--s-2) 0 0;
  display: grid;
  gap: var(--s-2);
  font-size: 0.88rem;
}
.grading li {
  margin: 0;
}
@media (max-width: 1000px) {
  .iv__grid {
    grid-template-columns: 1fr;
  }
  .iv__side {
    position: static;
  }
}
</style>
