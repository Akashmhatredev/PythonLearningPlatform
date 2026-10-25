<script setup>
// The 5-part structure for spoken technical answers. A personal checklist —
// ticking boxes is for the learner's own reflection, never a grade.
import { reactive } from 'vue'

const steps = [
  { id: 'define', label: 'Define it' },
  { id: 'why', label: 'Why it is useful' },
  { id: 'how', label: 'How it works' },
  { id: 'example', label: 'Code / example' },
  { id: 'tradeoff', label: 'Trade-off or real use' },
]
const done = reactive({})
</script>

<template>
  <div class="frame" role="group" aria-label="Answer structure checklist">
    <span class="label frame__title">answer frame</span>
    <label v-for="(s, i) in steps" :key="s.id" class="frame__step" :class="{ 'is-done': done[s.id] }">
      <input v-model="done[s.id]" type="checkbox" />
      <span class="mono">{{ i + 1 }}</span> {{ s.label }}
    </label>
  </div>
</template>

<style scoped>
.frame {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.frame__title {
  color: var(--muted);
  margin-right: 4px;
}
.frame__step {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1.5px dashed var(--line);
  font-size: 0.8rem;
  cursor: pointer;
}
.frame__step input {
  position: absolute;
  opacity: 0;
}
.frame__step:focus-within {
  outline: 3px solid var(--cobalt);
}
.frame__step.is-done {
  border-style: solid;
  background: var(--acid);
  color: var(--acid-ink);
}
.frame__step .mono {
  font-weight: 800;
}
</style>
