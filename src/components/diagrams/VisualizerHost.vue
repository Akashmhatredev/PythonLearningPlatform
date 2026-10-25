<script setup>
// Frames any visualizer: caption, accessible text description and lazy loading.
import { computed, onErrorCaptured, ref, useId } from 'vue'
import { visualizerComponent } from './registry.js'
import { visualizers } from '../../content/visualizers.js'
import RichText from '../learning/RichText.vue'
import StateBlock from '../ui/StateBlock.vue'

const props = defineProps({
  type: { type: String, required: true },
  props: { type: Object, default: () => ({}) },
  caption: { type: [String, Array], default: '' },
  alt: { type: String, default: '' }, // text alternative describing what the visual shows
  title: { type: String, default: '' },
})
const emit = defineEmits(['interact'])

const comp = computed(() => visualizerComponent(props.type))
const meta = computed(() => visualizers[props.type])
const descId = useId()
const showDesc = ref(false)
const failed = ref(null)

onErrorCaptured((err) => {
  failed.value = err?.message ?? String(err)
  return false
})
</script>

<template>
  <figure class="viz" :aria-describedby="alt ? descId : undefined">
    <div class="viz__head">
      <span class="label">{{ title || meta?.title || type }}</span>
      <button v-if="alt" type="button" class="viz__desc-btn label" :aria-expanded="showDesc" @click="showDesc = !showDesc">
        {{ showDesc ? 'hide' : 'show' }} text description
      </button>
    </div>
    <p v-if="alt" v-show="showDesc" :id="descId" class="viz__desc">{{ alt }}</p>
    <div class="viz__stage" @pointerdown.once="emit('interact')" @keydown.once="emit('interact')">
      <StateBlock v-if="failed" kind="error" title="This visualizer crashed">
        <p>{{ failed }}</p>
      </StateBlock>
      <StateBlock v-else-if="!comp" kind="error" title="Unknown visualizer">
        <p>No visualizer is registered as “{{ type }}”.</p>
      </StateBlock>
      <component :is="comp" v-else v-bind="props.props" />
    </div>
    <figcaption v-if="caption" class="viz__caption">
      <RichText :value="caption" />
    </figcaption>
  </figure>
</template>

<style scoped>
.viz {
  margin: var(--s-5) 0;
  border: var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.viz__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-4);
  border-bottom: var(--border);
  background: var(--cobalt);
  color: #fff;
}
.viz__desc-btn {
  border: 1.5px solid currentColor;
  background: transparent;
  color: inherit;
  padding: 3px 8px;
  font-size: 0.62rem;
}
.viz__desc {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border-bottom: var(--border-thin);
  background: var(--note-blue);
  font-size: 0.92rem;
}
.viz__stage {
  padding: var(--s-4);
  min-height: 120px;
}
.viz__caption {
  padding: var(--s-3) var(--s-4);
  border-top: var(--border-thin);
  background: var(--surface-2);
  font-size: 0.95rem;
}
@media (max-width: 600px) {
  .viz__stage {
    padding: var(--s-3);
  }
}
</style>
