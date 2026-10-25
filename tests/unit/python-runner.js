// Runs Python projects and their tests in Node, through the same engine and
// harness the browser uses (a worker thread stands in for the Web Worker, and a
// shared buffer interrupts runaway code exactly like the browser client does).
import v8 from 'node:v8'
import { Worker } from 'node:worker_threads'

// V8 flags are process-wide: enable JSPI before the worker's isolate exists so
// asyncio.run() works the way it does in current Chrome/Edge.
v8.setFlagsFromString('--experimental-wasm-jspi')

const TIMEOUT = { app: 10_000, test: 20_000, trace: 10_000, compile: 5_000 }

let worker = null
let ready = null
let seq = 0
const pending = new Map()
const interrupt = new Int8Array(new SharedArrayBuffer(1))

function start() {
  const w = new Worker(new URL('./python-node-worker.js', import.meta.url), { workerData: { interruptBuffer: interrupt } })
  worker = w
  w.unref()
  // A fatal interpreter error kills the worker: fail the pending runs and start
  // a fresh worker next time (the browser client does the same).
  const crash = (err) => {
    if (worker === w) worker = null
    for (const [id, p] of pending) {
      pending.delete(id)
      p.resolve({ status: 'internal', fatal: true, error: `The Python runtime crashed: ${err?.message ?? err}` })
    }
  }
  w.on('error', crash)
  w.on('exit', (code) => crash(new Error(`worker exited with code ${code}`)))
  ready = new Promise((resolve, reject) => {
    w.once('error', reject)
    w.on('message', (m) => {
      if (m.type === 'ready') return resolve(m)
      if (m.type === 'out') return pending.get(m.id)?.out.push([m.stream, m.text])
      if (m.type === 'result') {
        const p = pending.get(m.id)
        pending.delete(m.id)
        p?.resolve(m.result)
      }
    })
  })
  return ready
}

/** Run one request ({ mode, files, entry?, tests?, stdin? }). Resolves with the harness result. */
export async function runPython(request) {
  if (!worker) start()
  await ready
  const id = ++seq
  const out = []
  const result = await new Promise((resolve) => {
    pending.set(id, { resolve, out })
    let killer = null
    const timer = setTimeout(() => {
      interrupt[0] = 2 // raises KeyboardInterrupt inside the running Python code
      // Code stuck inside C (e.g. list(itertools.cycle(...))) never checks for
      // interrupts: replace the worker, as the browser client does.
      killer = setTimeout(() => {
        const w = worker
        worker = null
        pending.delete(id)
        resolve({ status: 'timeout', error: 'The code did not stop after an interrupt; the runtime was restarted.' })
        w?.terminate()
      }, 3000)
    }, TIMEOUT[request.mode ?? 'app'] ?? 10_000)
    pending.get(id).resolve = (r) => {
      clearTimeout(timer)
      clearTimeout(killer)
      resolve(r)
    }
    worker.postMessage({ type: 'run', id, request })
  })
  return { ...result, output: out }
}

export const compile = (files, snippets = []) => runPython({ mode: 'compile', files, snippets })
export const runProjectTests = (files, tests, entry, stdin) => runPython({ mode: 'test', files, tests, entry, stdin })
export const runApp = (files, entry, stdin) => runPython({ mode: 'app', files, entry, stdin })
export const traceProgram = (files, opts = {}) => runPython({ mode: 'trace', files, ...opts })

export async function pythonInfo() {
  if (!worker) start()
  return ready
}

export async function stopPython() {
  await worker?.terminate()
  worker = null
}
