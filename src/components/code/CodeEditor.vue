<script setup>
// CodeMirror 6 editor, loaded lazily. Shares token classes with CodeBlock.
// Esc then Tab moves focus out of the editor (CodeMirror's standard escape hatch).
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const model = defineModel({ type: String, required: true })
const props = defineProps({
  lang: { type: String, default: 'python' },
  readonly: { type: Boolean, default: false },
  guidedLines: { type: Array, default: () => [] }, // lines to spotlight in guided mode
  label: { type: String, default: 'Code editor' },
})
const emit = defineEmits(['run'])

const host = ref(null)
const view = shallowRef(null)
const failed = ref(false)
let cm = null
let setGuided = null

async function loadCodeMirror() {
  const [core, state, viewMod, language, highlight, js, python, html, css, commands] = await Promise.all([
    import('codemirror'),
    import('@codemirror/state'),
    import('@codemirror/view'),
    import('@codemirror/language'),
    import('@lezer/highlight'),
    import('@codemirror/lang-javascript'),
    import('@codemirror/lang-python'),
    import('@codemirror/lang-html'),
    import('@codemirror/lang-css'),
    import('@codemirror/commands'),
  ])
  return { core, state, viewMod, language, highlight, js, python, html, css, commands }
}

function languageFor(m, lang) {
  const l = (lang || '').toLowerCase()
  if (l === 'python' || l === 'py') return m.python.python()
  if (l === 'json' || l === 'js' || l === 'javascript') return m.js.javascript()
  if (l === 'html') return m.html.html()
  if (l === 'css') return m.css.css()
  return [] // plain text (csv, txt, toml…)
}

onMounted(async () => {
  try {
    cm = await loadCodeMirror()
  } catch {
    failed.value = true
    return
  }
  if (!host.value) return
  const { EditorState, StateEffect, StateField } = cm.state
  const { EditorView, Decoration, keymap } = cm.viewMod

  const guidedEffect = StateEffect.define()
  const guidedField = StateField.define({
    create: () => Decoration.none,
    update(deco, tr) {
      for (const e of tr.effects) {
        if (e.is(guidedEffect)) {
          const lines = [...new Set(e.value)].filter((n) => n >= 1 && n <= tr.state.doc.lines).sort((a, b) => a - b)
          deco = Decoration.set(lines.map((n) => Decoration.line({ class: 'cm-guided-line' }).range(tr.state.doc.line(n).from)))
        }
      }
      return deco.map(tr.changes)
    },
    provide: (f) => EditorView.decorations.from(f),
  })

  setGuided = (lines) => {
    if (!view.value) return
    const effects = [guidedEffect.of(lines)]
    if (lines.length) {
      const first = Math.min(...lines)
      if (first <= view.value.state.doc.lines) {
        effects.push(EditorView.scrollIntoView(view.value.state.doc.line(first).from, { y: 'center' }))
      }
    }
    view.value.dispatch({ effects })
  }

  view.value = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: model.value,
      extensions: [
        cm.core.basicSetup,
        keymap.of([
          cm.commands.indentWithTab,
          { key: 'Mod-Enter', run: () => (emit('run'), true) },
          { key: 'Mod-s', run: () => (emit('run'), true), preventDefault: true },
        ]),
        languageFor(cm, props.lang),
        cm.language.syntaxHighlighting(cm.highlight.classHighlighter),
        EditorState.tabSize.of(4),
        cm.language.indentUnit.of('    '), // PEP 8: four spaces
        EditorState.readOnly.of(props.readonly),
        EditorView.contentAttributes.of({ 'aria-label': props.label }),
        guidedField,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) model.value = u.state.doc.toString()
        }),
      ],
    }),
  })
  if (props.guidedLines.length) setGuided(props.guidedLines)
})

// External changes (reset, switching files) replace the document.
watch(model, (val) => {
  const v = view.value
  if (v && val !== v.state.doc.toString()) {
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: val } })
  }
})
watch(
  () => props.guidedLines,
  (lines) => setGuided?.(lines),
  { deep: true },
)

onBeforeUnmount(() => view.value?.destroy())

defineExpose({ focus: () => view.value?.focus() })
</script>

<template>
  <div class="editor">
    <div v-if="!view && !failed" class="editor__loading mono">loading editor…</div>
    <!-- if CodeMirror fails to load, fall back to a plain textarea so the learner can still edit -->
    <textarea
      v-if="failed"
      v-model="model"
      class="editor__fallback"
      :aria-label="label"
      :readonly="readonly"
      spellcheck="false"
      @keydown.meta.enter="emit('run')"
      @keydown.ctrl.enter="emit('run')"
    />
    <div ref="host" class="editor__host" />
  </div>
</template>

<style scoped>
.editor {
  position: relative;
  height: 100%;
  min-height: 180px;
  background: var(--code-bg);
}
.editor__host {
  height: 100%;
}
.editor__host :deep(.cm-editor) {
  height: 100%;
}
.editor__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--code-muted);
  font-size: 0.8rem;
}
.editor__fallback {
  width: 100%;
  height: 100%;
  min-height: 260px;
  padding: var(--s-3);
  border: 0;
  background: var(--code-bg);
  color: var(--code-text);
  font-family: var(--font-mono);
  font-size: 0.86rem;
  line-height: 1.6;
  resize: vertical;
}
</style>
