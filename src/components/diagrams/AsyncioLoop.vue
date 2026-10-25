<script setup>
// asyncio event-loop stepper. Each preset is a hand-written walk through how the
// event loop schedules the snippet; every printed order was verified by running
// the code with CPython semantics (time.sleep blocks the loop).
import { computed } from 'vue'
import AnimationControls from './AnimationControls.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'await-order' },
})

const BREW = `import asyncio

async def brew(drink, seconds):
    print("start", drink)
    await asyncio.sleep(seconds)
    print("done", drink)
`

const PRESETS = {
  'await-order': {
    code: `${BREW}
async def main():
    await brew("tea", 2)
    await brew("coffee", 1)

asyncio.run(main())`,
    steps: [
      { line: 12, clock: 0, ready: ['Task main()'], text: '`asyncio.run()` creates an **event loop** and wraps `main()` in a **Task** — the unit the loop schedules.' },
      { line: 9, clock: 0, running: ['main()'], text: 'The loop runs `main()`. `await brew("tea", 2)` runs the coroutine **inside main’s own task** — awaiting a coroutine does not start anything new.' },
      { line: 4, clock: 0, running: ['main()', 'brew("tea")'], out: ['start tea'], text: '`brew` prints `start tea`…' },
      { line: 5, clock: 0, waiting: ['main(): sleep → t=2s'], out: ['start tea'], text: '…then `await asyncio.sleep(2)` **suspends the task** and hands control back to the loop. Nothing else is ready, so the loop just waits.' },
      { line: 6, clock: 2, running: ['main()', 'brew("tea")'], out: ['start tea', 'done tea'], text: 'At t = 2 s the timer fires and the loop resumes `main` exactly where it paused.' },
      { line: 5, clock: 2, waiting: ['main(): sleep → t=3s'], out: ['start tea', 'done tea', 'start coffee'], text: 'Only now does `main` reach `brew("coffee", 1)`. Another wait…' },
      { line: 6, clock: 3, running: ['main()', 'brew("coffee")'], out: ['start tea', 'done tea', 'start coffee', 'done coffee'], text: 'Finished at **t = 3 s**. Awaiting coroutines one after another is still *sequential*. To overlap the waits you need more than one task.' },
    ],
  },
  gather: {
    code: `${BREW}
async def main():
    await asyncio.gather(brew("tea", 2), brew("coffee", 1))

asyncio.run(main())`,
    steps: [
      { line: 11, clock: 0, ready: ['Task main()'], text: '`asyncio.run()` starts the loop with `main()` as its first task.' },
      { line: 9, clock: 0, running: ['main()'], ready: ['Task tea', 'Task coffee'], text: '`asyncio.gather()` wraps **each** coroutine in its own Task and schedules them. `main` will wait until all of them finish.' },
      { line: 4, clock: 0, running: ['Task tea'], ready: ['Task coffee'], waiting: ['main(): gather'], out: ['start tea'], text: 'The loop runs the tea task: `start tea`.' },
      { line: 5, clock: 0, ready: ['Task coffee'], waiting: ['main(): gather', 'tea: sleep → t=2s'], out: ['start tea'], text: 'Tea awaits `sleep(2)` and **gives the loop back**…' },
      { line: 4, clock: 0, running: ['Task coffee'], waiting: ['main(): gather', 'tea: sleep → t=2s'], out: ['start tea', 'start coffee'], text: '…so the loop can run coffee straight away: `start coffee`.' },
      { line: 5, clock: 0, waiting: ['main(): gather', 'tea: sleep → t=2s', 'coffee: sleep → t=1s'], out: ['start tea', 'start coffee'], text: 'Now **both** timers are ticking at the same time. One thread, overlapping waits — that’s concurrency.' },
      { line: 6, clock: 1, running: ['Task coffee'], waiting: ['main(): gather', 'tea: sleep → t=2s'], out: ['start tea', 'start coffee', 'done coffee'], text: 'Coffee’s timer fires first: `done coffee`.' },
      { line: 6, clock: 2, running: ['Task tea'], waiting: ['main(): gather'], out: ['start tea', 'start coffee', 'done coffee', 'done tea'], text: 'Then tea: `done tea`.' },
      { line: 9, clock: 2, running: ['main()'], out: ['start tea', 'start coffee', 'done coffee', 'done tea'], text: 'All tasks done, so `gather` returns their results (in **argument** order) and `main` resumes. Total ≈ **2 s** instead of 3.' },
    ],
  },
  'create-task': {
    code: `import asyncio

async def ping(name):
    print("ping", name)
    await asyncio.sleep(0)
    print("pong", name)

async def main():
    task = asyncio.create_task(ping("A"))
    print("task created")
    await ping("B")
    await task

asyncio.run(main())`,
    steps: [
      { line: 14, ready: ['Task main()'], text: 'The loop starts with `main()`.' },
      { line: 9, running: ['main()'], ready: ['Task A'], text: '`create_task(ping("A"))` **schedules** A as a new task. It does not run yet — `main` keeps the loop until it awaits something.' },
      { line: 10, running: ['main()'], ready: ['Task A'], out: ['task created'], text: 'So `task created` prints first.' },
      { line: 4, running: ['main()', 'ping("B")'], ready: ['Task A'], out: ['task created', 'ping B'], text: '`await ping("B")` runs B **inside main’s task**, immediately: `ping B`.' },
      { line: 5, ready: ['Task A', 'Task main()'], out: ['task created', 'ping B'], text: '`await asyncio.sleep(0)` means “let others run”: main goes to the back of the ready queue.' },
      { line: 4, running: ['Task A'], ready: ['Task main()'], out: ['task created', 'ping B', 'ping A'], text: 'A finally gets its turn: `ping A`, then it also yields at `sleep(0)`.' },
      { line: 6, running: ['main()', 'ping("B")'], ready: ['Task A'], out: ['task created', 'ping B', 'ping A', 'pong B'], text: 'Main resumes inside B: `pong B`.' },
      { line: 12, waiting: ['main(): await task A'], ready: ['Task A'], out: ['task created', 'ping B', 'ping A', 'pong B'], text: '`await task` — A isn’t finished, so main waits for it.' },
      { line: 6, running: ['Task A'], waiting: ['main(): await task A'], out: ['task created', 'ping B', 'ping A', 'pong B', 'pong A'], text: 'A resumes: `pong A`. Final order: **task created, ping B, ping A, pong B, pong A** — tasks only switch at `await`.' },
    ],
  },
  blocking: {
    code: `import asyncio
import time

async def heartbeat():
    for _ in range(3):
        print("beat")
        await asyncio.sleep(0.1)

async def slow_report():
    time.sleep(0.3)  # blocks the whole event loop!
    print("report ready")

async def main():
    await asyncio.gather(heartbeat(), slow_report())

asyncio.run(main())`,
    steps: [
      { line: 14, clock: 0, ready: ['Task heartbeat', 'Task report'], waiting: ['main(): gather'], text: '`gather` schedules two tasks: a heartbeat that should beat every 0.1 s, and a report.' },
      { line: 6, clock: 0, running: ['Task heartbeat'], ready: ['Task report'], waiting: ['main(): gather'], out: ['beat'], text: 'First beat at t = 0.' },
      { line: 7, clock: 0, ready: ['Task report'], waiting: ['main(): gather', 'heartbeat: sleep → t=0.1s'], out: ['beat'], text: 'Heartbeat awaits `asyncio.sleep(0.1)` — it will be ready again at 0.1 s.' },
      { line: 10, clock: 0.1, blocked: true, running: ['Task report'], waiting: ['main(): gather', 'heartbeat: READY since 0.1s ⏰'], out: ['beat'], text: '`time.sleep(0.3)` is a **blocking** call: it never awaits, so the loop’s only thread is stuck inside it. The heartbeat’s timer has fired, but nothing can run it.' },
      { line: 11, clock: 0.3, running: ['Task report'], waiting: ['main(): gather', 'heartbeat: READY since 0.1s ⏰'], out: ['beat', 'report ready'], text: '0.3 s later the report finishes…' },
      { line: 6, clock: 0.3, running: ['Task heartbeat'], waiting: ['main(): gather'], out: ['beat', 'report ready', 'beat'], text: '…and only now does the heartbeat get to run — **0.2 s late**.' },
      { line: 6, clock: 0.4, running: ['Task heartbeat'], waiting: ['main(): gather'], out: ['beat', 'report ready', 'beat', 'beat'], text: 'Fix: use `await asyncio.sleep(...)`, an async library, or move blocking work off the loop with `await asyncio.to_thread(fn)`. One blocking call freezes *every* task.' },
    ],
  },
}

const def = PRESETS[props.preset] ?? PRESETS['await-order']
const player = useStepPlayer(() => def.steps, { interval: 2600 })
const step = computed(() => player.frame.value ?? def.steps[0])
const outLines = computed(() => {
  for (let i = player.index.value; i >= 0; i--) if (def.steps[i].out) return def.steps[i].out
  return []
})
const hasClock = computed(() => def.steps.some((s) => s.clock !== undefined))
</script>

<template>
  <div class="al" :class="{ 'is-blocked': step.blocked }">
    <div class="al__top">
      <CodeBlock :code="def.code" lang="python" title="main.py" :highlight="step.line ? [step.line] : []" :copyable="false" />
      <div class="al__console code-panel">
        <div class="code-panel__bar">
          <span class="code-panel__title"><span class="dot" aria-hidden="true" />output</span>
          <span v-if="hasClock" class="al__clock mono">t = {{ step.clock ?? 0 }} s</span>
        </div>
        <ol class="al__out mono">
          <li v-for="(o, i) in outLines" :key="i" :class="{ 'is-new': i === outLines.length - 1 }">{{ o }}</li>
          <li v-if="!outLines.length" class="al__empty">(nothing yet)</li>
        </ol>
      </div>
    </div>
    <div class="al__lanes">
      <section class="al__lane al__lane--run">
        <p class="label">running now <span class="muted">· one at a time</span></p>
        <ol class="al__stack">
          <li v-for="(f, i) in [...(step.running ?? [])].reverse()" :key="f + i" class="al__item al__item--run">{{ f }}</li>
          <li v-if="!step.running?.length" class="al__empty">loop idle — waiting for a timer or I/O</li>
        </ol>
        <p v-if="step.blocked" class="al__blocked mono">⛔ thread blocked by time.sleep()</p>
      </section>
      <section class="al__lane">
        <p class="label">ready queue</p>
        <ul>
          <li v-for="t in step.ready ?? []" :key="t" class="al__item">{{ t }}</li>
          <li v-if="!step.ready?.length" class="al__empty">empty</li>
        </ul>
      </section>
      <section class="al__lane al__lane--wait">
        <p class="label">waiting (timers, I/O, other tasks)</p>
        <ul>
          <li v-for="w in step.waiting ?? []" :key="w" class="al__item al__item--wait">{{ w }}</li>
          <li v-if="!step.waiting?.length" class="al__empty">—</li>
        </ul>
      </section>
    </div>
    <div class="al__explain" aria-live="polite">
      <RichText :value="step.text" />
    </div>
    <AnimationControls :player="player" label="asyncio event loop" />
  </div>
</template>

<style scoped>
.al {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.al__top {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--s-3);
}
.al__console {
  box-shadow: none;
}
.al__clock {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--acid);
}
.al__out {
  list-style: none;
  margin: 0;
  padding: var(--s-3);
  font-size: 0.85rem;
  min-height: 110px;
  color: var(--code-text);
}
.al__out li {
  margin: 0;
}
.al__out li.is-new {
  color: var(--acid);
}
.al__lanes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-2);
}
.al__lane {
  border: var(--border-thin);
  background: var(--surface);
  padding: var(--s-2);
  min-height: 130px;
}
.al__lane--run {
  background: var(--note-blue);
}
.al__lane--wait {
  background: var(--note-yellow);
}
.al__lane .label {
  margin: 0 0 6px;
  color: var(--muted);
}
.al__lane ul,
.al__stack {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.al__lane li + li {
  margin: 0;
}
.al__item {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 4px 6px;
  border: 2px solid var(--line);
  background: var(--surface-2);
  animation: drop 220ms steps(3);
}
.al__item--run {
  background: var(--cobalt);
  color: var(--cobalt-ink);
}
.al__item--wait {
  border-style: dashed;
  background: var(--surface);
}
.al__empty {
  font-size: 0.75rem;
  color: var(--muted);
}
.al__blocked {
  margin: 6px 0 0;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--red-text);
}
.is-blocked .al__lane--run {
  border-color: var(--red);
  box-shadow: 3px 3px 0 var(--red);
}
.al__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 70px;
}
.al__explain :deep(p) {
  margin: 0;
}
@keyframes drop {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
}
@container (max-width: 760px) {
  .al__top {
    grid-template-columns: 1fr;
  }
  .al__lanes {
    grid-template-columns: 1fr;
  }
}
</style>
