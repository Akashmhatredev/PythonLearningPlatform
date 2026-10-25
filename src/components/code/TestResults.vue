<script setup>
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'

const props = defineProps({
  results: { type: Array, default: null },
  running: { type: Boolean, default: false },
  tests: { type: Array, default: () => [] },
})
const passed = computed(() => props.results?.filter((r) => r.pass).length ?? 0)
</script>

<template>
  <div class="tests">
    <p v-if="running" class="tests__note" role="status">Running tests in the sandbox…</p>
    <template v-else-if="results">
      <p class="tests__summary" :class="passed === results.length ? 'is-pass' : 'is-fail'" role="status">
        {{ passed }}/{{ results.length }} passing
        <span class="tests__grading">test-graded</span>
      </p>
      <ul class="tests__list">
        <li v-for="r in results" :key="r.name" class="t" :class="r.pass ? 't--pass' : 't--fail'">
          <Check v-if="r.pass" :size="14" aria-label="passed" />
          <X v-else :size="14" aria-label="failed" />
          <div>
            <span class="t__name">{{ r.name }}</span>
            <pre v-if="!r.pass && r.error" class="t__err">{{ r.error }}</pre>
          </div>
        </li>
      </ul>
    </template>
    <template v-else>
      <p class="tests__note">Press <strong>Run tests</strong> to check your code. These checks run:</p>
      <ul class="tests__list">
        <li v-for="t in tests" :key="t.name" class="t"><span class="t__dot" aria-hidden="true">○</span> {{ t.name }}</li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.tests {
  height: 100%;
  overflow: auto;
  background: var(--code-bg);
  color: var(--code-text);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  padding: var(--s-2) 0;
}
.tests__note {
  margin: 0;
  padding: var(--s-2) var(--s-4);
  color: var(--code-muted);
}
.tests__summary {
  margin: 0 var(--s-4) var(--s-2);
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  gap: var(--s-3);
  align-items: center;
}
.tests__summary.is-pass {
  color: var(--acid);
}
.tests__summary.is-fail {
  color: #ff9a85;
}
.tests__grading {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1.5px solid var(--code-muted);
  color: var(--code-muted);
  padding: 0 5px;
  font-weight: 700;
}
.tests__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.t {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 5px var(--s-4);
  border-bottom: 1px solid var(--code-line);
}
.t + .t {
  margin-top: 0;
}
.t--pass {
  color: #c9f3a6;
}
.t--fail {
  color: #ffb4a6;
}
.t svg {
  flex: none;
  margin-top: 2px;
}
.t__err {
  margin: 4px 0 0;
  white-space: pre-wrap;
  font: inherit;
  color: #ffd2c8;
  opacity: 0.9;
}
.t__dot {
  color: var(--code-muted);
}
</style>
