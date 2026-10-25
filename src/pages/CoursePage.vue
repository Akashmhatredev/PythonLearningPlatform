<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Check, ChevronDown, Circle, CircleDashed, Clock, Dumbbell, MessagesSquare } from 'lucide-vue-next'
import { contentIndex } from '../content/index.js'
import { useProgressStore } from '../stores/progress.js'
import ProgressBar from '../components/ui/ProgressBar.vue'
import { lessonProgressRatio } from '../utils/learning.js'

const route = useRoute()
const progress = useProgressStore()

const band = ref('all')
const status = ref('all')
const interviewFocus = ref(false)
const query = ref('')
const open = reactive({})

function statusOf(l) {
  if (l.status !== 'ready') return 'planned'
  if (progress.isComplete(l.id)) return 'done'
  if (progress.lessonState(l.id)?.lastVisitedAt) return 'started'
  return 'new'
}

const levels = computed(() => {
  const q = query.value.trim().toLowerCase()
  return contentIndex.levels
    .map((level) => {
      const all = level.lessons.map((id) => contentIndex.lessons[id])
      const ready = all.filter((l) => l.status === 'ready')
      let items = all.filter((l) => {
        if (band.value !== 'all' && l.difficulty !== band.value) return false
        if (status.value !== 'all' && statusOf(l) !== status.value) return false
        if (interviewFocus.value && l.counts.questions < 5) return false
        if (q && !`${l.title} ${l.summary} ${l.tags.join(' ')}`.toLowerCase().includes(q)) return false
        return true
      })
      if (interviewFocus.value) items = [...items].sort((a, b) => b.counts.questions - a.counts.questions)
      return {
        ...level,
        items,
        ready: ready.length,
        done: ready.filter((l) => progress.isComplete(l.id)).length,
        minutes: ready.reduce((n, l) => n + (l.minutes ?? 0), 0),
        questions: ready.reduce((n, l) => n + l.counts.questions, 0),
      }
    })
    .filter((l) => l.items.length)
})
const filtered = computed(() => band.value !== 'all' || status.value !== 'all' || interviewFocus.value || query.value.trim())
const shownCount = computed(() => levels.value.reduce((n, l) => n + l.items.length, 0))

function setAll(value) {
  for (const l of contentIndex.levels) open[l.id] = value
}

watch(filtered, (f) => f && setAll(true))

onMounted(async () => {
  const hash = route.hash.slice(1)
  if (hash && contentIndex.levels.some((l) => l.id === hash)) {
    open[hash] = true
    await nextTick()
    document.getElementById(hash)?.scrollIntoView()
  } else {
    // open the level that contains the recommended lesson
    const rec = progress.recommended?.id
    const lvl = rec ? contentIndex.lessons[rec].level : contentIndex.levels[0].id
    open[lvl] = true
  }
})
</script>

<template>
  <div class="page course">
    <header class="page-head course__head">
      <span class="label">course explorer</span>
      <h1>The whole course,<br />one page.</h1>
      <p class="course__lead">
        {{ contentIndex.levels.length }} levels · {{ contentIndex.stats.ready }} lessons · {{ contentIndex.stats.questions }} interview questions · {{ contentIndex.stats.exercises }} coding exercises.
        <template v-if="contentIndex.stats.ready < contentIndex.stats.lessons"> {{ contentIndex.stats.lessons - contentIndex.stats.ready }} lessons are still being written and are marked <em>planned</em>.</template>
      </p>
      <div class="course__progress">
        <ProgressBar :value="progress.completion.ratio" :label="`${progress.completion.done} of ${progress.completion.total} lessons complete`" />
      </div>
    </header>

    <div class="filters" role="search" aria-label="Filter lessons">
      <div class="filters__group" role="radiogroup" aria-label="Difficulty">
        <button v-for="b in ['all', 'beginner', 'intermediate', 'advanced']" :key="b" type="button" role="radio" class="filters__chip" :aria-checked="band === b" @click="band = b">
          {{ b }}
        </button>
      </div>
      <div class="filters__group" role="radiogroup" aria-label="Status">
        <button
          v-for="st in [
            ['all', 'any status'],
            ['new', 'not started'],
            ['started', 'in progress'],
            ['done', 'completed'],
          ]"
          :key="st[0]"
          type="button"
          role="radio"
          class="filters__chip"
          :aria-checked="status === st[0]"
          @click="status = st[0]"
        >
          {{ st[1] }}
        </button>
      </div>
      <button type="button" class="filters__chip filters__chip--cobalt" :aria-pressed="interviewFocus" @click="interviewFocus = !interviewFocus">
        <MessagesSquare :size="14" aria-hidden="true" /> interview-focused
      </button>
      <label class="filters__search">
        <span class="visually-hidden">Filter by text</span>
        <input v-model="query" class="input" type="search" placeholder="filter by topic…" />
      </label>
      <div class="filters__tools">
        <span class="mono muted">{{ shownCount }} shown</span>
        <button type="button" class="btn btn--sm btn--ghost" @click="setAll(true)">expand all</button>
        <button type="button" class="btn btn--sm btn--ghost" @click="setAll(false)">collapse all</button>
      </div>
    </div>

    <p v-if="!levels.length" class="muted">No lessons match these filters.</p>

    <section v-for="level in levels" :id="level.id" :key="level.id" class="module" :class="{ 'is-open': open[level.id] }" :aria-labelledby="`${level.id}-h`">
      <h2 :id="`${level.id}-h`" class="module__h">
        <button type="button" class="module__toggle" :aria-expanded="!!open[level.id]" :aria-controls="`${level.id}-list`" @click="open[level.id] = !open[level.id]">
          <span class="module__num">{{ String(level.number).padStart(2, '0') }}</span>
          <span class="module__titles">
            <span class="module__title">{{ level.title }}</span>
            <span class="module__blurb">{{ level.blurb }}</span>
          </span>
          <span class="module__meta mono">
            <span class="chip" :class="`chip--${level.band}`">{{ level.band }}</span>
            <span v-if="level.optional" class="chip chip--ghost">optional</span>
            <span>{{ level.done }}/{{ level.ready }} done</span>
            <span>~{{ Math.round(level.minutes / 60) || '<1' }} h</span>
            <span>{{ level.questions }} Qs</span>
          </span>
          <ChevronDown class="module__chev" :size="22" aria-hidden="true" />
        </button>
      </h2>
      <ol v-show="open[level.id]" :id="`${level.id}-list`" class="lessons">
        <li v-for="l in level.items" :key="l.id" class="row" :class="`row--${statusOf(l)}`">
          <span class="row__status">
            <span class="visually-hidden">{{ { done: 'Completed:', started: 'In progress:', new: 'Not started:', planned: 'Planned:' }[statusOf(l)] }}</span>
            <Check v-if="statusOf(l) === 'done'" :size="18" aria-hidden="true" />
            <CircleDashed v-else-if="statusOf(l) === 'planned'" :size="18" aria-hidden="true" />
            <Circle v-else :size="18" aria-hidden="true" :class="{ 'is-half': statusOf(l) === 'started' }" />
          </span>
          <div class="row__main">
            <RouterLink v-if="l.status === 'ready'" :to="l.path" class="row__title">{{ l.title }}</RouterLink>
            <span v-else class="row__title muted">{{ l.title }}</span>
            <p v-if="l.summary" class="row__summary">{{ l.summary }}</p>
            <p v-if="l.prerequisites.length" class="row__pre">
              <span class="label">needs:</span>
              <RouterLink v-for="p in l.prerequisites" :key="p" :to="contentIndex.lessons[p]?.path ?? '/learn'" class="row__prelink">{{ contentIndex.lessons[p]?.title ?? p }}</RouterLink>
            </p>
            <span v-if="statusOf(l) === 'started'" class="row__bar" aria-hidden="true"><span :style="{ width: lessonProgressRatio(l, progress.lessonState(l.id)) * 100 + '%' }" /></span>
          </div>
          <div class="row__facts mono">
            <span class="chip" :class="`chip--${l.difficulty}`">{{ l.difficulty }}</span>
            <span v-if="l.minutes" title="Estimated time"><Clock :size="12" aria-hidden="true" /> {{ l.minutes }}m</span>
            <span title="Interview questions"><MessagesSquare :size="12" aria-hidden="true" /> {{ l.counts.questions }}</span>
            <span title="Exercises"><Dumbbell :size="12" aria-hidden="true" /> {{ l.counts.exercises }}</span>
            <span v-if="l.kind === 'project'" class="chip chip--ink">project</span>
            <span v-if="l.status !== 'ready'" class="chip chip--ghost">planned</span>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.course__lead {
  font-size: var(--step-1);
  max-width: 64ch;
  color: var(--text-soft);
}
.course__progress {
  max-width: 520px;
}
.filters {
  position: sticky;
  top: var(--header-h);
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-3);
  align-items: center;
  padding: var(--s-3) 0;
  margin-bottom: var(--s-5);
  background: var(--bg);
  border-bottom: var(--border);
}
.filters__group {
  display: inline-flex;
  border: var(--border-thin);
}
.filters__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: var(--surface);
  padding: 6px 10px;
  min-height: 36px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.filters__group .filters__chip + .filters__chip {
  border-left: var(--border-thin);
}
.filters__chip[aria-checked='true'],
.filters__chip[aria-pressed='true'] {
  background: var(--text);
  color: var(--bg);
}
.filters__chip--cobalt {
  border: var(--border-thin);
}
.filters__chip--cobalt[aria-pressed='true'] {
  background: var(--cobalt);
  color: #fff;
}
.filters__search {
  flex: 1 1 200px;
}
.filters__search .input {
  min-height: 38px;
}
.filters__tools {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.module {
  border: var(--border);
  background: var(--surface);
  margin-bottom: var(--s-4);
  box-shadow: var(--shadow-sm);
  scroll-margin-top: calc(var(--header-h) + 80px);
}
.module.is-open {
  box-shadow: var(--shadow);
}
.module__h {
  margin: 0;
  font-size: inherit;
}
.module__toggle {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: var(--s-4);
  align-items: center;
  width: 100%;
  padding: var(--s-4) var(--s-5);
  border: 0;
  background: none;
  text-align: left;
  color: var(--text);
}
.module__toggle:hover {
  background: var(--surface-2);
}
.module__num {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: var(--step-3);
  line-height: 1;
}
.module.is-open .module__num {
  background: var(--acid);
  color: var(--acid-ink);
  padding: 0 6px;
  border: var(--border);
}
.module__titles {
  display: grid;
  gap: 2px;
}
.module__title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-1);
  line-height: 1.15;
}
.module__blurb {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 0.9rem;
  color: var(--text-soft);
}
.module__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  justify-content: flex-end;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
  max-width: 300px;
}
.module__chev {
  transition: transform var(--quick) var(--snap);
}
.module.is-open .module__chev {
  transform: rotate(180deg);
}
.lessons {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: var(--border);
}
.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: start;
  padding: var(--s-3) var(--s-5);
  margin: 0;
  border-bottom: 1.5px dashed color-mix(in srgb, var(--line) 30%, transparent);
}
.row:last-child {
  border-bottom: 0;
}
.row--done {
  background: color-mix(in srgb, var(--note-green) 70%, transparent);
}
.row--planned {
  opacity: 0.7;
}
.row__status {
  margin-top: 2px;
}
.row--done .row__status {
  color: var(--green);
}
.row__status .is-half {
  fill: currentColor;
  fill-opacity: 0.35;
}
.row__title {
  font-weight: 800;
  font-size: 1.02rem;
}
.row__summary {
  margin: 2px 0 0;
  font-size: 0.88rem;
  color: var(--text-soft);
}
.row__pre {
  margin: 4px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: center;
  font-size: 0.8rem;
}
.row__prelink {
  color: var(--text-soft);
}
.row__bar {
  display: block;
  height: 5px;
  margin-top: 6px;
  max-width: 220px;
  border: 1.5px solid var(--line);
  position: relative;
}
.row__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--acid);
}
.row__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  justify-content: flex-end;
  font-size: 0.75rem;
  color: var(--muted);
  max-width: 300px;
}
.row__facts span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
@media (max-width: 800px) {
  .module__toggle {
    grid-template-columns: auto 1fr auto;
    padding: var(--s-3);
  }
  .module__meta {
    grid-column: 1 / -1;
    justify-content: flex-start;
    max-width: none;
  }
  .module__chev {
    grid-row: 1;
    grid-column: 3;
  }
  .row {
    grid-template-columns: auto minmax(0, 1fr);
    padding: var(--s-3);
  }
  .row__facts {
    grid-column: 2;
    justify-content: flex-start;
  }
  .filters {
    position: static;
  }
}
</style>
