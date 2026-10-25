<script setup>
// Performance lab: real measurements, taken by CPython in the learner's own
// browser. Each demo is Python code that times itself and prints JSON; this
// component only draws what the interpreter reports — no canned numbers.
import { computed, ref, shallowRef } from 'vue'
import { Gauge } from 'lucide-vue-next'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { PERFORMANCE_DEMOS } from './performanceDemos.js'
import { runPython, runtime } from '../../services/python/client.js'

const props = defineProps({
  demo: { type: String, default: 'membership' },
})

const def = PERFORMANCE_DEMOS[props.demo] ?? PERFORMANCE_DEMOS.membership
const rows = shallowRef(null)
const busy = ref(false)
const error = ref('')
const showCode = ref(false)
const runs = ref(0)

async function measure() {
  busy.value = true
  error.value = ''
  const { promise } = runPython({ mode: 'app', files: { 'main.py': def.code }, interactive: false }, { limit: 30_000 })
  const res = await promise
  busy.value = false
  const line = (res.stdout ?? '').trim().split('\n').reverse().find((l) => l.startsWith('['))
  if (res.status !== 'ok' || !line) {
    error.value = res.status === 'timeout' ? 'The measurement took too long on this device.' : res.error ?? 'The measurement failed.'
    return
  }
  rows.value = JSON.parse(line)
  runs.value++
}

const max = computed(() => {
  if (!rows.value) return 1
  return Math.max(...rows.value.flatMap((r) => def.series.map((s) => r[s.key])), 1e-9)
})
const fmt = (v) => (v >= 100 ? Math.round(v).toLocaleString() : v >= 1 ? v.toFixed(1) : v.toPrecision(2))
const ratio = (r) => {
  const [a, b] = def.series.map((s) => r[s.key])
  if (!a || !b) return ''
  const k = Math.max(a, b) / Math.min(a, b)
  return k >= 1.5 ? `≈ ${k >= 100 ? Math.round(k).toLocaleString() : k.toFixed(k >= 10 ? 0 : 1)}× difference` : 'about the same'
}
</script>

<template>
  <div class="pl">
    <div class="pl__head">
      <div>
        <p class="pl__title"><RichText :value="def.title" inline /></p>
        <p class="pl__q">{{ def.question }}</p>
      </div>
      <div class="cluster">
        <button type="button" class="btn btn--sm" :aria-pressed="showCode" @click="showCode = !showCode">{{ showCode ? 'Hide' : 'Show' }} the benchmark code</button>
        <button type="button" class="btn btn--sm btn--acid" :disabled="busy" @click="measure">
          <Gauge :size="14" aria-hidden="true" /> {{ busy ? 'Measuring…' : runs ? 'Measure again' : 'Run the measurement' }}
        </button>
      </div>
    </div>
    <CodeBlock v-if="showCode" :code="def.code" lang="python" title="benchmark.py" />

    <p v-if="error" class="status status--err" role="alert">{{ error }}</p>
    <p v-else-if="!rows && !busy" class="pl__hint hand">Press “Run the measurement” — your browser runs the Python above and we chart what it measures.</p>
    <p v-else-if="busy && !rows" class="pl__hint mono" role="status">{{ runtime.phase === 'ready' ? 'measuring…' : 'starting Python…' }}</p>

    <div v-if="rows" class="pl__chart" role="table" :aria-label="`${def.question} Results in ${def.unit}`">
      <div v-for="r in rows" :key="r.n" class="pl__group" role="rowgroup">
        <p class="pl__n mono" role="rowheader">n = {{ r.n.toLocaleString() }} <span class="pl__ratio">{{ ratio(r) }}</span></p>
        <div v-for="(s, i) in def.series" :key="s.key" class="pl__row" role="row">
          <span class="pl__label mono" role="cell">{{ s.label }}</span>
          <span class="pl__track" role="cell" :aria-label="`${fmt(r[s.key])} ${def.unit}`">
            <span class="pl__bar" :class="`pl__bar--${i}`" :style="{ width: Math.max(0.6, (r[s.key] / max) * 100) + '%' }" />
            <span class="pl__val mono">{{ fmt(r[s.key]) }}</span>
          </span>
        </div>
        <p v-if="def.extra" class="pl__extra mono">
          <span v-for="x in def.extra" :key="x.key">{{ x.label }}: {{ fmt(r[x.key]) }}</span>
        </p>
      </div>
      <p class="pl__unit mono">unit: {{ def.unit }} · measured just now by CPython {{ runtime.python }} (WebAssembly) on this device. Absolute numbers vary by machine; the shape is what matters.</p>
    </div>
    <div class="pl__explain">
      <RichText :value="def.explain" />
    </div>
  </div>
</template>

<style scoped>
.pl {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.pl__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--s-3);
}
.pl__title {
  margin: 0;
  font-weight: 800;
}
.pl__q {
  margin: 2px 0 0;
  color: var(--text-soft);
}
.pl__hint {
  margin: 0;
  font-size: 1.1rem;
  color: var(--muted);
}
.pl__chart {
  display: grid;
  gap: var(--s-3);
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
}
.pl__group {
  display: grid;
  gap: 4px;
}
.pl__n {
  margin: 0;
  font-weight: 800;
  font-size: 0.8rem;
}
.pl__ratio {
  margin-left: var(--s-2);
  font-weight: 700;
  color: var(--cobalt-text);
}
.pl__row {
  display: grid;
  grid-template-columns: minmax(120px, 0.6fr) minmax(0, 1fr);
  gap: var(--s-2);
  align-items: center;
}
.pl__label {
  font-size: 0.72rem;
}
.pl__track {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
}
.pl__bar {
  display: block;
  height: 16px;
  border: 2px solid var(--line);
  background: var(--accent);
  transition: width var(--med) var(--snap);
}
.pl__bar--1 {
  background: var(--acid);
}
.pl__bar--2 {
  background: var(--surface-2);
}
.pl__val {
  font-size: 0.72rem;
  white-space: nowrap;
}
.pl__extra {
  margin: 0;
  display: flex;
  gap: var(--s-3);
  font-size: 0.7rem;
  color: var(--muted);
}
.pl__unit {
  margin: 0;
  font-size: 0.68rem;
  color: var(--muted);
}
.pl__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
}
.pl__explain :deep(p:last-child) {
  margin-bottom: 0;
}
@container (max-width: 560px) {
  .pl__row {
    grid-template-columns: 1fr;
  }
}
</style>
