// Persistence boundary. Stores talk to an adapter with a tiny interface:
//   read(key, fallback) · write(key, value) · remove(key) · keys() · subscribe(key, cb)
// Today the adapter is LocalStorage; a backend adapter can implement the same
// interface later without touching stores or components.

const PREFIX = 'plp:'
const SCHEMA_VERSION = 1

function memoryAdapter() {
  const map = new Map()
  return {
    kind: 'memory',
    read: (key, fallback) => (map.has(key) ? structuredClone(map.get(key)) : fallback),
    write: (key, value) => void map.set(key, structuredClone(value)),
    remove: (key) => void map.delete(key),
    keys: () => [...map.keys()],
    subscribe: () => () => {},
  }
}

function localStorageAdapter(ls) {
  return {
    kind: 'localStorage',
    read(key, fallback) {
      try {
        const raw = ls.getItem(PREFIX + key)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        if (parsed?.v !== SCHEMA_VERSION) return fallback
        return parsed.data
      } catch {
        return fallback
      }
    },
    write(key, value) {
      try {
        ls.setItem(PREFIX + key, JSON.stringify({ v: SCHEMA_VERSION, data: value }))
        return true
      } catch {
        return false // quota exceeded or storage blocked; the app keeps working in memory
      }
    },
    remove(key) {
      try {
        ls.removeItem(PREFIX + key)
      } catch {
        /* ignore */
      }
    },
    keys() {
      try {
        return Object.keys(ls)
          .filter((k) => k.startsWith(PREFIX))
          .map((k) => k.slice(PREFIX.length))
      } catch {
        return []
      }
    },
    // Keep several open tabs in sync.
    subscribe(key, cb) {
      const handler = (e) => {
        if (e.key !== PREFIX + key || !e.newValue) return
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed?.v === SCHEMA_VERSION) cb(parsed.data)
        } catch {
          /* ignore */
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}

function detect() {
  try {
    const ls = globalThis.localStorage
    const probe = PREFIX + '__probe'
    ls.setItem(probe, '1')
    ls.removeItem(probe)
    return localStorageAdapter(ls)
  } catch {
    return memoryAdapter()
  }
}

let adapter = null

export function storage() {
  return (adapter ??= detect())
}

/** Swap the adapter (tests, or a future backend sync layer). */
export function setStorageAdapter(next) {
  adapter = next
}

export { memoryAdapter }
