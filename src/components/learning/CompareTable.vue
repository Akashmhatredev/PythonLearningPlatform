<script setup>
import RichText from './RichText.vue'

defineProps({
  table: { type: Object, required: true }, // { title?, headers: [], rows: [[]], note? }
})
</script>

<template>
  <div class="ct">
    <div class="ct__scroll" tabindex="0" role="region" :aria-label="table.title || 'Comparison table'">
      <table>
        <caption v-if="table.title" class="ct__caption">{{ table.title }}</caption>
        <thead>
          <tr>
            <th v-for="(h, i) in table.headers" :key="i" scope="col"><RichText :value="h" inline /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in table.rows" :key="r">
            <component :is="c === 0 ? 'th' : 'td'" v-for="(cell, c) in row" :key="c" :scope="c === 0 ? 'row' : undefined">
              <RichText :value="cell" inline />
            </component>
          </tr>
        </tbody>
      </table>
    </div>
    <RichText v-if="table.note" class="ct__note" :value="table.note" />
  </div>
</template>

<style scoped>
.ct__scroll {
  overflow-x: auto;
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}
table {
  min-width: 560px;
}
.ct__caption {
  text-align: left;
  padding: var(--s-3) var(--s-4);
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: var(--border);
  background: var(--surface-2);
}
th,
td {
  text-align: left;
  vertical-align: top;
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--border-thin);
  font-size: 0.95rem;
}
td + td,
th + td,
thead th + th {
  border-left: var(--border-thin);
}
thead th {
  background: var(--text);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}
thead th :deep(code) {
  color: var(--text);
}
tbody th {
  background: var(--surface-2);
  font-weight: 800;
  width: 22%;
}
tbody tr:last-child > * {
  border-bottom: 0;
}
.ct__note {
  margin-top: var(--s-3);
  font-size: 0.95rem;
}
</style>
