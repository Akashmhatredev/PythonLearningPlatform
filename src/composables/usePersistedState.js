import { reactive, watch } from 'vue'
import { storage } from '../services/storage.js'

/**
 * A reactive object that hydrates from the storage adapter and writes back
 * (throttled) whenever it changes. Also picks up changes made in other tabs.
 */
export function usePersistedState(key, defaults, { delay = 150 } = {}) {
  const store = storage()
  const state = reactive({ ...structuredClone(defaults), ...store.read(key, {}) })
  let timer = null
  let skipNextWrite = false

  const flush = () => {
    timer = null
    store.write(key, JSON.parse(JSON.stringify(state)))
  }

  watch(
    state,
    () => {
      if (skipNextWrite) {
        skipNextWrite = false
        return
      }
      if (timer) return
      timer = setTimeout(flush, delay)
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => timer && (clearTimeout(timer), flush()))
  }

  // Another tab saved: adopt its data without echoing it back.
  store.subscribe(key, (data) => {
    skipNextWrite = true
    Object.assign(state, structuredClone(defaults), data)
  })

  function reset() {
    for (const k of Object.keys(state)) delete state[k]
    Object.assign(state, structuredClone(defaults))
    store.write(key, structuredClone(defaults))
  }

  return { state, reset, flush: () => (timer && clearTimeout(timer), flush()) }
}
