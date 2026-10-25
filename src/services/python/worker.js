// The Python runtime lives in this Web Worker: CPython (Pyodide) loads once per
// page and every playground, exercise and visualizer shares it. Running off the
// main thread keeps the page responsive, and the client can always interrupt or
// replace the worker if learner code runs away.
import harnessSource from './harness.py?raw'
import { startEngine } from './engine.js'

let engine = null

self.onmessage = async (e) => {
  const msg = e.data
  if (msg.type === 'init') {
    try {
      const { loadPyodide } = await import(/* @vite-ignore */ new URL('pyodide.mjs', msg.indexURL).href)
      engine = await startEngine({
        loadPyodide,
        indexURL: msg.indexURL,
        harnessSource,
        post: (m) => self.postMessage(m),
        interruptBuffer: msg.interruptBuffer,
        inputBuffer: msg.inputBuffer,
      })
      self.postMessage({ type: 'ready', python: engine.python, version: engine.version })
    } catch (err) {
      self.postMessage({ type: 'init-error', message: String(err?.message ?? err) })
    }
    return
  }
  if (msg.type === 'run') {
    let result
    try {
      result = await engine.run(msg.id, msg.request)
    } catch (err) {
      result = { status: 'internal', error: `Internal sandbox error: ${err?.message ?? err}` }
    }
    self.postMessage({ type: 'result', id: msg.id, result })
  }
}
