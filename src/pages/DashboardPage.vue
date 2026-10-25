<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { ArrowRight, Bookmark, Flame, RotateCcw } from 'lucide-vue-next'
import { contentIndex, loadQuestionMeta } from '../content/index.js'
import { useProgressStore } from '../stores/progress.js'
import { summarizeSession, useInterviewStore } from '../stores/interview.js'
import { lessonProgressRatio, lessonsNeedingRevision, weakTopics } from '../utils/learning.js'
import { dayKey, relativeTime } from '../utils/dates.js'
import ProgressBar from '../components/ui/ProgressBar.vue'
import StateBlock from '../components/ui/StateBlock.vue'

const progress = useProgressStore()
const interview = useInterviewStore()
const bank = shallowRef([])
onMounted(async () => (bank.value = await loadQuestionMeta()))

const started = computed(() => Object.keys(progress.state.lessons).length > 0 || interview.totals.attempted > 0)
const next = computed(() => (progress.recommended?.id ? { ...contentIndex.lessons[progress.recommended.id], reason: progress.recommended.reason } : null))
const recent = computed(() =>
  progress.state.recent
    .map((id) => contentIndex.lessons[id])
    .filter(Boolean)
    .map((l) => ({ ...l, lp: progress.lessonState(l.id) })),
)
const bookmarks = computed(() => progress.state.bookmarks.map((id) => contentIndex.lessons[id]).filter(Boolean))
const bookmarkedQuestions = computed(() => Object.values(interview.state.stats).filter((s) => s.bookmarked).length)
const questionLesson = computed(() => Object.fromEntries(bank.value.map((q) => [q.id, q.lesson])))
const revision = computed(() =>
  lessonsNeedingRevision(contentIndex, progress.state, { questionStats: interview.state.stats, questionLesson: questionLesson.value }).slice(0, 8),
)
const weak = computed(() => weakTopics(bank.value, interview.state.stats).slice(0, 6))
const completed = computed(() =>
  progress.completedIds
    .map((id) => ({ ...contentIndex.lessons[id], at: progress.lessonState(id).completedAt }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 8),
)

// activity calendar: last 12 weeks
const calendar = computed(() => {
  const days = []
  const today = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const key = dayKey(d)
    days.push({ key, n: progress.state.activeDays[key] ?? 0, label: d.toLocaleDateString() })
  }
  return days
})
const activeDayCount = computed(() => Object.keys(progress.state.activeDays).length)

const quiz = computed(() => progress.quizStats)
const t = computed(() => interview.totals)
const sessions = computed(() => interview.finishedSessions.slice(-8).map((s) => ({ ...s, sum: summarizeSession(s) })))
</script>

<template>
  <div class="page dash">
    <header class="page-head dash__head">
      <span class="label">your dashboard</span>
      <h1>{{ started ? 'Keep going.' : 'Day zero.' }}</h1>
      <p class="dash__level">
        <span class="sticker sticker--acid">{{ progress.level.level }}</span>
        <span class="muted">{{ progress.level.explain }}</span>
      </p>
    </header>

    <StateBlock v-if="!started" kind="empty" title="No activity yet" class="dash__empty">
      <p>Everything here is calculated from what you actually do: lessons you complete, quizzes, exercises and interview practice. Start your first lesson and this page fills up.</p>
      <RouterLink v-if="next" :to="next.path" class="btn btn--cobalt">Start: {{ next.title }}</RouterLink>
    </StateBlock>

    <!-- ===== stat strip ===== -->
    <div class="stats">
      <section class="stat stat--wide">
        <p class="label">course completion</p>
        <p class="stat__big">{{ Math.round(progress.completion.ratio * 100) }}<small>%</small></p>
        <ProgressBar :value="progress.completion.ratio" :label="`${progress.completion.done} of ${progress.completion.total} lessons`" />
      </section>
      <section class="stat">
        <p class="label"><Flame :size="12" aria-hidden="true" /> current streak</p>
        <p class="stat__big">{{ progress.streak }}<small> day{{ progress.streak === 1 ? '' : 's' }}</small></p>
        <p class="stat__sub muted">{{ activeDayCount }} active day{{ activeDayCount === 1 ? '' : 's' }} in total</p>
      </section>
      <section class="stat">
        <p class="label">quiz performance</p>
        <p class="stat__big">{{ quiz.avgBest === null ? '—' : Math.round(quiz.avgBest * 100) + '%' }}</p>
        <p class="stat__sub muted">avg best score · {{ quiz.quizzesTaken }} quiz{{ quiz.quizzesTaken === 1 ? '' : 'zes' }}, {{ quiz.attempts }} attempts · auto-graded</p>
      </section>
      <section class="stat">
        <p class="label">interview practice</p>
        <p class="stat__big">{{ t.objectiveTotal ? Math.round((t.objectiveCorrect / t.objectiveTotal) * 100) + '%' : '—' }}</p>
        <p class="stat__sub muted">
          {{ t.objectiveCorrect }}/{{ t.objectiveTotal }} auto/test-graded correct · {{ t.selfGot }}/{{ t.selfTotal }} self-assessed “solid” · {{ t.attempted }} questions tried
        </p>
      </section>
      <section class="stat">
        <p class="label">exercises passed</p>
        <p class="stat__big">{{ progress.exerciseCount }}</p>
        <p class="stat__sub muted">of {{ contentIndex.stats.exercises }} in the course</p>
      </section>
    </div>

    <div class="dash__grid">
      <!-- ===== left column ===== -->
      <div class="dash__col">
        <section v-if="next" class="card card--acid next">
          <p class="label">recommended next</p>
          <h2 class="next__title">{{ next.title }}</h2>
          <p class="next__why">{{ next.reason }}</p>
          <RouterLink :to="next.path" class="btn btn--ink">Go <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
        </section>
        <section v-else-if="started" class="card card--acid">
          <p>{{ progress.recommended?.reason }}</p>
        </section>

        <section class="panel">
          <h2 class="panel__h">Recently visited</h2>
          <p v-if="!recent.length" class="muted">Lessons you open appear here.</p>
          <ul class="lesson-list">
            <li v-for="l in recent" :key="l.id">
              <RouterLink :to="l.path">{{ l.title }}</RouterLink>
              <span class="mono muted">{{ relativeTime(l.lp?.lastVisitedAt) }}</span>
              <span class="mini-bar" aria-hidden="true"><span :style="{ width: lessonProgressRatio(l, l.lp) * 100 + '%' }" /></span>
            </li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="panel__h">Completed lessons</h2>
          <p v-if="!completed.length" class="muted">Complete a lesson by meeting its requirements (run the example, pass the quiz, finish an exercise) and pressing “Mark lesson complete”.</p>
          <ul class="lesson-list">
            <li v-for="l in completed" :key="l.id">
              <RouterLink :to="l.path">✓ {{ l.title }}</RouterLink>
              <span class="mono muted">{{ relativeTime(l.at) }}</span>
            </li>
          </ul>
        </section>

        <section class="panel">
          <h2 class="panel__h">Activity — last 12 weeks</h2>
          <div class="calendar" role="img" :aria-label="`Active on ${calendar.filter((d) => d.n).length} of the last 84 days`">
            <span v-for="d in calendar" :key="d.key" class="calendar__day" :class="{ 'is-1': d.n > 0, 'is-2': d.n > 3, 'is-3': d.n > 8 }" :title="`${d.label}: ${d.n} action(s)`" />
          </div>
          <p class="muted calendar__note">A day counts when you run an example, pass something, finish a quiz or practise an interview question.</p>
        </section>
      </div>

      <!-- ===== right column ===== -->
      <div class="dash__col">
        <section class="panel panel--revise">
          <div class="spread">
            <h2 class="panel__h"><RotateCcw :size="18" aria-hidden="true" /> Needs revision</h2>
            <RouterLink to="/revision" class="btn btn--sm">revision queue</RouterLink>
          </div>
          <p v-if="!revision.length" class="muted">Nothing flagged. Lessons show up here when a quiz score is below 70%, you miss interview questions, you flag them yourself, or you haven’t revisited a completed lesson in 3 weeks.</p>
          <ul class="revise-list">
            <li v-for="r in revision" :key="r.id">
              <RouterLink :to="contentIndex.lessons[r.id].path">{{ contentIndex.lessons[r.id].title }}</RouterLink>
              <span class="muted">{{ r.reasons.join(' · ') }}</span>
            </li>
          </ul>
        </section>

        <section v-if="weak.length" class="panel">
          <h2 class="panel__h">Weak interview topics</h2>
          <ul class="revise-list">
            <li v-for="w in weak" :key="w.lesson">
              <span class="mono">{{ Math.round(w.ratio * 100) }}%</span> {{ w.title }} <span class="muted">({{ w.total }} answered)</span>
            </li>
          </ul>
          <RouterLink to="/interview?source=weak" class="btn btn--sm btn--cobalt">Practice my weak areas</RouterLink>
        </section>

        <section class="panel">
          <h2 class="panel__h"><Bookmark :size="18" aria-hidden="true" /> Bookmarks</h2>
          <p v-if="!bookmarks.length && !bookmarkedQuestions" class="muted">Bookmark lessons from their header; bookmark questions from any question card.</p>
          <ul class="lesson-list">
            <li v-for="l in bookmarks" :key="l.id"><RouterLink :to="l.path">{{ l.title }}</RouterLink></li>
          </ul>
          <RouterLink v-if="bookmarkedQuestions" to="/interview/bank?filter=bookmarked" class="btn btn--sm">{{ bookmarkedQuestions }} bookmarked question{{ bookmarkedQuestions === 1 ? '' : 's' }}</RouterLink>
        </section>

        <section class="panel">
          <h2 class="panel__h">Level breakdown</h2>
          <div class="bands">
            <ProgressBar
              v-for="(s, band) in progress.level.stats"
              :key="band"
              :value="s.ratio"
              :label="`${band} · ${s.done}/${s.total}`"
            />
          </div>
        </section>

        <section class="panel">
          <h2 class="panel__h">Interview sessions</h2>
          <p v-if="!sessions.length" class="muted">Finished practice and mock interviews show up here so you can see improvement over time.</p>
          <ol class="sessions">
            <li v-for="s in sessions" :key="s.id">
              <span class="mono">{{ new Date(s.finishedAt).toLocaleDateString() }}</span>
              <span>{{ s.config.mode === 'mock' ? 'mock' : 'practice' }} · {{ s.sum.answered }}/{{ s.sum.total }} answered</span>
              <span class="muted">
                <template v-if="s.sum.auto.total + s.sum.tests.total">objective {{ s.sum.auto.good + s.sum.tests.good }}/{{ s.sum.auto.total + s.sum.tests.total }}</template>
                <template v-if="s.sum.self.total"> · self “solid” {{ s.sum.self.got }}/{{ s.sum.self.total }}</template>
              </span>
              <RouterLink :to="`/interview/session/${s.id}`" class="mono">review</RouterLink>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash__level {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
  margin: 0;
}
.dash__empty {
  margin-bottom: var(--s-6);
}
.stats {
  display: grid;
  grid-template-columns: 1.5fr repeat(4, 1fr);
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
  margin-bottom: var(--s-6);
}
.stat {
  padding: var(--s-4);
  border-right: var(--border-thin);
  display: grid;
  gap: 6px;
  align-content: start;
}
.stat:last-child {
  border-right: 0;
}
.stat .label {
  margin: 0;
  display: flex;
  gap: 4px;
  align-items: center;
}
.stat__big {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: var(--step-4);
  line-height: 0.95;
}
.stat__big small {
  font-size: 0.4em;
  font-stretch: 100%;
}
.stat__sub {
  margin: 0;
  font-size: 0.78rem;
}
.dash__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--s-5);
  align-items: start;
}
.dash__col {
  display: grid;
  gap: var(--s-5);
}
.next__title {
  font-size: var(--step-2);
  margin: var(--s-2) 0;
}
.next__why {
  margin-bottom: var(--s-4);
}
.panel {
  border: var(--border);
  background: var(--surface);
  padding: var(--s-4) var(--s-5);
}
.panel--revise {
  background: var(--note-yellow);
}
.panel__h {
  font-size: var(--step-1);
  font-stretch: 105%;
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: var(--s-3);
}
.lesson-list,
.revise-list,
.sessions {
  list-style: none;
  margin: 0 0 var(--s-3);
  padding: 0;
  display: grid;
  gap: 6px;
}
.lesson-list li,
.revise-list li,
.sessions li {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
  padding-bottom: 6px;
  border-bottom: 1.5px dashed color-mix(in srgb, var(--line) 25%, transparent);
}
.lesson-list a,
.revise-list a {
  font-weight: 700;
}
.revise-list .muted {
  font-size: 0.82rem;
  flex-basis: 100%;
}
.lesson-list .mono,
.sessions .mono {
  font-size: 0.75rem;
}
.mini-bar {
  width: 70px;
  height: 6px;
  border: 1.5px solid var(--line);
  position: relative;
  margin-left: auto;
}
.mini-bar span {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--acid);
}
.calendar {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(7, 14px);
  grid-auto-flow: column;
  gap: 4px;
}
.calendar__day {
  border: 1.5px solid color-mix(in srgb, var(--line) 35%, transparent);
  background: var(--surface-2);
}
.calendar__day.is-1 {
  background: color-mix(in srgb, var(--acid) 55%, var(--surface));
  border-color: var(--line);
}
.calendar__day.is-2 {
  background: var(--acid);
}
.calendar__day.is-3 {
  background: var(--green);
}
.calendar__note {
  font-size: 0.78rem;
  margin: var(--s-2) 0 0;
}
.bands {
  display: grid;
  gap: var(--s-3);
}
@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat--wide {
    grid-column: 1 / -1;
  }
  .stat {
    border-bottom: var(--border-thin);
  }
}
@media (max-width: 800px) {
  .dash__grid {
    grid-template-columns: 1fr;
  }
}
</style>
