<script setup>
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Box, Bug, CircleHelp, Code2, FolderKanban, Search, Terminal } from 'lucide-vue-next'
import { contentIndex, lessonEntries, loadSearchIndex } from '../../content/index.js'
import { groupResults, searchIndex } from '../../utils/search.js'
import { useProgressStore } from '../../stores/progress.js'
import { useUiStore } from '../../stores/ui.js'
import { useEventListener } from '../../composables/useEventListener.js'

const ui = useUiStore()
const progress = useProgressStore()
const router = useRouter()
const dialog = ref(null)
const input = ref(null)
const query = ref('')
const active = ref(0)

const icons = { lesson: BookOpen, project: FolderKanban, module: Box, api: Terminal, example: Code2, error: Bug, question: CircleHelp }

const entries = shallowRef(null) // full index arrives when the palette first opens
const results = computed(() => searchIndex(entries.value ?? lessonEntries(), query.value))
const groups = computed(() => {
  if (query.value.trim()) return groupResults(results.value)
  const recent = progress.state.recent
    .map((id) => contentIndex.lessons[id])
    .filter(Boolean)
    .slice(0, 5)
    .map((l) => ({ id: `lesson:${l.id}`, type: 'lesson', title: l.title, subtitle: l.summary, to: l.path }))
  const quick = [
    { id: 'q:learn', type: 'module', title: 'Course explorer', subtitle: 'All 20 levels', to: '/learn' },
    { id: 'q:dash', type: 'module', title: 'Dashboard', subtitle: 'Your progress & next lesson', to: '/dashboard' },
    { id: 'q:int', type: 'question', title: 'Interview mode', subtitle: 'Practice or mock interviews', to: '/interview' },
    { id: 'q:pg', type: 'example', title: 'Playground', subtitle: 'Run Python code', to: '/playground' },
  ]
  return [
    ...(recent.length ? [{ type: 'recent', label: 'Recently visited', items: recent }] : []),
    { type: 'quick', label: 'Jump to', items: quick },
  ]
})
const flat = computed(() => groups.value.flatMap((g) => g.items))

watch(
  () => ui.searchOpen,
  async (open) => {
    await nextTick()
    const el = dialog.value
    if (!el) return
    if (open && !el.open) {
      if (!entries.value) loadSearchIndex().then((e) => (entries.value = e))
      el.showModal()
      active.value = 0
      input.value?.focus()
      input.value?.select()
    } else if (!open && el.open) el.close()
  },
)
watch(query, () => (active.value = 0))

function go(entry) {
  if (!entry) return
  ui.searchOpen = false
  router.push(entry.to)
}

function onKey(e) {
  if (e.key === 'ArrowDown') {
    active.value = Math.min(active.value + 1, flat.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    active.value = Math.max(active.value - 1, 0)
  } else if (e.key === 'Enter') {
    go(flat.value[active.value])
  } else return
  e.preventDefault()
  nextTick(() => dialog.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
}

// Global shortcut: Cmd/Ctrl+K toggles, "/" opens when not typing.
useEventListener(
  () => window,
  'keydown',
  (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      ui.searchOpen = !ui.searchOpen
    } else if (e.key === '/' && !typing && !ui.searchOpen) {
      e.preventDefault()
      ui.searchOpen = true
    }
  },
)

const indexOf = (entry) => flat.value.indexOf(entry)
</script>

<template>
  <dialog
    ref="dialog"
    class="palette"
    aria-label="Search the course"
    @close="ui.searchOpen = false"
    @click="(e) => e.target === dialog && (ui.searchOpen = false)"
  >
    <div class="palette__inner">
      <div class="palette__field">
        <Search :size="20" aria-hidden="true" />
        <input
          ref="input"
          v-model="query"
          class="palette__input"
          type="search"
          placeholder="Search lessons, APIs, errors, questions…"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="palette-results"
          :aria-expanded="flat.length > 0"
          :aria-activedescendant="flat[active] ? `pr-${indexOf(flat[active])}` : undefined"
          @keydown="onKey"
        />
        <span class="kbd">esc</span>
      </div>
      <div id="palette-results" class="palette__results" role="listbox" aria-label="Search results">
        <p v-if="query.trim() && !flat.length" class="palette__empty">
          No matches for “{{ query }}”. Try an API name like <code>enumerate()</code> or an error like <em>KeyError</em>.
        </p>
        <div v-for="g in groups" :key="g.type" class="group" role="group" :aria-label="g.label">
          <p class="group__label label">{{ g.label }} <span class="muted">{{ g.items.length }}</span></p>
          <button
            v-for="entry in g.items"
            :id="`pr-${indexOf(entry)}`"
            :key="entry.id"
            type="button"
            role="option"
            class="result"
            :aria-selected="indexOf(entry) === active"
            :data-active="indexOf(entry) === active"
            tabindex="-1"
            @click="go(entry)"
            @mousemove="active = indexOf(entry)"
          >
            <component :is="icons[entry.type] || BookOpen" class="result__icon" :size="16" aria-hidden="true" />
            <span class="result__text">
              <span class="result__title">{{ entry.title }}</span>
              <span class="result__sub">{{ entry.subtitle }}</span>
            </span>
          </button>
        </div>
      </div>
      <p class="palette__foot mono"><span class="kbd">↑</span><span class="kbd">↓</span> move · <span class="kbd">enter</span> open</p>
    </div>
  </dialog>
</template>

<style scoped>
.palette {
  margin: 10vh auto auto;
  padding: 0;
  width: min(680px, calc(100vw - 24px));
  border: var(--border);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
}
.palette::backdrop {
  background: color-mix(in srgb, #1a1a1a 55%, transparent);
}
.palette__inner {
  display: flex;
  flex-direction: column;
  max-height: 72vh;
}
.palette__field {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--border);
  background: var(--acid);
  color: var(--acid-ink);
}
.palette__input {
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--acid-ink);
  min-height: 40px;
}
.palette__input:focus {
  outline: none;
}
.palette__input::placeholder {
  color: #4b4b2b;
}
.palette__field .kbd {
  color: #1a1a1a;
  background: #fff;
}
.palette__results {
  overflow-y: auto;
  padding: var(--s-2) 0;
}
.palette__empty {
  padding: var(--s-4) var(--s-5);
  color: var(--muted);
}
.group__label {
  padding: var(--s-3) var(--s-4) var(--s-1);
  margin: 0;
  color: var(--muted);
}
.result {
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  width: 100%;
  border: 0;
  background: none;
  text-align: left;
  padding: var(--s-2) var(--s-4);
}
.result[data-active='true'] {
  background: var(--text);
  color: var(--bg);
}
.result__icon {
  flex: none;
  margin-top: 3px;
}
.result__text {
  display: grid;
  min-width: 0;
}
.result__title {
  font-weight: 700;
  line-height: 1.3;
}
.result__sub {
  font-size: 0.8rem;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.palette__foot {
  margin: 0;
  padding: var(--s-2) var(--s-4);
  border-top: var(--border-thin);
  font-size: 0.72rem;
  color: var(--muted);
  display: flex;
  gap: 6px;
  align-items: center;
}
</style>
