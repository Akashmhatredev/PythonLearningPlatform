import { computed, onBeforeUnmount, ref, toValue, watch } from 'vue'
import { usePreferencesStore } from '../stores/preferences.js'

/**
 * Drives step-by-step visualizations: play / pause / step / restart / speed.
 * `frames` is a ref/getter returning an array. When reduced motion is on,
 * autoplay is disabled — learners step manually instead.
 */
export function useStepPlayer(frames, { interval = 1400, loop = false } = {}) {
  const prefs = usePreferencesStore()
  const index = ref(0)
  const playing = ref(false)
  const speed = ref(1)
  let timer = null

  const list = computed(() => toValue(frames) ?? [])
  const total = computed(() => list.value.length)
  const frame = computed(() => list.value[Math.min(index.value, Math.max(0, total.value - 1))] ?? null)
  const atStart = computed(() => index.value <= 0)
  const atEnd = computed(() => index.value >= total.value - 1)
  const canAutoplay = computed(() => !prefs.reducedMotion)

  function schedule() {
    clearTimeout(timer)
    if (!playing.value) return
    timer = setTimeout(() => {
      if (atEnd.value) {
        if (loop) index.value = 0
        else return pause()
      } else index.value++
      schedule()
    }, interval / speed.value)
  }

  function play() {
    if (!total.value) return
    if (!canAutoplay.value) return next()
    if (atEnd.value) index.value = 0
    playing.value = true
    schedule()
  }
  function pause() {
    playing.value = false
    clearTimeout(timer)
  }
  const toggle = () => (playing.value ? pause() : play())
  function next() {
    pause()
    if (!atEnd.value) index.value++
  }
  function prev() {
    pause()
    if (!atStart.value) index.value--
  }
  function restart() {
    pause()
    index.value = 0
  }
  function goTo(i) {
    pause()
    index.value = Math.max(0, Math.min(i, total.value - 1))
  }
  function setSpeed(s) {
    speed.value = s
    if (playing.value) schedule()
  }

  // When a new sequence is generated (e.g. learner changed a value), start over.
  watch(list, () => {
    index.value = 0
  })

  onBeforeUnmount(() => clearTimeout(timer))

  return { index, frame, total, playing, speed, atStart, atEnd, canAutoplay, play, pause, toggle, next, prev, restart, goTo, setSpeed }
}
