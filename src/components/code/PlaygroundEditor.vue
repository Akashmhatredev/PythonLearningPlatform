<script setup>
// The interactive Python playground: edit real .py files and run them with
// CPython 3.14 (Pyodide) in a Web Worker shared by the whole page. Used by
// lessons, exercises, interview coding questions and the /playground page.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { Check, ChevronLeft, ChevronRight, Copy, FilePlus2, FlaskConical, Footprints, Info, Play, RotateCcw, Square, X } from 'lucide-vue-next'
import CodeEditor from './CodeEditor.vue'
import ConsolePanel from './ConsolePanel.vue'
import StateInspector from './StateInspector.vue'
import TestResults from './TestResults.vue'
import TabsBar from '../ui/TabsBar.vue'
import RichText from '../learning/RichText.vue'
import { useSandbox } from '../../composables/useSandbox.js'
import { useCopy } from '../../composables/useCopy.js'
import { runtime, supportsLiveInput, warmPython } from '../../services/python/client.js'

const props = defineProps({
  files: { type: Object, required: true }, // { 'main.py': '...' }
  entry: { type: String, default: undefined },
  title: { type: String, default: 'Playground' },
  tests: { type: Array, default: () => [] }, // [{ name, code, stdin? }] — Python test code
  guide: { type: Array, default: () => [] }, // [{ file?, lines: [..], text }]
  variants: { type: Array, default: () => [] }, // [{ id, label, files }] alternative examples/solutions
  stdin: { type: String, default: '' }, // lines pre-typed into the Input tab
  autorun: { type: Boolean, default: true }, // run once when scrolled into view (not counted as a learner run)
  height: { type: String, default: '420px' },
})
const emit = defineEmits(['run', 'tests', 'change'])

const uid = useId()
const sandbox = useSandbox()
const { status, logs, state, testResults, inputPrompt } = sandbox
const { copy, copied } = useCopy()

const original = shallowRef(structuredClone({ ...props.files }))
const current = ref(structuredClone({ ...props.files }))
const fileNames = computed(() => Object.keys(current.value))
const entryName = computed(() => {
  if (props.entry && current.value[props.entry] !== undefined) return props.entry
  if (current.value['main.py'] !== undefined) return 'main.py'
  return fileNames.value.find((n) => n.endsWith('.py')) ?? fileNames.value[0]
})
const activeFile = ref(entryName.value)
// The lesson's own files are always one of the choices, so learners can get back to them.
const sameFiles = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const variantOptions = computed(() => {
  if (!props.variants.length) return []
  const hasDefault = props.variants.some((v) => sameFiles(v.files, props.files))
  return hasDefault ? props.variants : [{ id: '__lesson', label: 'Lesson example', files: props.files }, ...props.variants]
})
const variantId = ref(variantOptions.value.find((v) => sameFiles(v.files, props.files))?.id ?? null)
const newFileName = ref(null)
const newFileError = ref('')
const bottomTab = ref('vars')
const stdinText = ref(props.stdin)
const guideOn = ref(false)
const guideStep = ref(0)
const root = ref(null)
const hasRun = ref(false)
const showLimits = ref(false)

const isDirty = computed(() => JSON.stringify(current.value) !== JSON.stringify(original.value))
const busy = computed(() => ['loading', 'running', 'waiting', 'testing'].includes(status.value))
const langOf = (name) => (name.endsWith('.py') ? 'python' : name.endsWith('.json') ? 'json' : 'text')
const stdinLines = computed(() => (stdinText.value ? stdinText.value.replace(/\n$/, '').split('\n').length : 0))

const bottomTabs = computed(() => [
  { id: 'vars', label: 'Variables' },
  { id: 'stdin', label: 'Input', badge: stdinLines.value || null },
  ...(props.tests.length ? [{ id: 'tests', label: 'Tests', badge: testResults.value ? `${testResults.value.filter((r) => r.pass).length}/${testResults.value.length}` : null }] : []),
])

const STATUS = {
  idle: 'not run yet',
  loading: 'starting Python…',
  running: 'running…',
  waiting: 'waiting for input',
  testing: 'testing…',
  done: 'finished',
  stopped: 'stopped',
  error: 'error',
}
const runtimeLabel = computed(() => (runtime.value.python ? `Python ${runtime.value.python}` : 'Python 3 · Pyodide'))

const currentGuide = computed(() => (guideOn.value ? props.guide[guideStep.value] : null))
// Guide steps use `lines: [start, end]` (or `[line]` for a single line).
const guidedLines = computed(() => {
  const g = currentGuide.value
  if (!g || (g.file && g.file !== activeFile.value)) return []
  const [a, b = a] = g.lines
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)
})
watch(currentGuide, (g) => {
  if (g?.file && current.value[g.file] !== undefined) activeFile.value = g.file
})

async function run({ learner = true } = {}) {
  hasRun.value = true
  if (bottomTab.value === 'tests') bottomTab.value = 'vars'
  const res = await sandbox.run(current.value, { entry: entryName.value, stdin: stdinText.value })
  if (learner && !res.superseded && !res.cancelled) emit('run', res)
  return res
}

async function runTests() {
  if (!props.tests.length) return null
  hasRun.value = true
  bottomTab.value = 'tests'
  const res = await sandbox.run(current.value, { entry: entryName.value, mode: 'test', tests: props.tests, stdin: stdinText.value })
  if (res.superseded || res.cancelled) return null
  const results = res.results ?? []
  emit('tests', { results, passed: results.length > 0 && results.every((r) => r.pass), files: current.value })
  return results
}

function reset() {
  current.value = structuredClone(original.value)
  stdinText.value = props.stdin
  if (!current.value[activeFile.value]) activeFile.value = entryName.value
  testResults.value = null
  run({ learner: false })
}

function loadFiles(files, { asOriginal = false } = {}) {
  current.value = structuredClone(files)
  if (asOriginal) original.value = structuredClone(files)
  if (!current.value[activeFile.value]) activeFile.value = entryName.value
  run({ learner: false })
}

function chooseVariant(id) {
  const v = variantOptions.value.find((x) => x.id === id)
  if (!v) return
  variantId.value = id
  loadFiles(v.files, { asOriginal: true })
}

const STARTERS = {
  py: (name) => `"""${name}"""\n\n\ndef hello():\n    return "Hello from ${name.replace(/\.py$/, '')}"\n`,
  txt: () => '',
  csv: () => 'name,value\n',
  json: () => '{}\n',
  md: () => '',
  toml: () => '',
}

function startNewFile() {
  newFileName.value = ''
  newFileError.value = ''
}

function addFile() {
  const name = (newFileName.value ?? '').trim()
  if (!/^[\w-]+(\/[\w-]+)*\.(py|txt|csv|json|md|toml)$/.test(name)) {
    newFileError.value = 'Use a name like helpers.py, data.csv or notes.txt'
    return
  }
  if (current.value[name] !== undefined) {
    newFileError.value = `${name} already exists`
    return
  }
  const ext = name.split('.').pop()
  current.value = { ...current.value, [name]: STARTERS[ext](name.replace(/.*\//, '')) }
  activeFile.value = name
  newFileName.value = null
}

function removeFile(name) {
  const next = { ...current.value }
  delete next[name]
  current.value = next
  if (activeFile.value === name) activeFile.value = entryName.value
}

watch(current, (v) => emit('change', v), { deep: true })

// Autorun when the playground first scrolls into view, so the output is never empty.
// Programs that call input() wait for an answer — those are left for the learner to start.
const readsInput = computed(() => Object.values(current.value).some((src) => /\binput\s*\(/.test(src)) && !stdinText.value)
let observer = null
onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return props.autorun && !readsInput.value && run({ learner: false })
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect()
        observer = null
        warmPython()
        if (props.autorun && !hasRun.value && !readsInput.value) run({ learner: false })
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

defineExpose({ run, runTests, reset, loadFiles, files: current })
</script>

<template>
  <section ref="root" class="pg" :aria-label="title">
    <div class="pg__toolbar">
      <div class="pg__title">
        <span class="label">{{ title }}</span>
        <span v-if="isDirty" class="chip chip--acid pg__edited">edited</span>
      </div>
      <div class="pg__actions">
        <label v-if="variantOptions.length > 1" class="pg__variant">
          <span class="visually-hidden">Choose example version</span>
          <select class="select" :value="variantId" @change="chooseVariant($event.target.value)">
            <option v-for="v in variantOptions" :key="v.id" :value="v.id">{{ v.label }}</option>
          </select>
        </label>
        <button v-if="guide.length" type="button" class="btn btn--sm" :aria-pressed="guideOn" @click="guideOn = !guideOn">
          <Footprints :size="14" aria-hidden="true" /> Guide
        </button>
        <button type="button" class="btn btn--sm" :aria-label="copied ? 'Copied' : `Copy ${activeFile}`" @click="copy(current[activeFile])">
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
          <span class="pg__btntext">{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
        <button type="button" class="btn btn--sm" :disabled="busy" @click="reset">
          <RotateCcw :size="14" aria-hidden="true" /> <span class="pg__btntext">Reset</span>
        </button>
        <button v-if="tests.length" type="button" class="btn btn--sm btn--cobalt" :disabled="busy" @click="runTests">
          <FlaskConical :size="14" aria-hidden="true" /> Run tests
        </button>
        <button v-if="busy" type="button" class="btn btn--sm btn--ink" title="Stop the running program" @click="sandbox.stop()">
          <Square :size="14" aria-hidden="true" /> Stop
        </button>
        <button v-else type="button" class="btn btn--sm btn--acid" title="Run (Ctrl/Cmd + Enter)" @click="run()">
          <Play :size="14" aria-hidden="true" /> Run
        </button>
      </div>
    </div>

    <div v-if="currentGuide" class="pg__guide" role="region" aria-label="Guided walkthrough" aria-live="polite">
      <span class="pg__guide-step mono">step {{ guideStep + 1 }}/{{ guide.length }}</span>
      <RichText class="pg__guide-text" :value="currentGuide.text" />
      <div class="pg__guide-nav">
        <button type="button" class="btn btn--sm btn--icon" :disabled="guideStep === 0" aria-label="Previous step" @click="guideStep--">
          <ChevronLeft :size="16" aria-hidden="true" />
        </button>
        <button type="button" class="btn btn--sm btn--icon" :disabled="guideStep === guide.length - 1" aria-label="Next step" @click="guideStep++">
          <ChevronRight :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="pg__body" :style="{ '--pg-h': height }">
      <div class="pg__editor code-panel">
        <div class="code-panel__bar pg__files">
          <div class="pg__filetabs" role="tablist" aria-label="Files">
            <span v-for="name in fileNames" :key="name" class="pg__filetab-wrap" :class="{ 'is-active': activeFile === name }">
              <button
                :id="`${uid}-file-${name}`"
                type="button"
                role="tab"
                class="pg__filetab"
                :aria-selected="activeFile === name"
                @click="activeFile = name"
              >
                {{ name }}
              </button>
              <button
                v-if="name !== entryName && fileNames.length > 1"
                type="button"
                class="pg__filex"
                :aria-label="`Delete ${name}`"
                title="Delete file (Reset restores the original files)"
                @click="removeFile(name)"
              >
                <X :size="12" aria-hidden="true" />
              </button>
            </span>
          </div>
          <form v-if="newFileName !== null" class="pg__newfile" @submit.prevent="addFile">
            <label class="visually-hidden" :for="`${uid}-newfile`">New file name</label>
            <input
              :id="`${uid}-newfile`"
              v-model="newFileName"
              class="pg__newfile-input"
              placeholder="helpers.py"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="!!newFileError"
              :aria-describedby="newFileError ? `${uid}-newfile-err` : undefined"
              @keydown.esc="newFileName = null"
            />
            <button type="submit" class="code-panel__btn">Add</button>
            <span v-if="newFileError" :id="`${uid}-newfile-err`" class="pg__newfile-err" role="alert">{{ newFileError }}</span>
          </form>
          <button v-else type="button" class="code-panel__btn pg__addfile" aria-label="Add a file" title="Add a file" @click="startNewFile">
            <FilePlus2 :size="14" aria-hidden="true" />
          </button>
        </div>
        <div class="pg__editor-area" role="tabpanel" :aria-labelledby="`${uid}-file-${activeFile}`">
          <CodeEditor
            :key="activeFile"
            v-model="current[activeFile]"
            :lang="langOf(activeFile)"
            :label="`${activeFile} — editable code`"
            :guided-lines="guidedLines"
            @run="run()"
          />
        </div>
      </div>

      <div class="pg__right">
        <div class="pg__preview">
          <div class="pg__preview-bar">
            <span class="label">Output</span>
            <span class="pg__runtime mono">{{ runtimeLabel }}</span>
            <button
              type="button"
              class="pg__info"
              :aria-expanded="showLimits"
              :aria-controls="`${uid}-limits`"
              title="What runs here?"
              @click="showLimits = !showLimits"
            >
              <Info :size="14" aria-hidden="true" /><span class="visually-hidden">What runs here?</span>
            </button>
            <span class="pg__status mono" role="status">
              <span class="pg__dot" :class="`is-${status}`" aria-hidden="true" />
              {{ STATUS[status] ?? status }}
            </span>
          </div>
          <div v-if="showLimits" :id="`${uid}-limits`" class="pg__limits">
            <p>
              Real <strong>CPython</strong> compiled to WebAssembly (Pyodide), running in your browser. You get the full
              <strong>standard library</strong>; there is no <code>pip</code>, network access, threads or subprocesses. Files your
              program creates live in memory and reset on every run. Runs stop after 10 seconds.
              <template v-if="!supportsLiveInput"> This page can't pause for live <code>input()</code> — type input lines in the Input tab.</template>
            </p>
          </div>
          <div class="pg__out">
            <ConsolePanel :logs="logs" :input-prompt="inputPrompt" @clear="sandbox.clearLogs()" @input="sandbox.submitInput" />
            <p v-if="status === 'idle' && !logs.length" class="pg__idle hand">press RUN to execute it →</p>
            <p v-else-if="status === 'loading'" class="pg__idle pg__idle--loading mono" role="status">starting Python… (first time only — the interpreter is cached afterwards)</p>
          </div>
        </div>
        <div class="pg__bottom code-panel">
          <div class="code-panel__bar pg__bottom-bar">
            <TabsBar v-model="bottomTab" :tabs="bottomTabs" label="Program panels" :id-prefix="`${uid}-out`" />
          </div>
          <div class="pg__bottom-area" role="tabpanel" :id="`${uid}-out-panel-${bottomTab}`" :aria-labelledby="`${uid}-out-tab-${bottomTab}`">
            <StateInspector v-if="bottomTab === 'vars'" :state="state" />
            <div v-else-if="bottomTab === 'stdin'" class="pg__stdin">
              <label :for="`${uid}-stdin`" class="pg__stdin-label">
                Lines typed here are fed to <code>input()</code>, one per call, before {{ supportsLiveInput ? 'the program asks you live' : 'the program runs out of input' }}.
              </label>
              <textarea :id="`${uid}-stdin`" v-model="stdinText" class="pg__stdin-box" rows="4" spellcheck="false" placeholder="Ada&#10;42" />
            </div>
            <TestResults v-else :results="testResults" :running="status === 'testing' || (status === 'loading' && bottomTab === 'tests')" :tests="tests" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg {
  border: var(--border);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}
.pg__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2) var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-bottom: var(--border);
  background: var(--surface-2);
}
.pg__title {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}
.pg__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: center;
}
.pg__variant .select {
  min-height: 34px;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
}
.pg__guide {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3);
  border-bottom: var(--border);
  background: var(--note-yellow);
}
.pg__guide-step {
  font-weight: 800;
  font-size: 0.72rem;
  background: var(--text);
  color: var(--bg);
  padding: 2px 6px;
}
.pg__guide-text :deep(p) {
  margin: 0;
}
.pg__guide-nav {
  display: flex;
  gap: var(--s-2);
}
.pg__body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  height: var(--pg-h);
  min-height: 360px;
}
.pg__editor {
  border: 0;
  border-right: var(--border);
  box-shadow: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pg__files {
  padding: 0;
}
.pg__filetabs {
  display: flex;
  overflow-x: auto;
}
.pg__files {
  flex-wrap: wrap;
}
.pg__filetab-wrap {
  display: inline-flex;
  align-items: stretch;
  border-right: 2px solid var(--code-line);
}
.pg__filetab-wrap.is-active {
  background: var(--code-bg);
  box-shadow: inset 0 3px 0 var(--acid);
}
.pg__filex {
  border: 0;
  background: transparent;
  color: var(--code-muted);
  padding: 0 6px 0 0;
}
.pg__filex:hover {
  color: var(--red);
}
.pg__addfile {
  margin-left: auto;
}
.pg__newfile {
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-left: auto;
  flex-wrap: wrap;
}
.pg__newfile-input {
  width: 150px;
  border: 0;
  border-left: 2px solid var(--code-line);
  background: var(--code-bg);
  color: var(--acid);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0 8px;
}
.pg__newfile-err {
  flex-basis: 100%;
  padding: 2px 8px;
  font-size: 0.7rem;
  color: #ff9a85;
}
.pg__filetab {
  border: 0;
  background: transparent;
  color: var(--code-muted);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0 0.9em;
  min-height: 40px;
  white-space: nowrap;
}
.pg__filetab[aria-selected='true'] {
  color: var(--acid);
}
.pg__filetab:focus-visible {
  outline: 3px solid var(--acid);
  outline-offset: -3px;
}
.pg__editor-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.pg__right {
  display: grid;
  grid-template-rows: minmax(0, 1.2fr) minmax(0, 1fr);
  min-height: 0;
}
.pg__preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: var(--border);
}
.pg__preview-bar {
  display: flex;
  gap: var(--s-1);
  align-items: center;
  padding: 6px var(--s-3);
  border-bottom: var(--border-thin);
  background: var(--surface);
}
.pg__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--muted);
}
.pg__dot {
  width: 10px;
  height: 10px;
  border: 2px solid var(--line);
  background: var(--surface-2);
}
.pg__dot.is-done {
  background: #39d353;
}
.pg__dot.is-waiting {
  background: var(--cobalt);
}
.pg__dot.is-running,
.pg__dot.is-loading,
.pg__dot.is-testing {
  background: var(--acid);
  animation: blink 0.6s steps(2) infinite;
}
.pg__dot.is-error {
  background: var(--red);
}
@keyframes blink {
  50% {
    opacity: 0.2;
  }
}
.pg__out {
  position: relative;
  flex: 1;
  min-height: 0;
}
.pg__runtime {
  margin-left: var(--s-2);
  font-size: 0.68rem;
  color: var(--muted);
}
.pg__info {
  border: 0;
  background: none;
  color: var(--muted);
  padding: 2px;
  margin-right: auto;
  display: inline-grid;
  place-items: center;
}
.pg__info:hover {
  color: var(--text);
}
.pg__limits {
  padding: var(--s-2) var(--s-3);
  border-bottom: var(--border-thin);
  background: var(--note-blue);
  font-size: 0.85rem;
}
.pg__limits p {
  margin: 0;
}
.pg__stdin {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-3);
  background: var(--code-bg);
  color: var(--code-muted);
  font-size: 0.75rem;
}
.pg__stdin-label code {
  background: var(--code-bg-2);
  border-color: var(--code-line);
  color: var(--code-text);
}
.pg__stdin-box {
  flex: 1;
  min-height: 64px;
  resize: none;
  border: 1.5px solid var(--code-line);
  background: var(--code-bg-2);
  color: var(--acid);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 6px 8px;
}
.pg__stdin-box:focus {
  outline: 2px solid var(--acid);
}
.pg__idle {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 1.3rem;
  color: var(--code-muted);
  pointer-events: none;
}
.pg__idle--loading {
  font-size: 0.78rem;
  padding: var(--s-4);
  text-align: center;
  color: var(--code-muted);
}
.pg__bottom {
  border: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pg__bottom-bar {
  padding: 0;
}
.pg__bottom-area {
  flex: 1;
  min-height: 0;
}

@media (max-width: 900px) {
  .pg__body {
    grid-template-columns: 1fr;
    height: auto;
  }
  .pg__editor {
    border-right: 0;
    border-bottom: var(--border);
    height: 340px;
  }
  .pg__right {
    grid-template-rows: 300px 220px;
  }
  .pg__btntext {
    display: none;
  }
  .pg__guide {
    grid-template-columns: 1fr auto;
  }
  .pg__guide-step {
    grid-column: 1 / -1;
    width: fit-content;
  }
}
</style>
