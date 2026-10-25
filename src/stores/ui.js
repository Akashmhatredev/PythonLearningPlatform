import { defineStore } from 'pinia'
import { ref } from 'vue'

// Ephemeral UI state (not persisted): drawers, palettes and toasts.
export const useUiStore = defineStore('ui', () => {
  const searchOpen = ref(false)
  const navOpen = ref(false)
  const sidebarDrawerOpen = ref(false)
  const toasts = ref([])
  let seq = 0

  function toast(message, { tone = 'info', timeout = 3800 } = {}) {
    const id = ++seq
    toasts.value.push({ id, message, tone })
    if (timeout) setTimeout(() => dismiss(id), timeout)
    return id
  }
  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { searchOpen, navOpen, sidebarDrawerOpen, toasts, toast, dismiss }
})
