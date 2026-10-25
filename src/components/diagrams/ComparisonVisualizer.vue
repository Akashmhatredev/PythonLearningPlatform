<script setup>
// Two approaches side by side, with the differences called out underneath.
import { ref } from 'vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'

const props = defineProps({
  left: { type: Object, required: true }, // { label, code, lang?, note?, highlight? }
  right: { type: Object, required: true },
  points: { type: Array, default: () => [] },
})
const focus = ref(null) // index of the point being read; highlights its lines if provided
</script>

<template>
  <div class="cmp">
    <div class="cmp__cols">
      <section v-for="(side, key) in { left, right }" :key="key" class="cmp__col">
        <span class="sticker cmp__label" :class="key === 'left' ? 'sticker--kraft' : 'sticker--acid'">{{ side.label }}</span>
        <CodeBlock
          :code="side.code"
          :lang="side.lang || 'python'"
          :title="side.title || side.label"
          :highlight="focus !== null && points[focus]?.[key] ? [points[focus][key]] : side.highlight || []"
          :dim="focus !== null && !!points[focus]?.[key]"
        />
        <RichText v-if="side.note" class="cmp__note" :value="side.note" />
      </section>
    </div>
    <div v-if="points.length" class="cmp__points">
      <p class="label">What's different</p>
      <ol>
        <li
          v-for="(p, i) in points"
          :key="i"
          :class="{ 'is-focus': focus === i }"
          tabindex="0"
          @mouseenter="focus = i"
          @mouseleave="focus = null"
          @focus="focus = i"
          @blur="focus = null"
        >
          <RichText :value="typeof p === 'string' ? p : p.text" inline />
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.cmp {
  display: grid;
  gap: var(--s-4);
}
.cmp__cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-5);
  align-items: start;
}
.cmp__col {
  position: relative;
  display: grid;
  gap: var(--s-3);
  padding-top: var(--s-4);
}
.cmp__label {
  position: absolute;
  top: -6px;
  left: 12px;
  z-index: 1;
  font-size: 1.05rem;
}
.cmp__col:last-child .cmp__label {
  transform: rotate(2deg);
}
.cmp__note {
  font-size: 0.92rem;
}
.cmp__points {
  border: var(--border);
  background: var(--note);
  padding: var(--s-3) var(--s-4);
}
.cmp__points ol {
  margin: var(--s-2) 0 0;
}
.cmp__points li {
  padding: 2px 6px;
}
.cmp__points li.is-focus {
  background: var(--acid);
  color: var(--acid-ink);
}
@media (max-width: 800px) {
  .cmp__cols {
    grid-template-columns: 1fr;
  }
}
</style>
