<script setup>
// The program's terminal: stdout, stderr (tracebacks), echoed input and sandbox
// notes, in the order they happened. When the running program calls input(),
// a prompt line appears here and the program waits for the learner's answer.
import { nextTick, ref, useId, watch } from 'vue'
import { CornerDownLeft, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  logs: { type: Array, required: true },
  inputPrompt: { type: String, default: null }, // non-null while input() is waiting
})
const emit = defineEmits(['clear', 'input'])

const uid = useId()
const list = ref(null)
const field = ref(null)
const answer = ref('')

watch(
  () => [props.logs.length, props.logs[props.logs.length - 1]?.text.length, props.inputPrompt],
  async () => {
    await nextTick()
    if (list.value) list.value.scrollTop = list.value.scrollHeight
  },
)
watch(
  () => props.inputPrompt,
  async (p) => {
    if (p === null) return
    answer.value = ''
    await nextTick()
    field.value?.focus({ preventScroll: true })
  },
)

function send() {
  emit('input', answer.value)
  answer.value = ''
}
</script>

<template>
  <div class="console">
    <div ref="list" class="console__list" role="log" aria-label="Program output" aria-live="polite">
      <p v-if="!logs.length && inputPrompt === null" class="console__empty">
        Output appears here. <code>print()</code> writes to it, <code>input()</code> asks you for a line, and errors show a full traceback.
      </p>
      <pre v-if="logs.length" class="term"><span v-for="l in logs" :key="l.id" class="term__chunk" :class="`term__chunk--${l.level}`">{{ l.text }}</span></pre>
      <form v-if="inputPrompt !== null" class="term__ask" @submit.prevent="send">
        <label :for="`${uid}-in`" class="visually-hidden">Input for the program{{ inputPrompt ? `: ${inputPrompt}` : '' }}</label>
        <span class="term__caret" aria-hidden="true">›</span>
        <input
          :id="`${uid}-in`"
          ref="field"
          v-model="answer"
          class="term__field"
          autocomplete="off"
          spellcheck="false"
          placeholder="type a line, press Enter"
        />
        <button type="submit" class="term__send" aria-label="Send input line"><CornerDownLeft :size="14" aria-hidden="true" /></button>
      </form>
    </div>
    <button type="button" class="console__clear" aria-label="Clear output" title="Clear output" @click="emit('clear')">
      <Trash2 :size="14" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.console {
  position: relative;
  height: 100%;
  background: var(--code-bg);
  color: var(--code-text);
}
.console__list {
  height: 100%;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}
.console__empty {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  padding-right: 48px;
  color: var(--code-muted);
}
.console__empty code {
  background: var(--code-bg-2);
  border-color: var(--code-line);
  color: var(--code-text);
}
.term {
  margin: 0;
  padding: var(--s-3) 48px var(--s-2) var(--s-4);
  font: inherit;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.term__chunk--err,
.term__chunk--error {
  color: #ffb4a6;
}
.term__chunk--error {
  display: block;
  margin-top: var(--s-2);
  padding: 4px 8px;
  background: rgba(229, 52, 26, 0.16);
  border-left: 3px solid #ff7a63;
}
.term__chunk--in {
  color: var(--acid);
  font-weight: 700;
}
.term__chunk--info {
  color: var(--code-muted);
  font-style: italic;
}
.term__ask {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 var(--s-4) var(--s-3);
  border: 1.5px solid var(--acid);
  background: var(--code-bg-2);
}
.term__caret {
  padding-left: 8px;
  color: var(--acid);
  font-weight: 800;
}
.term__field {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--code-text);
  font: inherit;
  padding: 6px 4px;
}
.term__field:focus {
  outline: none;
}
.term__ask:focus-within {
  outline: 3px solid var(--acid);
  outline-offset: 1px;
}
.term__send {
  border: 0;
  border-left: 1.5px solid var(--acid);
  background: var(--acid);
  color: var(--acid-ink);
  padding: 6px 10px;
  display: grid;
  place-items: center;
}
.console__clear {
  position: absolute;
  top: 6px;
  right: 10px;
  border: 1.5px solid var(--code-line);
  background: var(--code-bg-2);
  color: var(--code-muted);
  padding: 4px 6px;
}
.console__clear:hover {
  color: var(--acid-ink);
  background: var(--acid);
}
</style>
