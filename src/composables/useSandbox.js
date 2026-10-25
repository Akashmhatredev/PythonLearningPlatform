import { onBeforeUnmount, ref, watch } from 'vue'
import { runPython, runtime } from '../services/python/client.js'

let logSeq = 0
const MAX_ENTRIES = 400

/**
 * Runs Python projects on the page's shared CPython runtime (Pyodide in a Web
 * Worker). Same surface the playground components always used: `run()` for the
 * program or its tests, a console log, the program's variables as `state`.
 *
 * Console entries: { id, level, text } with level
 *   out (stdout) · err (stderr) · in (echoed input) · info (sandbox notes) · error
 */
export function useSandbox() {
  const status = ref('idle') // idle | loading | running | waiting | testing | done | stopped | error
  const logs = ref([])
  const compileErrors = ref([])
  const state = ref(null) // [{ name, type, value }] after a run
  const testResults = ref(null)
  const lastRunAt = ref(0)
  const inputPrompt = ref(null) // string while the program waits for input()
  const lastResult = ref(null)

  let job = null

  function push(level, text) {
    if (!text) return
    const last = logs.value[logs.value.length - 1]
    // Consecutive chunks from one stream form one block, like a terminal.
    if (last && last.level === level && level !== 'error') {
      last.text += text
      return
    }
    logs.value.push({ id: ++logSeq, level, text, count: 1 })
    if (logs.value.length > MAX_ENTRIES) logs.value.splice(0, logs.value.length - MAX_ENTRIES)
  }

  const STREAM = { stdout: 'out', stderr: 'err', stdin: 'in', info: 'info' }

  /**
   * @param {Record<string,string>} files
   * @param {{ entry?: string, mode?: 'app'|'test', tests?: {name:string, code:string, stdin?: string}[], stdin?: string }} opts
   */
  async function run(files, { entry, mode = 'app', tests = [], stdin = '' } = {}) {
    job?.stop()
    logs.value = []
    compileErrors.value = []
    state.value = null
    inputPrompt.value = null
    if (mode === 'test') testResults.value = null
    lastRunAt.value = Date.now()
    const busy = mode === 'test' ? 'testing' : 'running'
    status.value = runtime.value.phase === 'ready' ? busy : 'loading'
    const stopWatch = watch(
      () => runtime.value.phase,
      (p) => {
        if (p === 'ready' && status.value === 'loading') status.value = busy
      },
    )

    const handle = runPython(
      { mode, files, entry, tests, stdin },
      {
        onOutput: (stream, text) => push(STREAM[stream] ?? 'out', text),
        onInput: (prompt) => {
          inputPrompt.value = prompt
          status.value = 'waiting'
        },
      },
    )
    job = handle
    const result = await handle.promise
    stopWatch()
    if (job !== handle) return { ok: false, superseded: true }
    job = null
    inputPrompt.value = null
    lastResult.value = result

    if (result.restarted) push('info', '\n[the Python runtime was restarted]\n')
    switch (result.status) {
      case 'timeout':
        push('error', `Stopped: the code ran for more than ${Math.round((result.limitMs ?? 10000) / 1000)} s. Look for a loop that never ends (or work that is too big for the browser).`)
        break
      case 'stopped':
        push('info', '\n[stopped]\n')
        break
      case 'cancelled':
        return { ok: false, cancelled: true }
      case 'internal':
        push('error', result.error ?? 'The Python sandbox failed.')
        break
    }

    if (mode === 'test') {
      const results =
        result.results ??
        [{ name: 'Tests', pass: false, error: result.status === 'timeout' ? 'Stopped: the time limit was reached (an infinite loop?).' : (result.error ?? 'The tests could not run.') }]
      testResults.value = results
      status.value = 'done'
      return { ok: true, results }
    }

    state.value = result.variables ?? null
    status.value = result.status === 'ok' || result.status === 'exit' ? 'done' : result.status === 'stopped' ? 'stopped' : 'error'
    if (result.status === 'ok' && !logs.value.some((l) => l.level === 'out' || l.level === 'err')) {
      push('info', '[the program finished without printing anything]\n')
    }
    return { ok: result.status === 'ok', result }
  }

  function submitInput(text) {
    if (!job || inputPrompt.value === null) return
    inputPrompt.value = null
    status.value = 'running'
    job.provideInput(text)
  }

  function stop() {
    job?.stop()
  }

  function clearLogs() {
    logs.value = []
  }

  onBeforeUnmount(() => job?.stop())

  return { status, logs, compileErrors, state, testResults, lastRunAt, inputPrompt, lastResult, run, submitInput, stop, clearLogs }
}
