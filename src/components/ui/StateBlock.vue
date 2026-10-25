<script setup>
// One component for loading / error / empty states so they look consistent.
import { AlertTriangle, Inbox, Loader } from 'lucide-vue-next'

defineProps({
  kind: { type: String, default: 'empty' }, // loading | error | empty
  title: { type: String, default: '' },
})
</script>

<template>
  <div class="state" :class="`state--${kind}`" :role="kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : null">
    <Loader v-if="kind === 'loading'" class="state__icon spin" :size="28" aria-hidden="true" />
    <AlertTriangle v-else-if="kind === 'error'" class="state__icon" :size="28" aria-hidden="true" />
    <Inbox v-else class="state__icon" :size="28" aria-hidden="true" />
    <div>
      <p class="state__title">{{ title || (kind === 'loading' ? 'Loading…' : kind === 'error' ? 'Something went wrong' : 'Nothing here yet') }}</p>
      <div class="state__body"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.state {
  display: flex;
  gap: var(--s-4);
  align-items: flex-start;
  padding: var(--s-5);
  border: var(--border);
  border-style: dashed;
  background: var(--surface);
}
.state--error {
  border-style: solid;
  background: #ffe1da;
  color: #1a1a1a;
}
:root[data-theme='dark'] .state--error {
  background: #3a1d17;
  color: var(--text);
}
.state__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--step-1);
  margin: 0 0 var(--s-2);
  line-height: 1.2;
}
.state__body :deep(p:last-child) {
  margin-bottom: 0;
}
.state__icon {
  flex: none;
  margin-top: 2px;
}
.spin {
  animation: spin 0.9s steps(8) infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
