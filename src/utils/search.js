// Tiny ranked search over the generated index. No dependency needed: the
// index is a few thousand short entries.

export const GROUPS = [
  { type: 'lesson', label: 'Lessons' },
  { type: 'project', label: 'Projects' },
  { type: 'module', label: 'Modules' },
  { type: 'api', label: 'API reference' },
  { type: 'example', label: 'Code examples & exercises' },
  { type: 'error', label: 'Common errors & debugging' },
  { type: 'question', label: 'Interview questions' },
]

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')

const prepared = new WeakMap()
function prep(entry) {
  let p = prepared.get(entry)
  if (!p) {
    p = { title: norm(entry.title), subtitle: norm(entry.subtitle), text: norm(entry.text) }
    prepared.set(entry, p)
  }
  return p
}

export function searchIndex(entries, query, { limit = 60 } = {}) {
  const q = norm(query).trim()
  if (!q) return []
  const words = q.split(/\s+/).filter(Boolean)
  const results = []
  for (const entry of entries) {
    const p = prep(entry)
    let score = 0
    let all = true
    for (const w of words) {
      const inTitle = p.title.indexOf(w)
      if (inTitle !== -1) score += inTitle === 0 ? 8 : /\W/.test(p.title[inTitle - 1] ?? ' ') ? 6 : 4
      else if (p.subtitle.includes(w)) score += 2
      else if (p.text.includes(w)) score += 1
      else {
        all = false
        break
      }
    }
    if (!all) continue
    if (p.title === q) score += 20
    else if (p.title.startsWith(q)) score += 10
    else if (p.title.includes(q)) score += 5
    if (entry.type === 'lesson' || entry.type === 'api') score += 1.5
    results.push({ entry, score })
  }
  results.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length)
  return results.slice(0, limit).map((r) => r.entry)
}

export function groupResults(results) {
  return GROUPS.map((g) => ({ ...g, items: results.filter((r) => r.type === g.type) })).filter((g) => g.items.length)
}
