<script setup>
import { ref } from 'vue'
import { Download, Trash2, Upload } from 'lucide-vue-next'
import { usePreferencesStore } from '../stores/preferences.js'
import { useProgressStore } from '../stores/progress.js'
import { useInterviewStore } from '../stores/interview.js'
import { useUiStore } from '../stores/ui.js'
import { storage } from '../services/storage.js'
import BaseModal from '../components/ui/BaseModal.vue'

const prefs = usePreferencesStore()
const progress = useProgressStore()
const interview = useInterviewStore()
const ui = useUiStore()
const confirmReset = ref(false)
const resetWhat = ref('progress')
const importError = ref('')

const OPTIONS = {
  theme: [
    ['system', 'Follow my device'],
    ['light', 'Paper (light)'],
    ['dark', 'Blackboard (dark)'],
  ],
  motion: [
    ['system', 'Follow my device'],
    ['reduced', 'Reduce motion'],
    ['full', 'Full motion'],
  ],
  learningMode: [
    ['guided', 'Guided — every intuition section open'],
    ['fast', 'Fast-track — fold the “explain like I’m 15” parts'],
  ],
  codeSize: [
    ['sm', 'Small'],
    ['md', 'Medium'],
    ['lg', 'Large'],
  ],
}

function exportData() {
  const data = { exportedAt: new Date().toISOString(), app: 'python-learning-platform', progress: progress.state, interview: interview.state, preferences: prefs.prefs }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `python-learning-platform-progress-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function importData(e) {
  importError.value = ''
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    if (data.app !== 'python-learning-platform' || !data.progress || !data.interview) throw new Error('This file is not a Python Learning Platform export.')
    Object.assign(progress.state, data.progress)
    Object.assign(interview.state, data.interview)
    ui.toast('Progress imported.', { tone: 'success' })
  } catch (err) {
    importError.value = err.message
  } finally {
    e.target.value = ''
  }
}

function doReset() {
  if (resetWhat.value === 'progress' || resetWhat.value === 'all') progress.reset()
  if (resetWhat.value === 'interview' || resetWhat.value === 'all') interview.reset()
  if (resetWhat.value === 'all') {
    prefs.reset()
    storage().remove('playground-draft')
  }
  confirmReset.value = false
  ui.toast('Data reset.', { tone: 'info' })
}
</script>

<template>
  <div class="page settings">
    <header class="page-head">
      <span class="label">settings &amp; data</span>
      <h1>Make it yours.</h1>
    </header>

    <div class="settings__grid">
      <section class="panel">
        <h2 class="panel__h">Appearance &amp; accessibility</h2>
        <fieldset v-for="key in ['theme', 'motion', 'codeSize']" :key="key" class="opt-group">
          <legend class="label">{{ { theme: 'theme', motion: 'motion', codeSize: 'code size' }[key] }}</legend>
          <label v-for="o in OPTIONS[key]" :key="o[0]" class="opt">
            <input v-model="prefs.prefs[key]" type="radio" :name="key" :value="o[0]" />
            {{ o[1] }}
          </label>
        </fieldset>
        <p class="muted">Reduced motion turns off decorative animation and makes visualizers step manually instead of autoplaying.</p>
      </section>

      <section class="panel">
        <h2 class="panel__h">Learning</h2>
        <fieldset class="opt-group">
          <legend class="label">lesson mode</legend>
          <label v-for="o in OPTIONS.learningMode" :key="o[0]" class="opt">
            <input v-model="prefs.prefs.learningMode" type="radio" name="learningMode" :value="o[0]" />
            {{ o[1] }}
          </label>
        </fieldset>
      </section>

      <section class="panel">
        <h2 class="panel__h">Your data</h2>
        <p>Everything — progress, quiz attempts, interview history, bookmarks — is stored only in this browser ({{ storage().kind }}). Nothing is sent anywhere.</p>
        <div class="cluster">
          <button type="button" class="btn" @click="exportData"><Download :size="16" aria-hidden="true" /> Export as JSON</button>
          <label class="btn">
            <Upload :size="16" aria-hidden="true" /> Import JSON
            <input type="file" accept="application/json" class="visually-hidden" @change="importData" />
          </label>
        </div>
        <p v-if="importError" class="status status--err" role="alert">{{ importError }}</p>
      </section>

      <section class="panel panel--danger">
        <h2 class="panel__h">Reset</h2>
        <p>Start over. This can’t be undone (export first if you might want it back).</p>
        <label class="field">
          <span class="label">what to reset</span>
          <select v-model="resetWhat" class="select">
            <option value="progress">Lesson progress, quizzes, bookmarks &amp; streak</option>
            <option value="interview">Interview history &amp; question flags</option>
            <option value="all">Everything, including preferences</option>
          </select>
        </label>
        <button type="button" class="btn btn--danger" @click="confirmReset = true"><Trash2 :size="16" aria-hidden="true" /> Reset…</button>
      </section>
    </div>

    <BaseModal v-model:open="confirmReset" title="Really reset?" size="sm">
      <p>
        This permanently deletes
        <strong>{{ { progress: 'your lesson progress, quiz attempts, bookmarks and streak', interview: 'your interview history and question flags', all: 'all of your data and preferences' }[resetWhat] }}</strong>
        from this browser.
      </p>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="confirmReset = false">Cancel</button>
        <button type="button" class="btn btn--danger" @click="doReset">Yes, reset</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.settings__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-5);
}
.panel {
  border: var(--border);
  background: var(--surface);
  padding: var(--s-5);
  display: grid;
  gap: var(--s-3);
  align-content: start;
}
.panel--danger {
  box-shadow: 6px 6px 0 var(--red);
}
.panel__h {
  font-size: var(--step-1);
  margin: 0;
}
.opt-group {
  border: 0;
  padding: 0;
  margin: 0 0 var(--s-2);
  display: grid;
  gap: 6px;
}
.opt {
  display: flex;
  gap: var(--s-2);
  align-items: center;
  cursor: pointer;
}
.opt input {
  width: 18px;
  height: 18px;
  accent-color: var(--text);
}
.panel p {
  margin: 0;
}
@media (max-width: 800px) {
  .settings__grid {
    grid-template-columns: 1fr;
  }
}
</style>
