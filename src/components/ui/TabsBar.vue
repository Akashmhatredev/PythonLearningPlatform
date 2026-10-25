<script setup>
// Accessible tab list (WAI-ARIA tabs pattern): arrow keys move between tabs,
// Home/End jump, only the active tab is in the tab order.
import { ref } from 'vue'

const active = defineModel({ type: String, required: true })
const props = defineProps({
  tabs: { type: Array, required: true }, // [{ id, label, badge? }]
  label: { type: String, required: true },
  idPrefix: { type: String, required: true },
})

const buttons = ref([])

function focusTab(i) {
  const n = props.tabs.length
  const idx = (i + n) % n
  active.value = props.tabs[idx].id
  buttons.value[idx]?.focus()
}

function onKey(e, i) {
  if (e.key === 'ArrowRight') focusTab(i + 1)
  else if (e.key === 'ArrowLeft') focusTab(i - 1)
  else if (e.key === 'Home') focusTab(0)
  else if (e.key === 'End') focusTab(props.tabs.length - 1)
  else return
  e.preventDefault()
}
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="label">
    <button
      v-for="(tab, i) in tabs"
      :id="`${idPrefix}-tab-${tab.id}`"
      :key="tab.id"
      ref="buttons"
      type="button"
      role="tab"
      class="tabs__tab"
      :aria-selected="active === tab.id"
      :aria-controls="`${idPrefix}-panel-${tab.id}`"
      :tabindex="active === tab.id ? 0 : -1"
      @click="active = tab.id"
      @keydown="onKey($event, i)"
    >
      {{ tab.label }}
      <span v-if="tab.badge !== undefined && tab.badge !== null" class="tabs__badge">{{ tab.badge }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
}
.tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45em;
  border: 0;
  border-right: 2px solid var(--code-line);
  background: transparent;
  color: var(--code-muted);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0 0.9em;
  min-height: 40px;
  white-space: nowrap;
}
.tabs__tab[aria-selected='true'] {
  background: var(--code-bg);
  color: var(--acid);
  box-shadow: inset 0 3px 0 var(--acid);
}
.tabs__tab:hover {
  color: var(--code-text);
}
.tabs__tab:focus-visible {
  outline: 3px solid var(--acid);
  outline-offset: -3px;
}
.tabs__badge {
  min-width: 1.5em;
  padding: 0 0.35em;
  background: var(--red);
  color: #fff;
  font-size: 0.65rem;
  text-align: center;
  line-height: 1.5;
}
</style>
