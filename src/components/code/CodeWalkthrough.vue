<script setup>
// Step-by-step explanation of a code sample: each step spotlights lines.
import { computed } from 'vue'
import CodeBlock from './CodeBlock.vue'
import AnimationControls from '../diagrams/AnimationControls.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  code: { type: String, required: true },
  lang: { type: String, default: 'python' },
  title: { type: String, default: '' },
  steps: { type: Array, required: true }, // [{ lines: [start, end?], text }]
})

const player = useStepPlayer(() => props.steps, { interval: 4200 })
const highlight = computed(() => {
  const s = player.frame.value
  if (!s) return []
  const [a, b = a] = s.lines
  return [[a, b]]
})
</script>

<template>
  <div class="wt">
    <div class="wt__code">
      <CodeBlock :code="code" :lang="lang" :title="title" :highlight="highlight" dim />
    </div>
    <div class="wt__side">
      <AnimationControls :player="player" label="Walkthrough" />
      <ol class="wt__steps">
        <li v-for="(s, i) in steps" :key="i">
          <button
            type="button"
            class="wt__step"
            :class="{ 'is-active': player.index.value === i }"
            :aria-current="player.index.value === i ? 'step' : undefined"
            @click="player.goTo(i)"
          >
            <span class="wt__lines mono">L{{ s.lines[0] }}{{ s.lines[1] && s.lines[1] !== s.lines[0] ? '–' + s.lines[1] : '' }}</span>
            <RichText class="wt__text" :value="s.text" />
          </button>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.wt {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--s-5);
  align-items: start;
}
.wt__code {
  min-width: 0; /* grid items: let long code lines scroll inside their panel instead of widening the page */
  position: sticky;
  top: calc(var(--header-h) + 64px);
}
.wt__side {
  min-width: 0; /* grid items: let long code lines scroll inside their panel instead of widening the page */
  display: grid;
  gap: var(--s-3);
}
.wt__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s-2);
}
.wt__steps li + li {
  margin-top: 0;
}
.wt__step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--s-3);
  width: 100%;
  text-align: left;
  padding: var(--s-3);
  border: var(--border-thin);
  background: var(--surface);
  color: var(--text);
}
.wt__step:hover {
  background: var(--surface-2);
}
.wt__step.is-active {
  background: var(--note-yellow);
  border-color: var(--line);
  box-shadow: var(--shadow-sm);
}
.wt__lines {
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--text);
  color: var(--bg);
  padding: 2px 6px;
  height: fit-content;
}
.wt__text :deep(p:last-child) {
  margin-bottom: 0;
}
.wt__text {
  font-size: 0.95rem;
}
@media (max-width: 1000px) {
  .wt {
    grid-template-columns: 1fr;
  }
  .wt__code {
    position: static;
  }
}
</style>
