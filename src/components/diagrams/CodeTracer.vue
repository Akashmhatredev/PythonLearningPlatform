<script setup>
// Real Python, one step at a time. The code runs in the page's shared CPython
// runtime under sys.settrace (harness.py, mode 'trace'): every step records the
// call stack, each frame's variables and the objects they refer to. Nothing here
// is scripted — edit the code and the trace is recorded again.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { Pencil, Play, X } from 'lucide-vue-next'
import AnimationControls from './AnimationControls.vue'
import CodeEditor from '../code/CodeEditor.vue'
import RichText from '../learning/RichText.vue'
import StateBlock from '../ui/StateBlock.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'
import { highlightLines } from '../../services/highlight.js'
import { runPython, runtime } from '../../services/python/client.js'

const props = defineProps({
  code: { type: String, required: true },
  inline: { type: Boolean, default: true }, // draw numbers/strings inside the variable box
  notes: { type: Object, default: () => ({}) }, // { lineNumber: markdown shown after that line runs }
  stdin: { type: String, default: '' },
  editable: { type: Boolean, default: true },
  maxSteps: { type: Number, default: 300 },
  expectError: { type: Boolean, default: false },
})

const uid = useId()
const tidy = (s) => s.replace(/\s+$/, '') + '\n'
const source = ref(tidy(props.code))
const draft = ref(source.value)
const editing = ref(false)
const trace = shallowRef(null)
const loading = ref(false)
const failure = ref('')
const root = ref(null)
const stage = ref(null)
const arrows = shallowRef([])
const svgSize = ref({ w: 0, h: 0 })
const lines = shallowRef([])

const steps = computed(() => trace.value?.steps ?? [])
const player = useStepPlayer(steps, { interval: 1500 })
const step = computed(() => player.frame.value)
const prev = computed(() => (player.index.value > 0 ? steps.value[player.index.value - 1] : null))

async function record(code) {
  loading.value = true
  failure.value = ''
  const { promise } = runPython({ mode: 'trace', files: { 'main.py': code }, inline: props.inline, stdin: props.stdin, maxSteps: props.maxSteps })
  const res = await promise
  loading.value = false
  if (res.status === 'cancelled') return
  if (!res.steps?.length) {
    failure.value = res.stderr || res.error || 'The code could not be traced.'
    trace.value = null
    return
  }
  trace.value = res
}

async function paint(code) {
  const hl = await highlightLines(code.replace(/\n$/, ''), 'python')
  lines.value = hl
}

function visualize() {
  source.value = tidy(draft.value)
  editing.value = false
  paint(source.value)
  record(source.value)
}

function cancelEdit() {
  draft.value = source.value
  editing.value = false
}

// ------------------------------------------------------------- derived view
const justRan = computed(() => (prev.value && ['line', 'call'].includes(prev.value.e) ? prev.value.line : null))
const nextLine = computed(() => (step.value && !['end', 'crash'].includes(step.value.e) ? step.value.line : null))
const note = computed(() => (justRan.value && props.notes ? props.notes[justRan.value] ?? props.notes[String(justRan.value)] : null))
const output = computed(() => (trace.value?.stdout ?? '').slice(0, step.value?.o ?? 0))
const topFrame = computed(() => step.value?.stack?.[step.value.stack.length - 1] ?? null)
const heapList = computed(() => {
  const heap = step.value?.heap ?? {}
  return Object.keys(heap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((id) => ({ id, ...heap[id] }))
})

// Variables whose binding changed since the previous step get a highlight.
const changed = computed(() => {
  const set = new Set()
  if (!prev.value || !step.value) return set
  const before = new Map()
  for (const f of prev.value.stack ?? []) for (const [n, r] of f.vars) before.set(`${f.id}:${n}`, JSON.stringify(r))
  for (const f of step.value.stack ?? []) {
    for (const [n, r] of f.vars) {
      const key = `${f.id}:${n}`
      if (before.get(key) !== JSON.stringify(r)) set.add(key)
    }
  }
  return set
})

const srcLines = computed(() => source.value.split('\n'))
function fmt(r) {
  if (!r) return 'None'
  if (r.r) {
    const o = step.value?.heap?.[r.r]
    return o ? `${kindLabel(o)} #${r.r}` : `object #${r.r}`
  }
  return r.v
}
function kindLabel(o) {
  if (o.k === 'func') return 'function'
  if (o.k === 'class') return `class ${o.name}`
  if (o.k === 'obj') return `${o.type} object`
  return o.type
}
const description = computed(() => {
  const s = step.value
  if (!s) return ''
  const top = topFrame.value
  const inside = top && top.kind !== 'module' ? ` inside \`${top.name}()\`` : ''
  switch (s.e) {
    case 'call':
      if (top?.kind === 'class') return `Python runs the body of **class ${top.name}**: every name it defines becomes a class attribute.`
      if (top?.kind === 'gen') return `\`${top.name}()\` resumes (or starts): its frame goes back on the stack.`
      return `Call \`${top?.name}()\` — a new **frame** is pushed onto the call stack for its local variables.`
    case 'line':
      return `Line ${s.line}${inside} is about to run.`
    case 'return':
      if (s.yield) return `\`${top?.name}()\` **pauses** and yields \`${fmt(s.ret)}\`. Its local variables are kept for later.`
      if (top?.kind === 'class') return `The body of class ${top.name} is done. Python builds the class object and binds the name \`${top.name}\` to it.`
      return `\`${top?.name}()\` returns \`${fmt(s.ret)}\` and its frame is popped off the stack.`
    case 'exception':
      return `**${s.exc}** is raised${inside}. Python looks for a matching \`except\`, frame by frame.`
    case 'end':
      return 'The program finished. These are the global names that are left.'
    case 'crash':
      return `The program crashed: **${s.exc}** was never caught.`
    default:
      return ''
  }
})

// ------------------------------------------------------------------ arrows
let raf = 0
function drawArrows() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const host = stage.value
    if (!host) return
    const box = host.getBoundingClientRect()
    svgSize.value = { w: host.scrollWidth, h: host.scrollHeight }
    const out = []
    for (const el of host.querySelectorAll('[data-to]')) {
      const target = host.querySelector(`[data-obj="${el.dataset.to}"]`)
      if (!target) continue
      const a = el.getBoundingClientRect()
      const b = target.getBoundingClientRect()
      const x1 = a.left + a.width / 2 - box.left
      const y1 = a.top + a.height / 2 - box.top
      const ty = b.top + Math.min(16, b.height / 2) - box.top
      let d
      if (b.left - box.left > x1 + 12) {
        const x2 = b.left - box.left - 2
        const dx = Math.max(30, (x2 - x1) / 2)
        d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${ty}, ${x2} ${ty}`
      } else {
        // target is left of / below the pointer: loop around the right edge
        const x2 = b.right - box.left + 2
        const bulge = Math.max(x1, x2) + 46
        d = `M ${x1} ${y1} C ${bulge} ${y1}, ${bulge} ${ty}, ${x2} ${ty}`
      }
      out.push({ key: `${el.dataset.from}->${el.dataset.to}`, d, hot: el.dataset.hot === '1' })
    }
    arrows.value = out
  })
}

watch([step, editing], async () => {
  await nextTick()
  drawArrows()
})

let observer = null
let resize = null
onMounted(() => {
  paint(source.value)
  const start = () => !trace.value && !loading.value && record(source.value)
  if (typeof IntersectionObserver === 'undefined') start()
  else {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect()
        observer = null
        start()
      }
    }, { rootMargin: '200px' })
    observer.observe(root.value)
  }
  if (typeof ResizeObserver !== 'undefined') {
    resize = new ResizeObserver(() => drawArrows())
    resize.observe(root.value)
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  resize?.disconnect()
  cancelAnimationFrame(raf)
})

const isTop = (f) => topFrame.value && f.id === topFrame.value.id
const status = computed(() => {
  if (loading.value) return runtime.value.phase === 'ready' ? 'recording steps…' : 'starting Python…'
  if (!trace.value) return ''
  const n = steps.value.length
  if (trace.value.status === 'truncated') return `${n} steps (stopped at the step limit)`
  return `${n} steps · recorded by CPython ${runtime.value.python ?? ''}`.trim()
})
</script>

<template>
  <div ref="root" class="tr">
    <div class="tr__top">
      <div class="tr__code code-panel">
        <div class="code-panel__bar">
          <span class="code-panel__title"><span class="dot" aria-hidden="true" />main.py</span>
          <div v-if="editable" class="tr__codebtns">
            <template v-if="editing">
              <button type="button" class="code-panel__btn" @click="cancelEdit"><X :size="12" aria-hidden="true" /> cancel</button>
              <button type="button" class="code-panel__btn tr__go" @click="visualize"><Play :size="12" aria-hidden="true" /> visualize</button>
            </template>
            <button v-else type="button" class="code-panel__btn" @click="editing = true"><Pencil :size="12" aria-hidden="true" /> edit code</button>
          </div>
        </div>
        <div v-if="editing" class="tr__editor">
          <CodeEditor v-model="draft" lang="python" label="Code to visualize — editable" @run="visualize" />
        </div>
        <ol v-else class="tr__lines mono" :aria-label="`Code, line ${nextLine ?? '–'} runs next`">
          <li
            v-for="(tokens, i) in lines"
            :key="i"
            class="tr__line"
            :class="{ 'is-next': nextLine === i + 1, 'is-ran': justRan === i + 1 && nextLine !== i + 1 }"
          >
            <span class="tr__ln" aria-hidden="true">{{ i + 1 }}</span>
            <span class="tr__mark" aria-hidden="true">{{ nextLine === i + 1 ? '➜' : justRan === i + 1 ? '✓' : '' }}</span>
            <code class="tr__src"><span v-for="(t, j) in tokens" :key="j" :class="t.cls">{{ t.text }}</span></code>
          </li>
        </ol>
      </div>

      <div class="tr__side">
        <div class="tr__explain" aria-live="polite">
          <span class="label">step {{ steps.length ? player.index.value + 1 : 0 }} / {{ steps.length }}</span>
          <RichText v-if="step" :value="description" />
          <RichText v-if="note" class="tr__note" :value="note" />
          <p v-if="!step && !loading && !failure" class="muted">Press play to run the code step by step.</p>
        </div>
        <div class="tr__out code-panel">
          <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" aria-hidden="true" />output</span></div>
          <pre class="tr__stdout">{{ output || ' ' }}</pre>
        </div>
      </div>
    </div>

    <StateBlock v-if="failure" kind="error" title="Couldn't trace this code">
      <pre class="tr__fail">{{ failure }}</pre>
    </StateBlock>
    <p v-else-if="loading && !trace" class="tr__loading mono" role="status">{{ status }}</p>

    <div v-if="step" ref="stage" class="tr__stage">
      <section class="tr__frames" aria-label="Frames (the call stack)">
        <p class="label">frames <span class="muted">· call stack, newest at the bottom</span></p>
        <div v-for="f in step.stack" :key="f.id" class="tr__frame" :class="{ 'is-top': isTop(f) }">
          <p class="tr__fname">
            <strong>{{ f.kind === 'module' ? f.name : f.kind === 'class' ? `class ${f.name} body` : `${f.name}()` }}</strong>
            <span class="mono muted">line {{ f.line }}</span>
          </p>
          <table class="tr__vars">
            <tbody>
              <tr v-for="[name, val] in f.vars" :key="name" :class="{ 'is-changed': changed.has(`${f.id}:${name}`) }">
                <th scope="row" class="mono">{{ name }}</th>
                <td>
                  <span v-if="val.r" class="tr__ptr" :data-from="`${f.id}:${name}`" :data-to="val.r" :data-hot="isTop(f) ? '1' : '0'">
                    <span class="visually-hidden">refers to object #{{ val.r }}</span>
                  </span>
                  <span v-else class="tr__val mono" :class="`tr__val--${val.t}`">{{ val.v }}</span>
                </td>
              </tr>
              <tr v-if="isTop(f) && step.e === 'return'" class="tr__retrow">
                <th scope="row" class="mono">{{ step.yield ? 'yields' : 'returns' }}</th>
                <td>
                  <span v-if="step.ret?.r" class="tr__ptr" :data-from="`${f.id}:ret`" :data-to="step.ret.r" data-hot="1">
                    <span class="visually-hidden">object #{{ step.ret.r }}</span>
                  </span>
                  <span v-else class="tr__val mono">{{ step.ret?.v }}</span>
                </td>
              </tr>
              <tr v-if="!f.vars.length && !(isTop(f) && step.e === 'return')">
                <td colspan="2" class="muted tr__none">no names yet</td>
              </tr>
            </tbody>
          </table>
          <p v-if="isTop(f) && step.exc && step.e === 'exception'" class="tr__exc mono">⚠ {{ step.exc }}</p>
        </div>
        <p v-if="step.e === 'crash'" class="tr__exc mono">✗ uncaught {{ step.exc }}</p>
      </section>

      <section class="tr__heap" aria-label="Objects in memory">
        <p class="label">objects</p>
        <p v-if="!heapList.length" class="muted tr__none">
          {{ inline ? 'Numbers and strings are drawn inside the variable boxes; containers, functions and objects appear here.' : 'No objects yet.' }}
        </p>
        <div v-for="o in heapList" :key="o.id" class="tr__obj" :class="`tr__obj--${o.k}`" :data-obj="o.id">
          <p class="tr__ohead mono">
            <span class="tr__otype">{{ o.k === 'class' ? 'class' : o.k === 'obj' ? `${o.type} object` : o.type }}</span>
            <span class="tr__oid">#{{ o.id }}</span>
          </p>
          <!-- primitives (int, str, float…) when drawn as objects -->
          <p v-if="o.k === 'prim' || o.k === 'other'" class="tr__prim mono">
            {{ o.v }}
            <span v-if="o.self?.r" class="tr__ptr" :data-from="`o${o.id}:self`" :data-to="o.self.r"><span class="visually-hidden">self is object #{{ o.self.r }}</span></span>
          </p>
          <!-- list / tuple / set -->
          <div v-else-if="['list', 'tuple', 'set'].includes(o.k)" class="tr__cells">
            <span v-if="!o.items.length" class="muted mono tr__empty">empty</span>
            <span v-for="(it, i) in o.items" :key="i" class="tr__cell">
              <span v-if="o.k !== 'set'" class="tr__idx mono">{{ o.fields?.[i] ?? i }}</span>
              <span v-if="it.r" class="tr__ptr" :data-from="`o${o.id}:${i}`" :data-to="it.r"><span class="visually-hidden">item {{ i }} refers to object #{{ it.r }}</span></span>
              <span v-else class="tr__val mono" :class="`tr__val--${it.t}`">{{ it.v }}</span>
            </span>
            <span v-if="o.more" class="muted mono tr__more">+{{ o.more }} more</span>
          </div>
          <!-- dict -->
          <table v-else-if="o.k === 'dict'" class="tr__vars tr__dict">
            <tbody>
              <tr v-for="([k, v], i) in o.entries" :key="i">
                <th scope="row" class="mono">
                  <span v-if="k.r" class="tr__ptr" :data-from="`o${o.id}:k${i}`" :data-to="k.r"><span class="visually-hidden">key object #{{ k.r }}</span></span>
                  <template v-else>{{ k.v }}</template>
                </th>
                <td>
                  <span v-if="v.r" class="tr__ptr" :data-from="`o${o.id}:v${i}`" :data-to="v.r"><span class="visually-hidden">value object #{{ v.r }}</span></span>
                  <span v-else class="tr__val mono" :class="`tr__val--${v.t}`">{{ v.v }}</span>
                </td>
              </tr>
              <tr v-if="!o.entries.length"><td class="muted mono tr__empty">empty</td></tr>
              <tr v-if="o.more"><td colspan="2" class="muted mono">+{{ o.more }} more</td></tr>
            </tbody>
          </table>
          <!-- function -->
          <div v-else-if="o.k === 'func'" class="tr__fn">
            <p class="mono tr__sig">def {{ o.sig }}</p>
            <table v-if="o.closure?.length || o.wraps" class="tr__vars">
              <caption class="tr__cap mono">{{ o.closure?.length ? 'closure (remembered names)' : '' }}</caption>
              <tbody>
                <tr v-for="[name, val] in o.closure ?? []" :key="name">
                  <th scope="row" class="mono">{{ name }}</th>
                  <td>
                    <span v-if="val.r" class="tr__ptr" :data-from="`o${o.id}:c:${name}`" :data-to="val.r"><span class="visually-hidden">refers to object #{{ val.r }}</span></span>
                    <span v-else class="tr__val mono" :class="`tr__val--${val.t}`">{{ val.v }}</span>
                  </td>
                </tr>
                <tr v-if="o.wraps">
                  <th scope="row" class="mono">__wrapped__</th>
                  <td>
                    <span v-if="o.wraps.r" class="tr__ptr" :data-from="`o${o.id}:wraps`" :data-to="o.wraps.r"><span class="visually-hidden">wraps object #{{ o.wraps.r }}</span></span>
                    <span v-else class="tr__val mono">{{ o.wraps.v }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- generator / coroutine -->
          <div v-else-if="o.k === 'gen'" class="tr__fn">
            <p class="mono tr__sig">{{ o.name }}() · <strong>{{ o.state }}</strong><template v-if="o.line"> at line {{ o.line }}</template></p>
            <table v-if="o.locals?.length" class="tr__vars">
              <caption class="tr__cap mono">paused locals</caption>
              <tbody>
                <tr v-for="[name, val] in o.locals" :key="name">
                  <th scope="row" class="mono">{{ name }}</th>
                  <td>
                    <span v-if="val.r" class="tr__ptr" :data-from="`o${o.id}:g:${name}`" :data-to="val.r"><span class="visually-hidden">refers to object #{{ val.r }}</span></span>
                    <span v-else class="tr__val mono" :class="`tr__val--${val.t}`">{{ val.v }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- class -->
          <div v-else-if="o.k === 'class'" class="tr__fn">
            <p class="mono tr__sig"><strong>{{ o.name }}</strong><template v-if="o.bases.length">({{ o.bases.join(', ') }})</template></p>
            <p v-if="o.methods.length" class="mono tr__methods">methods: {{ o.methods.join(', ') }}</p>
            <table v-if="o.attrs.length" class="tr__vars">
              <tbody>
                <tr v-for="[name, val] in o.attrs" :key="name">
                  <th scope="row" class="mono">{{ name }}</th>
                  <td>
                    <span v-if="val.r" class="tr__ptr" :data-from="`o${o.id}:a:${name}`" :data-to="val.r"><span class="visually-hidden">refers to object #{{ val.r }}</span></span>
                    <span v-else class="tr__val mono" :class="`tr__val--${val.t}`">{{ val.v }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="o.mro.length > 2" class="mono tr__mro">MRO: {{ o.mro.join(' → ') }}</p>
          </div>
          <!-- instance -->
          <table v-else-if="o.k === 'obj'" class="tr__vars">
            <tbody>
              <tr v-for="[name, val] in o.attrs" :key="name">
                <th scope="row" class="mono">{{ name }}</th>
                <td>
                  <span v-if="val.r" class="tr__ptr" :data-from="`o${o.id}:a:${name}`" :data-to="val.r"><span class="visually-hidden">refers to object #{{ val.r }}</span></span>
                  <span v-else class="tr__val mono" :class="`tr__val--${val.t}`">{{ val.v }}</span>
                </td>
              </tr>
              <tr v-if="!o.attrs.length"><td class="muted mono tr__empty">no attributes</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <svg class="tr__arrows" :width="svgSize.w" :height="svgSize.h" aria-hidden="true">
        <defs>
          <marker :id="`${uid}-tip`" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="tr__tip" />
          </marker>
          <marker :id="`${uid}-tip-hot`" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="tr__tip tr__tip--hot" />
          </marker>
        </defs>
        <path v-for="a in arrows" :key="a.key" :d="a.d" class="tr__arrow" :class="{ 'is-hot': a.hot }" :marker-end="`url(#${uid}-tip${a.hot ? '-hot' : ''})`" />
      </svg>
    </div>

    <div class="tr__foot">
      <AnimationControls v-if="steps.length" :player="player" label="Code tracer" />
      <span class="tr__status mono">{{ status }}</span>
    </div>
    <p v-if="inline && step" class="tr__legend muted">
      Names (left) refer to objects (right). Small numbers and strings are drawn inside the box to keep the picture tidy — in Python they are objects too.
    </p>
  </div>
</template>

<style scoped>
.tr {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.tr__top {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: var(--s-3);
}
.tr__code {
  box-shadow: none;
  min-width: 0;
}
.tr__codebtns {
  display: flex;
  gap: 4px;
}
.tr__go {
  background: var(--acid);
  color: var(--acid-ink);
}
.tr__editor {
  height: 260px;
}
.tr__lines {
  list-style: none;
  margin: 0;
  padding: var(--s-2) 0;
  font-size: 0.8rem;
  line-height: 1.6;
  max-height: 340px;
  overflow: auto;
}
.tr__line {
  display: grid;
  grid-template-columns: 2.4em 1.4em minmax(0, 1fr);
  margin: 0;
  padding-right: var(--s-3);
}
.tr__line + .tr__line {
  margin-top: 0;
}
.tr__line.is-next {
  background: var(--code-highlight);
  box-shadow: inset 4px 0 0 var(--acid);
}
.tr__line.is-ran {
  background: rgba(143, 188, 230, 0.12);
}
.tr__ln {
  text-align: right;
  padding-right: 6px;
  color: var(--code-muted);
  user-select: none;
}
.tr__mark {
  color: var(--acid);
  font-weight: 800;
}
.tr__line.is-ran .tr__mark {
  color: #8fbce6;
}
.tr__src {
  white-space: pre;
  background: none;
  border: 0;
  padding: 0;
  color: var(--code-text);
  font-size: inherit;
}
.tr__side {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--s-3);
  min-width: 0;
}
.tr__explain {
  border: var(--border);
  background: var(--note-yellow);
  padding: var(--s-3);
  min-height: 92px;
}
.tr__explain :deep(p) {
  margin: 4px 0 0;
}
.tr__note {
  margin-top: var(--s-2);
  padding-top: var(--s-2);
  border-top: 2px dashed var(--line);
}
.tr__out {
  box-shadow: none;
  min-height: 90px;
}
.tr__stdout {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--code-text);
  white-space: pre-wrap;
  max-height: 160px;
  overflow: auto;
}
.tr__loading {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}
.tr__fail {
  white-space: pre-wrap;
  font-size: 0.78rem;
  margin: 0;
}
.tr__stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: var(--s-5) clamp(var(--s-6), 6vw, 90px);
  padding: var(--s-3);
  border: var(--border-thin);
  background: var(--surface);
  overflow-x: auto;
}
.tr__frames,
.tr__heap {
  display: grid;
  align-content: start;
  gap: var(--s-3);
  min-width: 0;
  position: relative;
  z-index: 1;
}
.tr__frames .label,
.tr__heap .label {
  margin: 0;
}
.tr__frame {
  border: var(--border-thin);
  background: var(--surface-2);
  padding: var(--s-2);
}
.tr__frame.is-top {
  background: var(--note-blue);
  border-color: var(--cobalt);
  box-shadow: 4px 4px 0 var(--cobalt);
}
.tr__fname {
  display: flex;
  justify-content: space-between;
  gap: var(--s-2);
  margin: 0 0 4px;
  font-size: 0.85rem;
}
.tr__fname .mono {
  font-size: 0.7rem;
}
.tr__vars {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.tr__vars th,
.tr__vars td {
  border: 1.5px solid var(--line);
  padding: 3px 6px;
  text-align: left;
  background: var(--surface);
}
.tr__vars th {
  width: 1%;
  white-space: nowrap;
  font-weight: 700;
}
.tr__vars tr.is-changed th,
.tr__vars tr.is-changed td {
  background: var(--acid);
  color: var(--acid-ink);
}
.tr__retrow th,
.tr__retrow td {
  background: var(--note-yellow);
}
.tr__none,
.tr__empty {
  font-size: 0.75rem;
}
.tr__ptr {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text);
  vertical-align: middle;
}
.tr__val {
  word-break: break-word;
}
.tr__val--str {
  color: var(--green);
}
.tr__val--NoneType,
.tr__val--bool {
  color: var(--cobalt-text);
  font-weight: 700;
}
.tr__exc {
  margin: 6px 0 0;
  padding: 4px 6px;
  border: 2px solid var(--red);
  background: color-mix(in srgb, var(--red) 12%, var(--surface));
  color: var(--red-text);
  font-size: 0.75rem;
  font-weight: 700;
}
.tr__obj {
  border: var(--border-thin);
  background: var(--surface);
  padding: 4px 6px 6px;
  justify-self: start;
  min-width: 90px;
  max-width: 100%;
  box-shadow: 3px 3px 0 var(--shadow-color);
}
.tr__obj--func,
.tr__obj--class {
  background: var(--note-blue);
}
.tr__obj--gen {
  background: var(--note-yellow);
}
.tr__ohead {
  display: flex;
  justify-content: space-between;
  gap: var(--s-3);
  margin: 0 0 4px;
  font-size: 0.68rem;
  font-weight: 700;
}
.tr__oid {
  color: var(--muted);
}
.tr__prim {
  margin: 0;
  font-size: 0.85rem;
  word-break: break-word;
}
.tr__cells {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}
.tr__cell {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 34px;
  padding: 2px 6px 4px;
  border: 1.5px solid var(--line);
  margin: 0 -1.5px -1.5px 0;
  font-size: 0.8rem;
}
.tr__obj--set .tr__cell {
  border-radius: 999px;
  margin: 2px;
}
.tr__obj--tuple .tr__cell {
  background: var(--surface-2);
}
.tr__idx {
  font-size: 0.6rem;
  color: var(--muted);
}
.tr__more {
  align-self: center;
  padding: 0 6px;
  font-size: 0.7rem;
}
.tr__sig {
  margin: 0 0 4px;
  font-size: 0.78rem;
  word-break: break-word;
}
.tr__methods,
.tr__mro {
  margin: 4px 0 0;
  font-size: 0.7rem;
  color: var(--muted);
}
.tr__cap {
  caption-side: top;
  text-align: left;
  font-size: 0.62rem;
  color: var(--muted);
  padding-bottom: 2px;
}
.tr__arrows {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 2;
}
.tr__arrow {
  fill: none;
  stroke: var(--text);
  stroke-width: 2;
  opacity: 0.75;
}
.tr__arrow.is-hot {
  stroke: var(--cobalt-text);
  stroke-width: 2.5;
  opacity: 1;
}
.tr__tip {
  fill: var(--text);
}
.tr__tip--hot {
  fill: var(--cobalt-text);
}
.tr__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-2);
}
.tr__status {
  font-size: 0.7rem;
  color: var(--muted);
}
.tr__legend {
  margin: 0;
  font-size: 0.8rem;
}
@container (max-width: 720px) {
  .tr__top {
    grid-template-columns: 1fr;
  }
  .tr__stage {
    grid-template-columns: minmax(0, 1fr);
    padding-right: 56px;
  }
}
</style>
