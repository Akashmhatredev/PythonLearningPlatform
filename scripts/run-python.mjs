// Run Python in the exact runtime the playground uses (CPython 3.14 via Pyodide).
//   node scripts/run-python.mjs 'print(0.1 + 0.2)'
//   node scripts/run-python.mjs --file path/to/main.py [--stdin "line1\nline2"]
//   node scripts/run-python.mjs --dir path/to/project [--entry main.py]   (multi-file projects)
import fs from 'node:fs'
import path from 'node:path'
import { runApp, stopPython } from '../tests/unit/python-runner.js'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args.splice(i, 2)[1]
}
const file = flag('--file')
const dir = flag('--dir')
const entry = flag('--entry') ?? 'main.py'
const stdin = flag('--stdin')?.replace(/\\n/g, '\n')

function readProject(root) {
  const files = {}
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        if (e.name !== '__pycache__') walk(p)
      } else files[path.relative(root, p).split(path.sep).join('/')] = fs.readFileSync(p, 'utf8')
    }
  }
  walk(root)
  return files
}

const files = dir ? readProject(dir) : { 'main.py': file ? fs.readFileSync(file, 'utf8') : args.join(' ') }
const r = await runApp(files, entry, stdin)
for (const [stream, text] of r.output) process[stream === 'stderr' || stream === 'info' ? 'stderr' : 'stdout'].write(text)
if (r.status !== 'ok') process.stderr.write(`\n[status: ${r.status}]\n`)
await stopPython()
