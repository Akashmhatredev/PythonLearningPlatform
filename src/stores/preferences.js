import { defineStore } from 'pinia'
import { computed, watchEffect } from 'vue'
import { usePersistedState } from '../composables/usePersistedState.js'
import { useMediaQuery } from '../composables/useMediaQuery.js'

const DEFAULTS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  motion: 'system', // 'system' | 'reduced' | 'full'
  learningMode: 'guided', // 'guided' shows every intuition section open; 'fast' folds them
  codeSize: 'md', // 'sm' | 'md' | 'lg'
  sidebarOpen: true,
}

export const usePreferencesStore = defineStore('preferences', () => {
  const { state, reset } = usePersistedState('preferences', DEFAULTS)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  const resolvedTheme = computed(() =>
    state.theme === 'system' ? (prefersDark.value ? 'dark' : 'light') : state.theme,
  )
  const reducedMotion = computed(() =>
    state.motion === 'system' ? prefersReduced.value : state.motion === 'reduced',
  )

  if (typeof document !== 'undefined') {
    watchEffect(() => {
      const root = document.documentElement
      root.dataset.theme = resolvedTheme.value
      if (state.motion === 'system') delete root.dataset.motion
      else root.dataset.motion = state.motion
      root.dataset.codeSize = state.codeSize
    })
  }

  return {
    prefs: state,
    resolvedTheme,
    reducedMotion,
    setTheme: (t) => (state.theme = t),
    setMotion: (m) => (state.motion = m),
    setLearningMode: (m) => (state.learningMode = m),
    toggleSidebar: () => (state.sidebarOpen = !state.sidebarOpen),
    reset,
  }
})
