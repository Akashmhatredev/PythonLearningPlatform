// Node worker_threads twin of src/services/python/worker.js: the content
// validator and unit tests run Python through the same engine + harness.
import fs from 'node:fs'
import { parentPort, workerData } from 'node:worker_threads'

const { loadPyodide } = await import('pyodide')
const { startEngine } = await import('../../src/services/python/engine.js')

const harnessSource = fs.readFileSync(new URL('../../src/services/python/harness.py', import.meta.url), 'utf8')
const engine = await startEngine({
  loadPyodide,
  harnessSource,
  post: (m) => parentPort.postMessage(m),
  interruptBuffer: workerData.interruptBuffer,
})
parentPort.postMessage({ type: 'ready', python: engine.python, version: engine.version })

parentPort.on('message', async (msg) => {
  if (msg.type !== 'run') return
  let result
  try {
    result = await engine.run(msg.id, msg.request)
  } catch (err) {
    result = { status: 'internal', error: String(err?.message ?? err) }
  }
  parentPort.postMessage({ type: 'result', id: msg.id, result })
  if (result.fatal) process.exit(1) // unusable interpreter: let the runner start a new worker
})
