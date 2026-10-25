<script setup>
import { computed, shallowRef, watchEffect } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { highlightLines, plainLines } from '../../services/highlight.js'
import { useCopy } from '../../composables/useCopy.js'

const props = defineProps({
  code: { type: String, required: true },
  lang: { type: String, default: 'python' },
  title: { type: String, default: '' },
  highlight: { type: Array, default: () => [] }, // [3, [5, 8]] — single lines or ranges
  dim: { type: Boolean, default: false }, // fade non-highlighted lines
  lineNumbers: { type: Boolean, default: true },
  copyable: { type: Boolean, default: true },
  static: { type: Boolean, default: false }, // labelled as not runnable
  tone: { type: String, default: '' }, // '' | 'wrong' | 'right'
})

const { copy, copied } = useCopy()
const source = computed(() => props.code.replace(/\n+$/, ''))
const lines = shallowRef(plainLines(source.value))

watchEffect(async () => {
  const code = source.value
  lines.value = plainLines(code)
  const hl = await highlightLines(code, props.lang)
  if (code === source.value) lines.value = hl
})

const hlSet = computed(() => {
  const set = new Set()
  for (const h of props.highlight) {
    if (Array.isArray(h)) for (let i = h[0]; i <= h[1]; i++) set.add(i)
    else set.add(h)
  }
  return set
})
const label = computed(() => props.title || ({ python: 'main.py', py: 'main.py', pycon: 'python shell', js: 'script.js', javascript: 'script.js', html: 'index.html', css: 'styles.css', bash: 'terminal', sh: 'terminal', shell: 'terminal', json: 'data.json', toml: 'pyproject.toml', text: 'text', ts: 'script.ts' }[props.lang] ?? props.lang))
</script>

<template>
  <figure class="code-panel cb" :class="tone && `cb--${tone}`">
    <figcaption class="code-panel__bar">
      <span class="code-panel__title">
        <span class="dot" aria-hidden="true" />
        {{ label }}
        <span v-if="tone === 'wrong'" class="cb__tag cb__tag--wrong">✗ broken</span>
        <span v-else-if="tone === 'right'" class="cb__tag cb__tag--right">✓ fixed</span>
        <span v-if="static" class="cb__tag">static example</span>
      </span>
      <span class="code-panel__actions">
        <button v-if="copyable" type="button" class="code-panel__btn" :aria-label="copied ? 'Copied' : `Copy ${label}`" @click="copy(source)">
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </span>
    </figcaption>
    <pre class="code-block" :class="{ 'code-block--plain': !lineNumbers }" tabindex="0" :aria-label="`Code: ${label}`"><code><span
      v-for="(line, i) in lines"
      :key="i"
      class="code-line"
      :class="{ 'is-hl': hlSet.has(i + 1), 'is-dim': dim && hlSet.size && !hlSet.has(i + 1) }"
      :data-n="i + 1"
    ><span v-for="(tok, j) in line" :key="j" :class="tok.cls">{{ tok.text }}</span>{{ '\n' }}</span></code></pre>
  </figure>
</template>

<style scoped>
.cb {
  margin: 0;
}
.cb--wrong {
  box-shadow: 6px 6px 0 var(--red);
}
.cb--right {
  box-shadow: 6px 6px 0 #0f7a3d;
}
.cb__tag {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 1px 6px;
  border: 1.5px solid var(--code-muted);
  color: var(--code-muted);
}
.cb__tag--wrong {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
}
.cb__tag--right {
  background: #0f7a3d;
  border-color: #0f7a3d;
  color: #fff;
}
.code-block:focus-visible {
  outline: 3px solid var(--acid);
  outline-offset: -3px;
}
</style>
