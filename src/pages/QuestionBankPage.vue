<script setup>
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dice5, Play } from 'lucide-vue-next'
import { contentIndex, loadQuestionBank } from '../content/index.js'
import { inCategory, interviewCategories, QUESTION_TYPES, shuffle } from '../content/interview-categories.js'
import { NEGATIVE, useInterviewStore } from '../stores/interview.js'
import { searchIndex } from '../utils/search.js'
import QuestionCard from '../components/interview/QuestionCard.vue'
import StateBlock from '../components/ui/StateBlock.vue'

const PAGE = 15
const route = useRoute()
const router = useRouter()
const interview = useInterviewStore()

const bank = shallowRef([])
const loading = ref(true)
const page = ref(1)
const f = reactive({
  q: '',
  level: '',
  category: '',
  difficulty: '',
  type: '',
  status: route.query.filter ? String(route.query.filter) : '',
})
const focusId = ref(route.query.q ? String(route.query.q) : '')

onMounted(async () => {
  bank.value = await loadQuestionBank()
  loading.value = false
})

const STATUS = [
  ['', 'any'],
  ['bookmarked', 'bookmarked'],
  ['review', 'flagged for review'],
  ['missed', 'missed last time'],
  ['new', 'never tried'],
  ['understood', 'understood'],
]
function matchesStatus(q) {
  const s = interview.state.stats[q.id]
  switch (f.status) {
    case 'bookmarked':
      return !!s?.bookmarked
    case 'review':
      return !!s?.review
    case 'missed':
      return NEGATIVE.includes(s?.lastResult) || s?.lastResult === 'partial'
    case 'new':
      return !s?.attempts
    case 'understood':
      return !!s?.understood
    default:
      return true
  }
}

const searchEntries = computed(() => bank.value.map((q) => ({ id: q.id, type: 'question', title: q.question, subtitle: q.lessonTitle, text: `${q.answer} ${q.lessonTitle}` })))
const filtered = computed(() => {
  if (focusId.value) return bank.value.filter((q) => q.id === focusId.value)
  let qs = bank.value
  if (f.q.trim()) {
    const ids = new Set(searchIndex(searchEntries.value, f.q, { limit: 1000 }).map((e) => e.id))
    qs = qs.filter((q) => ids.has(q.id))
  }
  if (f.level) qs = qs.filter((q) => q.level === f.level)
  if (f.category) {
    const cat = interviewCategories.find((c) => c.id === f.category)
    qs = qs.filter((q) => inCategory(q, cat))
  }
  if (f.difficulty) qs = qs.filter((q) => q.difficulty === f.difficulty)
  if (f.type) qs = qs.filter((q) => q.type === f.type)
  if (f.status) qs = qs.filter(matchesStatus)
  return qs
})
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE)))
const visible = computed(() => filtered.value.slice((page.value - 1) * PAGE, page.value * PAGE))
watch(f, () => {
  page.value = 1
  focusId.value = ''
})

function random() {
  const pool = filtered.value.length ? filtered.value : bank.value
  if (!pool.length) return
  focusId.value = pool[Math.floor(Math.random() * pool.length)].id
  router.replace({ query: { q: focusId.value } })
}
function clearFocus() {
  focusId.value = ''
  router.replace({ query: {} })
}
function practice() {
  const ids = shuffle(filtered.value).slice(0, 10).map((q) => q.id)
  if (!ids.length) return
  const sid = interview.startSession({ mode: 'practice', minutes: null, source: 'bank' }, ids)
  router.push(`/interview/session/${sid}`)
}
</script>

<template>
  <div class="page qb">
    <header class="page-head">
      <span class="label">interview question bank</span>
      <h1>{{ bank.length || '…' }} questions, sorted by topic.</h1>
      <p class="qb__lead">Draft your answer, reveal the model answer, rate yourself. Flag anything shaky — it goes into your revision queue.</p>
    </header>

    <div class="qb__filters" role="search" aria-label="Filter questions">
      <label class="field qb__search">
        <span class="label">search</span>
        <input v-model="f.q" class="input" type="search" placeholder="list vs tuple, GIL, decorators…" />
      </label>
      <label class="field">
        <span class="label">level</span>
        <select v-model="f.level" class="select">
          <option value="">all levels</option>
          <option v-for="l in contentIndex.levels" :key="l.id" :value="l.id">{{ String(l.number).padStart(2, '0') }} {{ l.short }}</option>
        </select>
      </label>
      <label class="field">
        <span class="label">category</span>
        <select v-model="f.category" class="select">
          <option value="">all categories</option>
          <option v-for="c in interviewCategories" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="label">difficulty</span>
        <select v-model="f.difficulty" class="select">
          <option value="">any</option>
          <option v-for="d in ['beginner', 'intermediate', 'advanced']" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <label class="field">
        <span class="label">type</span>
        <select v-model="f.type" class="select">
          <option value="">any</option>
          <option v-for="t in QUESTION_TYPES" :key="t.id" :value="t.id">{{ t.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="label">my status</span>
        <select v-model="f.status" class="select">
          <option v-for="s in STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
        </select>
      </label>
    </div>

    <div class="qb__bar">
      <p class="mono" role="status">{{ filtered.length }} match{{ filtered.length === 1 ? '' : 'es' }}</p>
      <div class="cluster">
        <button v-if="focusId" type="button" class="btn btn--sm btn--ghost" @click="clearFocus">show all</button>
        <button type="button" class="btn btn--sm" @click="random"><Dice5 :size="14" aria-hidden="true" /> random question</button>
        <button type="button" class="btn btn--sm btn--cobalt" :disabled="!filtered.length" @click="practice"><Play :size="14" aria-hidden="true" /> practise 10 of these</button>
      </div>
    </div>

    <StateBlock v-if="loading" kind="loading" title="Loading questions…" />
    <StateBlock v-else-if="!filtered.length" kind="empty" title="No questions match">
      <p>Loosen a filter or search for something else.</p>
    </StateBlock>
    <div v-else class="qb__list">
      <QuestionCard v-for="q in visible" :key="q.id" :question="q" :start-open="!!focusId" />
    </div>

    <nav v-if="pages > 1 && !focusId" class="qb__pages" aria-label="Pages">
      <button type="button" class="btn btn--sm" :disabled="page === 1" @click="page--">← prev</button>
      <span class="mono">page {{ page }} / {{ pages }}</span>
      <button type="button" class="btn btn--sm" :disabled="page === pages" @click="page++">next →</button>
    </nav>
  </div>
</template>

<style scoped>
.qb__lead {
  max-width: 60ch;
  font-size: var(--step-1);
  color: var(--text-soft);
}
.qb__filters {
  display: grid;
  grid-template-columns: 2fr repeat(5, 1fr);
  gap: var(--s-3);
  padding: var(--s-4);
  border: var(--border);
  background: var(--surface);
}
.qb__bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  margin: var(--s-4) 0;
}
.qb__bar p {
  margin: 0;
}
.qb__list {
  display: grid;
  gap: var(--s-4);
}
.qb__pages {
  display: flex;
  gap: var(--s-3);
  align-items: center;
  justify-content: center;
  margin-top: var(--s-6);
}
@media (max-width: 1100px) {
  .qb__filters {
    grid-template-columns: repeat(3, 1fr);
  }
  .qb__search {
    grid-column: 1 / -1;
  }
}
@media (max-width: 600px) {
  .qb__filters {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
