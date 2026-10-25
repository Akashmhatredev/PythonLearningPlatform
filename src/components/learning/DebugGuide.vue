<script setup>
import RichText from './RichText.vue'

defineProps({
  items: { type: Array, required: true }, // [{ symptom, cause, fix }]
})
</script>

<template>
  <div class="debug">
    <div v-for="(d, i) in items" :key="i" class="debug__row">
      <div class="debug__cell debug__cell--symptom">
        <span class="label">symptom</span>
        <RichText :value="d.symptom" />
      </div>
      <div class="debug__cell">
        <span class="label">likely cause</span>
        <RichText :value="d.cause" />
      </div>
      <div class="debug__cell debug__cell--fix">
        <span class="label">fix</span>
        <RichText :value="d.fix" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug {
  border: var(--border);
  background: var(--surface);
}
.debug__row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
}
.debug__row + .debug__row {
  border-top: var(--border-thin);
}
.debug__cell {
  padding: var(--s-3) var(--s-4);
  font-size: 0.95rem;
}
.debug__cell + .debug__cell {
  border-left: var(--border-thin);
}
.debug__cell .label {
  display: block;
  color: var(--muted);
  margin-bottom: 4px;
}
.debug__cell :deep(p:last-child) {
  margin-bottom: 0;
}
.debug__cell--symptom {
  background: var(--note-yellow);
  font-weight: 600;
}
.debug__cell--fix {
  background: var(--note-green);
}
@media (max-width: 800px) {
  .debug__row {
    grid-template-columns: 1fr;
  }
  .debug__cell + .debug__cell {
    border-left: 0;
    border-top: 1.5px dashed color-mix(in srgb, var(--line) 35%, transparent);
  }
}
</style>
