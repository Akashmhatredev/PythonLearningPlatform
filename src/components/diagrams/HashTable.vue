<script setup>
// Interactive, simplified hash table — the idea behind dict and set lookups.
// Simplified on purpose: a toy string hash (CPython's is randomised per process),
// linear probing (CPython uses a perturbed probe sequence) and a separate
// key table. Integer keys use their own value as the hash, as CPython does for
// small non-negative ints.
import { computed, ref, shallowRef, useId } from 'vue'

const props = defineProps({
  preset: { type: String, default: 'dict' },
})

const uid = useId()
const isSet = props.preset === 'set'
const toyHash = (key) => {
  if (typeof key === 'number') return key
  let h = 7
  for (const ch of key) h = (h * 31 + ch.codePointAt(0)) % 1_000_003
  return h
}
const show = (k) => (typeof k === 'number' ? String(k) : JSON.stringify(k).replace(/^"|"$/g, "'"))

const size = ref(8)
const slots = shallowRef(Array(8).fill(null)) // { key, value }
const log = ref([])
const path = ref([]) // slot indexes visited by the last operation
const result = ref(null) // { slot, kind: 'found'|'stored'|'missing'|'dup' }
const keyText = ref('')
const valueText = ref('')

function probe(key) {
  const h = toyHash(key)
  const visited = []
  let i = h % size.value
  for (let n = 0; n < size.value; n++) {
    visited.push(i)
    const s = slots.value[i]
    if (!s || s.key === key) return { h, i, visited, hit: !!s }
    i = (i + 1) % size.value
  }
  return { h, i: -1, visited, hit: false }
}

function rawInsert(key, value, table, n) {
  let i = toyHash(key) % n
  while (table[i] && table[i].key !== key) i = (i + 1) % n
  table[i] = { key, value }
}

function insert(key, value, { quiet = false } = {}) {
  const count = slots.value.filter(Boolean).length
  const found = probe(key)
  if (!found.hit && (count + 1) * 3 > size.value * 2) {
    const n = size.value * 2
    const table = Array(n).fill(null)
    for (const s of slots.value) if (s) rawInsert(s.key, s.value, table, n)
    size.value = n
    slots.value = table
    if (!quiet) log.value.unshift(`The table was getting full (more than ⅔ used), so it **grew to ${n} slots** and every key was re-inserted at its new position. Real dicts do this too — it’s why one insert is occasionally slow.`)
  }
  const p = probe(key)
  const table = [...slots.value]
  const steps = p.visited.length - 1
  const collide = steps ? ` Slot${steps > 1 ? 's' : ''} ${p.visited.slice(0, -1).join(', ')} ${steps > 1 ? 'were' : 'was'} taken by another key (a **collision**), so it probed to the next slot.` : ''
  if (p.hit) {
    if (!isSet) table[p.i] = { key, value }
    if (!quiet) log.value.unshift(isSet ? `${show(key)} is already in the set (slot ${p.i}). Sets keep one copy, so nothing changes.` : `hash(${show(key)}) = ${p.h} → slot ${p.h % size.value}.${collide} The key already exists, so its value is **replaced** with ${show(value)}.`)
    result.value = { slot: p.i, kind: isSet ? 'dup' : 'stored' }
  } else {
    table[p.i] = { key, value }
    if (!quiet) log.value.unshift(`hash(${show(key)}) = ${p.h}; ${p.h} % ${size.value} = **${p.h % size.value}**.${collide} Stored in slot ${p.i}.`)
    result.value = { slot: p.i, kind: 'stored' }
  }
  slots.value = table
  path.value = p.visited
}

function lookup(key) {
  const p = probe(key)
  path.value = p.visited
  const checks = p.visited.length
  const items = slots.value.filter(Boolean).length
  if (p.hit) {
    const v = isSet ? '' : ` → value ${show(slots.value[p.i].value)}`
    log.value.unshift(`\`${show(key)} in …\`: hash → slot ${p.h % size.value}; **found** after ${checks} comparison${checks > 1 ? 's' : ''}${v}. A list would have scanned up to ${items} items.`)
    result.value = { slot: p.i, kind: 'found' }
  } else {
    log.value.unshift(`\`${show(key)} in …\`: hash → slot ${p.h % size.value}; reached an **empty** slot after ${checks} check${checks > 1 ? 's' : ''}, so the key is **not there**. No need to look anywhere else.`)
    result.value = { slot: p.i, kind: 'missing' }
  }
}

function parseKey(text) {
  const t = text.trim()
  return /^-?\d+$/.test(t) ? Number(t) : t
}
function onAdd() {
  if (!keyText.value.trim()) return
  const v = valueText.value.trim()
  insert(parseKey(keyText.value), v === '' ? 0 : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v)
  keyText.value = ''
  valueText.value = ''
}
function onFind() {
  if (!keyText.value.trim()) return
  lookup(parseKey(keyText.value))
}
function reset() {
  size.value = 8
  slots.value = Array(8).fill(null)
  log.value = []
  path.value = []
  result.value = null
  const seed = props.preset === 'collision' ? [[3, 'red'], [11, 'green'], [19, 'blue']] : isSet ? [['ada'], ['grace'], ['guido']] : [['apple', 3], ['banana', 5], ['cherry', 7]]
  for (const [k, v] of seed) insert(k, v ?? null, { quiet: true })
  path.value = []
  result.value = null
  log.value = [
    props.preset === 'collision'
      ? 'Keys 3, 11 and 19 all give index 3 (their hash is the number itself, and 3 % 8 = 11 % 8 = 19 % 8 = 3). Look up 19 to see the probe walk past the collisions.'
      : isSet
        ? 'A set is a hash table with keys only. Add a name twice, or check whether a name is in the set.'
        : 'Each key is hashed to a number; the number picks a slot. Add a key or look one up.',
  ]
}
reset()

// Log lines contain learner-typed keys: escape everything, then add bold/code.
const escapeHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const format = (line) => escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')
const pathSet = computed(() => new Set(path.value))
const count = computed(() => slots.value.filter(Boolean).length)
</script>

<template>
  <div class="ht">
    <form class="ht__controls" @submit.prevent="onAdd">
      <label class="field ht__field">
        <span class="label">{{ isSet ? 'item' : 'key' }}</span>
        <input :id="`${uid}-k`" v-model="keyText" class="input" autocomplete="off" :placeholder="preset === 'collision' ? '27' : isSet ? 'linus' : 'kiwi'" />
      </label>
      <label v-if="!isSet" class="field ht__field ht__field--sm">
        <span class="label">value</span>
        <input v-model="valueText" class="input" autocomplete="off" placeholder="4" />
      </label>
      <button type="submit" class="btn btn--sm btn--acid">{{ isSet ? 'add()' : 'd[key] = value' }}</button>
      <button type="button" class="btn btn--sm btn--cobalt" @click="onFind">key in {{ isSet ? 's' : 'd' }}</button>
      <button type="button" class="btn btn--sm btn--ghost" @click="reset">reset</button>
    </form>

    <div class="ht__grid">
      <table class="ht__table" :aria-label="`Hash table with ${size} slots, ${count} used`">
        <thead>
          <tr>
            <th scope="col">slot</th>
            <th scope="col">key</th>
            <th v-if="!isSet" scope="col">value</th>
            <th scope="col">hash (toy)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(s, i) in slots"
            :key="i"
            :class="{
              'is-path': pathSet.has(i),
              'is-hit': result?.slot === i && ['found', 'stored', 'dup'].includes(result.kind),
              'is-miss': result?.slot === i && result.kind === 'missing',
            }"
          >
            <th scope="row" class="mono">{{ i }}</th>
            <td class="mono">{{ s ? show(s.key) : '' }}<span v-if="!s" class="ht__empty">empty</span></td>
            <td v-if="!isSet" class="mono">{{ s ? show(s.value) : '' }}</td>
            <td class="mono ht__hash">{{ s ? toyHash(s.key) : '' }}</td>
          </tr>
        </tbody>
      </table>
      <div class="ht__log" aria-live="polite">
        <p class="label">what happened</p>
        <ol>
          <li v-for="(line, i) in log.slice(0, 6)" :key="log.length - i" :class="{ 'is-latest': i === 0 }" v-html="format(line)" />
        </ol>
        <p class="ht__load mono">{{ count }} / {{ size }} slots used · grows past ⅔</p>
      </div>
    </div>
    <p class="ht__note muted">
      Simplified model: a toy string hash, linear probing and keys stored in the slots. CPython randomises string hashes per run, uses a smarter probe sequence and keeps a compact entries array (that’s how dicts remember insertion order) — but the idea is the same: <strong>hash → slot → compare a few keys</strong>, instead of scanning everything.
    </p>
  </div>
</template>

<style scoped>
.ht {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.ht__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: flex-end;
}
.ht__field {
  min-width: 140px;
}
.ht__field--sm {
  min-width: 90px;
  max-width: 120px;
}
.ht__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
}
.ht__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  background: var(--surface);
}
.ht__table th,
.ht__table td {
  border: 2px solid var(--line);
  padding: 4px 8px;
  text-align: left;
}
.ht__table thead th {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--surface-2);
}
.ht__table tbody th {
  width: 3.5em;
  background: var(--surface-2);
}
.ht__table tr.is-path td,
.ht__table tr.is-path th {
  background: var(--note-yellow);
}
.ht__table tr.is-hit td,
.ht__table tr.is-hit th {
  background: var(--acid);
  color: var(--acid-ink);
  font-weight: 800;
}
.ht__table tr.is-miss td,
.ht__table tr.is-miss th {
  background: var(--note-blue);
  outline: 2px dashed var(--cobalt-text);
  outline-offset: -4px;
}
.ht__empty {
  color: var(--muted);
  font-size: 0.7rem;
}
.ht__hash {
  color: var(--muted);
  font-size: 0.72rem;
}
.ht__log {
  border: var(--border-thin);
  background: var(--surface);
  padding: var(--s-2) var(--s-3);
}
.ht__log .label {
  margin: 0 0 6px;
}
.ht__log ol {
  margin: 0;
  padding-left: 1.2em;
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
}
.ht__log li {
  opacity: 0.6;
}
.ht__log li.is-latest {
  opacity: 1;
}
.ht__load {
  margin: var(--s-2) 0 0;
  font-size: 0.7rem;
  color: var(--muted);
}
.ht__note {
  margin: 0;
  font-size: 0.82rem;
}
@container (max-width: 720px) {
  .ht__grid {
    grid-template-columns: 1fr;
  }
}
</style>
