/** Local-calendar date helpers. Plans and due dates use the learner's local date, not UTC. */

export type LocalDate = string // YYYY-MM-DD

export function localDate(d: Date = new Date()): LocalDate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocal(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = parseLocal(date)
  d.setDate(d.getDate() + days)
  return localDate(d)
}

/** Whole calendar days from a to b (b - a); DST-safe because it rounds. */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((parseLocal(b).getTime() - parseLocal(a).getTime()) / 86_400_000)
}
