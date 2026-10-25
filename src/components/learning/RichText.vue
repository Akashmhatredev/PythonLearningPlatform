<script setup>
// Renders lesson prose. `value` may be:
//   - a markdown string
//   - an array mixing markdown strings, code blocks { code, lang, title, highlight }
//     and callouts { callout: 'tip'|'warn'|'note'|'version', text }
import { computed } from 'vue'
import { parseMarkdown, parseInline } from '../../utils/markdown.js'
import InlineTokens from './InlineTokens.vue'
import CodeBlock from '../code/CodeBlock.vue'

const props = defineProps({
  value: { type: [String, Array, Object], default: '' },
  inline: { type: Boolean, default: false },
})

const items = computed(() => {
  const list = Array.isArray(props.value) ? props.value : [props.value]
  return list.filter(Boolean).map((item) => {
    if (typeof item === 'string') return { kind: 'md', blocks: parseMarkdown(item) }
    if (item.code !== undefined) return { kind: 'code', ...item }
    if (item.callout) return { kind: 'callout', tone: item.callout, title: item.title, blocks: parseMarkdown(item.text ?? '') }
    return { kind: 'md', blocks: [] }
  })
})
const inlineTokens = computed(() => (props.inline && typeof props.value === 'string' ? parseInline(props.value) : []))
const calloutLabel = { tip: 'Tip', warn: 'Careful', note: 'Note', version: 'Version note' }
</script>

<template>
  <span v-if="inline"><InlineTokens :tokens="inlineTokens" /></span>
  <div v-else class="rich">
    <template v-for="(item, i) in items" :key="i">
      <template v-if="item.kind === 'md'">
        <template v-for="(b, j) in item.blocks" :key="j">
          <p v-if="b.type === 'p'"><InlineTokens :tokens="b.inline" /></p>
          <ul v-else-if="b.type === 'ul'">
            <li v-for="(li, k) in b.items" :key="k"><InlineTokens :tokens="li" /></li>
          </ul>
          <ol v-else-if="b.type === 'ol'" :start="b.start">
            <li v-for="(li, k) in b.items" :key="k"><InlineTokens :tokens="li" /></li>
          </ol>
          <component :is="`h${b.level}`" v-else-if="b.type === 'h'" class="rich__h"><InlineTokens :tokens="b.inline" /></component>
          <CodeBlock v-else-if="b.type === 'code'" class="rich__code" :code="b.code" :lang="b.lang" :title="b.title" />
          <div v-else-if="b.type === 'table'" class="rich__table" tabindex="0" role="region" aria-label="Table">
            <table>
              <thead>
                <tr>
                  <th v-for="(h, k) in b.headers" :key="k" scope="col" :style="{ textAlign: b.align[k] }"><InlineTokens :tokens="h" /></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, r) in b.rows" :key="r">
                  <td v-for="(cell, k) in row" :key="k" :style="{ textAlign: b.align[k] }"><InlineTokens :tokens="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <aside v-else-if="b.type === 'quote'" class="callout" :class="`callout--${b.tone}`">
            <template v-for="(qb, k) in b.blocks" :key="k">
              <p v-if="qb.type === 'p'"><InlineTokens :tokens="qb.inline" /></p>
              <ul v-else-if="qb.type === 'ul'">
                <li v-for="(li, m) in qb.items" :key="m"><InlineTokens :tokens="li" /></li>
              </ul>
              <CodeBlock v-else-if="qb.type === 'code'" :code="qb.code" :lang="qb.lang" />
            </template>
          </aside>
        </template>
      </template>
      <CodeBlock
        v-else-if="item.kind === 'code'"
        class="rich__code"
        :code="item.code"
        :lang="item.lang || 'python'"
        :title="item.title"
        :highlight="item.highlight || []"
        :static="item.static"
      />
      <aside v-else-if="item.kind === 'callout'" class="callout" :class="`callout--${item.tone}`">
        <p class="callout__label label">{{ item.title || calloutLabel[item.tone] || 'Note' }}</p>
        <template v-for="(b, j) in item.blocks" :key="j">
          <p v-if="b.type === 'p'"><InlineTokens :tokens="b.inline" /></p>
          <ul v-else-if="b.type === 'ul'">
            <li v-for="(li, k) in b.items" :key="k"><InlineTokens :tokens="li" /></li>
          </ul>
          <CodeBlock v-else-if="b.type === 'code'" :code="b.code" :lang="b.lang" />
        </template>
      </aside>
    </template>
  </div>
</template>

<style scoped>
.rich > :last-child {
  margin-bottom: 0;
}
.rich__code {
  margin: var(--s-5) 0;
}
.rich__table {
  margin: var(--s-5) 0;
  overflow-x: auto;
  border: var(--border);
  background: var(--surface);
}
.rich__table table {
  min-width: 480px;
}
.rich__table th,
.rich__table td {
  padding: var(--s-2) var(--s-3);
  border-bottom: var(--border-thin);
  vertical-align: top;
  font-size: 0.95rem;
}
.rich__table td + td,
.rich__table th + th {
  border-left: var(--border-thin);
}
.rich__table thead th {
  background: var(--text);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 0.78rem;
}
.rich__table tbody tr:last-child td {
  border-bottom: 0;
}
.rich__h {
  font-size: var(--step-1);
  margin-top: var(--s-5);
}
.callout {
  position: relative;
  margin: var(--s-5) 0;
  padding: var(--s-4) var(--s-5);
  border: var(--border);
  border-left-width: 10px;
  background: var(--note);
}
.callout > :last-child {
  margin-bottom: 0;
}
.callout--tip {
  background: var(--note-green);
}
.callout--warn {
  background: #ffe9e3;
  border-left-color: var(--red);
}
:root[data-theme='dark'] .callout--warn {
  background: #2e1a15;
}
.callout--version {
  background: var(--note-blue);
  border-left-color: var(--cobalt);
}
.callout__label {
  margin-bottom: var(--s-2);
}
</style>
