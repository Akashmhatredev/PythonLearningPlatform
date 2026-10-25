<script setup>
defineProps({
  num: { type: Number, required: true },
  phase: { type: String, required: true },
  title: { type: String, required: true },
  id: { type: String, required: true },
})
</script>

<template>
  <header class="sh">
    <span class="sh__num" aria-hidden="true">{{ String(num).padStart(2, '0') }}</span>
    <div class="sh__text">
      <span class="label sh__phase">{{ phase }}</span>
      <h2 :id="`${id}-title`" class="sh__title">{{ title }}</h2>
    </div>
  </header>
</template>

<style scoped>
.sh {
  display: flex;
  align-items: flex-end;
  gap: var(--s-4);
  margin-bottom: var(--s-5);
  padding-bottom: var(--s-3);
  border-bottom: var(--border);
}
.sh__num {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: var(--step-4);
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 2px var(--text);
  flex: none;
}
.sh__phase {
  display: inline-block;
  background: var(--acid);
  color: var(--acid-ink);
  padding: 1px 6px;
  border: 2px solid var(--line);
  margin-bottom: 6px;
}
.sh__title {
  font-size: var(--step-2);
  margin: 0;
}
</style>
