<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true }, // 0..1
  label: { type: String, required: true },
  showValue: { type: Boolean, default: true },
})
const pct = computed(() => Math.round(Math.max(0, Math.min(1, props.value)) * 100))
</script>

<template>
  <div class="pbar">
    <div class="pbar__row">
      <span class="label">{{ label }}</span>
      <span v-if="showValue" class="pbar__val mono">{{ pct }}%</span>
    </div>
    <div class="bar" role="progressbar" :aria-label="label" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="pct">
      <span :style="{ width: pct + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.pbar {
  display: grid;
  gap: 6px;
}
.pbar__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--s-2);
}
.pbar__val {
  font-weight: 800;
  font-size: 0.85rem;
}
</style>
