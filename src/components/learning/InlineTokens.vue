<script setup>
// Renders inline markdown tokens (see utils/markdown.js). Recursive.
import { getLessonMeta } from '../../content/index.js'

defineProps({
  tokens: { type: Array, required: true },
})

const lessonTo = (link) => {
  const meta = getLessonMeta(link.id)
  return meta ? meta.path + (link.hash ? `#${link.hash}` : '') : '/learn'
}
</script>

<template>
  <template v-for="(tok, i) in tokens" :key="i">
    <template v-if="tok.t === 'text'">{{ tok.v }}</template>
    <code v-else-if="tok.t === 'code'">{{ tok.v }}</code>
    <strong v-else-if="tok.t === 'strong'"><InlineTokens :tokens="tok.c" /></strong>
    <em v-else-if="tok.t === 'em'"><InlineTokens :tokens="tok.c" /></em>
    <br v-else-if="tok.t === 'br'" />
    <a v-else-if="tok.t === 'link' && tok.link.kind === 'external'" :href="tok.link.href" target="_blank" rel="noopener noreferrer"
      ><InlineTokens :tokens="tok.c" /><span class="visually-hidden"> (opens in a new tab)</span></a
    >
    <RouterLink v-else-if="tok.t === 'link' && tok.link.kind === 'lesson'" :to="lessonTo(tok.link)" class="lesson-link"
      ><InlineTokens :tokens="tok.c"
    /></RouterLink>
    <RouterLink v-else-if="tok.t === 'link'" :to="tok.link.href"><InlineTokens :tokens="tok.c" /></RouterLink>
    <span v-else-if="tok.c"><InlineTokens :tokens="tok.c" /></span>
  </template>
</template>

<style scoped>
.lesson-link {
  text-decoration-style: wavy;
  text-decoration-color: var(--cobalt-text);
}
</style>
