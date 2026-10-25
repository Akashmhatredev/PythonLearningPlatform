// Serves the Pyodide runtime (CPython compiled to WebAssembly) that the Python
// playground runs in. Dev: a middleware streams the files from node_modules.
// Build: they are emitted as versioned static assets. Either way the app reads
// the location from `virtual:pyodide`, so the browser always runs the exact
// Pyodide version in package-lock.json — no CDN, works offline.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
const TYPES = { '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.zip': 'application/zip', '.json': 'application/json' }

function pyodideDir() {
  return path.dirname(require.resolve('pyodide/package.json'))
}

export function pyodideAssets() {
  const VIRTUAL_ID = 'virtual:pyodide'
  const RESOLVED = '\0' + VIRTUAL_ID
  let dir = ''
  let version = ''
  let base = '/'
  const prefix = () => `pyodide/${version}/`

  return {
    name: 'pyodide-assets',
    configResolved(config) {
      base = config.base || '/'
      dir = pyodideDir()
      version = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED
    },
    load(id) {
      if (id !== RESOLVED) return
      return `export default ${JSON.stringify({ path: base.replace(/\/$/, '') + '/' + prefix(), version })}`
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        const at = url.indexOf('/' + prefix())
        if (at === -1) return next()
        const file = url.slice(at + prefix().length + 1)
        if (!FILES.includes(file)) return next()
        res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        fs.createReadStream(path.join(dir, file)).pipe(res)
      })
    },
    generateBundle() {
      for (const file of FILES) {
        this.emitFile({ type: 'asset', fileName: prefix() + file, source: fs.readFileSync(path.join(dir, file)) })
      }
    },
  }
}
