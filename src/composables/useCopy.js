import { ref } from 'vue'

/** Copy text to the clipboard with a short-lived `copied` flag for feedback. */
export function useCopy(resetMs = 1800) {
  const copied = ref(false)
  const failed = ref(false)
  let timer = null

  async function copy(text) {
    failed.value = false
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      if (!ok) {
        failed.value = true
        return false
      }
    }
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), resetMs)
    return true
  }

  return { copy, copied, failed }
}
