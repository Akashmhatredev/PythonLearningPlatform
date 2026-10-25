<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { lessonEntries } from '../content/index.js'
import { searchIndex } from '../utils/search.js'
import { useUiStore } from '../stores/ui.js'

const route = useRoute()
const ui = useUiStore()
const path = computed(() => route.fullPath)
// Suggest lessons that look like the words in the broken URL.
const suggestions = computed(() => {
  const words = route.path.split(/[/\-_]+/).filter((w) => w.length > 2).join(' ')
  return words ? searchIndex(lessonEntries(), words, { limit: 5 }) : []
})
</script>

<template>
  <div class="page nf">
    <p class="nf__code" aria-hidden="true">404</p>
    <h1 class="nf__title">This page doesn’t exist.</h1>
    <p class="nf__path mono">No route matched <code>{{ path }}</code> — fittingly, this page is the catch-all route <code>/:pathMatch(.*)*</code>.</p>
    <div v-if="suggestions.length" class="nf__sugg">
      <p class="label">maybe you meant</p>
      <ul>
        <li v-for="s in suggestions" :key="s.id"><RouterLink :to="s.to">{{ s.title }}</RouterLink></li>
      </ul>
    </div>
    <div class="cluster">
      <RouterLink to="/" class="btn btn--cobalt">Home</RouterLink>
      <RouterLink to="/learn" class="btn">Course explorer</RouterLink>
      <button type="button" class="btn btn--ghost" @click="ui.searchOpen = true">Search</button>
    </div>
  </div>
</template>

<style scoped>
.nf {
  max-width: 900px;
}
.nf__code {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: clamp(6rem, 3rem + 18vw, 16rem);
  line-height: 0.85;
  margin: 0;
  color: transparent;
  -webkit-text-stroke: 4px var(--text);
}
.nf__title {
  margin-top: var(--s-4);
}
.nf__path {
  font-size: 0.85rem;
}
.nf__sugg {
  margin: var(--s-5) 0;
}
</style>
