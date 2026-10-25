<script setup>
import CodeBlock from '../code/CodeBlock.vue'
import RichText from './RichText.vue'

defineProps({
  mistakes: { type: Array, required: true }, // [{ title, wrong: {code, lang}, right: {code, lang}, explanation }]
})
</script>

<template>
  <ol class="mistakes">
    <li v-for="(m, i) in mistakes" :key="i" class="mistake">
      <h3 class="mistake__title"><span class="mistake__x" aria-hidden="true">✗</span> <RichText :value="m.title" inline /></h3>
      <div class="mistake__codes" :class="{ 'is-single': !m.right || !m.wrong }">
        <CodeBlock v-if="m.wrong" :code="m.wrong.code" :lang="m.wrong.lang || 'python'" :title="m.wrong.title || 'what people write'" tone="wrong" />
        <CodeBlock v-if="m.right" :code="m.right.code" :lang="m.right.lang || 'python'" :title="m.right.title || 'what to write instead'" tone="right" />
      </div>
      <RichText class="mistake__why" :value="m.explanation" />
    </li>
  </ol>
</template>

<style scoped>
.mistakes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s-6);
}
.mistake + .mistake {
  margin-top: 0;
}
.mistake__title {
  font-size: var(--step-1);
  font-stretch: 100%;
  line-height: 1.25;
  margin-bottom: var(--s-3);
}
.mistake__x {
  color: var(--red-text);
  font-family: var(--font-hand);
  font-size: 1.5em;
}
.mistake__codes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-4);
}
.mistake__codes.is-single {
  grid-template-columns: 1fr;
}
.mistake__why {
  margin-top: var(--s-4);
  padding-left: var(--s-4);
  border-left: 4px solid var(--red);
}
@media (max-width: 800px) {
  .mistake__codes {
    grid-template-columns: 1fr;
  }
}
</style>
