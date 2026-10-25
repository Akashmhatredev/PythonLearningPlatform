import { onBeforeUnmount, onMounted, toValue } from 'vue'

/** Adds an event listener when the component mounts and removes it on unmount. */
export function useEventListener(target, event, handler, options) {
  let el = null
  onMounted(() => {
    el = toValue(target)
    el?.addEventListener(event, handler, options)
  })
  onBeforeUnmount(() => el?.removeEventListener(event, handler, options))
}
