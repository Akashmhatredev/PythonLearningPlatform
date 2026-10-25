<script setup>
// Accessible modal built on the native <dialog> element: focus is trapped,
// Escape closes it and the rest of the page becomes inert automatically.
import { nextTick, ref, useId, watch } from 'vue'
import { X } from 'lucide-vue-next'

const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  title: { type: String, required: true },
  size: { type: String, default: 'md' }, // sm | md | lg
  initialFocus: { type: String, default: '' }, // CSS selector inside the dialog
})
const emit = defineEmits(['close'])

const dialog = ref(null)
const titleId = useId()
let returnFocus = null

watch(
  open,
  async (isOpen) => {
    await nextTick()
    const el = dialog.value
    if (!el) return
    if (isOpen && !el.open) {
      returnFocus = document.activeElement
      el.showModal()
      if (props.initialFocus) el.querySelector(props.initialFocus)?.focus()
    } else if (!isOpen && el.open) {
      el.close()
    }
  },
  { immediate: true },
)

function onClose() {
  open.value = false
  emit('close')
  returnFocus?.focus?.()
}

function onBackdrop(e) {
  if (e.target === dialog.value) onClose()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :class="`modal--${size}`"
    :aria-labelledby="titleId"
    @close="onClose"
    @cancel.prevent="onClose"
    @click="onBackdrop"
  >
    <div class="modal__inner">
      <header class="modal__head">
        <h2 :id="titleId" class="modal__title">{{ title }}</h2>
        <button type="button" class="btn btn--icon btn--sm btn--ghost" aria-label="Close dialog" @click="onClose">
          <X :size="18" aria-hidden="true" />
        </button>
      </header>
      <div class="modal__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal__foot">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  padding: 0;
  border: var(--border);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
}
.modal--sm {
  width: min(420px, calc(100vw - 32px));
}
.modal--lg {
  width: min(860px, calc(100vw - 32px));
}
.modal::backdrop {
  background: color-mix(in srgb, #1a1a1a 55%, transparent);
}
.modal__inner {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 54px);
}
.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-3) var(--s-3) var(--s-5);
  border-bottom: var(--border);
  background: var(--acid);
  color: var(--acid-ink);
}
.modal__head .btn {
  --btn-fg: var(--acid-ink);
}
.modal__title {
  font-size: var(--step-1);
  margin: 0;
  font-stretch: 110%;
}
.modal__body {
  padding: var(--s-5);
  overflow: auto;
}
.modal__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--s-3);
  padding: var(--s-4) var(--s-5);
  border-top: var(--border);
  background: var(--surface-2);
}
</style>
