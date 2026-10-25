<script setup>
// Three depths of the same explanation: beginner → technical → production.
import { computed, ref, useId } from 'vue'
import RichText from './RichText.vue'

const props = defineProps({
  layers: { type: Object, required: true }, // { beginner, technical, production }
})
const uid = useId()
const tabs = computed(() =>
  [
    { id: 'beginner', label: '① What a beginner needs' },
    { id: 'technical', label: '② How it works technically' },
    { id: 'production', label: '③ How pros apply it' },
  ].filter((t) => props.layers[t.id]),
)
const active = ref(tabs.value[0]?.id)

function onKey(e, i) {
  const n = tabs.value.length
  let next = null
  if (e.key === 'ArrowRight') next = (i + 1) % n
  if (e.key === 'ArrowLeft') next = (i - 1 + n) % n
  if (next === null) return
  e.preventDefault()
  active.value = tabs.value[next].id
  document.getElementById(`${uid}-t-${tabs.value[next].id}`)?.focus()
}
</script>

<template>
  <div class="layers">
    <div class="layers__tabs" role="tablist" aria-label="Explanation depth">
      <button
        v-for="(t, i) in tabs"
        :id="`${uid}-t-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        class="layers__tab"
        :aria-selected="active === t.id"
        :aria-controls="`${uid}-p-${t.id}`"
        :tabindex="active === t.id ? 0 : -1"
        @click="active = t.id"
        @keydown="onKey($event, i)"
      >
        {{ t.label }}
      </button>
    </div>
    <div
      v-for="t in tabs"
      v-show="active === t.id"
      :id="`${uid}-p-${t.id}`"
      :key="t.id"
      class="layers__panel"
      role="tabpanel"
      :aria-labelledby="`${uid}-t-${t.id}`"
      tabindex="0"
    >
      <RichText :value="layers[t.id]" />
    </div>
  </div>
</template>

<style scoped>
.layers {
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.layers__tabs {
  display: flex;
  flex-wrap: wrap;
  border-bottom: var(--border);
}
.layers__tab {
  flex: 1 1 200px;
  border: 0;
  border-right: var(--border-thin);
  background: var(--surface-2);
  padding: var(--s-3);
  font-weight: 800;
  font-size: 0.9rem;
  text-align: left;
  color: var(--text);
}
.layers__tab:last-child {
  border-right: 0;
}
.layers__tab[aria-selected='true'] {
  background: var(--acid);
  color: var(--acid-ink);
}
.layers__panel {
  padding: var(--s-5);
}
</style>
