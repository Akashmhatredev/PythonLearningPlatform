import { getCurrentScope, onScopeDispose, ref } from 'vue'

/** Reactive `matchMedia`. Cleans up its listener when the owning scope ends. */
export function useMediaQuery(query) {
  const matches = ref(false)
  if (typeof window === 'undefined' || !window.matchMedia) return matches
  const mql = window.matchMedia(query)
  matches.value = mql.matches
  const onChange = (e) => (matches.value = e.matches)
  mql.addEventListener('change', onChange)
  if (getCurrentScope()) onScopeDispose(() => mql.removeEventListener('change', onChange))
  return matches
}
