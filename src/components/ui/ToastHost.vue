<script setup>
import { X } from 'lucide-vue-next'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()
</script>

<template>
  <!-- polite live region: screen readers announce toasts without stealing focus -->
  <div class="toasts" role="status" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="`toast--${t.tone}`">
        <span class="toast__msg">{{ t.message }}</span>
        <button type="button" class="toast__x" aria-label="Dismiss notification" @click="ui.dismiss(t.id)">
          <X :size="16" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 60;
  display: grid;
  gap: var(--s-3);
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-3) var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
  font-weight: 600;
}
.toast--success {
  background: var(--acid);
  color: var(--acid-ink);
}
.toast--error {
  background: var(--red);
  color: #fff;
}
.toast__msg {
  flex: 1;
}
.toast__x {
  border: 0;
  background: none;
  padding: 2px;
  color: inherit;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    transform 180ms steps(3),
    opacity 180ms steps(3);
}
.toast-enter-from,
.toast-leave-to {
  transform: translateX(30px) rotate(2deg);
  opacity: 0;
}
</style>
