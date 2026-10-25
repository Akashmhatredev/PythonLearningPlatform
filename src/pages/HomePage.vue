<script setup>
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { ArrowRight, Search } from 'lucide-vue-next'
import { contentIndex } from '../content/index.js'
import { visualizerTypes } from '../content/visualizers.js'
import { useProgressStore } from '../stores/progress.js'
import { usePreferencesStore } from '../stores/preferences.js'
import HandArrow from '../components/ui/HandArrow.vue'
import ProgressBar from '../components/ui/ProgressBar.vue'
import VisualizerHost from '../components/diagrams/VisualizerHost.vue'
import PlaygroundEditor from '../components/code/PlaygroundEditor.vue'

const progress = useProgressStore()
const prefs = usePreferencesStore()
const stats = contentIndex.stats
const firstLesson = contentIndex.order.map((id) => contentIndex.lessons[id]).find((l) => l.status === 'ready')
const next = computed(() => {
  const id = progress.recommended?.id
  return id ? contentIndex.lessons[id] : firstLesson
})
const started = computed(() => Object.keys(progress.state.lessons).length > 0)

const JOURNEY = [
  { n: '01', title: 'Learn', text: 'Plain-English explanation, an everyday analogy and a picture of the idea.' },
  { n: '02', title: 'Experiment', text: 'Edit real Python and run it in your browser — break it, read the traceback, follow guided experiments.' },
  { n: '03', title: 'Visualize', text: 'Step through your code line by line and watch names, objects and the call stack change.' },
  { n: '04', title: 'Understand', text: 'Predict the output, find the bug, explain it back.' },
  { n: '05', title: 'Practice', text: 'Coding exercises checked by real tests, with hints on demand.' },
  { n: '06', title: 'Interview', text: 'Topic-specific questions with model answers and timed mock interviews.' },
  { n: '07', title: 'Review', text: 'Your weak spots come back in a personal revision queue.' },
]

const levels = computed(() =>
  contentIndex.levels.map((l) => {
    const lessons = l.lessons.map((id) => contentIndex.lessons[id])
    const ready = lessons.filter((x) => x.status === 'ready')
    return { ...l, ready: ready.length, done: ready.filter((x) => progress.isComplete(x.id)).length }
  }),
)
const bands = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

// searchable topic index
const topicQuery = ref('')
const topicResults = computed(() => {
  const q = topicQuery.value.trim().toLowerCase()
  const all = contentIndex.order.map((id) => contentIndex.lessons[id])
  const hits = q ? all.filter((l) => `${l.title} ${l.summary} ${l.tags.join(' ')}`.toLowerCase().includes(q)) : all
  return contentIndex.levels
    .map((lvl) => ({ ...lvl, items: hits.filter((l) => l.level === lvl.id) }))
    .filter((g) => g.items.length)
})
const topicCount = computed(() => topicResults.value.reduce((n, g) => n + g.items.length, 0))

const demoFiles = {
  'main.py': `playlist = ["Blue Monday", "Yellow", "Python Song"]
playlist.append("Hello, World")

for number, song in enumerate(playlist, start=1):
    print(f"{number}. {song:<14} {len(song):>2} letters")

longest = max(playlist, key=len)
print("Longest title:", longest)
`,
}

const tracerCode = `def greet(name):
    message = "Hi, " + name
    return message

friends = ["Ada", "Guido"]
squad = friends
squad.append("Grace")
for friend in friends:
    print(greet(friend))
`

// GSAP stamp-in for the hero (skipped with reduced motion)
const hero = useTemplateRef('hero')
onMounted(async () => {
  if (prefs.reducedMotion || !hero.value) return
  await nextTick()
  const { gsap } = await import('gsap')
  gsap.from(hero.value.querySelectorAll('.hero__line'), { y: 40, rotate: -2, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'steps(4)' })
  gsap.from(hero.value.querySelectorAll('.hero__tag'), { scale: 0, opacity: 0, duration: 0.3, delay: 0.5, stagger: 0.08, ease: 'back.out(3)' })
})
</script>

<template>
  <div class="home">
    <!-- ================= HERO ================= -->
    <section ref="hero" class="hero" aria-labelledby="hero-title">
      <div class="hero__inner">
        <span class="hero__tag hero__tag--1 mono">&gt;&gt;&gt; import this</span>
        <span class="hero__tag hero__tag--2 sticker sticker--kraft">lesson 001</span>
        <span class="hero__tag hero__tag--3 mono">NO MAGIC. JUST PYTHON.</span>
        <span class="hero__tag hero__tag--4 sticker">build something real ✎</span>
        <h1 id="hero-title" class="hero__title">
          <span class="hero__line">PYTHON</span>
          <span class="hero__line">FROM ZERO</span>
          <span class="hero__line">TO <span class="hero__ship">PRO.</span></span>
        </h1>
        <div class="hero__bottom">
          <p class="hero__lead">
            The Python Learning Platform takes you from <strong>never having written a line of code</strong> to building, testing and explaining production Python —
            with real Python running in your browser, step-by-step visualizations and real interview practice.
          </p>
          <div class="hero__cta">
            <HandArrow class="hero__arrow" variant="loop" width="130" />
            <RouterLink v-if="next" :to="next.path" class="btn btn--cobalt btn--lg">
              {{ started ? 'Continue learning' : 'Start learning' }} <ArrowRight :size="20" aria-hidden="true" />
            </RouterLink>
            <RouterLink to="/learn" class="btn btn--lg">See the course</RouterLink>
          </div>
          <p v-if="next" class="hero__next mono">next up → {{ next.title }}</p>
        </div>
      </div>
      <dl class="hero__stats">
        <div><dt>lessons</dt><dd>{{ stats.ready }}</dd></div>
        <div><dt>levels</dt><dd>{{ contentIndex.levels.length }}</dd></div>
        <div><dt>interview questions</dt><dd>{{ stats.questions }}</dd></div>
        <div><dt>coding exercises</dt><dd>{{ stats.exercises }}</dd></div>
        <div><dt>visualizers</dt><dd>{{ visualizerTypes.length }}</dd></div>
      </dl>
    </section>

    <!-- ================= JOURNEY ================= -->
    <section class="sec" aria-labelledby="journey-title">
      <div class="sec__head">
        <span class="label">how every lesson works</span>
        <h2 id="journey-title">Learn it. Break it.<br />Explain it.</h2>
      </div>
      <ol class="journey">
        <li v-for="(j, i) in JOURNEY" :key="j.n" class="journey__step" :style="{ '--tilt': (i % 2 ? 0.8 : -0.6) + 'deg' }">
          <span class="journey__n">{{ j.n }}</span>
          <strong class="journey__title">{{ j.title }}</strong>
          <span>{{ j.text }}</span>
        </li>
      </ol>
    </section>

    <!-- ================= PATH MAP ================= -->
    <section class="sec sec--paper" aria-labelledby="map-title">
      <div class="sec__head">
        <span class="label">the learning path</span>
        <h2 id="map-title">{{ contentIndex.levels.length }} levels. One map.</h2>
        <p class="sec__lead">From “what is a program?” to asyncio, Python internals, clean architecture and interview drills. Your progress fills the map as you go.</p>
      </div>
      <div class="bands">
        <div v-for="band in bands" :key="band.id" class="band" :class="`band--${band.id}`">
          <p class="band__label"><span class="chip" :class="`chip--${band.id}`">{{ band.label }}</span></p>
          <ol class="stations">
            <li v-for="l in levels.filter((x) => x.band === band.id)" :key="l.id">
              <RouterLink :to="`/learn#${l.id}`" class="station">
                <span class="station__num">{{ String(l.number).padStart(2, '0') }}</span>
                <span class="station__title">{{ l.title }}</span>
                <span class="station__meta mono">{{ l.done }}/{{ l.ready }}{{ l.optional ? ' · optional' : '' }}</span>
                <span class="station__bar" aria-hidden="true"><span :style="{ width: l.ready ? (l.done / l.ready) * 100 + '%' : '0%' }" /></span>
              </RouterLink>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ================= LIVE CONCEPT PREVIEW ================= -->
    <section class="sec" aria-labelledby="viz-title">
      <div class="sec__head sec__head--split">
        <div>
          <span class="label">see what python does</span>
          <h2 id="viz-title">Abstract ideas,<br />made visible.</h2>
        </div>
        <p class="sec__lead">
          {{ visualizerTypes.length }} interactive visualizers show names and objects, the call stack, closures, generators, exceptions, class lookup, memory, asyncio and concurrency. The
          code tracer runs <em>your</em> code for real and records every step.
          <RouterLink to="/visualizers">Browse all visualizers →</RouterLink>
        </p>
      </div>
      <VisualizerHost type="code-tracer" :props="{ code: tracerCode }" title="Try it: step through real Python" alt="A code tracer stepping through a short program: the friends list and the squad name point to the same list object, a third name is appended through squad, and greet() is called once per friend, adding a frame to the call stack each time." />
    </section>

    <!-- ================= PLAYGROUND ================= -->
    <section class="sec sec--ink" aria-labelledby="pg-title">
      <div class="sec__head sec__head--split">
        <div>
          <span class="label">real code, real python</span>
          <h2 id="pg-title">A playground<br />that actually runs.</h2>
        </div>
        <p class="sec__lead">
          Every lesson has one. CPython 3.14 runs right in your browser (via WebAssembly), with real tracebacks, live input(), a variables inspector and test-graded exercises.
        </p>
      </div>
      <PlaygroundEditor :files="demoFiles" title="Edit the playlist and press Run" height="360px" />
    </section>

    <!-- ================= INTERVIEW ================= -->
    <section class="sec" aria-labelledby="int-title">
      <div class="interview">
        <div>
          <span class="label">interview mode</span>
          <h2 id="int-title">Explain it out loud before someone asks.</h2>
          <p class="sec__lead">Every topic has its own question bank: conceptual, output-prediction, debugging, coding and architecture questions, each with a model answer you can say in an interview.</p>
          <ul class="interview__list">
            <li>Practice mode — answer first, reveal only when you choose</li>
            <li>Timed mock interviews with a final review</li>
            <li>Coding questions graded by real tests</li>
            <li>A revision queue built from what you got wrong</li>
          </ul>
          <div class="cluster">
            <RouterLink to="/interview" class="btn btn--cobalt">Start interview practice</RouterLink>
            <RouterLink to="/interview/bank" class="btn">Browse {{ stats.questions }} questions</RouterLink>
          </div>
        </div>
        <figure class="interview__card card tilt-r">
          <span class="sticker sticker--red interview__sticker">asked a lot</span>
          <p class="label">beginner · comparison</p>
          <p class="interview__q">What is the difference between a <code>list</code> and a <code>tuple</code>?</p>
          <p class="interview__a hand">“A list is mutable and meant for items of one kind; a tuple is immutable, hashable if its items are, and great for fixed records…”</p>
          <figcaption class="muted">Model answers are structured: define → why → how → example → trade-off.</figcaption>
        </figure>
      </div>
    </section>

    <!-- ================= PROGRESS ================= -->
    <section class="sec sec--paper" aria-labelledby="prog-title">
      <div class="progress-preview card card--note">
        <div>
          <span class="label">your progress</span>
          <h2 id="prog-title" class="progress-preview__title">{{ started ? `Level: ${progress.level.level}` : 'Your notebook is empty — for now.' }}</h2>
          <p v-if="!started">Progress, bookmarks and quiz results are saved in this browser only. No account needed.</p>
          <p v-else>{{ progress.level.explain }}</p>
        </div>
        <div class="progress-preview__stats">
          <ProgressBar :value="progress.completion.ratio" :label="`${progress.completion.done} of ${progress.completion.total} lessons complete`" />
          <p class="mono">streak: {{ progress.streak }} day{{ progress.streak === 1 ? '' : 's' }} · exercises passed: {{ progress.exerciseCount }}</p>
          <RouterLink to="/dashboard" class="btn btn--sm">Open dashboard</RouterLink>
        </div>
      </div>
    </section>

    <!-- ================= TOPIC INDEX ================= -->
    <section class="sec" aria-labelledby="index-title">
      <div class="sec__head sec__head--split">
        <div>
          <span class="label">topic index</span>
          <h2 id="index-title">Find any topic.</h2>
        </div>
        <label class="index-search">
          <Search :size="18" aria-hidden="true" />
          <span class="visually-hidden">Filter topics</span>
          <input v-model="topicQuery" class="input" type="search" placeholder="Filter: generators, decorators, asyncio, GIL…" />
          <span class="mono muted">{{ topicCount }} topics</span>
        </label>
      </div>
      <div class="index">
        <div v-for="g in topicResults" :key="g.id" class="index__group">
          <p class="index__level"><span class="mono">{{ String(g.number).padStart(2, '0') }}</span> {{ g.short }}</p>
          <ul>
            <li v-for="l in g.items" :key="l.id">
              <RouterLink v-if="l.status === 'ready'" :to="l.path">{{ l.title }}</RouterLink>
              <span v-else class="muted">{{ l.title }} <em class="label">planned</em></span>
            </li>
          </ul>
        </div>
        <p v-if="!topicResults.length" class="muted">No topic matches “{{ topicQuery }}”. Try the global search (⌘K) — it also searches APIs, errors and interview questions.</p>
      </div>
    </section>

    <!-- ================= FINAL CTA ================= -->
    <section class="final" aria-labelledby="final-title">
      <h2 id="final-title" class="final__title">Stop reading about Python.<br /><span class="mark">Start writing it.</span></h2>
      <RouterLink v-if="next" :to="next.path" class="btn btn--cobalt btn--lg">{{ started ? 'Continue' : 'Start lesson 001' }} <ArrowRight :size="20" aria-hidden="true" /></RouterLink>
    </section>
  </div>
</template>

<style scoped>
.home {
  overflow-x: clip;
}
/* ---------- hero ---------- */
.hero {
  border-bottom: var(--border);
  position: relative;
}
.hero__inner {
  position: relative;
  max-width: var(--page-max);
  margin: 0 auto;
  padding: clamp(40px, 7vw, 96px) clamp(16px, 4vw, 48px) var(--s-7);
}
.hero__title {
  font-size: clamp(3.2rem, 1rem + 11vw, 11.5rem);
  font-stretch: 125%;
  font-weight: 900;
  line-height: 0.84;
  letter-spacing: -0.035em;
  margin: 0 0 var(--s-6);
  display: grid;
}
.hero__line {
  display: block;
}
.hero__ship {
  background: var(--acid);
  color: var(--acid-ink);
  padding: 0 0.08em;
  box-shadow: 0.06em 0.06em 0 var(--shadow-color);
  border: 0.03em solid var(--line);
  display: inline-block;
  transform: rotate(-1.5deg);
}
.hero__tag {
  position: absolute;
  z-index: 2;
  font-size: 0.75rem;
  font-weight: 800;
}
.hero__tag.mono {
  border: var(--border-thin);
  padding: 3px 8px;
  background: var(--surface);
  letter-spacing: 0.08em;
}
.hero__tag--1 {
  top: clamp(16px, 3vw, 48px);
  right: clamp(16px, 8vw, 140px);
  transform: rotate(3deg);
}
.hero__tag--2 {
  top: clamp(90px, 14vw, 220px);
  right: clamp(12px, 3vw, 48px);
}
.hero__tag--3 {
  top: clamp(36px, 5vw, 72px);
  left: clamp(160px, 38vw, 560px);
  transform: rotate(-2deg);
  background: var(--text) !important;
  color: var(--bg);
}
.hero__tag--4 {
  bottom: clamp(16px, 3vw, 40px);
  right: clamp(16px, 6vw, 96px);
  --r: 4deg;
  transform: rotate(4deg);
}
.hero__bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-4) var(--s-6);
  align-items: end;
  max-width: 1200px;
}
.hero__lead {
  font-size: var(--step-1);
  max-width: 46ch;
  margin: 0;
}
.hero__cta {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  align-items: center;
}
.hero__arrow {
  position: absolute;
  left: -140px;
  top: -64px;
  color: var(--red-text);
}
.hero__next {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}
.hero__stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: 0;
  border-top: var(--border);
  background: var(--text);
  color: var(--bg);
}
.hero__stats div {
  padding: var(--s-4) clamp(12px, 2vw, 32px);
  border-right: 2px solid color-mix(in srgb, var(--bg) 25%, transparent);
}
.hero__stats div:last-child {
  border-right: 0;
}
.hero__stats dt {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.75;
}
.hero__stats dd {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: var(--step-3);
  line-height: 1;
}
/* ---------- sections ---------- */
.sec {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: var(--s-8) clamp(16px, 4vw, 48px);
}
.sec--paper {
  max-width: none;
  background: var(--surface-2);
  border-block: var(--border);
}
.sec--paper > * {
  max-width: calc(var(--page-max) - 96px);
  margin-inline: auto;
}
.sec--ink {
  max-width: none;
  background: #1a1a1a;
  color: #f1eee5;
}
.sec--ink > * {
  max-width: calc(var(--page-max) - 96px);
  margin-inline: auto;
}
.sec--ink .label {
  color: var(--acid);
}
.sec__head {
  margin-bottom: var(--s-6);
}
.sec__head--split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-5);
  align-items: end;
}
.sec__head h2 {
  font-size: var(--step-4);
  font-stretch: 118%;
  margin: var(--s-2) 0 0;
}
.sec__lead {
  font-size: var(--step-1);
  max-width: 56ch;
  margin: var(--s-3) 0 0;
}
/* ---------- journey ---------- */
.journey {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--s-3);
}
.journey__step {
  margin: 0;
  display: grid;
  gap: var(--s-2);
  align-content: start;
  padding: var(--s-4) var(--s-3);
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transform: rotate(var(--tilt));
  font-size: 0.9rem;
}
.journey__step:nth-child(2),
.journey__step:nth-child(5) {
  background: var(--acid);
  color: var(--acid-ink);
}
.journey__step:nth-child(6) {
  background: var(--cobalt);
  color: #fff;
}
.journey__n {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-2);
  color: transparent;
  -webkit-text-stroke: 1.5px currentColor;
}
.journey__step:nth-child(2) .journey__n,
.journey__step:nth-child(5) .journey__n,
.journey__step:nth-child(6) .journey__n {
  -webkit-text-stroke-color: currentColor;
}
.journey__title {
  font-family: var(--font-display);
  font-size: var(--step-1);
}
/* ---------- path map ---------- */
.bands {
  display: grid;
  gap: var(--s-6);
}
.band__label {
  margin: 0 0 var(--s-3);
}
.stations {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: var(--s-3);
}
.stations li {
  margin: 0;
}
.station {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px var(--s-3);
  align-items: center;
  padding: var(--s-3);
  border: var(--border);
  background: var(--surface);
  text-decoration: none;
  height: 100%;
  box-shadow: var(--shadow-sm);
}
.station:hover {
  background: var(--acid);
  color: var(--acid-ink);
  transform: translate(-2px, -2px);
}
.station__num {
  grid-row: span 2;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-2);
  font-stretch: 125%;
}
.station__title {
  font-weight: 800;
  line-height: 1.2;
}
.station__meta {
  font-size: 0.72rem;
  color: var(--muted);
}
.station:hover .station__meta {
  color: #3d3d2c;
}
.station__bar {
  grid-column: 1 / -1;
  height: 6px;
  border: 1.5px solid var(--line);
  margin-top: 6px;
  position: relative;
}
.station__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--green);
}
/* ---------- interview ---------- */
.interview {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--s-7);
  align-items: center;
}
.interview h2 {
  font-size: var(--step-3);
  margin: var(--s-2) 0 0;
}
.interview__list {
  list-style: none;
  padding: 0;
  margin: var(--s-4) 0 var(--s-5);
}
.interview__list li {
  padding-left: 1.6em;
  position: relative;
  font-weight: 600;
}
.interview__list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--cobalt-text);
  font-weight: 900;
}
.interview__card {
  border-left: 12px solid var(--cobalt);
  padding: var(--s-6) var(--s-5) var(--s-5);
}
.interview__sticker {
  position: absolute;
  top: -16px;
  right: 18px;
}
.interview__q {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--step-1);
  line-height: 1.25;
}
.interview__a {
  font-size: 1.3rem;
  color: var(--cobalt-text);
}
/* ---------- progress ---------- */
.progress-preview {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--s-6);
  align-items: center;
}
.progress-preview__title {
  font-size: var(--step-3);
  margin: var(--s-2) 0 var(--s-3);
}
.progress-preview__stats {
  display: grid;
  gap: var(--s-3);
  justify-items: start;
}
.progress-preview__stats > :first-child {
  width: 100%;
}
.progress-preview__stats p {
  margin: 0;
  font-size: 0.85rem;
}
/* ---------- index ---------- */
.index-search {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
.index-search .input {
  flex: 1;
}
.index {
  columns: 4 260px;
  column-gap: var(--s-6);
}
.index__group {
  break-inside: avoid;
  margin-bottom: var(--s-5);
}
.index__level {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-1);
  margin: 0 0 var(--s-2);
  border-bottom: var(--border);
  padding-bottom: 4px;
}
.index__level .mono {
  font-size: 0.8rem;
  background: var(--text);
  color: var(--bg);
  padding: 1px 5px;
  vertical-align: middle;
}
.index ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.9rem;
}
.index li {
  margin: 3px 0;
}
.index em {
  font-style: normal;
  font-size: 0.6rem;
}
/* ---------- final ---------- */
.final {
  border-top: var(--border);
  padding: var(--s-9) clamp(16px, 4vw, 48px);
  text-align: center;
  display: grid;
  justify-items: center;
  gap: var(--s-6);
  background: var(--note-yellow);
}
.final__title {
  font-size: var(--step-4);
  font-stretch: 118%;
  margin: 0;
}

@media (max-width: 1100px) {
  .journey {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .hero__arrow {
    display: none;
  }
}
@media (max-width: 800px) {
  .hero__bottom,
  .sec__head--split,
  .interview,
  .progress-preview {
    grid-template-columns: 1fr;
  }
  .hero__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero__stats div {
    border-bottom: 2px solid color-mix(in srgb, var(--bg) 25%, transparent);
  }
  .journey {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .hero__tag--3,
  .hero__tag--4 {
    display: none;
  }
}
@media (max-width: 480px) {
  .journey {
    grid-template-columns: 1fr;
  }
}
</style>
