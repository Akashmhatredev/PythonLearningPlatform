// The Python engine: boots Pyodide once, installs the harness and runs requests.
// Environment-agnostic — the browser worker (worker.js) and the Node worker the
// content validator uses (tests/unit/python-node-worker.js) both wrap it, so the
// tests exercise exactly the code learners run.
//
// Messages it posts: { type: 'out', id, stream, text } while code runs and
// { type: 'input-request', id, prompt } when input() needs a live answer.

const HARNESS_DIR = '/plp'

/**
 * @param {object} o
 * @param {(opts: object) => Promise<any>} o.loadPyodide
 * @param {string} [o.indexURL]
 * @param {string} o.harnessSource  contents of harness.py
 * @param {(msg: object) => void} o.post
 * @param {Int8Array} [o.interruptBuffer]  shared; set [0] = 2 to raise KeyboardInterrupt
 * @param {SharedArrayBuffer} [o.inputBuffer]  shared; lets input() block for a live answer
 */
export async function startEngine({ loadPyodide, indexURL, harnessSource, post, interruptBuffer, inputBuffer }) {
  const py = await loadPyodide({ ...(indexURL ? { indexURL } : {}), stdout: () => {}, stderr: () => {} })
  if (interruptBuffer) py.setInterruptBuffer(interruptBuffer)

  let currentId = null
  let currentInteractive = false
  const ctrl = inputBuffer ? new Int32Array(inputBuffer, 0, 2) : null
  const bytes = inputBuffer ? new Uint8Array(inputBuffer, 8) : null
  const decoder = new TextDecoder()

  py.registerJsModule('_plp_js', {
    emit(stream, text) {
      post({ type: 'out', id: currentId, stream, text })
    },
    // Blocks the worker until the page answers (or cancels). Without shared
    // memory there is no way to wait, so input() falls back to pre-typed lines.
    request_input(prompt) {
      if (!ctrl || currentInteractive === false) return null
      Atomics.store(ctrl, 0, 0)
      post({ type: 'input-request', id: currentId, prompt: String(prompt ?? '') })
      Atomics.wait(ctrl, 0, 0)
      if (Atomics.load(ctrl, 0) !== 1) return null
      return decoder.decode(bytes.slice(0, ctrl[1]))
    },
  })

  py.FS.mkdirTree(HARNESS_DIR)
  py.FS.writeFile(`${HARNESS_DIR}/_plp_harness.py`, harnessSource)
  py.runPython(`import sys\nsys.path.insert(0, ${JSON.stringify(HARNESS_DIR)})\nimport _plp_harness`)
  const harness = py.pyimport('_plp_harness')
  const runFn = harness.run
  const info = JSON.parse(harness.info())
  // JSPI ("stack switching") lets asyncio.run() and time.sleep() block properly.
  let jspi = typeof WebAssembly !== 'undefined' && typeof WebAssembly.Suspending === 'function' && typeof runFn.callPromising === 'function'

  async function run(id, request) {
    currentId = id
    currentInteractive = !!request.interactive
    if (interruptBuffer) interruptBuffer[0] = 0
    try {
      const json = JSON.stringify({ jspi, ...request })
      let out
      if (jspi && typeof runFn.callPromising === 'function') {
        try {
          out = await runFn.callPromising(json)
        } catch (e) {
          // Runtimes without JSPI throw here; fall back to a plain call once.
          if (!/stack switching|JSPI|WebAssembly\.Suspend|promising/i.test(String(e?.message))) throw e
          jspi = false
          out = await runFn(json)
        }
      } else {
        out = await runFn(json)
      }
      if (out && typeof out !== 'string' && typeof out.then === 'function') out = await out
      return JSON.parse(String(out))
    } catch (err) {
      // Pyodide marks unrecoverable failures (e.g. the WebAssembly stack overflowing
      // during very deep recursion through C code). The interpreter is unusable
      // afterwards, so the caller must start a fresh one.
      if (err?.pyodide_fatal_error || /fatal error/i.test(String(err?.message))) {
        return {
          status: 'internal',
          fatal: true,
          error:
            'The Python runtime crashed — usually very deep recursion that ran out of WebAssembly stack before Python could raise RecursionError (for example a property that sets itself). The interpreter was restarted.',
        }
      }
      throw err
    } finally {
      currentId = null
      currentInteractive = false
      if (interruptBuffer) interruptBuffer[0] = 0
    }
  }

  return { run, python: info.python, version: py.version }
}
