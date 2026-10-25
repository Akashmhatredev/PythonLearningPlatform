<script setup>
// Data-driven stepped diagram. Lessons describe nodes, edges and steps; this
// component lays them out, draws hand-made-looking arrows and walks through the
// steps. Auto layouts reflow into a column on narrow screens.
import { computed, useId } from 'vue'
import AnimationControls from './AnimationControls.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'
import { useMediaQuery } from '../../composables/useMediaQuery.js'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, default: () => [] },
  steps: { type: Array, default: () => [] },
  layout: { type: String, default: 'row' }, // row | column | grid
  cols: { type: Number, default: 0 },
  width: { type: Number, default: 760 },
  height: { type: Number, default: 320 },
})

const uid = useId()
const narrow = useMediaQuery('(max-width: 640px)')
const player = useStepPlayer(() => props.steps, { interval: 3200 })
const step = player.frame

const explicit = computed(() => props.nodes.every((n) => typeof n.x === 'number' && typeof n.y === 'number'))
const mode = computed(() => (explicit.value ? 'explicit' : narrow.value ? 'column' : props.layout))

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line)
      line = w
    } else line = (line + ' ' + w).trim()
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

const layoutData = computed(() => {
  const n = props.nodes.length
  let W = props.width
  let H = props.height
  let cols = 1
  let rows = 1
  if (mode.value === 'row') {
    cols = n <= 5 ? n : Math.ceil(n / 2)
    rows = Math.ceil(n / cols)
    H = Math.max(H, rows * 130)
  } else if (mode.value === 'grid') {
    cols = props.cols || Math.ceil(Math.sqrt(n))
    rows = Math.ceil(n / cols)
    H = Math.max(H, rows * 130)
  } else if (mode.value === 'column') {
    W = 420
    H = n * 104 + 20
  }
  const cellW = mode.value === 'explicit' ? 170 : mode.value === 'column' ? 300 : W / cols
  const boxW = Math.min(mode.value === 'column' ? 280 : 190, cellW - 24)
  const maxChars = Math.max(8, Math.floor((boxW - 20) / 8.2))

  const nodes = props.nodes.map((node, i) => {
    let x
    let y
    if (mode.value === 'explicit') {
      x = node.x
      y = node.y
    } else if (mode.value === 'column') {
      x = W / 2
      y = 60 + i * 104
    } else {
      const r = Math.floor(i / cols)
      const c = i % cols
      const inRow = Math.min(cols, n - r * cols)
      x = (W / inRow) * (c + 0.5)
      y = (H / rows) * (r + 0.5)
    }
    const lines = wrap(node.label, maxChars)
    const noteLines = node.note ? wrap(node.note, maxChars + 4).slice(0, 2) : []
    const h = 22 + lines.length * 18 + noteLines.length * 15
    return { ...node, x, y, w: boxW, h, lines, noteLines }
  })
  return { W, H, nodes }
})

const byId = computed(() => Object.fromEntries(layoutData.value.nodes.map((n) => [n.id, n])))

// Point where the segment from the box centre towards (tx, ty) leaves the box.
function exitPoint(box, tx, ty) {
  const dx = tx - box.x
  const dy = ty - box.y
  if (!dx && !dy) return { x: box.x, y: box.y }
  const sx = dx ? box.w / 2 / Math.abs(dx) : Infinity
  const sy = dy ? box.h / 2 / Math.abs(dy) : Infinity
  const s = Math.min(sx, sy)
  return { x: box.x + dx * s, y: box.y + dy * s }
}

const edges = computed(() =>
  props.edges
    .map((e) => {
      const a = byId.value[e.from]
      const b = byId.value[e.to]
      if (!a || !b) return null
      const id = e.id ?? `${e.from}->${e.to}`
      const reverse = props.edges.some((o) => o.from === e.to && o.to === e.from)
      const p1 = exitPoint(a, b.x, b.y)
      const p2 = exitPoint(b, a.x, a.y)
      const mx = (p1.x + p2.x) / 2
      const my = (p1.y + p2.y) / 2
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
      const bend = (reverse ? 26 : 10) * (e.bend ?? 1)
      const cx = mx + (-(p2.y - p1.y) / len) * bend
      const cy = my + ((p2.x - p1.x) / len) * bend
      return { ...e, id, d: `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`, lx: (mx + cx) / 2, ly: (my + cy) / 2 }
    })
    .filter(Boolean),
)

const focus = computed(() => new Set(step.value?.focus ?? []))
const activeEdges = computed(() => new Set(step.value?.edges ?? []))
const dimming = computed(() => focus.value.size > 0 || activeEdges.value.size > 0)
const edgeTouchesFocus = (e) => focus.value.has(e.from) && focus.value.has(e.to)
</script>

<template>
  <div class="cd">
    <div class="cd__canvas graph-paper" :class="{ 'cd__canvas--scroll': mode === 'explicit' }">
      <svg
        class="cd__svg"
        :viewBox="`0 0 ${layoutData.W} ${layoutData.H}`"
        :style="{ minWidth: mode === 'explicit' ? '560px' : null, maxWidth: mode === 'column' ? '440px' : null }"
        role="img"
        :aria-label="`Diagram: ${nodes.map((n) => n.label).join(', ')}`"
      >
        <defs>
          <marker :id="`${uid}-arrow`" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="cd__mk" />
          </marker>
          <marker :id="`${uid}-arrow-on`" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="cd__mk cd__mk--on" />
          </marker>
        </defs>
        <g
          v-for="e in edges"
          :key="e.id"
          class="cd__edge"
          :class="{ 'is-active': activeEdges.has(e.id), 'is-dim': dimming && !activeEdges.has(e.id) && !edgeTouchesFocus(e) }"
        >
          <path :d="e.d" fill="none" :stroke-dasharray="e.dashed ? '7 6' : null" :marker-end="`url(#${uid}-arrow${activeEdges.has(e.id) ? '-on' : ''})`" />
          <g v-if="e.label">
            <rect :x="e.lx - e.label.length * 3.6 - 6" :y="e.ly - 11" :width="e.label.length * 7.2 + 12" height="20" class="cd__elabel-bg" />
            <text :x="e.lx" :y="e.ly + 4" text-anchor="middle" class="cd__elabel">{{ e.label }}</text>
          </g>
        </g>
        <g
          v-for="node in layoutData.nodes"
          :key="node.id"
          class="cd__node"
          :class="[`tone-${node.tone || 'paper'}`, { 'is-focus': focus.has(node.id), 'is-dim': dimming && !focus.has(node.id) }]"
        >
          <rect class="cd__shadow" :x="node.x - node.w / 2 + 5" :y="node.y - node.h / 2 + 5" :width="node.w" :height="node.h" />
          <rect class="cd__box" :x="node.x - node.w / 2" :y="node.y - node.h / 2" :width="node.w" :height="node.h" />
          <text class="cd__label" text-anchor="middle">
            <tspan v-for="(l, i) in node.lines" :key="i" :x="node.x" :y="node.y - node.h / 2 + 24 + i * 18">{{ l }}</tspan>
          </text>
          <text v-if="node.noteLines.length" class="cd__note" text-anchor="middle">
            <tspan v-for="(l, i) in node.noteLines" :key="i" :x="node.x" :y="node.y - node.h / 2 + 24 + node.lines.length * 18 + i * 15">{{ l }}</tspan>
          </text>
        </g>
      </svg>
    </div>

    <template v-if="steps.length">
      <div class="cd__explain" aria-live="polite">
        <span class="label cd__count">step {{ player.index.value + 1 }} / {{ player.total.value }}</span>
        <RichText :value="step?.text ?? ''" />
      </div>
      <AnimationControls :player="player" label="Diagram" />
    </template>
  </div>
</template>

<style scoped>
.cd {
  display: grid;
  gap: var(--s-3);
}
.cd__canvas {
  border: var(--border-thin);
  padding: var(--s-2);
  display: flex;
  justify-content: center;
}
.cd__canvas--scroll {
  overflow-x: auto;
  justify-content: flex-start;
}
.cd__svg {
  width: 100%;
  height: auto;
  color: var(--text);
  overflow: visible;
}
.cd__mk {
  fill: var(--text);
}
.cd__mk--on {
  fill: var(--red);
}
.cd__edge {
  color: var(--text);
  transition: opacity var(--med) var(--snap);
}
.cd__edge path {
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
}
.cd__edge.is-active {
  color: var(--red);
}
.cd__edge.is-active path {
  stroke-width: 4;
  stroke-dasharray: 9 6;
  animation: flow 0.8s linear infinite;
}
.cd__edge.is-dim {
  opacity: 0.25;
}
.cd__elabel-bg {
  fill: var(--surface);
  stroke: currentColor;
  stroke-width: 1.5;
}
.cd__elabel {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  fill: currentColor;
}
.cd__node {
  transition: opacity var(--med) var(--snap);
}
.cd__box {
  fill: var(--surface);
  stroke: var(--line);
  stroke-width: 3;
}
.cd__shadow {
  fill: var(--shadow-color);
}
.cd__label {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  fill: var(--text);
}
.cd__note {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--muted);
}
/* yellow/blue are the Python-palette names for acid/cobalt; both spellings work */
.tone-acid .cd__box,
.tone-yellow .cd__box {
  fill: var(--acid);
}
.tone-acid .cd__label,
.tone-acid .cd__note,
.tone-yellow .cd__label,
.tone-yellow .cd__note {
  fill: var(--acid-ink);
}
.tone-cobalt .cd__box,
.tone-blue .cd__box {
  fill: var(--cobalt);
}
.tone-cobalt .cd__label,
.tone-cobalt .cd__note,
.tone-blue .cd__label,
.tone-blue .cd__note,
.tone-red .cd__label,
.tone-red .cd__note {
  fill: #fff;
}
.tone-red .cd__box {
  fill: var(--red);
}
.tone-ink .cd__box {
  fill: #1a1a1a;
}
.tone-ink .cd__label {
  fill: #f1eee5;
}
.tone-ink .cd__note {
  fill: #bdb8aa;
}
.tone-kraft .cd__box {
  fill: var(--kraft);
}
.tone-kraft .cd__label,
.tone-kraft .cd__note {
  fill: #1a1a1a;
}
.cd__node.is-focus .cd__box {
  stroke-width: 5;
  stroke: var(--red);
}
.cd__node.is-focus .cd__shadow {
  fill: var(--red);
}
.cd__node.is-dim {
  opacity: 0.35;
}
.cd__explain {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 80px;
}
.cd__explain :deep(p:last-child) {
  margin-bottom: 0;
}
.cd__count {
  width: fit-content;
  background: var(--text);
  color: var(--bg);
  padding: 1px 6px;
}
@keyframes flow {
  to {
    stroke-dashoffset: -30;
  }
}
</style>
