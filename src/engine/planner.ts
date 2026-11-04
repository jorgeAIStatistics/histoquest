import type { LocalDate } from './dates'
import type { ObjectiveEvidence } from './readiness'
import { isDue, overdueRatio, type SrsState } from './srs'

export interface PlanInput {
  today: LocalDate
  minutes: 10 | 20 | 45
  srs: Record<string, SrsState>
  evidence: Record<string, ObjectiveEvidence>
  objectiveTitles: Record<string, string>
  lessons: { id: string; title: string; minutes: number; prerequisites: string[]; objectives: string[]; simulation?: string }[]
  completedLessons: Set<string>
  simTitles: Record<string, string>
  challengeSeed: number
}

export interface PlannedItem {
  id: string
  kind: 'review' | 'weak' | 'new' | 'challenge'
  title: string
  why: string
  minutes: number
  href: string
}

const REVIEW_MIN_PER_ITEM = 0.75

/** Objectives ranked weakest-first, considering only those with real evidence. */
export function weakObjectives(ev: Record<string, ObjectiveEvidence>): { id: string; score: number; e: ObjectiveEvidence }[] {
  return Object.values(ev)
    .map((e) => {
      const n = e.fresh.n + e.delayed.n + e.immediate.n
      const c = e.fresh.correct + e.delayed.correct + e.immediate.correct
      // Laplace-smoothed accuracy so one miss doesn't dominate; recent misses add urgency.
      const acc = (c + 1) / (n + 2)
      return { id: e.objective, score: acc - 0.05 * e.recentMisses, e, n }
    })
    .filter((x) => x.n > 0 && x.score < 0.7)
    .sort((a, b) => a.score - b.score)
}

export function nextLesson(input: Pick<PlanInput, 'lessons' | 'completedLessons'>) {
  return input.lessons.find((l) => !input.completedLessons.has(l.id) && l.prerequisites.every((p) => input.completedLessons.has(p)))
}

export function buildPlan(input: PlanInput): PlannedItem[] {
  const { minutes, today } = input
  const budget = { 10: { review: 6, weak: 0, sim: false }, 20: { review: 6, weak: 5, sim: false }, 45: { review: 12, weak: 8, sim: true } }[minutes]
  const items: PlannedItem[] = []
  let left = minutes

  // 1. Due reviews, most overdue first.
  const due = Object.entries(input.srs)
    .filter(([, s]) => isDue(s, today))
    .sort(([, a], [, b]) => overdueRatio(b, today) - overdueRatio(a, today))
  if (due.length) {
    const n = Math.min(due.length, Math.floor(budget.review / REVIEW_MIN_PER_ITEM))
    const m = Math.max(2, Math.ceil(n * REVIEW_MIN_PER_ITEM))
    const lapsed = due.slice(0, n).filter(([, s]) => s.lapses > 0).length
    items.push({
      id: 'review',
      kind: 'review',
      title: `Review ${n} due item${n === 1 ? '' : 's'}`,
      why:
        `${due.length} item${due.length === 1 ? ' is' : 's are'} due today by the review schedule` +
        (lapsed ? `; ${lapsed} of them you missed before, so they come first.` : '.'),
      minutes: m,
      href: `/practice/review?limit=${n}`,
    })
    left -= m
  }

  // 2. Weakest objective with evidence.
  const weak = weakObjectives(input.evidence)[0]
  if (weak && budget.weak && left >= budget.weak) {
    const e = weak.e
    const missed = e.fresh.n + e.delayed.n + e.immediate.n - (e.fresh.correct + e.delayed.correct + e.immediate.correct)
    items.push({
      id: `weak:${weak.id}`,
      kind: 'weak',
      title: `Strengthen: ${input.objectiveTitles[weak.id]}`,
      why: `You missed ${missed} question${missed === 1 ? '' : 's'} on this objective${e.recentMisses ? `, ${e.recentMisses} in the last two weeks` : ''}. A short targeted set with fresh questions where possible.`,
      minutes: budget.weak,
      href: `/practice/run?objective=${weak.id}&n=5`,
    })
    left -= budget.weak
  }

  // 3. New material: next lesson whose prerequisites are complete.
  const lesson = nextLesson(input)
  if (lesson && left >= Math.min(lesson.minutes, 8)) {
    const m = Math.min(lesson.minutes, left - 2)
    items.push({
      id: `new:${lesson.id}`,
      kind: 'new',
      title: lesson.title,
      why: lesson.prerequisites.length ? 'Next in the curriculum; its prerequisites are done.' : 'Next new lesson in the curriculum sequence.',
      minutes: Math.max(5, m),
      href: `/learn/${lesson.id}`,
    })
    left -= Math.max(5, m)
  }

  // 4. Application challenge: a simulation in long sessions, otherwise a short failed-run case.
  const simLesson = lesson?.simulation ?? input.lessons.find((l) => l.simulation && input.completedLessons.has(l.id))?.simulation
  if (budget.sim && simLesson && left >= 6) {
    items.push({ id: `sim:${simLesson}`, kind: 'challenge', title: `Virtual Lab: ${input.simTitles[simLesson] ?? simLesson}`, why: 'Apply the idea with decisions and consequences, not just recall.', minutes: Math.min(10, left), href: `/lab/${simLesson}` })
  } else {
    items.push({ id: 'challenge', kind: 'challenge', title: 'Solve a failed run', why: 'One troubleshooting case to practise reasoning from evidence to cause.', minutes: Math.max(2, Math.min(4, left)), href: `/practice/run?kind=case&n=2&seed=${input.challengeSeed}` })
  }
  return items
}
