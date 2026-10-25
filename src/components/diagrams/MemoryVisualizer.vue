<script setup>
// Reference counting & garbage collection stepper (CPython). Names on the left,
// objects on the right with their reference counts; arrows are references.
// Hand-written walkthroughs of how CPython manages the snippet's memory — the
// printed results were verified by running the code. Counts are simplified: real
// objects also get references from the interpreter itself (sys.getrefcount shows
// one extra for its own argument).
import { computed, useId } from 'vue'
import AnimationControls from './AnimationControls.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'refcount' },
})

const PRESETS = {
  refcount: {
    code: `playlist = ["intro", "chorus"]
backup = playlist
songs = {"main": playlist}
del backup
songs.clear()
playlist = None`,
    names: { playlist: 50, backup: 120, songs: 200 },
    objects: { list: { label: 'list', note: "['intro', 'chorus']", x: 470, y: 70 }, dict: { label: 'dict', note: 'songs', x: 470, y: 205 } },
    steps: [
      { line: 1, names: ['playlist'], objects: ['list'], refs: [['playlist', 'list']], text: 'A list object is created and the name `playlist` refers to it: **reference count 1**.' },
      { line: 2, names: ['playlist', 'backup'], objects: ['list'], refs: [['playlist', 'list'], ['backup', 'list']], text: '`backup = playlist` adds a second reference to the **same** list: count 2.' },
      { line: 3, names: ['playlist', 'backup', 'songs'], objects: ['list', 'dict'], refs: [['playlist', 'list'], ['backup', 'list'], ['songs', 'dict'], ['dict', 'list']], text: 'A dict stores the list as a value. References from *inside other objects* count too: 3.' },
      { line: 4, names: ['playlist', 'songs'], objects: ['list', 'dict'], refs: [['playlist', 'list'], ['songs', 'dict'], ['dict', 'list']], text: '`del backup` deletes the **name**, not the list. The count drops to 2.' },
      { line: 5, names: ['playlist', 'songs'], objects: ['list', 'dict'], refs: [['playlist', 'list'], ['songs', 'dict']], text: '`songs.clear()` removes the dict’s reference: 1.' },
      { line: 6, names: ['playlist', 'songs'], objects: ['dict'], freed: ['list'], refs: [['songs', 'dict']], text: 'Re-binding `playlist` drops the last reference. The count hits **0**, and CPython frees the list **immediately** — no waiting, no garbage collector involved.' },
    ],
  },
  cycle: {
    code: `import gc

class Node:
    def __init__(self, name):
        self.name = name
        self.partner = None

a = Node("a")
b = Node("b")
a.partner = b
b.partner = a
del a, b
print("unreachable found:", gc.collect() > 0)`,
    names: { a: 70, b: 190 },
    objects: { na: { label: 'Node', note: 'name="a"', x: 470, y: 70 }, nb: { label: 'Node', note: 'name="b"', x: 470, y: 190 } },
    steps: [
      { line: 9, names: ['a', 'b'], objects: ['na', 'nb'], refs: [['a', 'na'], ['b', 'nb']], text: 'Two `Node` objects, each referenced once by a name.' },
      { line: 10, names: ['a', 'b'], objects: ['na', 'nb'], refs: [['a', 'na'], ['b', 'nb'], ['na', 'nb']], text: '`a.partner = b`: node *b* is now referenced by the name `b` **and** by node *a*: count 2.' },
      { line: 11, names: ['a', 'b'], objects: ['na', 'nb'], refs: [['a', 'na'], ['b', 'nb'], ['na', 'nb'], ['nb', 'na']], text: '`b.partner = a` closes a **reference cycle**: each node keeps the other alive.' },
      { line: 12, names: [], objects: ['na', 'nb'], unreachable: true, refs: [['na', 'nb'], ['nb', 'na']], text: 'After `del a, b` no name can reach either node — but each still has a count of **1**, from its partner. Reference counting alone can never free them.' },
      { line: 13, names: [], objects: [], freed: ['na', 'nb'], refs: [], out: ['unreachable found: True'], text: 'CPython’s **cyclic garbage collector** periodically looks for groups of objects that only reference each other. `gc.collect()` runs it now: the cycle is unreachable, so both nodes are freed.' },
    ],
  },
  weakref: {
    code: `import weakref

class Image:
    def __init__(self, name):
        self.name = name

cache = weakref.WeakValueDictionary()
photo = Image("cat.png")
cache["cat"] = photo
print("cat" in cache)
del photo
print("cat" in cache)`,
    names: { cache: 70, photo: 190 },
    objects: { cache: { label: 'WeakValueDictionary', note: '', x: 470, y: 70 }, img: { label: 'Image', note: 'cat.png', x: 470, y: 190 } },
    steps: [
      { line: 7, names: ['cache'], objects: ['cache'], refs: [['cache', 'cache']], text: 'A `WeakValueDictionary` holds its values through **weak references**.' },
      { line: 8, names: ['cache', 'photo'], objects: ['cache', 'img'], refs: [['cache', 'cache'], ['photo', 'img']], text: 'An `Image` with one strong reference: `photo`.' },
      { line: 9, names: ['cache', 'photo'], objects: ['cache', 'img'], refs: [['cache', 'cache'], ['photo', 'img']], weak: [['cache', 'img']], text: 'Storing it in the cache adds a **weak** reference (dashed). Weak references don’t increase the count — it is still 1.' },
      { line: 10, names: ['cache', 'photo'], objects: ['cache', 'img'], refs: [['cache', 'cache'], ['photo', 'img']], weak: [['cache', 'img']], out: ['True'], text: 'While someone else holds the image, the cache can hand it out.' },
      { line: 11, names: ['cache'], objects: ['cache'], freed: ['img'], refs: [['cache', 'cache']], out: ['True'], text: '`del photo` removes the only **strong** reference: count 0, the image is freed, and its weak entry disappears automatically.' },
      { line: 12, names: ['cache'], objects: ['cache'], refs: [['cache', 'cache']], out: ['True', 'False'], text: 'The cache never kept the image alive. Weak references are perfect for caches and observers that must not cause memory leaks.' },
    ],
  },
}

const uid = useId()
const def = PRESETS[props.preset] ?? PRESETS.refcount
const player = useStepPlayer(() => def.steps, { interval: 2800 })
const step = computed(() => player.frame.value ?? def.steps[0])
const outLines = computed(() => {
  for (let i = player.index.value; i >= 0; i--) if (def.steps[i].out) return def.steps[i].out
  return []
})
const W = 640
const NAME_X = 90
const BOX = { w: 200, h: 58 }
const H = 260

const counts = computed(() => {
  const c = {}
  for (const id of step.value.objects) c[id] = 0
  for (const [, to] of step.value.refs) if (to in c) c[to]++
  return c
})
// Self-references like ['cache','cache'] mean "name → object of the same id".
function endpoints([from, to], fromIsObject = false) {
  const obj = def.objects[to]
  const fromObj = fromIsObject || def.names[from] === undefined ? def.objects[from] : null
  if (!fromObj) {
    const y = def.names[from]
    return { d: `M ${NAME_X + 46} ${y} C ${NAME_X + 160} ${y}, ${obj.x - BOX.w / 2 - 120} ${obj.y}, ${obj.x - BOX.w / 2 - 4} ${obj.y}` }
  }
  const down = obj.y > fromObj.y
  const x1 = fromObj.x + (down ? 40 : -40)
  const y1 = fromObj.y + (down ? BOX.h / 2 : -BOX.h / 2)
  const x2 = obj.x + (down ? 40 : -40)
  const y2 = obj.y + (down ? -BOX.h / 2 - 4 : BOX.h / 2 + 4)
  const bend = down ? 60 : -60
  return { d: `M ${x1} ${y1} C ${x1 + bend} ${y1 + (y2 - y1) / 3}, ${x2 + bend} ${y2 - (y2 - y1) / 3}, ${x2} ${y2}` }
}
const visibleFreed = computed(() => step.value.freed ?? [])
const allObjects = computed(() => [...step.value.objects, ...visibleFreed.value])
</script>

<template>
  <div class="mv">
    <div class="mv__grid">
      <CodeBlock :code="def.code" lang="python" title="main.py" :highlight="[step.line]" :copyable="false" />
      <div class="mv__canvas graph-paper">
        <svg :viewBox="`0 0 ${W} ${H}`" class="mv__svg" role="img" :aria-label="`Names: ${step.names.join(', ') || 'none'}. Objects with reference counts: ${step.objects.map((o) => `${def.objects[o].label} ${counts[o]}`).join(', ') || 'none'}.`">
          <defs>
            <marker :id="`${uid}-tip`" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" class="mv__tip" />
            </marker>
          </defs>
          <text x="20" y="22" class="mv__head">names</text>
          <text :x="W - 250" y="22" class="mv__head">objects · refcount</text>
          <g v-for="(y, n) in def.names" :key="n" class="mv__name" :class="{ 'is-gone': !step.names.includes(n) }">
            <rect :x="NAME_X - 50" :y="y - 16" width="96" height="32" />
            <text :x="NAME_X - 2" :y="y + 5" text-anchor="middle">{{ n }}</text>
          </g>
          <path v-for="r in step.refs.filter(([f, t]) => f !== t || def.names[f] !== undefined)" :key="r.join('>')" :d="endpoints(r).d" class="mv__ref" :marker-end="`url(#${uid}-tip)`" />
          <path v-for="r in step.weak ?? []" :key="'w' + r.join('>')" :d="endpoints(r, true).d" class="mv__ref mv__ref--weak" :marker-end="`url(#${uid}-tip)`" />
          <g
            v-for="id in allObjects"
            :key="id"
            class="mv__obj"
            :class="{ 'is-freed': visibleFreed.includes(id), 'is-orphan': step.unreachable && !visibleFreed.includes(id) }"
          >
            <rect class="mv__shadow" :x="def.objects[id].x - BOX.w / 2 + 5" :y="def.objects[id].y - BOX.h / 2 + 5" :width="BOX.w" :height="BOX.h" />
            <rect class="mv__box" :x="def.objects[id].x - BOX.w / 2" :y="def.objects[id].y - BOX.h / 2" :width="BOX.w" :height="BOX.h" />
            <text :x="def.objects[id].x - BOX.w / 2 + 12" :y="def.objects[id].y - 4" class="mv__label">{{ def.objects[id].label }}</text>
            <text :x="def.objects[id].x - BOX.w / 2 + 12" :y="def.objects[id].y + 15" class="mv__note">{{ def.objects[id].note }}</text>
            <g v-if="!visibleFreed.includes(id)">
              <circle :cx="def.objects[id].x + BOX.w / 2 - 6" :cy="def.objects[id].y - BOX.h / 2 + 4" r="15" class="mv__count" />
              <text :x="def.objects[id].x + BOX.w / 2 - 6" :y="def.objects[id].y - BOX.h / 2 + 9" text-anchor="middle" class="mv__countnum">{{ counts[id] }}</text>
            </g>
            <text v-else :x="def.objects[id].x" :y="def.objects[id].y + 6" text-anchor="middle" class="mv__stamp">FREED</text>
          </g>
        </svg>
      </div>
    </div>
    <div v-if="outLines.length" class="mv__out code-panel">
      <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" aria-hidden="true" />output</span></div>
      <pre class="mv__pre">{{ outLines.join('\n') }}</pre>
    </div>
    <div class="mv__explain" aria-live="polite">
      <RichText :value="step.text" />
    </div>
    <AnimationControls :player="player" label="Memory" />
    <p class="mv__note muted">CPython detail: reference counting and the cyclic collector are how CPython manages memory. The language only promises that unreachable objects are reclaimed eventually — PyPy, for example, uses a different garbage collector.</p>
  </div>
</template>

<style scoped>
.mv {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.mv__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
  gap: var(--s-3);
  align-items: start;
}
.mv__canvas {
  border: var(--border-thin);
  padding: var(--s-2);
}
.mv__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
.mv__head {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  fill: var(--muted);
}
.mv__name rect {
  fill: var(--acid);
  stroke: var(--line);
  stroke-width: 3;
}
.mv__name text {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 15px;
  fill: var(--acid-ink);
}
.mv__name.is-gone {
  opacity: 0.18;
}
.mv__name.is-gone rect {
  stroke-dasharray: 5 5;
  fill: none;
}
.mv__ref {
  fill: none;
  stroke: var(--text);
  stroke-width: 2.5;
}
.mv__ref--weak {
  stroke: var(--cobalt-text);
  stroke-dasharray: 7 6;
}
.mv__tip {
  fill: var(--text);
}
.mv__shadow {
  fill: var(--shadow-color);
}
.mv__box {
  fill: var(--surface);
  stroke: var(--line);
  stroke-width: 3;
}
.mv__label {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  fill: var(--text);
}
.mv__note {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--muted);
}
.mv__count {
  fill: var(--cobalt);
  stroke: var(--line);
  stroke-width: 3;
}
.mv__countnum {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 15px;
  fill: var(--cobalt-ink);
}
.mv__obj.is-orphan .mv__box {
  fill: var(--note-yellow);
  stroke: var(--red);
  stroke-dasharray: 8 5;
}
.mv__obj.is-freed {
  opacity: 0.4;
}
.mv__obj.is-freed .mv__box {
  stroke-dasharray: 6 6;
}
.mv__stamp {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 22px;
  fill: var(--red);
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(-8deg);
}
.mv__out {
  box-shadow: none;
}
.mv__pre {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--code-text);
}
.mv__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 70px;
}
.mv__explain :deep(p) {
  margin: 0;
}
.mv__note {
  margin: 0;
  font-size: 0.8rem;
}
@container (max-width: 760px) {
  .mv__grid {
    grid-template-columns: 1fr;
  }
}
</style>
