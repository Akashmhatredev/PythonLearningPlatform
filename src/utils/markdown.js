// A deliberately small markdown dialect for lesson prose.
// It returns a token tree that Vue components render; it never produces HTML
// strings, so lesson text can't inject markup into the page.
//
// Blocks : paragraphs, - / * lists, 1. lists, ``` fences, > quotes, #### headings
// Inline : `code`, **bold**, *em* / _em_, [text](href), line breaks via two spaces

const cache = new Map()

export function parseMarkdown(src) {
  if (typeof src !== 'string') return []
  const hit = cache.get(src)
  if (hit) return hit
  const blocks = parseBlocks(dedent(src))
  if (cache.size > 2000) cache.clear()
  cache.set(src, blocks)
  return blocks
}

export function dedent(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(min)).join('\n')
}

const FENCE = /^```\s*([\w-]*)\s*(.*)$/
const UL = /^\s*[-*]\s+(.*)$/
const OL = /^\s*(\d+)[.)]\s+(.*)$/
const HEADING = /^(#{2,5})\s+(.*)$/

function parseBlocks(src) {
  const lines = src.split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const fence = line.match(FENCE)
    if (fence) {
      const body = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++])
      i++ // closing fence
      out.push({ type: 'code', lang: fence[1] || 'text', title: fence[2] || '', code: body.join('\n') })
      continue
    }
    if (isTableStart(lines, i)) {
      const headers = splitRow(lines[i])
      const align = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : 'left'))
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitRow(lines[i++]))
      out.push({
        type: 'table',
        align,
        headers: headers.map(parseInline),
        rows: rows.map((r) => headers.map((_, c) => parseInline(r[c] ?? ''))),
      })
      continue
    }
    const h = line.match(HEADING)
    if (h) {
      out.push({ type: 'h', level: Math.min(h[1].length + 1, 5), inline: parseInline(h[2]) })
      i++
      continue
    }
    if (/^>\s?/.test(line)) {
      const body = []
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''))
      const inner = parseBlocks(body.join('\n'))
      out.push({ type: 'quote', tone: calloutTone(body[0]), blocks: inner })
      continue
    }
    if (UL.test(line) || OL.test(line)) {
      const ordered = !UL.test(line)
      const items = []
      const start = ordered ? Number(line.match(OL)[1]) : 1
      while (i < lines.length) {
        const l = lines[i]
        const m = ordered ? l.match(OL) : l.match(UL)
        if (m) {
          items.push(ordered ? m[2] : m[1])
          i++
        } else if (l.trim() && /^\s{2,}/.test(l) && items.length) {
          items[items.length - 1] += ' ' + l.trim() // continuation line
          i++
        } else break
      }
      out.push({ type: ordered ? 'ol' : 'ul', start, items: items.map(parseInline) })
      continue
    }
    const para = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !FENCE.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !isTableStart(lines, i)
    ) {
      para.push(lines[i++])
    }
    out.push({ type: 'p', inline: parseInline(para.join('\n')) })
  }
  return out
}

// GFM-style pipe tables: a header row followed by a |---|---| separator row.
function isTableStart(lines, i) {
  return /^\s*\|.*\|\s*$/.test(lines[i] ?? '') && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1] ?? '')
}

function splitRow(line) {
  const cells = []
  let buf = ''
  let inCode = false
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '\\' && body[i + 1] === '|') {
      buf += '|'
      i++
    } else if (ch === '`') {
      inCode = !inCode
      buf += ch
    } else if (ch === '|' && !inCode) {
      cells.push(buf.trim())
      buf = ''
    } else buf += ch
  }
  cells.push(buf.trim())
  return cells
}

function calloutTone(first = '') {
  const m = first.match(/^\*\*(\w+)/)
  const word = m?.[1]?.toLowerCase()
  if (!word) return 'note'
  if (['warning', 'careful', 'danger', 'security', 'caution'].includes(word)) return 'warn'
  if (['tip', 'pro'].includes(word)) return 'tip'
  if (['version', 'requires'].includes(word)) return 'version'
  return 'note'
}

export function safeHref(href = '') {
  const h = href.trim()
  if (/^(https?:|mailto:)/i.test(h)) return { kind: 'external', href: h }
  if (h.startsWith('lesson:')) return { kind: 'lesson', id: h.slice(7).split('#')[0], hash: h.split('#')[1] || '' }
  if (h.startsWith('/') || h.startsWith('#')) return { kind: 'internal', href: h }
  return null
}

// Inline tokenizer. Code spans win over everything else.
export function parseInline(text) {
  const tokens = []
  let buf = ''
  let i = 0
  const flush = () => {
    if (buf) tokens.push({ t: 'text', v: buf })
    buf = ''
  }
  while (i < text.length) {
    const ch = text[i]
    if (ch === '\\' && i + 1 < text.length && /[`*_\[\]\\]/.test(text[i + 1])) {
      buf += text[i + 1]
      i += 2
      continue
    }
    if (ch === '`') {
      const ticks = text.slice(i).match(/^`+/)[0]
      const end = text.indexOf(ticks, i + ticks.length)
      if (end !== -1) {
        flush()
        tokens.push({ t: 'code', v: text.slice(i + ticks.length, end).replace(/^ (.*) $/, '$1') })
        i = end + ticks.length
        continue
      }
    }
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end > i + 2) {
        flush()
        tokens.push({ t: 'strong', c: parseInline(text.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }
    if ((ch === '*' || ch === '_') && text[i + 1] !== ch && text[i + 1] !== ' ') {
      const prev = text[i - 1]
      if (ch === '_' && prev && /\w/.test(prev)) {
        buf += ch
        i++
        continue
      }
      const end = findClosing(text, ch, i + 1)
      if (end > i + 1) {
        flush()
        tokens.push({ t: 'em', c: parseInline(text.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }
    if (ch === '[') {
      const close = findBracket(text, i)
      if (close !== -1 && text[close + 1] === '(') {
        const end = text.indexOf(')', close + 2)
        if (end !== -1) {
          const link = safeHref(text.slice(close + 2, end))
          flush()
          const children = parseInline(text.slice(i + 1, close))
          tokens.push(link ? { t: 'link', link, c: children } : { t: 'span', c: children })
          i = end + 1
          continue
        }
      }
    }
    if (ch === '\n') {
      if (buf.endsWith('  ')) {
        buf = buf.replace(/ +$/, '')
        flush()
        tokens.push({ t: 'br' })
      } else buf += ' '
      i++
      continue
    }
    buf += ch
    i++
  }
  flush()
  return tokens
}

function findClosing(text, ch, from) {
  for (let j = from; j < text.length; j++) {
    if (text[j] === '`') {
      const end = text.indexOf('`', j + 1)
      if (end === -1) return -1
      j = end
      continue
    }
    if (text[j] === ch && text[j - 1] !== ' ' && text[j + 1] !== ch) {
      if (ch === '_' && text[j + 1] && /\w/.test(text[j + 1])) continue
      return j
    }
  }
  return -1
}

function findBracket(text, from) {
  let depth = 0
  for (let j = from; j < text.length; j++) {
    if (text[j] === '[') depth++
    else if (text[j] === ']') {
      depth--
      if (depth === 0) return j
    } else if (text[j] === '`') {
      const end = text.indexOf('`', j + 1)
      if (end === -1) return -1
      j = end
    }
  }
  return -1
}

// Flatten inline/markdown to plain text (search, aria labels, titles).
export function toPlainText(src) {
  if (!src) return ''
  if (Array.isArray(src)) return src.map(toPlainText).join(' ')
  if (typeof src === 'object') return toPlainText(src.text || src.body || '')
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
