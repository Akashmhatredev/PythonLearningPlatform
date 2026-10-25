<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { visualizers } from '../content/visualizers.js'
import { contentIndex } from '../content/index.js'
import VisualizerHost from '../components/diagrams/VisualizerHost.vue'

const route = useRoute()
const router = useRouter()

// Demo data for the data-driven visualizers.
const DEMO_PROPS = {
  'code-tracer': {
    code: `def make_counter():
    count = 0

    def increment():
        nonlocal count
        count += 1
        return count

    return increment

tick = make_counter()
tick()
tick()
print(tick())
`,
    notes: {
      9: 'The inner function is returned — and it keeps a reference to `count` in its **closure**.',
      13: 'Each call finds `count` through the closure cell and updates it with `nonlocal`.',
    },
  },
  'concept-diagram': {
    nodes: [
      { id: 'src', label: 'main.py', note: 'your source code', tone: 'yellow' },
      { id: 'compile', label: 'Compiler', note: 'parse → AST → bytecode' },
      { id: 'pyc', label: 'Bytecode', note: 'cached in __pycache__/' },
      { id: 'vm', label: 'Interpreter loop', note: 'runs one instruction at a time', tone: 'blue' },
    ],
    edges: [
      { from: 'src', to: 'compile', label: 'read' },
      { from: 'compile', to: 'pyc' },
      { from: 'pyc', to: 'vm', label: 'execute' },
    ],
    steps: [
      { focus: ['src'], text: 'A **concept diagram** is defined entirely by lesson data: nodes, arrows and steps.' },
      { focus: ['compile'], edges: ['src->compile'], text: 'CPython first compiles your source code…' },
      { focus: ['pyc'], edges: ['compile->pyc'], text: '…into bytecode, a compact list of instructions (see the bytecode lesson).' },
      { focus: ['vm'], edges: ['pyc->vm'], text: 'The interpreter loop executes that bytecode. Auto-layout reflows into a column on phones.' },
    ],
  },
  comparison: {
    left: { label: 'Building a list in a loop', lang: 'python', code: 'squares = []\nfor n in range(10):\n    if n % 2 == 0:\n        squares.append(n * n)' },
    right: { label: 'List comprehension', lang: 'python', code: 'squares = [n * n for n in range(10) if n % 2 == 0]' },
    points: ['Both build the same list: [0, 4, 16, 36, 64].', 'The comprehension says what the list contains in one expression.', 'Use the loop when the body needs several statements or side effects.'],
  },
}

const types = Object.keys(visualizers)
const active = computed(() => (types.includes(route.query.v) ? route.query.v : 'code-tracer'))
const def = computed(() => visualizers[active.value])
const enumProp = computed(() => Object.entries(def.value.props).find(([, v]) => Array.isArray(v)))
const presetValue = computed(() => {
  const [name, values] = enumProp.value ?? []
  if (!name) return null
  return values.includes(route.query.p) ? route.query.p : values[0]
})
const hostProps = computed(() => {
  const base = { ...(DEMO_PROPS[active.value] ?? {}) }
  if (enumProp.value) base[enumProp.value[0]] = presetValue.value
  return base
})
const usedIn = computed(() =>
  Object.values(contentIndex.lessons)
    .filter((l) => l.status === 'ready' && l.visuals.includes(active.value))
    .slice(0, 12),
)

function pick(v, p) {
  router.replace({ query: { v, ...(p ? { p } : {}) } })
}
</script>

<template>
  <div class="page vz">
    <header class="page-head">
      <span class="label">visual learning engine</span>
      <h1>Concept visualizers</h1>
      <p class="vz__lead">{{ types.length }} interactive machines that make Python’s invisible work visible — names and objects, the call stack, exceptions, lookups, memory, the event loop and real performance measurements. Lessons embed them with a single line of data.</p>
    </header>

    <div class="vz__grid">
      <nav class="vz__nav" aria-label="Visualizers">
        <button
          v-for="t in types"
          :key="t"
          type="button"
          class="vz__item"
          :aria-current="active === t ? 'true' : undefined"
          @click="pick(t)"
        >
          <span class="vz__item-title">{{ visualizers[t].title }}</span>
          <span class="vz__item-blurb">{{ visualizers[t].blurb }}</span>
        </button>
      </nav>

      <section class="vz__main" :aria-label="def.title">
        <div v-if="enumProp" class="vz__presets cluster">
          <span class="label">{{ enumProp[0] }}:</span>
          <button v-for="p in enumProp[1]" :key="p" type="button" class="btn btn--sm mono" :aria-pressed="presetValue === p" @click="pick(active, p)">{{ p }}</button>
        </div>
        <VisualizerHost :key="active + presetValue" :type="active" :props="hostProps" :title="def.title" :caption="def.blurb" />
        <div v-if="usedIn.length" class="vz__used">
          <p class="label">used in these lessons</p>
          <div class="cluster">
            <RouterLink v-for="l in usedIn" :key="l.id" :to="l.path" class="chip">{{ l.title }}</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.vz__lead {
  max-width: 60ch;
  font-size: var(--step-1);
  color: var(--text-soft);
}
.vz__grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: var(--s-6);
  align-items: start;
}
.vz__nav {
  display: grid;
  border: var(--border);
  background: var(--surface);
  position: sticky;
  top: calc(var(--header-h) + 16px);
  max-height: calc(100vh - var(--header-h) - 32px);
  overflow-y: auto;
}
.vz__item {
  display: grid;
  gap: 2px;
  text-align: left;
  padding: var(--s-3);
  border: 0;
  border-bottom: var(--border-thin);
  background: none;
  color: var(--text);
}
.vz__item:last-child {
  border-bottom: 0;
}
.vz__item:hover {
  background: var(--surface-2);
}
.vz__item[aria-current='true'] {
  background: var(--acid);
  color: var(--acid-ink);
}
.vz__item-title {
  font-weight: 800;
}
.vz__item-blurb {
  font-size: 0.8rem;
  opacity: 0.8;
}
.vz__main {
  min-width: 0;
}
.vz__presets .btn {
  text-transform: none;
  letter-spacing: 0;
}
.vz__used a.chip {
  text-decoration: none;
}
@media (max-width: 1000px) {
  .vz__grid {
    grid-template-columns: 1fr;
  }
  .vz__nav {
    position: static;
    max-height: 260px;
  }
}
</style>
