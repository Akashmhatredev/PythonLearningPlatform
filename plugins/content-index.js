// Builds lightweight virtual modules from the curriculum content so the app can
// show the course map, counts and global search without downloading every
// lesson body up front.
//
//   virtual:content-index  -> levels, lesson metadata, counts, search entries
//   virtual:question-bank  -> every interview question, tagged with its lesson
//
// Lesson files are plain ES modules (no Vite-only syntax), so Node can import
// them directly here and in the content validation tests.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CONTENT_DIR = 'src/content'
const LESSON_DIR = 'src/content/lessons'

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    return d.isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []
  })
}

async function importFresh(file, bust) {
  const url = pathToFileURL(file).href + (bust ? `?v=${bust}` : '')
  const mod = await import(url)
  return mod.default ?? mod
}

const clip = (s, n = 280) => (s.length > n ? s.slice(0, n) : s)

const plain = (s = '') =>
  String(s)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_>#\[\]]/g, '')
    .replace(/\(https?:[^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function richToText(value) {
  if (!value) return ''
  if (typeof value === 'string') return plain(value)
  if (Array.isArray(value)) return value.map(richToText).join(' ')
  if (typeof value === 'object') {
    if (value.text) return plain(value.text)
    if (value.body) return richToText(value.body)
  }
  return ''
}

export async function loadContent(root = process.cwd(), { bust = 0 } = {}) {
  const curriculumFile = path.join(root, CONTENT_DIR, 'curriculum.js')
  const { levels } = await import(pathToFileURL(curriculumFile).href + (bust ? `?v=${bust}` : ''))
  const files = walk(path.join(root, LESSON_DIR))
  const lessons = {}
  const fileOf = {}
  const failures = []
  for (const file of files) {
    const id = path.basename(file, '.js')
    try {
      lessons[id] = await importFresh(file, bust)
      fileOf[id] = path.relative(root, file)
    } catch (e) {
      failures.push({ file: path.relative(root, file), message: e.message })
    }
  }
  return { levels, lessons, fileOf, failures, files: files.map((f) => path.relative(root, f)) }
}

export function buildIndex({ levels, lessons }) {
  const index = { levels: [], lessons: {}, order: [], search: [], stats: {} }
  const questions = []
  let order = 0

  for (const level of levels) {
    index.levels.push({
      id: level.id,
      number: level.number,
      title: level.title,
      short: level.short,
      band: level.band,
      blurb: level.blurb,
      optional: !!level.optional,
      lessons: level.lessons.map((l) => l.id),
    })
    index.search.push({
      id: `level:${level.id}`,
      type: 'module',
      title: `${String(level.number).padStart(2, '0')} — ${level.title}`,
      subtitle: level.blurb,
      to: `/learn#${level.id}`,
      text: level.lessons.map((l) => l.title).join(' '),
    })

    for (const planned of level.lessons) {
      const lesson = lessons[planned.id]
      const ready = !!lesson
      const to = `/learn/${level.id}/${planned.id}`
      const meta = {
        id: planned.id,
        level: level.id,
        levelNumber: level.number,
        band: level.band,
        order: order++,
        status: ready ? 'ready' : 'planned',
        title: lesson?.title ?? planned.title,
        summary: lesson?.summary ?? planned.summary ?? '',
        difficulty: lesson?.difficulty ?? planned.difficulty ?? level.band,
        minutes: lesson?.minutes ?? null,
        kind: lesson?.kind ?? (level.id === 'projects' ? 'project' : 'lesson'),
        prerequisites: lesson?.prerequisites ?? [],
        related: lesson?.related ?? [],
        tags: lesson?.tags ?? [],
        path: to,
        counts: {
          questions: lesson?.interview?.length ?? 0,
          exercises: (lesson?.exercises?.length ?? 0) + (lesson?.playground?.tests?.length ? 1 : 0),
          quiz: lesson?.quiz?.length ?? 0,
          experiments: lesson?.playground?.experiments?.length ?? 0,
        },
        hasPlayground: !!lesson?.playground,
        visuals: [lesson?.visual?.type, lesson?.animation?.type].filter(Boolean),
        completion: lesson?.completion ?? null,
      }
      index.lessons[planned.id] = meta
      index.order.push(planned.id)

      index.search.push({
        id: `lesson:${planned.id}`,
        type: meta.kind === 'project' ? 'project' : 'lesson',
        title: meta.title,
        subtitle: `${String(level.number).padStart(2, '0')} ${level.short} · ${meta.difficulty}${ready ? '' : ' · planned'}`,
        to,
        text: [meta.summary, meta.tags.join(' '), ready ? richToText(lesson.intro) : ''].join(' '),
      })

      if (!lesson) continue

      for (const api of lesson.apis ?? []) {
        index.search.push({
          id: `api:${planned.id}:${api.name}`,
          type: 'api',
          title: api.name,
          subtitle: plain(api.summary),
          to: `${to}#syntax`,
          text: `${api.name} ${plain(api.summary)} ${meta.title}`,
        })
      }
      for (const [i, m] of (lesson.mistakes ?? []).entries()) {
        index.search.push({
          id: `error:${planned.id}:m${i}`,
          type: 'error',
          title: plain(m.title),
          subtitle: `Common mistake · ${meta.title}`,
          to: `${to}#mistakes`,
          text: richToText(m.explanation),
        })
      }
      for (const [i, d] of (lesson.debugging ?? []).entries()) {
        index.search.push({
          id: `error:${planned.id}:d${i}`,
          type: 'error',
          title: plain(d.symptom),
          subtitle: `Debugging · ${meta.title}`,
          to: `${to}#debugging`,
          text: `${plain(d.cause)} ${plain(d.fix)}`,
        })
      }
      if (lesson.playground) {
        index.search.push({
          id: `example:${planned.id}:playground`,
          type: 'example',
          title: plain(lesson.playground.title),
          subtitle: `Live example · ${meta.title}`,
          to: `${to}#playground`,
          text: plain(lesson.playground.objective),
        })
      }
      for (const ex of lesson.exercises ?? []) {
        index.search.push({
          id: `example:${planned.id}:${ex.id}`,
          type: 'example',
          title: plain(ex.title),
          subtitle: `Exercise · ${meta.title}`,
          to: `${to}#exercises`,
          text: richToText(ex.prompt),
        })
      }
      for (const q of lesson.interview ?? []) {
        const question = { ...q, lesson: planned.id, level: level.id, lessonTitle: meta.title, lessonPath: to }
        questions.push(question)
        index.search.push({
          id: `question:${q.id}`,
          type: 'question',
          title: plain(q.question),
          subtitle: `${q.difficulty} · ${q.type} · ${meta.title}`,
          to: `/interview/bank?q=${encodeURIComponent(q.id)}`,
          text: plain(q.answer),
        })
      }
    }
  }

  for (const e of index.search) e.text = clip(e.text ?? '')
  const all = Object.values(index.lessons)
  index.stats = {
    lessons: all.length,
    ready: all.filter((l) => l.status === 'ready').length,
    questions: questions.length,
    exercises: all.reduce((n, l) => n + l.counts.exercises, 0),
    quiz: all.reduce((n, l) => n + l.counts.quiz, 0),
  }
  return { index, questions }
}

export function contentIndex() {
  // index: small, loaded on every page · search: loaded when search opens · bank: interview pages
  const IDS = { index: 'virtual:content-index', search: 'virtual:search-index', bank: 'virtual:question-bank', qmeta: 'virtual:question-meta' }
  const RESOLVED = Object.fromEntries(Object.entries(IDS).map(([k, v]) => [k, '\0' + v]))
  let root = process.cwd()
  let cache = null
  let bust = 0

  let isBuild = false

  async function get() {
    if (cache) return cache
    const content = await loadContent(root, { bust })
    for (const f of content.failures) {
      const msg = `[content-index] ${f.file} failed to load: ${f.message}`
      // A broken lesson must never ship; in dev it is skipped so editing stays smooth.
      if (isBuild) throw new Error(msg)
      console.warn(msg)
    }
    cache = buildIndex(content)
    return cache
  }

  return {
    name: 'content-index',
    configResolved(config) {
      root = config.root
      isBuild = config.command === 'build'
    },
    resolveId(id) {
      const key = Object.keys(IDS).find((k) => IDS[k] === id)
      if (key) return RESOLVED[key]
    },
    async load(id) {
      if (!Object.values(RESOLVED).includes(id)) return
      for (const f of walk(path.join(root, CONTENT_DIR))) this.addWatchFile(f)
      const { index, questions } = await get()
      if (id === RESOLVED.bank) return `export default ${JSON.stringify(questions)}`
      if (id === RESOLVED.search) return `export default ${JSON.stringify(index.search)}`
      if (id === RESOLVED.qmeta) {
        const meta = questions.map(({ id: qid, lesson, level, difficulty, type, lessonTitle }) => ({ id: qid, lesson, level, difficulty, type, lessonTitle }))
        return `export default ${JSON.stringify(meta)}`
      }
      const { search, ...light } = index
      return `export default ${JSON.stringify(light)}`
    },
    configureServer(server) {
      const contentRoot = path.join(root, CONTENT_DIR)
      const onChange = (file) => {
        if (!file.startsWith(contentRoot)) return
        cache = null
        bust = Date.now()
        for (const id of Object.values(RESOLVED)) {
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        // VLP_NO_CONTENT_RELOAD=1 keeps open pages stable while content is being written in bulk.
        if (!process.env.VLP_NO_CONTENT_RELOAD) server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', onChange)
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}
