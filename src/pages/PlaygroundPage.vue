<script setup>
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { playgroundExamples } from '../content/playground-examples.js'
import { contentIndex, loadLesson } from '../content/index.js'
import { storage } from '../services/storage.js'
import { runtime } from '../services/python/client.js'
import PlaygroundEditor from '../components/code/PlaygroundEditor.vue'
import StateBlock from '../components/ui/StateBlock.vue'

const route = useRoute()
const router = useRouter()
const store = storage()

const lessonsWithPlaygrounds = contentIndex.order.map((id) => contentIndex.lessons[id]).filter((l) => l.status === 'ready' && l.hasPlayground)

const selected = ref(route.query.lesson ? `lesson:${route.query.lesson}` : route.query.example ? `ex:${route.query.example}` : 'ex:hello')
const current = shallowRef(null)
const loading = ref(false)
const error = ref('')
const draft = shallowRef(store.read('playground-draft', null))

async function load(key) {
  error.value = ''
  if (key === 'draft' && draft.value) {
    current.value = { id: 'draft', title: 'Your saved draft', files: draft.value.files, blurb: `Saved ${new Date(draft.value.at).toLocaleString()}` }
    return
  }
  if (key.startsWith('ex:')) {
    const ex = playgroundExamples.find((e) => e.id === key.slice(3)) ?? playgroundExamples[0]
    current.value = { ...ex }
    return
  }
  const id = key.slice(7)
  loading.value = true
  try {
    const lesson = await loadLesson(id)
    if (!lesson?.playground) throw new Error('That lesson has no live example.')
    current.value = {
      id: `lesson-${id}`,
      title: lesson.playground.title,
      blurb: `From the lesson “${lesson.title}”.`,
      files: lesson.playground.files,
      entry: lesson.playground.entry,
      stdin: lesson.playground.stdin,
      variants: lesson.playground.variants,
      lessonPath: contentIndex.lessons[id].path,
    }
  } catch (e) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

watch(
  selected,
  (key) => {
    load(key)
    const query = key.startsWith('lesson:') ? { lesson: key.slice(7) } : key.startsWith('ex:') ? { example: key.slice(3) } : {}
    router.replace({ query })
  },
  { immediate: true },
)

// Per-viewer convenience: keep the latest edits so a refresh doesn't lose work.
let saveTimer = null
function onChange(files) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const value = { files, at: Date.now(), from: current.value?.title }
    store.write('playground-draft', value)
    draft.value = value
  }, 600)
}

const grouped = computed(() => ({
  beginner: playgroundExamples.filter((e) => e.level === 'beginner'),
  intermediate: playgroundExamples.filter((e) => e.level === 'intermediate'),
  advanced: playgroundExamples.filter((e) => e.level === 'advanced'),
}))
</script>

<template>
  <div class="page pgp">
    <header class="pgp__head">
      <div>
        <span class="label">playground</span>
        <h1 class="pgp__title">Write Python. Run it. Break it.</h1>
      </div>
      <p class="pgp__meta mono">{{ runtime.python ? `CPython ${runtime.python}` : 'CPython 3' }} · Pyodide {{ runtime.pyodide }} · runs in your browser, in a Web Worker</p>
    </header>

    <div class="pgp__picker">
      <label class="field">
        <span class="label">example</span>
        <select v-model="selected" class="select">
          <option v-if="draft" value="draft">★ Your saved draft{{ draft.from ? ` (${draft.from})` : '' }}</option>
          <optgroup v-for="(list, level) in grouped" :key="level" :label="`${level} examples`">
            <option v-for="e in list" :key="e.id" :value="`ex:${e.id}`">{{ e.title }}</option>
          </optgroup>
          <optgroup label="Live examples from lessons">
            <option v-for="l in lessonsWithPlaygrounds" :key="l.id" :value="`lesson:${l.id}`">{{ String(l.levelNumber).padStart(2, '0') }} · {{ l.title }}</option>
          </optgroup>
        </select>
      </label>
      <p v-if="current" class="pgp__blurb">
        <strong>{{ current.title }}</strong> — {{ current.blurb }}
        <span v-if="current.variants?.length" class="chip chip--acid">{{ current.variants.length }} versions — use the version menu</span>
        <span v-if="current.guide?.length" class="chip">guided walkthrough available</span>
        <RouterLink v-if="current.lessonPath" :to="current.lessonPath">open the lesson →</RouterLink>
      </p>
    </div>

    <StateBlock v-if="loading" kind="loading" title="Loading example…" />
    <StateBlock v-else-if="error" kind="error" title="Couldn't load that example"><p>{{ error }}</p></StateBlock>
    <PlaygroundEditor
      v-else-if="current"
      :key="current.id"
      :files="current.files"
      :entry="current.entry"
      :stdin="current.stdin ?? ''"
      :title="current.title"
      :variants="current.variants ?? []"
      :guide="current.guide ?? []"
      height="calc(100vh - 300px)"
      @change="onChange"
    />

    <details class="pgp__help">
      <summary class="label">what can the sandbox do?</summary>
      <ul>
        <li>Real <strong>CPython</strong> compiled to WebAssembly (Pyodide), loaded once and reused for every run. Nothing is simulated: the output, tracebacks and variables come from the interpreter.</li>
        <li>The whole <strong>standard library</strong> is available — <code>json</code>, <code>csv</code>, <code>re</code>, <code>sqlite3</code>, <code>asyncio</code>, <code>dataclasses</code>, <code>unittest</code>… Third-party packages (<code>requests</code>, <code>numpy</code>, <code>pytest</code>) are not installed.</li>
        <li><strong>main.py</strong> is the entry point. Add modules (<code>helpers.py</code>) and data files (<code>data.csv</code>, <code>notes.txt</code>) with the + button and open/import them normally. Files live in memory and reset on every run.</li>
        <li><code>input()</code> asks you in the output panel (or reads the lines in the Input tab). There is no network access, and threads or subprocesses can't start.</li>
        <li>Runs stop after 10 seconds — the Stop button ends one sooner. If a program won't stop, the interpreter is restarted.</li>
        <li>Shortcut: <span class="kbd">Ctrl</span>/<span class="kbd">⌘</span> + <span class="kbd">Enter</span> runs the code.</li>
      </ul>
    </details>
  </div>
</template>

<style scoped>
.pgp {
  max-width: none;
  padding-top: var(--s-5);
}
.pgp__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}
.pgp__title {
  font-size: var(--step-3);
  margin: 4px 0 0;
}
.pgp__meta {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}
.pgp__picker {
  display: grid;
  grid-template-columns: minmax(240px, 380px) 1fr;
  gap: var(--s-4);
  align-items: end;
  margin-bottom: var(--s-4);
}
.pgp__blurb {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
}
.pgp__help {
  margin-top: var(--s-5);
  border: var(--border-thin);
  padding: var(--s-3) var(--s-4);
  background: var(--surface);
}
.pgp__help summary {
  cursor: pointer;
}
.pgp__help ul {
  margin: var(--s-3) 0 0;
}
@media (max-width: 800px) {
  .pgp__picker {
    grid-template-columns: 1fr;
  }
}
</style>
