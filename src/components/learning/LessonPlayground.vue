<script setup>
// "Experiment" step of a lesson: the live example plus guided experiments.
// Experiments with tests are checked in the sandbox; others are self-reported.
import { computed, reactive, ref } from 'vue'
import { CheckCircle2, Circle, FlaskConical, Lightbulb } from 'lucide-vue-next'
import PlaygroundEditor from '../code/PlaygroundEditor.vue'
import RichText from './RichText.vue'
import { useProgressStore } from '../../stores/progress.js'
import { useSandbox } from '../../composables/useSandbox.js'

const props = defineProps({
  spec: { type: Object, required: true }, // lesson.playground
  lessonId: { type: String, required: true },
  guide: { type: Array, default: () => [] },
})

const progress = useProgressStore()
const pg = ref(null)
const hints = reactive({})
const checking = ref(null)
const checkResults = reactive({})
const checker = useSandbox() // separate run so checks don't disturb the visible output

const lp = computed(() => progress.lessonState(props.lessonId))
const experiments = computed(() => props.spec.experiments ?? [])
const doneCount = computed(() => experiments.value.filter((e) => lp.value?.experiments?.[e.id]).length)

function onRun() {
  progress.recordRun(props.lessonId)
}

// Projects attach tests to the starter playground; passing them counts as finishing the build.
function onTests({ passed }) {
  if (passed) progress.recordExercise(props.lessonId, 'playground-tests', 'tests')
}

async function check(exp) {
  checking.value = exp.id
  const res = await checker.run(pg.value.files, { entry: props.spec.entry, mode: 'test', tests: exp.tests, stdin: props.spec.stdin })
  checking.value = null
  const results = res.results ?? []
  const passed = results.length > 0 && results.every((r) => r.pass)
  checkResults[exp.id] = { passed, results }
  if (passed) progress.recordExperiment(props.lessonId, exp.id, 'tests')
}

function selfDone(exp) {
  progress.recordExperiment(props.lessonId, exp.id, 'self')
}
</script>

<template>
  <div class="lpg">
    <div class="lpg__intro">
      <p v-if="spec.objective" class="lpg__objective"><span class="label">Objective</span> <RichText :value="spec.objective" inline /></p>
    </div>

    <PlaygroundEditor
      ref="pg"
      :files="spec.files"
      :entry="spec.entry"
      :title="spec.title"
      :guide="guide"
      :variants="spec.variants ?? []"
      :tests="spec.tests ?? []"
      :stdin="spec.stdin ?? ''"
      @run="onRun"
      @tests="onTests"
    />

    <div v-if="spec.expected" class="lpg__expected">
      <span class="label">What you should see</span>
      <RichText :value="spec.expected" />
    </div>

    <div v-if="experiments.length" class="lpg__exps">
      <div class="spread">
        <h4 class="lpg__exps-title">Guided experiments</h4>
        <span class="label">{{ doneCount }}/{{ experiments.length }} done</span>
      </div>
      <ol class="exps">
        <li v-for="(exp, i) in experiments" :key="exp.id" class="exp" :class="{ 'exp--done': lp?.experiments?.[exp.id] }">
          <span class="exp__icon" aria-hidden="true">
            <CheckCircle2 v-if="lp?.experiments?.[exp.id]" :size="20" />
            <Circle v-else :size="20" />
          </span>
          <div class="exp__body">
            <p class="exp__task"><span class="mono exp__n">{{ i + 1 }}.</span> <RichText :value="exp.task" inline /></p>
            <div class="cluster exp__actions">
              <button v-if="exp.hint" type="button" class="btn btn--sm btn--ghost" :aria-expanded="!!hints[exp.id]" @click="hints[exp.id] = !hints[exp.id]">
                <Lightbulb :size="14" aria-hidden="true" /> {{ hints[exp.id] ? 'Hide hint' : 'Hint' }}
              </button>
              <button v-if="exp.tests?.length" type="button" class="btn btn--sm btn--cobalt" :disabled="checking === exp.id" @click="check(exp)">
                <FlaskConical :size="14" aria-hidden="true" /> {{ checking === exp.id ? 'Checking…' : 'Check my change' }}
              </button>
              <button v-else-if="!lp?.experiments?.[exp.id]" type="button" class="btn btn--sm" @click="selfDone(exp)">I tried it</button>
              <span v-if="lp?.experiments?.[exp.id]" class="label exp__grading">
                {{ lp.experiments[exp.id].grading === 'tests' ? 'checked by tests' : 'self-reported' }}
              </span>
            </div>
            <RichText v-if="hints[exp.id]" class="exp__hint" :value="exp.hint" />
            <div v-if="checkResults[exp.id] && !checkResults[exp.id].passed" class="exp__fail" role="status">
              <p v-for="r in checkResults[exp.id].results.filter((x) => !x.pass)" :key="r.name">
                ✗ {{ r.name }} — <span class="mono">{{ r.error }}</span>
              </p>
            </div>
            <RichText v-if="exp.explain && lp?.experiments?.[exp.id]" class="exp__explain" :value="exp.explain" />
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.lpg {
  display: grid;
  gap: var(--s-5);
}
.lpg > * {
  min-width: 0; /* grid items: let long code lines scroll inside their panel instead of widening the page */
}
.lpg__objective {
  margin: 0;
  font-size: 1.05rem;
}
.lpg__objective .label {
  background: var(--text);
  color: var(--bg);
  padding: 2px 6px;
  margin-right: 6px;
}
.lpg__expected {
  border: var(--border);
  border-style: dashed;
  padding: var(--s-3) var(--s-4);
  background: var(--surface);
}
.lpg__expected :deep(p:last-child) {
  margin-bottom: 0;
}
.lpg__exps {
  border: var(--border);
  background: var(--note);
  padding: var(--s-4) var(--s-5);
}
.lpg__exps-title {
  margin: 0;
}
.exps {
  list-style: none;
  margin: var(--s-4) 0 0;
  padding: 0;
  display: grid;
  gap: var(--s-3);
}
.exp {
  display: flex;
  gap: var(--s-3);
  padding: var(--s-3);
  border: var(--border-thin);
  background: var(--surface);
}
.exp + .exp {
  margin-top: 0;
}
.exp--done {
  background: var(--note-green);
}
.exp--done .exp__icon {
  color: var(--green);
}
.exp__icon {
  flex: none;
  margin-top: 2px;
}
.exp__body {
  flex: 1;
  min-width: 0;
}
.exp__task {
  margin: 0 0 var(--s-2);
}
.exp__n {
  font-weight: 800;
}
.exp__hint,
.exp__explain {
  margin-top: var(--s-2);
  padding: var(--s-2) var(--s-3);
  border-left: 4px solid var(--kraft-dark);
  background: var(--note-yellow);
  font-size: 0.95rem;
}
.exp__explain {
  border-left-color: var(--green);
  background: var(--surface);
}
.exp__fail {
  margin-top: var(--s-2);
  color: var(--red-text);
  font-size: 0.9rem;
}
.exp__fail p {
  margin: 0;
}
.exp__grading {
  color: var(--muted);
}
</style>
