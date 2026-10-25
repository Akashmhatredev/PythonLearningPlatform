<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, ChevronDown, Flag, Map as MapIcon, MessagesSquare } from 'lucide-vue-next'
import { contentIndex, getLessonMeta, getLevel, loadLesson, neighbours } from '../content/index.js'
import { useProgressStore } from '../stores/progress.js'
import { usePreferencesStore } from '../stores/preferences.js'
import { useUiStore } from '../stores/ui.js'
import SectionHead from '../components/learning/SectionHead.vue'
import RichText from '../components/learning/RichText.vue'
import CodeWalkthrough from '../components/code/CodeWalkthrough.vue'
import CodeBlock from '../components/code/CodeBlock.vue'
import LessonPlayground from '../components/learning/LessonPlayground.vue'
import PlaygroundEditor from '../components/code/PlaygroundEditor.vue'
import VisualizerHost from '../components/diagrams/VisualizerHost.vue'
import LayeredExplainer from '../components/learning/LayeredExplainer.vue'
import MistakeList from '../components/learning/MistakeList.vue'
import DebugGuide from '../components/learning/DebugGuide.vue'
import CompareTable from '../components/learning/CompareTable.vue'
import QuizRunner from '../components/quiz/QuizRunner.vue'
import ExerciseCard from '../components/learning/ExerciseCard.vue'
import QuestionCard from '../components/interview/QuestionCard.vue'
import CompletionPanel from '../components/learning/CompletionPanel.vue'
import StateBlock from '../components/ui/StateBlock.vue'

const route = useRoute()
const progress = useProgressStore()
const prefs = usePreferencesStore()
const ui = useUiStore()

const id = route.params.lessonId
const meta = getLessonMeta(id)
const level = getLevel(meta.level)
const lesson = shallowRef(null)
const loading = ref(true)
const error = ref(null)
const expandedIntuition = ref({})
const solutionShown = ref(false)
const activeSection = ref('')

const { prev, next } = neighbours(id)
const lessonNumber = `${String(level.number).padStart(2, '0')}.${String(level.lessons.indexOf(id) + 1).padStart(2, '0')}`

const SECTIONS = [
  { key: 'intro', phase: 'Learn', title: 'Introduction' },
  { key: 'why', phase: 'Learn', title: 'Why it exists' },
  { key: 'requirements', phase: 'Plan', title: 'Requirements' },
  { key: 'objectives', phase: 'Plan', title: 'Learning objectives' },
  { key: 'eli15', phase: 'Learn', title: "Explain it like I'm 15", intuition: true },
  { key: 'analogy', phase: 'Learn', title: (l) => `Everyday analogy: ${l.analogy.title}`, intuition: true },
  { key: 'visual', phase: 'Learn', title: 'Picture it' },
  { key: 'syntax', phase: 'Learn', title: 'Syntax & rules' },
  { key: 'walkthrough', phase: 'Learn', title: 'Step-by-step code walkthrough' },
  { key: 'preview', phase: 'Experiment', title: 'Interactive preview: the finished app' },
  { key: 'playground', phase: 'Experiment', title: (l) => (l.kind === 'project' ? 'Build it: starter code' : 'Live example — edit it, run it') },
  { key: 'steps', phase: 'Build', title: 'Step-by-step implementation' },
  { key: 'animation', phase: 'Visualize', title: 'Watch it work' },
  { key: 'internals', phase: 'Visualize', title: 'What happens internally' },
  { key: 'mistakes', phase: 'Master', title: 'Common mistakes' },
  { key: 'debugging', phase: 'Master', title: 'Debugging guide' },
  { key: 'bestPractices', phase: 'Master', title: 'Best practices' },
  { key: 'useCases', phase: 'Master', title: 'Real-world use cases' },
  { key: 'whenToUse', phase: 'Master', title: 'When to use it — and when not to' },
  { key: 'comparison', phase: 'Master', title: 'Compared with related concepts' },
  { key: 'quiz', phase: 'Understand', title: 'Check your understanding' },
  { key: 'exercises', phase: 'Practice', title: 'Coding exercises' },
  { key: 'challenges', phase: 'Practice', title: 'Stretch challenges' },
  { key: 'solution', phase: 'Practice', title: 'Complete solution' },
  { key: 'interview', phase: 'Interview', title: 'Interview corner' },
  { key: 'takeaways', phase: 'Review', title: 'Summary & key takeaways' },
]

const present = (l, key) => {
  const v = l[key]
  if (key === 'preview') return !!l.solution?.files && l.kind === 'project'
  if (key === 'solution') return !!l.solution?.files && l.kind === 'project'
  return Array.isArray(v) ? v.length > 0 : !!v
}

const sections = computed(() => {
  const l = lesson.value
  if (!l) return []
  return SECTIONS.filter((s) => present(l, s.key)).map((s, i) => ({
    ...s,
    num: i + 1,
    id: s.key,
    title: typeof s.title === 'function' ? s.title(l) : s.title,
  }))
})
const phases = computed(() => {
  const seen = new Map()
  for (const s of sections.value) if (!seen.has(s.phase)) seen.set(s.phase, s.id)
  return [...seen.entries()].map(([phase, first]) => ({ phase, first }))
})
const activePhase = computed(() => sections.value.find((s) => s.id === activeSection.value)?.phase)

const prereqs = computed(() => (lesson.value?.prerequisites ?? []).map((p) => contentIndex.lessons[p]).filter(Boolean))
const related = computed(() => (lesson.value?.related ?? []).map((p) => contentIndex.lessons[p]).filter(Boolean))
const nextLesson = computed(() => (lesson.value?.next ? contentIndex.lessons[lesson.value.next] : next))
const interviewQuestions = computed(() =>
  (lesson.value?.interview ?? []).map((q) => ({ ...q, lesson: id, lessonTitle: meta.title, lessonPath: meta.path })),
)
const isFast = computed(() => prefs.prefs.learningMode === 'fast')
const showIntuition = (key) => !isFast.value || expandedIntuition.value[key]

// Map walkthrough steps onto the playground guide when the code matches the entry file.
const guide = computed(() => {
  const l = lesson.value
  if (!l?.walkthrough || !l.playground) return []
  const entry = l.playground.entry ?? Object.keys(l.playground.files)[0]
  if (l.playground.files[entry]?.trim() !== l.walkthrough.code.trim()) return []
  return l.walkthrough.steps.map((s) => ({ file: entry, lines: s.lines, text: s.text }))
})

let observer = null
function observeSections() {
  observer?.disconnect()
  if (typeof IntersectionObserver === 'undefined') return
  // Callbacks only report sections whose visibility changed, so remember all of
  // them and highlight the LAST visible one (the section being scrolled into).
  const visible = new Map()
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting)
      const current = sections.value.filter((s) => visible.get(s.id)).pop()
      if (current) activeSection.value = current.id
    },
    { rootMargin: '-120px 0px -55% 0px' },
  )
  document.querySelectorAll('.lsn-section').forEach((el) => observer.observe(el))
}

onMounted(async () => {
  progress.visit(id)
  try {
    lesson.value = await loadLesson(id)
    if (!lesson.value) error.value = 'This lesson could not be found.'
  } catch (e) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
  await nextTick()
  observeSections()
  if (route.hash) document.getElementById(route.hash.slice(1))?.scrollIntoView()
})
onBeforeUnmount(() => observer?.disconnect())

watch(
  () => route.hash,
  (h) => h && nextTick(() => document.getElementById(h.slice(1))?.scrollIntoView()),
)

function onVisualInteract() {
  progress.recordVisualizer(id)
}
</script>

<template>
  <article class="lsn" :aria-busy="loading">
    <!-- ======= header ======= -->
    <header class="lsn__head">
      <nav class="crumbs" aria-label="Breadcrumb">
        <ol>
          <li><RouterLink to="/learn">Learn</RouterLink></li>
          <li><RouterLink :to="`/learn#${level.id}`">{{ String(level.number).padStart(2, '0') }} {{ level.short }}</RouterLink></li>
          <li aria-current="page">{{ meta.title }}</li>
        </ol>
      </nav>
      <div class="lsn__stickers" aria-hidden="true">
        <span class="sticker sticker--kraft">{{ meta.kind === 'project' ? 'project' : 'lesson' }} {{ lessonNumber }}</span>
      </div>
      <div class="lsn__chips cluster">
        <span class="chip" :class="`chip--${meta.difficulty}`">{{ meta.difficulty }}</span>
        <span v-if="meta.minutes" class="chip chip--ghost">~{{ meta.minutes }} min</span>
        <span class="chip chip--ghost">{{ meta.counts.questions }} interview Qs</span>
        <span class="chip chip--ghost">{{ meta.counts.exercises }} exercises</span>
        <span class="chip chip--ghost">{{ meta.counts.quiz }} quiz Qs</span>
        <span v-if="progress.isComplete(id)" class="chip chip--acid">completed ✓</span>
      </div>
      <h1 class="lsn__title">{{ meta.title }}</h1>
      <p class="lsn__summary">{{ meta.summary }}</p>
      <div v-if="prereqs.length" class="lsn__prereq">
        <span class="label">Before this:</span>
        <RouterLink v-for="p in prereqs" :key="p.id" :to="p.path" class="chip" :class="progress.isComplete(p.id) ? 'chip--acid' : ''">
          {{ progress.isComplete(p.id) ? '✓ ' : '' }}{{ p.title }}
        </RouterLink>
      </div>
      <div class="lsn__actions cluster">
        <button type="button" class="btn btn--sm lsn__map-btn" aria-controls="course-sidebar" :aria-expanded="ui.sidebarDrawerOpen" @click="ui.sidebarDrawerOpen = true">
          <MapIcon :size="14" aria-hidden="true" /> Course map
        </button>
        <button v-if="!prefs.prefs.sidebarOpen" type="button" class="btn btn--sm lsn__map-btn-desk" @click="prefs.toggleSidebar()">
          <MapIcon :size="14" aria-hidden="true" /> Show course map
        </button>
        <button type="button" class="btn btn--sm" :aria-pressed="progress.isBookmarked(id)" @click="progress.toggleBookmark(id)">
          <BookmarkCheck v-if="progress.isBookmarked(id)" :size="14" aria-hidden="true" />
          <Bookmark v-else :size="14" aria-hidden="true" />
          {{ progress.isBookmarked(id) ? 'Bookmarked' : 'Bookmark' }}
        </button>
        <button type="button" class="btn btn--sm" :aria-pressed="!!progress.lessonState(id)?.revisit" @click="progress.toggleRevisit(id)">
          <Flag :size="14" aria-hidden="true" /> {{ progress.lessonState(id)?.revisit ? 'Flagged for revision' : 'Revise later' }}
        </button>
        <RouterLink :to="{ path: '/interview', query: { topics: id } }" class="btn btn--sm btn--cobalt">
          <MessagesSquare :size="14" aria-hidden="true" /> Interview mode
        </RouterLink>
      </div>
    </header>

    <!-- ======= phase bar ======= -->
    <nav v-if="phases.length" class="phasebar" aria-label="Lesson phases">
      <a v-for="(p, i) in phases" :key="p.phase" :href="`#${p.first}`" class="phasebar__item" :class="{ 'is-active': activePhase === p.phase }">
        <span class="mono">{{ i + 1 }}</span> {{ p.phase }}
      </a>
    </nav>

    <StateBlock v-if="loading" kind="loading" title="Loading lesson…" class="lsn__state" />
    <StateBlock v-else-if="error" kind="error" title="Couldn't load this lesson" class="lsn__state">
      <p>{{ error }}</p>
      <RouterLink to="/learn" class="btn btn--sm">Back to the course</RouterLink>
    </StateBlock>

    <div v-else class="lsn__grid">
      <div class="lsn__body">
        <section v-for="s in sections" :id="s.id" :key="s.id" class="lsn-section" :class="`lsn-section--${s.key}`" :aria-labelledby="`${s.id}-title`">
          <SectionHead :num="s.num" :phase="s.phase" :title="s.title" :id="s.id" />

          <!-- intuition sections fold away in fast-track mode -->
          <div v-if="s.intuition && !showIntuition(s.key)" class="fold">
            <p class="muted">Folded because you're in fast-track mode.</p>
            <button type="button" class="btn btn--sm" @click="expandedIntuition[s.key] = true"><ChevronDown :size="14" aria-hidden="true" /> Show it anyway</button>
          </div>

          <template v-else-if="s.key === 'intro' || s.key === 'why' || s.key === 'syntax'">
            <RichText class="prose" :value="lesson[s.key]" />
          </template>

          <template v-else-if="s.key === 'eli15'">
            <div class="eli15 card card--note card--sketch">
              <span class="sticker eli15__sticker">like I'm 15 ✎</span>
              <RichText class="prose" :value="lesson.eli15" />
            </div>
          </template>

          <template v-else-if="s.key === 'analogy'">
            <div class="analogy">
              <RichText class="prose" :value="lesson.analogy.body" />
              <aside v-if="lesson.analogy.mapping?.length" class="analogy__map">
                <p class="label">How the analogy maps</p>
                <dl>
                  <template v-for="(m, i) in lesson.analogy.mapping" :key="i">
                    <dt><RichText :value="m[0]" inline /></dt>
                    <dd><RichText :value="m[1]" inline /></dd>
                  </template>
                </dl>
              </aside>
            </div>
          </template>

          <template v-else-if="s.key === 'requirements' || s.key === 'objectives' || s.key === 'challenges'">
            <ul class="checklist">
              <li v-for="(item, i) in lesson[s.key]" :key="i"><RichText :value="item" inline /></li>
            </ul>
          </template>

          <template v-else-if="s.key === 'visual' || s.key === 'animation'">
            <VisualizerHost
              :type="lesson[s.key].type"
              :props="lesson[s.key].props"
              :caption="lesson[s.key].caption"
              :alt="lesson[s.key].alt"
              :title="lesson[s.key].title"
              @interact="onVisualInteract"
            />
            <RichText v-if="lesson[s.key].after" class="prose" :value="lesson[s.key].after" />
          </template>

          <template v-else-if="s.key === 'walkthrough'">
            <RichText v-if="lesson.walkthrough.intro" class="prose" :value="lesson.walkthrough.intro" />
            <CodeWalkthrough :code="lesson.walkthrough.code" :lang="lesson.walkthrough.lang || 'python'" :title="lesson.walkthrough.title" :steps="lesson.walkthrough.steps" />
          </template>

          <template v-else-if="s.key === 'preview'">
            <p class="prose">This is the finished project running for real. Click around, then build it yourself below.</p>
            <PlaygroundEditor :files="lesson.solution.files" :entry="lesson.solution.entry" title="Finished app (complete solution)" />
          </template>

          <template v-else-if="s.key === 'playground'">
            <LessonPlayground :spec="lesson.playground" :lesson-id="id" :guide="guide" />
          </template>

          <template v-else-if="s.key === 'steps'">
            <ol class="build-steps">
              <li v-for="(step, i) in lesson.steps" :key="i" class="build-step">
                <h3 class="build-step__title"><span class="mono">step {{ i + 1 }}</span> {{ step.title }}</h3>
                <RichText class="prose" :value="step.body" />
              </li>
            </ol>
          </template>

          <template v-else-if="s.key === 'internals'">
            <LayeredExplainer v-if="lesson.internals.beginner || lesson.internals.technical" :layers="lesson.internals" />
            <RichText v-else class="prose" :value="lesson.internals" />
          </template>

          <MistakeList v-else-if="s.key === 'mistakes'" :mistakes="lesson.mistakes" />
          <DebugGuide v-else-if="s.key === 'debugging'" :items="lesson.debugging" />

          <template v-else-if="s.key === 'bestPractices' || s.key === 'useCases'">
            <ul class="pointlist" :class="`pointlist--${s.key}`">
              <li v-for="(item, i) in lesson[s.key]" :key="i"><RichText :value="item" inline /></li>
            </ul>
          </template>

          <template v-else-if="s.key === 'whenToUse'">
            <div class="when">
              <div class="when__col when__col--use">
                <p class="label">Use it when</p>
                <ul>
                  <li v-for="(item, i) in lesson.whenToUse.use" :key="i"><RichText :value="item" inline /></li>
                </ul>
              </div>
              <div class="when__col when__col--avoid">
                <p class="label">Avoid it when</p>
                <ul>
                  <li v-for="(item, i) in lesson.whenToUse.avoid" :key="i"><RichText :value="item" inline /></li>
                </ul>
              </div>
            </div>
          </template>

          <CompareTable v-else-if="s.key === 'comparison'" :table="lesson.comparison" />

          <QuizRunner v-else-if="s.key === 'quiz'" :questions="lesson.quiz" :lesson-id="id" :pass="lesson.completion?.quizPass ?? undefined" />

          <div v-else-if="s.key === 'exercises'" class="exercises">
            <ExerciseCard v-for="(ex, i) in lesson.exercises" :key="ex.id" :exercise="ex" :lesson-id="id" :number="i + 1" />
          </div>

          <template v-else-if="s.key === 'solution'">
            <div v-if="!solutionShown" class="fold">
              <p>The full solution is here when you want it — try the starter and the steps first.</p>
              <button type="button" class="btn btn--sm btn--ink" @click="solutionShown = true">Reveal the complete solution</button>
            </div>
            <div v-else class="solution">
              <RichText v-if="lesson.solution.explanation" class="prose" :value="lesson.solution.explanation" />
              <CodeBlock v-for="(code, name) in lesson.solution.files" :key="name" :code="code" :lang="name.endsWith('.py') ? 'python' : name.endsWith('.json') ? 'json' : 'text'" :title="name" />
            </div>
          </template>

          <template v-else-if="s.key === 'interview'">
            <p class="prose">Questions an interviewer could ask about this topic. Draft your answer first, then reveal the model answer.</p>
            <div class="interview-list">
              <QuestionCard v-for="q in interviewQuestions" :key="q.id" :question="q" :show-lesson="false" />
            </div>
            <RouterLink :to="{ path: '/interview', query: { topics: id } }" class="btn btn--cobalt interview-cta">
              Practise these in a timed mock interview <ArrowRight :size="16" aria-hidden="true" />
            </RouterLink>
          </template>

          <template v-else-if="s.key === 'takeaways'">
            <ol class="takeaways">
              <li v-for="(t, i) in lesson.takeaways" :key="i"><RichText :value="t" inline /></li>
            </ol>
            <div v-if="lesson.docs?.length" class="docs">
              <p class="label">Go deeper — official docs</p>
              <ul>
                <li v-for="d in lesson.docs" :key="d.url"><a :href="d.url" target="_blank" rel="noopener noreferrer">{{ d.label }}</a></li>
              </ul>
            </div>
          </template>
        </section>

        <!-- ======= finish ======= -->
        <section id="finish" class="lsn-finish" aria-label="Finish the lesson">
          <CompletionPanel :lesson-id="id" />
          <div v-if="related.length" class="related">
            <p class="label">Related concepts</p>
            <div class="cluster">
              <RouterLink v-for="r in related" :key="r.id" :to="r.status === 'ready' ? r.path : '/learn'" class="chip">{{ r.title }}</RouterLink>
            </div>
          </div>
          <nav class="pager" aria-label="Lesson navigation">
            <RouterLink v-if="prev" :to="prev.path" class="pager__link pager__link--prev">
              <span class="label"><ArrowLeft :size="12" aria-hidden="true" /> previous</span>
              <span class="pager__title">{{ prev.title }}</span>
            </RouterLink>
            <span v-else />
            <RouterLink v-if="nextLesson" :to="nextLesson.path" class="pager__link pager__link--next">
              <span class="label">up next <ArrowRight :size="12" aria-hidden="true" /></span>
              <span class="pager__title">{{ nextLesson.title }}</span>
            </RouterLink>
          </nav>
        </section>
      </div>

      <!-- ======= right rail ======= -->
      <aside class="lsn__rail" aria-label="Lesson tools">
        <div class="rail__sticky">
          <nav class="toc" aria-label="On this page">
            <p class="label">On this page</p>
            <ol>
              <li v-for="s in sections" :key="s.id">
                <a :href="`#${s.id}`" :class="{ 'is-active': activeSection === s.id }" :aria-current="activeSection === s.id ? 'location' : undefined">
                  <span class="mono">{{ String(s.num).padStart(2, '0') }}</span> {{ s.title }}
                </a>
              </li>
            </ol>
          </nav>
          <CompletionPanel :lesson-id="id" compact />
        </div>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.lsn {
  padding: var(--s-5) clamp(16px, 3.5vw, 48px) var(--s-9);
  max-width: 1320px;
}
.crumbs ol {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
  margin: 0 0 var(--s-4);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}
.crumbs li + li {
  margin: 0;
}
.crumbs li + li::before {
  content: '/';
  margin-right: 6px;
  color: var(--muted);
}
.crumbs [aria-current] {
  color: var(--muted);
}
.lsn__head {
  position: relative;
  max-width: 980px;
  margin-bottom: var(--s-5);
}
.lsn__stickers {
  position: absolute;
  right: 0;
  top: 0;
}
.lsn__chips {
  --cluster-gap: 6px;
  margin-bottom: var(--s-4);
}
.lsn__title {
  font-size: clamp(2.2rem, 1.4rem + 3.4vw, 4.6rem);
  font-stretch: 115%;
  margin-bottom: var(--s-4);
  overflow-wrap: anywhere;
}
.lsn__summary {
  font-size: var(--step-1);
  max-width: 60ch;
  color: var(--text-soft);
}
.lsn__prereq {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: var(--s-4);
}
.lsn__prereq a.chip {
  text-decoration: none;
}
.lsn__actions {
  --cluster-gap: var(--s-2);
}
.lsn__map-btn {
  display: none;
}
.phasebar {
  position: sticky;
  top: var(--header-h);
  z-index: 20;
  display: flex;
  overflow-x: auto;
  margin: 0 calc(-1 * clamp(16px, 3.5vw, 48px)) var(--s-6);
  padding: 0 clamp(16px, 3.5vw, 48px);
  background: var(--bg);
  border-top: var(--border-thin);
  border-bottom: var(--border);
  scrollbar-width: none;
}
.phasebar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  border-right: 1.5px dashed color-mix(in srgb, var(--line) 30%, transparent);
}
.phasebar__item .mono {
  background: var(--surface-2);
  border: 1.5px solid var(--line);
  padding: 0 4px;
}
.phasebar__item.is-active {
  background: var(--text);
  color: var(--bg);
}
.phasebar__item.is-active .mono {
  background: var(--acid);
  color: var(--acid-ink);
  border-color: var(--acid);
}
.lsn__state {
  max-width: 760px;
}
.lsn__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: var(--s-7);
  align-items: start;
}
.lsn__body {
  min-width: 0;
}
.lsn-section {
  scroll-margin-top: calc(var(--header-h) + 60px);
  margin-bottom: var(--s-8);
}
.prose {
  max-width: 72ch;
  font-size: 1.06rem;
}
.prose :deep(p),
.prose :deep(li) {
  line-height: 1.7;
}
.fold {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-4);
  border: var(--border);
  border-style: dashed;
}
.fold p {
  margin: 0;
}
.eli15 {
  max-width: 78ch;
  padding: var(--s-6) var(--s-6) var(--s-5);
  background: var(--note);
}
.eli15__sticker {
  position: absolute;
  top: -16px;
  right: 24px;
}
.eli15 .prose {
  font-size: 1.12rem;
}
.analogy {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--s-5);
  align-items: start;
}
.analogy__map {
  border: var(--border);
  background: var(--note-yellow);
  padding: var(--s-4);
  transform: rotate(0.6deg);
  box-shadow: var(--shadow-sm);
}
.analogy__map dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px var(--s-3);
  margin: var(--s-2) 0 0;
}
.analogy__map dt {
  font-weight: 800;
}
.analogy__map dd {
  margin: 0;
}
.analogy__map dt::after {
  content: ' →';
  color: var(--red-text);
}
.checklist,
.pointlist {
  list-style: none;
  padding: 0;
  max-width: 76ch;
  display: grid;
  gap: var(--s-2);
}
.checklist li,
.pointlist li {
  position: relative;
  padding: var(--s-3) var(--s-4) var(--s-3) 3rem;
  border: var(--border-thin);
  background: var(--surface);
  margin: 0;
}
.checklist li::before,
.pointlist li::before {
  content: '→';
  position: absolute;
  left: 1rem;
  top: var(--s-3);
  font-weight: 900;
  color: var(--red-text);
}
.pointlist--bestPractices li::before {
  content: '✓';
  color: var(--green);
}
.pointlist--useCases li::before {
  content: '◆';
  color: var(--cobalt-text);
}
.checklist li::before {
  content: '☐';
  color: var(--text);
}
.build-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s-6);
  counter-reset: step;
}
.build-step {
  border-left: 6px solid var(--text);
  padding-left: var(--s-5);
  margin: 0;
}
.build-step__title {
  font-size: var(--step-1);
  font-stretch: 100%;
}
.build-step__title .mono {
  font-size: 0.75rem;
  background: var(--acid);
  color: var(--acid-ink);
  padding: 2px 6px;
  border: 2px solid var(--line);
  vertical-align: middle;
  margin-right: 6px;
}
.when {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}
.when__col {
  border: var(--border);
  padding: var(--s-4) var(--s-5);
  background: var(--surface);
}
.when__col ul {
  margin: 0;
}
.when__col--use {
  background: var(--note-green);
  box-shadow: 6px 6px 0 var(--green);
}
.when__col--avoid {
  background: #ffe9e3;
  box-shadow: 6px 6px 0 var(--red);
}
:root[data-theme='dark'] .when__col--avoid {
  background: #2e1a15;
}
.exercises,
.interview-list {
  display: grid;
  gap: var(--s-6);
}
.interview-list {
  gap: var(--s-4);
}
.interview-cta {
  margin-top: var(--s-5);
  max-width: 100%;
  white-space: normal;
}
.takeaways {
  counter-reset: t;
  list-style: none;
  padding: 0;
  max-width: 76ch;
  display: grid;
  gap: var(--s-3);
}
.takeaways li {
  counter-increment: t;
  position: relative;
  padding: var(--s-3) var(--s-4) var(--s-3) 3.6rem;
  border: var(--border);
  background: var(--note);
  font-weight: 600;
  margin: 0;
}
.takeaways li::before {
  content: counter(t, decimal-leading-zero);
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2.8rem;
  display: grid;
  place-items: center;
  background: var(--acid);
  color: var(--acid-ink);
  border-right: var(--border);
  font-family: var(--font-mono);
  font-weight: 800;
}
.docs {
  margin-top: var(--s-5);
}
.solution {
  display: grid;
  gap: var(--s-4);
}
.lsn-finish {
  display: grid;
  gap: var(--s-5);
  padding-top: var(--s-5);
  border-top: var(--border);
}
.lsn-finish > * {
  min-width: 0;
}
.related .label {
  margin-bottom: var(--s-2);
}
.related a.chip {
  text-decoration: none;
}
.pager {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-4);
}
.pager__link {
  display: grid;
  gap: 4px;
  padding: var(--s-4);
  border: var(--border);
  background: var(--surface);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
}
.pager__link:hover {
  background: var(--acid);
  color: var(--acid-ink);
}
.pager__link--next {
  text-align: right;
}
.pager__link .label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.pager__link--next .label {
  justify-content: flex-end;
}
.pager__title {
  font-weight: 800;
  font-size: 1.05rem;
}
.lsn__rail {
  min-width: 0;
}
.rail__sticky {
  position: sticky;
  top: calc(var(--header-h) + 64px);
  display: grid;
  gap: var(--s-4);
  max-height: calc(100vh - var(--header-h) - 80px);
  overflow-y: auto;
  padding-bottom: var(--s-4);
  scrollbar-width: thin;
}
.toc ol {
  list-style: none;
  padding: 0;
  margin: var(--s-2) 0 0;
}
.toc li + li {
  margin: 0;
}
.toc a {
  display: block;
  padding: 4px 6px;
  font-size: 0.84rem;
  line-height: 1.3;
  text-decoration: none;
  color: var(--text-soft);
  border-left: 3px solid transparent;
}
.toc a .mono {
  font-size: 0.7rem;
  color: var(--muted);
}
.toc a.is-active {
  border-left-color: var(--text);
  background: var(--acid);
  color: var(--acid-ink);
  font-weight: 700;
}
.toc a.is-active .mono {
  color: var(--acid-ink);
}

@media (max-width: 1300px) {
  .lsn__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .lsn__rail {
    display: none;
  }
}
@media (max-width: 1100px) {
  .lsn__map-btn {
    display: inline-flex;
  }
  .lsn__map-btn-desk {
    display: none;
  }
}
@media (max-width: 800px) {
  .lsn__stickers {
    position: static;
    margin-bottom: var(--s-3);
  }
  .analogy,
  .when,
  .pager {
    grid-template-columns: 1fr;
  }
  .eli15 {
    padding: var(--s-5) var(--s-4) var(--s-4);
  }
}
</style>
