// App-side access to curriculum content.
// The index is static data: frozen and never made deeply reactive.
import rawIndex from 'virtual:content-index'

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    Object.values(o).forEach(deepFreeze)
  }
  return o
}

export const contentIndex = deepFreeze(rawIndex)

const lessonLoaders = import.meta.glob('./lessons/*/*.js')

export function getLessonMeta(id) {
  return contentIndex.lessons[id] ?? null
}

export function getLevel(id) {
  return contentIndex.levels.find((l) => l.id === id) ?? null
}

export function lessonsOfLevel(levelId) {
  return (getLevel(levelId)?.lessons ?? []).map((id) => contentIndex.lessons[id])
}

export async function loadLesson(id) {
  const meta = getLessonMeta(id)
  if (!meta || meta.status !== 'ready') return null
  const loader = lessonLoaders[`./lessons/${meta.level}/${id}.js`]
  if (!loader) return null
  const mod = await loader()
  return deepFreeze(mod.default)
}

let searchPromise = null
/** Full search entries (lessons, APIs, errors, examples, questions) — loaded on demand. */
export function loadSearchIndex() {
  searchPromise ??= import('virtual:search-index').then((m) => deepFreeze(m.default))
  return searchPromise
}

/** Lightweight lesson entries for search-like features that don't need the full index. */
export function lessonEntries() {
  return contentIndex.order.map((id) => {
    const l = contentIndex.lessons[id]
    return { id: `lesson:${id}`, type: l.kind === 'project' ? 'project' : 'lesson', title: l.title, subtitle: l.summary, to: l.path, text: l.tags.join(' ') }
  })
}

let metaPromise = null
/** Light question metadata (id, lesson, level, difficulty, type) for stats. */
export function loadQuestionMeta() {
  metaPromise ??= import('virtual:question-meta').then((m) => deepFreeze(m.default))
  return metaPromise
}

let bankPromise = null
export function loadQuestionBank() {
  bankPromise ??= import('virtual:question-bank').then((m) => deepFreeze(m.default))
  return bankPromise
}

export function neighbours(id) {
  const ready = contentIndex.order.filter((x) => contentIndex.lessons[x].status === 'ready')
  const i = ready.indexOf(id)
  return {
    prev: i > 0 ? contentIndex.lessons[ready[i - 1]] : null,
    next: i >= 0 && i < ready.length - 1 ? contentIndex.lessons[ready[i + 1]] : null,
  }
}

export function lessonPath(id, hash = '') {
  const meta = getLessonMeta(id)
  if (!meta) return '/learn'
  return meta.path + (hash ? `#${hash}` : '')
}
