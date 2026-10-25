import { afterEach } from 'vitest'

afterEach(() => {
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })
}
