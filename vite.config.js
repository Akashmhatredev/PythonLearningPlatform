import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { contentIndex } from './plugins/content-index.js'
import { pyodideAssets } from './plugins/pyodide-assets.js'

// Cross-origin isolation enables SharedArrayBuffer, which the Python runtime uses
// to stop runaway code (KeyboardInterrupt) and to pause for live input().
// vercel.json sends the same headers in production.
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), contentIndex(), pyodideAssets()],
  server: { headers: isolation },
  preview: { headers: isolation },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    // The only chunks above ~250 kB are lazily loaded data (search index and
    // interview question bank), fetched on first search / interview visit.
    chunkSizeWarningLimit: 2600,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
    setupFiles: ['tests/unit/setup.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Python runs in a worker thread per test file; one retry absorbs machine-load hiccups.
    retry: 1,
  },
})
