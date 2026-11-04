import { OBJECTIVES } from '../../content/curriculum'
import { C_OBJECTIVE, DOMAIN_NAMES, LESSON_BY_ID, LESSONS, OBJECTIVE_TITLES, Q_OBJECTIVE, SIM_TITLES } from '../../content'
import { localDate } from '../../engine/dates'
import { buildPlan } from '../../engine/planner'
import { evidenceByObjective, readiness } from '../../engine/readiness'
import { hashString } from '../../engine/random'
import type { AppState, PlanItem } from '../../store/state'

export function completedLessons(s: AppState) {
  return new Set(Object.entries(s.lessons).filter(([, v]) => v.completedAt).map(([k]) => k))
}

export function evidence(s: AppState) {
  const done = completedLessons(s)
  const lessonObjectives = new Set([...done].flatMap((id) => LESSON_BY_ID[id]?.objectives ?? []))
  const cardEv = s.cardReviews.map((r) => ({ objective: C_OBJECTIVE[r.cid], correct: r.correct, gapDays: r.gapDays }))
  return evidenceByObjective(OBJECTIVES, s.attempts, Q_OBJECTIVE, s.sims, lessonObjectives, cardEv)
}

export function readinessOf(s: AppState) {
  return readiness(OBJECTIVES, evidence(s), DOMAIN_NAMES)
}

export function planFor(s: AppState, minutes: 10 | 20 | 45, today = localDate()): PlanItem[] {
  const items = buildPlan({
    today,
    minutes,
    srs: s.srs,
    evidence: evidence(s),
    objectiveTitles: OBJECTIVE_TITLES,
    lessons: LESSONS,
    completedLessons: completedLessons(s),
    simTitles: SIM_TITLES,
    challengeSeed: hashString(today),
  })
  return items.map((i) => ({ ...i, done: false, skipped: false }))
}

/** Streak that forgives: one missed day per rolling week does not break it. */
export function forgivingStreak(days: string[], today = localDate()): { length: number; graceUsed: boolean } {
  const set = new Set(days)
  let length = 0
  let misses = 0
  let graceUsed = false
  const d = new Date()
  if (!set.has(today)) d.setDate(d.getDate() - 1) // today not yet studied doesn't break anything
  for (let i = 0; i < 400; i++) {
    const key = localDate(d)
    if (set.has(key)) {
      length++
      misses = 0
    } else {
      misses++
      if (misses > 1 || length === 0) break
      graceUsed = true
    }
    d.setDate(d.getDate() - 1)
  }
  return { length, graceUsed }
}

export function totalXp(s: AppState) {
  return s.xp.reduce((a, x) => a + x.amount, 0)
}
