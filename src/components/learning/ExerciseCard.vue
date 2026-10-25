<script setup>
// A coding exercise: prompt → hints on demand → run tests → solution only on request.
import { computed, ref } from 'vue'
import { CheckCircle2, Eye, Lightbulb } from 'lucide-vue-next'
import PlaygroundEditor from '../code/PlaygroundEditor.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from './RichText.vue'
import { useProgressStore } from '../../stores/progress.js'
import { useUiStore } from '../../stores/ui.js'

const props = defineProps({
  exercise: { type: Object, required: true },
  lessonId: { type: String, required: true },
  number: { type: Number, default: 1 },
})

const progress = useProgressStore()
const ui = useUiStore()
const pg = ref(null)
const hintsShown = ref(0)
const solutionShown = ref(false)
const confirmReveal = ref(false)
const testRuns = ref(0)
const lastPassed = ref(false)

const ex = computed(() => props.exercise)
const done = computed(() => progress.lessonState(props.lessonId)?.exercises?.[ex.value.id] ?? null)
const hasTests = computed(() => (ex.value.tests ?? []).length > 0)

function onTests({ passed }) {
  testRuns.value++
  lastPassed.value = passed
  if (passed) {
    const first = !done.value
    progress.recordExercise(props.lessonId, ex.value.id, 'tests')
    if (first) ui.toast(`Exercise passed: ${ex.value.title}`, { tone: 'success' })
  }
}

function markSelfDone() {
  progress.recordExercise(props.lessonId, ex.value.id, 'self')
}

function askReveal() {
  if (testRuns.value === 0 && hintsShown.value === 0 && !done.value) confirmReveal.value = true
  else solutionShown.value = true
}
</script>

<template>
  <article class="ex" :id="`exercise-${ex.id}`">
    <header class="ex__head">
      <span class="ex__num mono">EX {{ String(number).padStart(2, '0') }}</span>
      <h4 class="ex__title">{{ ex.title }}</h4>
      <span v-if="ex.difficulty" class="chip" :class="`chip--${ex.difficulty}`">{{ ex.difficulty }}</span>
      <span v-if="done" class="chip chip--acid ex__done">
        <CheckCircle2 :size="14" aria-hidden="true" /> done · {{ done.grading === 'tests' ? 'test-graded' : 'self-reported' }}
      </span>
    </header>
    <RichText class="ex__prompt" :value="ex.prompt" />

    <PlaygroundEditor
      ref="pg"
      :files="ex.files"
      :tests="ex.tests ?? []"
      :title="`Exercise ${number}: your code`"
      height="400px"
      @tests="onTests"
    />

    <div class="ex__tools">
      <button
        v-if="(ex.hints ?? []).length"
        type="button"
        class="btn btn--sm"
        :disabled="hintsShown >= ex.hints.length"
        @click="hintsShown++"
      >
        <Lightbulb :size="14" aria-hidden="true" />
        {{ hintsShown === 0 ? 'Show a hint' : hintsShown < ex.hints.length ? 'Next hint' : 'No more hints' }}
        <span class="mono">({{ hintsShown }}/{{ ex.hints.length }})</span>
      </button>
      <button v-if="!solutionShown" type="button" class="btn btn--sm btn--ghost" @click="askReveal">
        <Eye :size="14" aria-hidden="true" /> Show solution
      </button>
      <button v-if="!hasTests && !done" type="button" class="btn btn--sm btn--ink" @click="markSelfDone">I finished it (self-reported)</button>
      <span v-if="hasTests && testRuns && !lastPassed" class="annotation">keep going — read the failing test message ↑</span>
    </div>

    <ol v-if="hintsShown" class="ex__hints" aria-live="polite">
      <li v-for="(h, i) in ex.hints.slice(0, hintsShown)" :key="i" class="hint">
        <span class="label">hint {{ i + 1 }}</span>
        <RichText :value="h" />
      </li>
    </ol>

    <div v-if="confirmReveal && !solutionShown" class="status status--warn ex__confirm" role="alertdialog" aria-label="Reveal solution?">
      <div>
        <p><strong>Try first?</strong> You haven't run the tests or opened a hint yet. Struggling a little is where learning happens.</p>
        <div class="cluster">
          <button type="button" class="btn btn--sm btn--ink" @click="(solutionShown = true), (confirmReveal = false)">Reveal anyway</button>
          <button type="button" class="btn btn--sm" @click="(confirmReveal = false), (hintsShown = Math.max(hintsShown, 1))">Give me a hint instead</button>
        </div>
      </div>
    </div>

    <div v-if="solutionShown" class="ex__solution">
      <p class="label">Solution</p>
      <RichText v-if="ex.solution?.explanation" :value="ex.solution.explanation" />
      <CodeBlock v-for="(code, name) in ex.solution?.files ?? {}" :key="name" :code="code" :lang="name.endsWith('.py') ? 'python' : 'text'" :title="name" />
      <button type="button" class="btn btn--sm" @click="pg?.loadFiles(ex.solution.files)">Load solution into the editor</button>
      <p class="muted ex__note">Loading the solution doesn't mark the exercise done — the tests have to pass on code in the editor.</p>
    </div>
  </article>
</template>

<style scoped>
.ex {
  border: var(--border);
  border-top-width: 12px;
  border-top-color: var(--acid);
  background: var(--note-yellow);
  padding: var(--s-5);
  box-shadow: var(--shadow);
  display: grid;
  gap: var(--s-4);
}
:root[data-theme='dark'] .ex {
  border-top-color: var(--acid);
}
.ex > * {
  min-width: 0; /* grid items: let long code lines scroll inside their panel instead of widening the page */
}
.ex__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
}
.ex__num {
  font-weight: 800;
  background: var(--text);
  color: var(--bg);
  padding: 2px 8px;
}
.ex__title {
  margin: 0;
  font-size: var(--step-1);
}
.ex__done {
  margin-left: auto;
}
.ex__prompt :deep(p:last-child) {
  margin-bottom: 0;
}
.ex__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-3);
}
.ex__hints {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--s-2);
}
.hint {
  border: var(--border-thin);
  border-radius: var(--sketch-radius);
  background: var(--surface);
  padding: var(--s-3) var(--s-4);
}
.hint :deep(p:last-child) {
  margin-bottom: 0;
}
.ex__confirm p {
  margin-bottom: var(--s-3);
}
.ex__solution {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-4);
  border: var(--border);
  background: var(--surface);
}
.ex__solution .btn {
  justify-self: start;
}
.ex__note {
  margin: 0;
  font-size: 0.85rem;
}
</style>
