// Page-side client for the shared Python worker.
//
// - One CPython runtime per page: it loads on first use and is reused by every
//   playground, exercise check and visualizer (never reloaded per run).
// - Runs are queued and executed one at a time.
// - Runaway code: after the time limit the client raises KeyboardInterrupt in
//   the worker (needs cross-origin isolation for SharedArrayBuffer). If the code
//   still doesn't stop — or interrupts are unavailable — the worker is replaced.
// - input(): with shared memory the worker pauses and the page asks the learner
//   for a line; otherwise programs read the lines typed into the Input tab.
import { shallowRef } from 'vue'
import pyodideInfo from 'virtual:pyodide'

export const LIMITS = { app: 10_000, test: 20_000, trace: 10_000, compile: 5_000 }
const KILL_GRACE = 2500

const shared = typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated === true

/** Reactive runtime status for the UI. phase: idle | loading | ready | error */
export const runtime = shallowRef({ phase: 'idle', python: null, pyodide: pyodideInfo.version, interactive: shared, message: '' })

let worker = null
let booting = null
let interruptBuffer = null
let inputCtrl = null
let inputBytes = null
let inputSab = null
let seq = 0
let active = null
const queue = []
const encoder = new TextEncoder()

const setRuntime = (patch) => (runtime.value = { ...runtime.value, ...patch })

function boot() {
  if (booting) return booting
  setRuntime({ phase: 'loading', message: '' })
  if (shared) {
    interruptBuffer = new Int8Array(new SharedArrayBuffer(1))
    inputSab = new SharedArrayBuffer(8 + 16_384)
    inputCtrl = new Int32Array(inputSab, 0, 2)
    inputBytes = new Uint8Array(inputSab, 8)
  }
  const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module', name: 'python' })
  worker = w
  booting = new Promise((resolve, reject) => {
    w.onmessage = (e) => onMessage(e.data, resolve, reject)
    w.onerror = (e) => {
      e.preventDefault?.()
      const raw = e.message || 'the Python worker crashed'
      const message = /call stack|fatal/i.test(raw)
        ? 'The Python runtime crashed — usually very deep recursion that ran out of WebAssembly stack before Python could raise RecursionError (for example a property that sets itself). It was restarted.'
        : `The Python runtime crashed: ${raw}`
      if (runtime.value.phase === 'loading') {
        setRuntime({ phase: 'error', message })
        reject(new Error(message))
      }
      if (active) restart(active, `internal`, message)
    }
  })
  booting.catch(() => {
    if (worker === w) {
      w.terminate()
      worker = null
      booting = null
    }
  })
  w.postMessage({
    type: 'init',
    indexURL: new URL(pyodideInfo.path, location.href).href,
    interruptBuffer,
    inputBuffer: inputSab,
  })
  return booting
}

function onMessage(msg, resolve, reject) {
  switch (msg.type) {
    case 'ready':
      setRuntime({ phase: 'ready', python: msg.python, message: '' })
      resolve(msg)
      break
    case 'init-error':
      setRuntime({ phase: 'error', message: msg.message })
      reject(new Error(msg.message))
      break
    case 'out':
      if (active && msg.id === active.id) active.onOutput?.(msg.stream, msg.text)
      break
    case 'input-request':
      if (active && msg.id === active.id) {
        active.waitingInput = true
        pauseTimer(active)
        active.onInput?.(msg.prompt)
      }
      break
    case 'result':
      if (active && msg.id === active.id) {
        const job = active
        finish(job, msg.result)
        // A harness failure may leave the interpreter in a bad state: start fresh next time.
        if (msg.result?.status === 'internal') replaceWorker()
      }
      break
  }
}

function armTimer(job, ms) {
  clearTimeout(job.timer)
  job.deadline = performance.now() + ms
  job.timer = setTimeout(() => interrupt(job, 'timeout'), ms)
}

function pauseTimer(job) {
  clearTimeout(job.timer)
  job.remaining = Math.max(500, job.deadline - performance.now())
}

async function pump() {
  if (active || !queue.length) return
  const job = queue.shift()
  active = job
  try {
    await boot()
  } catch (err) {
    finish(job, { status: 'internal', error: `Python could not start: ${err.message}` })
    return
  }
  if (job.state === 'done') return
  job.state = 'running'
  armTimer(job, job.limit)
  worker.postMessage({ type: 'run', id: job.id, request: job.request })
}

function finish(job, result) {
  if (job.state === 'done') return
  job.state = 'done'
  clearTimeout(job.timer)
  clearTimeout(job.killTimer)
  let out = result ?? { status: 'internal', error: 'No result' }
  if (job.reason) out = { ...out, status: job.reason, limitMs: job.limit }
  if (active === job) active = null
  job.resolve(out)
  pump()
}

function replaceWorker() {
  worker?.terminate()
  worker = null
  booting = null
  setRuntime({ phase: 'idle' })
}

function restart(job, reason, error) {
  replaceWorker()
  job.reason ??= reason
  finish(job, { status: reason, restarted: true, error })
}

function interrupt(job, reason) {
  if (job.state === 'done') return
  if (job.state === 'queued') {
    queue.splice(queue.indexOf(job), 1)
    job.state = 'done'
    job.resolve({ status: 'cancelled' })
    return
  }
  job.reason ??= reason
  if (job.waitingInput) cancelInput()
  if (interruptBuffer && runtime.value.phase === 'ready') {
    interruptBuffer[0] = 2
    clearTimeout(job.killTimer)
    job.killTimer = setTimeout(() => restart(job, job.reason), KILL_GRACE)
  } else {
    restart(job, job.reason)
  }
}

function cancelInput() {
  if (!inputCtrl) return
  Atomics.store(inputCtrl, 0, 2)
  Atomics.notify(inputCtrl, 0)
  if (active) active.waitingInput = false
}

/**
 * Run a request on the shared runtime.
 * @param {{ mode?: 'app'|'test'|'trace'|'compile', files: Record<string,string>, entry?: string, tests?: any[], stdin?: string, interactive?: boolean }} request
 * @param {{ onOutput?: (stream: string, text: string) => void, onInput?: (prompt: string) => void, limit?: number }} handlers
 * @returns {{ id: number, promise: Promise<any>, stop: () => void, provideInput: (text: string) => void }}
 */
export function runPython(request, { onOutput, onInput, limit } = {}) {
  // A program blocked on input() would hold the runtime forever; a new run takes over.
  if (active?.waitingInput) interrupt(active, 'stopped')
  const mode = request.mode ?? 'app'
  const clean = JSON.parse(JSON.stringify({ ...request, mode, interactive: shared && mode === 'app' && request.interactive !== false }))
  const job = { id: ++seq, request: clean, onOutput, onInput, limit: limit ?? LIMITS[mode] ?? LIMITS.app, state: 'queued' }
  job.promise = new Promise((resolve) => (job.resolve = resolve))
  queue.push(job)
  pump()
  return {
    id: job.id,
    promise: job.promise,
    stop: () => interrupt(job, 'stopped'),
    provideInput: (text) => provideInput(job, text),
  }
}

function provideInput(job, text) {
  if (job !== active || !job.waitingInput || !inputCtrl) return
  const enc = encoder.encode(String(text)).slice(0, inputBytes.length)
  inputBytes.set(enc)
  inputCtrl[1] = enc.length
  Atomics.store(inputCtrl, 0, 1)
  Atomics.notify(inputCtrl, 0)
  job.waitingInput = false
  armTimer(job, job.remaining ?? job.limit)
}

/** Start downloading Python early (e.g. when a playground scrolls into view). */
export function warmPython() {
  boot().catch(() => {})
}

export const pythonVersion = () => runtime.value.python
export const supportsLiveInput = shared
