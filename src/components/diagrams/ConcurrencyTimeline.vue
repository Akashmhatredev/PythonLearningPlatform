<script setup>
// Threads vs processes vs asyncio. Illustrative timelines (not measurements) of
// the same work under each model, plus a step-by-step lost-update race. Timings
// are schematic units chosen to show the shape of each model, not benchmarks.
import { computed } from 'vue'
import AnimationControls from './AnimationControls.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'io-bound' },
})

const io = (offset, label) => [
  [offset, offset + 0.1, 'cpu', label],
  [offset + 0.1, offset + 0.9, 'wait', label],
  [offset + 0.9, offset + 1.0, 'cpu', label],
]
const TIMELINES = {
  'io-bound': {
    intro: 'Three downloads. Each needs a little CPU work (send the request, parse the reply) and a long **wait** for the network.',
    end: 3,
    models: [
      { id: 'seq', label: 'Sequential', sub: '1 thread', lanes: [{ name: 'main', segs: [...io(0, 'A'), ...io(1, 'B'), ...io(2, 'C')] }] },
      {
        id: 'threads',
        label: 'Threads',
        sub: '3 threads · 1 GIL',
        lanes: [
          { name: 'thread 1', segs: io(0, 'A') },
          { name: 'thread 2', segs: [[0, 0.1, 'gil'], ...io(0.1, 'B')] },
          { name: 'thread 3', segs: [[0, 0.2, 'gil'], ...io(0.2, 'C')] },
        ],
      },
      {
        id: 'asyncio',
        label: 'asyncio',
        sub: '1 thread · 3 tasks',
        lanes: [
          { name: 'task A', segs: io(0, 'A') },
          { name: 'task B', segs: [[0, 0.1, 'ready'], ...io(0.1, 'B')] },
          { name: 'task C', segs: [[0, 0.2, 'ready'], ...io(0.2, 'C')] },
        ],
      },
      {
        id: 'procs',
        label: 'Processes',
        sub: '3 processes',
        lanes: ['A', 'B', 'C'].map((l, i) => ({ name: `process ${i + 1}`, segs: [[0, 0.3, 'start'], ...io(0.3, l)] })),
      },
    ],
    steps: [
      { t: 0, text: 'Three downloads. Each needs a little CPU work and a long **wait** for the network. Watch what each model does with the waiting.' },
      { t: 1.5, focus: 'seq', text: '**Sequential:** download B can’t start until A is completely finished. During every wait the CPU sits idle.' },
      { t: 1.5, focus: 'threads', text: '**Threads:** a thread that is waiting on the network **releases the GIL**, so the next thread can start. The waits overlap; only the tiny CPU slices queue for the GIL.' },
      { t: 1.5, focus: 'asyncio', text: '**asyncio:** the same overlap on **one** thread. Each task `await`s the network and the event loop switches to the next ready task.' },
      { t: 1.5, focus: 'procs', text: '**Processes** overlap too, but each one costs start-up time and memory — overkill when the work is mostly waiting.' },
      { t: 3, text: 'Totals (illustrative units): sequential ≈ 3, threads ≈ asyncio ≈ 1.2, processes ≈ 1.3. **For I/O-bound work, overlap the waits:** asyncio or threads.' },
    ],
  },
  'cpu-bound': {
    end: 3,
    models: [
      { id: 'seq', label: 'Sequential', sub: '1 thread', lanes: [{ name: 'main', segs: [[0, 1, 'cpu', 'A'], [1, 2, 'cpu', 'B'], [2, 3, 'cpu', 'C']] }] },
      {
        id: 'threads',
        label: 'Threads',
        sub: '3 threads · 1 GIL',
        lanes: [0, 1, 2].map((k) => {
          const segs = []
          for (let round = 0; round < 4; round++) {
            const start = round * 0.75 + k * 0.25
            if (start > 0 && segs.length === 0) segs.push([0, start, 'gil'])
            else if (segs.length) segs.push([segs[segs.length - 1][1], start, 'gil'])
            segs.push([start, start + 0.25, 'cpu', 'ABC'[k]])
          }
          return { name: `thread ${k + 1}`, segs }
        }),
      },
      { id: 'asyncio', label: 'asyncio', sub: '1 thread · 3 tasks', lanes: [{ name: 'event loop', segs: [[0, 1, 'cpu', 'A'], [1, 2, 'cpu', 'B'], [2, 3, 'cpu', 'C']] }] },
      {
        id: 'procs',
        label: 'Processes',
        sub: '3 processes · 3 cores',
        lanes: ['A', 'B', 'C'].map((l, i) => ({ name: `process ${i + 1}`, segs: [[0, 0.3, 'start'], [0.3, 1.3, 'cpu', l]] })),
      },
    ],
    steps: [
      { t: 0, text: 'Three jobs that are pure computation (say, resizing images in Python code). No waiting at all.' },
      { t: 3, focus: 'seq', text: '**Sequential:** one after another, about 3 units.' },
      { t: 3, focus: 'threads', text: '**Threads (standard CPython):** only the thread holding the **GIL** can run Python bytecode, so the threads just take turns. Still ≈ 3 units — plus switching overhead.' },
      { t: 3, focus: 'asyncio', text: '**asyncio:** there is nothing to `await`, so tasks can’t even take turns. No speed-up — and a long computation freezes every other task.' },
      { t: 1.3, focus: 'procs', text: '**Processes:** each has its own interpreter and its own GIL, so three cores really work in parallel. ≈ 1.3 units including start-up.' },
      { t: 3, text: '**For CPU-bound Python, use processes** (`multiprocessing`, `ProcessPoolExecutor`) or code that releases the GIL (NumPy, C extensions). The free-threaded build (experimental in 3.13, supported in 3.14) removes the GIL so threads *can* run in parallel.' },
    ],
  },
}

const RACE = {
  code: `count = 0

def work():
    global count
    for _ in range(100_000):
        count += 1   # really: read count, add 1, write count

# the fix
lock = threading.Lock()

def safe_work():
    global count
    for _ in range(100_000):
        with lock:   # only one thread at a time in here
            count += 1`,
  steps: [
    { count: 0, t1: [], t2: [], text: 'Two threads both run `count += 1` once. We expect `count` to end at **2**. But `count += 1` is three steps: **read**, **add**, **write**.', line: 6 },
    { count: 0, t1: ['read count → 0'], t2: [], text: 'Thread 1 reads `count`: 0.', line: 6, hot: 1 },
    { count: 0, t1: ['read count → 0'], t2: ['read count → 0'], text: 'The scheduler switches threads **in the middle**. Thread 2 also reads 0.', line: 6, hot: 2 },
    { count: 1, t1: ['read count → 0', 'add: 0 + 1 = 1', 'write count = 1'], t2: ['read count → 0'], text: 'Thread 1 adds and writes **1**.', line: 6, hot: 1 },
    { count: 1, t1: ['read count → 0', 'add: 0 + 1 = 1', 'write count = 1'], t2: ['read count → 0', 'add: 0 + 1 = 1', 'write count = 1'], lost: true, text: 'Thread 2 adds 1 to the **stale** 0 it read and writes **1** too. One increment vanished — a **lost update**. The GIL doesn’t prevent this: it protects the interpreter’s internals, not your read-modify-write.', line: 6, hot: 2 },
    { count: 0, reset: true, lock: 'T1', t1: ['acquire lock ✓'], t2: [], text: 'Same race with a **lock**. Thread 1 acquires it first.', line: 14, hot: 1 },
    { count: 0, lock: 'T1', t1: ['acquire lock ✓', 'read count → 0'], t2: ['acquire lock … waiting'], text: 'Thread 2 tries to acquire the lock and has to **wait**.', line: 14, hot: 2 },
    { count: 1, lock: null, t1: ['acquire lock ✓', 'read count → 0', 'add: 0 + 1 = 1', 'write count = 1', 'release lock'], t2: ['acquire lock … waiting'], text: 'Thread 1 finishes its read-add-write and releases the lock.', line: 15, hot: 1 },
    { count: 2, lock: null, t1: ['acquire lock ✓', 'read count → 0', 'add: 0 + 1 = 1', 'write count = 1', 'release lock'], t2: ['acquire lock … waiting', 'acquire lock ✓', 'read count → 1', 'add: 1 + 1 = 2', 'write count = 2', 'release lock'], ok: true, text: 'Thread 2 now reads the **fresh** value 1 and writes 2. Correct! A lock makes the three steps behave as one.', line: 15, hot: 2 },
  ],
}

const isRace = props.preset === 'race-condition'
const def = isRace ? null : TIMELINES[props.preset] ?? TIMELINES['io-bound']
const player = useStepPlayer(() => (isRace ? RACE.steps : def.steps), { interval: 3000 })
const step = computed(() => player.frame.value ?? (isRace ? RACE.steps[0] : def.steps[0]))

const pct = (x) => `${(x / (def?.end ?? 3)) * 100}%`
function visible(seg) {
  const t = step.value.t ?? 0
  if (seg[0] >= t) return null
  return { left: pct(seg[0]), width: pct(Math.min(seg[1], t) - seg[0]) }
}
const finish = (m) => Math.max(...m.lanes.flatMap((l) => l.segs.map((s) => s[1])))
const ticks = computed(() => Array.from({ length: (def?.end ?? 3) + 1 }, (_, i) => i))
</script>

<template>
  <div class="cc">
    <template v-if="!isRace">
      <div class="cc__legend mono">
        <span><i class="cc__sw cc__sw--cpu" /> running Python</span>
        <span><i class="cc__sw cc__sw--wait" /> waiting for I/O</span>
        <span><i class="cc__sw cc__sw--gil" /> waiting for the GIL</span>
        <span><i class="cc__sw cc__sw--ready" /> ready, not scheduled</span>
        <span><i class="cc__sw cc__sw--start" /> process start-up</span>
      </div>
      <div class="cc__chart" role="img" :aria-label="`Timelines at time ${step.t ?? 0}. ${def.models.map((m) => `${m.label}: finishes at about ${finish(m)} units`).join('. ')}`">
        <div v-for="m in def.models" :key="m.id" class="cc__model" :class="{ 'is-focus': step.focus === m.id, 'is-dim': step.focus && step.focus !== m.id }">
          <p class="cc__mlabel"><strong>{{ m.label }}</strong> <span class="mono muted">{{ m.sub }}</span> <span v-if="(step.t ?? 0) >= finish(m)" class="cc__done mono">done ≈ {{ finish(m) }}</span></p>
          <div v-for="lane in m.lanes" :key="lane.name" class="cc__lane">
            <span class="cc__lname mono">{{ lane.name }}</span>
            <span class="cc__track">
              <template v-for="(seg, i) in lane.segs" :key="i">
                <span v-if="visible(seg)" class="cc__seg" :class="`cc__seg--${seg[2]}`" :style="visible(seg)">{{ seg[2] === 'cpu' && seg[1] - seg[0] >= 0.2 ? seg[3] : '' }}</span>
              </template>
            </span>
          </div>
        </div>
        <div class="cc__axis mono" aria-hidden="true">
          <span class="cc__lname" />
          <span class="cc__ticks"><span v-for="t in ticks" :key="t" :style="{ left: pct(t) }">{{ t }}</span></span>
        </div>
      </div>
      <p class="cc__note muted">Illustrative timelines in schematic time units — not a benchmark. Threads and processes can’t start inside this browser sandbox, so run the lesson’s static examples on your own machine to measure for real.</p>
    </template>

    <template v-else>
      <div class="cc__race">
        <CodeBlock :code="RACE.code" lang="python" title="counter.py (runs on your machine — threads can't start in the browser)" :highlight="[step.line]" :copyable="false" />
        <div class="cc__mem">
          <section class="cc__thread" :class="{ 'is-hot': step.hot === 1 }">
            <p class="label">thread 1</p>
            <ol>
              <li v-for="(op, i) in step.t1" :key="i" :class="{ 'is-last': step.hot === 1 && i === step.t1.length - 1 }">{{ op }}</li>
            </ol>
          </section>
          <section class="cc__shared" :class="{ 'is-lost': step.lost, 'is-ok': step.ok }">
            <p class="label">shared memory</p>
            <p class="cc__count mono">count = <strong>{{ step.count }}</strong></p>
            <p v-if="step.lost" class="cc__verdict mono">expected 2 ✗</p>
            <p v-if="step.ok" class="cc__verdict mono">2 ✓</p>
            <p class="cc__lock mono">🔒 lock: {{ step.lock ? `held by ${step.lock}` : step.reset !== undefined || player.index.value >= 5 ? 'free' : 'not used' }}</p>
          </section>
          <section class="cc__thread" :class="{ 'is-hot': step.hot === 2 }">
            <p class="label">thread 2</p>
            <ol>
              <li v-for="(op, i) in step.t2" :key="i" :class="{ 'is-last': step.hot === 2 && i === step.t2.length - 1 }">{{ op }}</li>
            </ol>
          </section>
        </div>
      </div>
    </template>

    <div class="cc__explain" aria-live="polite">
      <RichText :value="step.text" />
    </div>
    <AnimationControls :player="player" label="Concurrency" />
  </div>
</template>

<style scoped>
.cc {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.cc__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-4);
  font-size: 0.7rem;
}
.cc__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cc__sw {
  display: inline-block;
  width: 18px;
  height: 12px;
  border: 2px solid var(--line);
}
.cc__chart {
  display: grid;
  gap: var(--s-3);
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
}
.cc__model {
  display: grid;
  gap: 3px;
  transition: opacity var(--quick) var(--snap);
}
.cc__model.is-dim {
  opacity: 0.35;
}
.cc__model.is-focus .cc__mlabel strong {
  background: var(--acid);
  color: var(--acid-ink);
  padding: 0 4px;
}
.cc__mlabel {
  margin: 0;
  font-size: 0.85rem;
}
.cc__done {
  margin-left: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--cobalt-text);
}
.cc__lane,
.cc__axis {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: center;
  gap: var(--s-2);
}
.cc__lname {
  font-size: 0.66rem;
  color: var(--muted);
}
.cc__track {
  position: relative;
  height: 20px;
  border-bottom: 1.5px dotted var(--line);
}
.cc__seg {
  position: absolute;
  top: 2px;
  bottom: 2px;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 800;
  border: 1.5px solid var(--line);
  overflow: hidden;
  transition: width var(--med) var(--snap);
}
.cc__seg--cpu,
.cc__sw--cpu {
  background: var(--cobalt);
  color: var(--cobalt-ink);
}
.cc__seg--wait,
.cc__sw--wait {
  background: repeating-linear-gradient(-45deg, var(--acid), var(--acid) 4px, transparent 4px, transparent 8px);
}
.cc__seg--gil,
.cc__sw--gil {
  background: color-mix(in srgb, var(--red) 25%, var(--surface));
  border-style: dashed;
}
.cc__seg--ready,
.cc__sw--ready {
  background: var(--surface-2);
  border-style: dotted;
}
.cc__seg--start,
.cc__sw--start {
  background: var(--kraft);
}
.cc__ticks {
  position: relative;
  height: 14px;
  font-size: 0.62rem;
  color: var(--muted);
}
.cc__ticks span {
  position: absolute;
  transform: translateX(-50%);
}
.cc__note {
  margin: 0;
  font-size: 0.8rem;
}
.cc__race {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: var(--s-3);
  align-items: start;
}
.cc__mem {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--s-2);
}
.cc__thread,
.cc__shared {
  border: var(--border-thin);
  background: var(--surface);
  padding: var(--s-2);
  min-height: 180px;
}
.cc__thread.is-hot {
  border-color: var(--cobalt);
  box-shadow: 3px 3px 0 var(--cobalt);
}
.cc__thread .label,
.cc__shared .label {
  margin: 0 0 6px;
  color: var(--muted);
}
.cc__thread ol {
  margin: 0;
  padding-left: 1.2em;
  font-family: var(--font-mono);
  font-size: 0.72rem;
}
.cc__thread li.is-last {
  background: var(--acid);
  color: var(--acid-ink);
}
.cc__shared {
  text-align: center;
  background: var(--note-blue);
}
.cc__shared.is-lost {
  background: color-mix(in srgb, var(--red) 15%, var(--surface));
  border-color: var(--red);
}
.cc__shared.is-ok {
  background: var(--note-green);
  border-color: var(--green);
}
.cc__count {
  margin: var(--s-2) 0;
  font-size: 1.1rem;
}
.cc__count strong {
  font-size: 1.8rem;
}
.cc__verdict {
  margin: 0;
  font-weight: 800;
}
.cc__lock {
  margin: var(--s-2) 0 0;
  font-size: 0.7rem;
}
.cc__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 70px;
}
.cc__explain :deep(p) {
  margin: 0;
}
@container (max-width: 760px) {
  .cc__race {
    grid-template-columns: 1fr;
  }
  .cc__mem {
    grid-template-columns: 1fr;
  }
  .cc__lane,
  .cc__axis {
    grid-template-columns: 64px minmax(0, 1fr);
  }
}
</style>
