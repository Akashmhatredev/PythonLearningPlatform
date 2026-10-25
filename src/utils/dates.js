// Local-calendar day keys ("2026-10-21"). Streaks follow the learner's own
// timezone, not UTC, so studying at 11pm still counts for "today".
export function dayKey(date = new Date()) {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

/**
 * Consecutive active days ending today — or ending yesterday, so a streak is
 * not shown as broken before the learner has had a chance to study today.
 */
export function computeStreak(activeDays, today = new Date()) {
  const days = new Set(activeDays)
  let cursor = dayKey(today)
  if (!days.has(cursor)) cursor = addDays(cursor, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function daysBetween(a, b = Date.now()) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

export function relativeTime(ts, now = Date.now()) {
  if (!ts) return 'never'
  const s = Math.round((now - ts) / 1000)
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`
  return new Date(ts).toLocaleDateString()
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
