<script setup>
import { computed } from 'vue'
import { CheckSquare, Square, Trophy } from 'lucide-vue-next'
import { useProgressStore } from '../../stores/progress.js'
import { useUiStore } from '../../stores/ui.js'

const props = defineProps({
  lessonId: { type: String, required: true },
  compact: { type: Boolean, default: false },
})
const progress = useProgressStore()
const ui = useUiStore()

const reqs = computed(() => progress.requirements(props.lessonId))
const done = computed(() => progress.isComplete(props.lessonId))
const ready = computed(() => reqs.value.every((r) => r.met))

function complete() {
  if (progress.markComplete(props.lessonId)) ui.toast('Lesson complete. Nice work!', { tone: 'success' })
}
</script>

<template>
  <div class="cp" :class="{ 'cp--done': done, 'cp--compact': compact }">
    <p class="label cp__title">{{ done ? 'Completed' : 'To complete this lesson' }}</p>
    <ul v-if="reqs.length" class="cp__list">
      <li v-for="r in reqs" :key="r.key" :class="{ 'is-met': r.met }">
        <CheckSquare v-if="r.met" :size="16" aria-hidden="true" />
        <Square v-else :size="16" aria-hidden="true" />
        <span>
          <span class="visually-hidden">{{ r.met ? 'Done:' : 'To do:' }}</span>
          {{ r.label }}
          <small v-if="r.detail" class="cp__detail">{{ r.detail }}</small>
        </span>
      </li>
    </ul>
    <p v-else class="cp__none">This lesson has no activities — mark it complete when you've read it.</p>
    <button v-if="!done" type="button" class="btn btn--sm" :class="ready ? 'btn--acid' : ''" :disabled="!ready" @click="complete">
      <Trophy :size="14" aria-hidden="true" /> Mark lesson complete
    </button>
    <div v-else class="cp__done">
      <span class="sticker sticker--acid">done ✓</span>
      <button type="button" class="btn btn--sm btn--ghost" @click="progress.markIncomplete(lessonId)">Undo</button>
    </div>
  </div>
</template>

<style scoped>
.cp {
  border: var(--border);
  background: var(--surface);
  padding: var(--s-4);
  display: grid;
  gap: var(--s-3);
}
.cp--done {
  background: var(--note-green);
}
.cp__title {
  margin: 0;
}
.cp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  font-size: 0.88rem;
}
.cp__list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  line-height: 1.35;
}
.cp__list li + li {
  margin-top: 0;
}
.cp__list svg {
  flex: none;
  margin-top: 1px;
}
.cp__list .is-met {
  color: var(--green);
}
.cp__detail {
  display: block;
  color: var(--muted);
  font-size: 0.78rem;
}
.cp__none {
  margin: 0;
  font-size: 0.88rem;
}
.cp__done {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
</style>
