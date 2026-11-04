import { addDays, daysBetween, type LocalDate } from './dates'

/**
 * Spaced-repetition scheduler (SM-2 family, adapted).
 *
 * Inputs per review: correctness and self-rated confidence (1 = guessed, 2 = unsure, 3 = sure).
 *   correct + sure    → quality 5    correct + unsure → 4    correct + guessed → 3
 *   wrong + guessed   → 2            wrong + unsure   → 1    wrong + sure      → 0  (confident errors are the most urgent)
 * Quality < 3 is a lapse: repetitions reset and the item is due tomorrow.
 * Otherwise the interval grows: 1 day, then 3 days, then previous interval × ease.
 * Reviewing early (before due) only earns credit proportional to the time actually elapsed,
 * so cramming the same item repeatedly does not inflate its interval.
 * Ease starts at 2.5, moves by the SM-2 formula and is clamped to [1.3, 2.8].
 */
export interface SrsState {
  ease: number
  interval: number // days
  reps: number
  lapses: number
  due: LocalDate
  last?: LocalDate
}

export type Confidence = 1 | 2 | 3

export function quality(correct: boolean, confidence: Confidence): number {
  if (correct) return confidence === 3 ? 5 : confidence === 2 ? 4 : 3
  return confidence === 1 ? 2 : confidence === 2 ? 1 : 0
}

export function newState(today: LocalDate): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: today }
}

export function review(prev: SrsState | undefined, correct: boolean, confidence: Confidence, today: LocalDate): SrsState {
  const s = prev ?? newState(today)
  const q = quality(correct, confidence)
  const ease = Math.min(2.8, Math.max(1.3, s.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))))
  if (q < 3) {
    return { ease, interval: 1, reps: 0, lapses: s.lapses + 1, due: addDays(today, 1), last: today }
  }
  let interval: number
  if (s.reps === 0) interval = 1
  else if (s.reps === 1) interval = 3
  else {
    const elapsed = s.last ? Math.max(0, daysBetween(s.last, today)) : s.interval
    // Early review: grow from what actually elapsed, never less than the current interval.
    const basis = Math.max(1, Math.min(s.interval, elapsed) || 1)
    interval = Math.max(s.interval, Math.round(basis * ease))
  }
  if (q === 3) interval = Math.max(1, Math.round(interval * 0.6)) // a correct guess is not solid recall
  return { ease, interval, reps: s.reps + 1, lapses: s.lapses, due: addDays(today, interval), last: today }
}

export function isDue(s: SrsState | undefined, today: LocalDate): boolean {
  return !!s && s.due <= today
}

/** How overdue relative to its interval (higher = more urgent). */
export function overdueRatio(s: SrsState, today: LocalDate): number {
  return (daysBetween(s.due, today) + 1) / Math.max(1, s.interval)
}
