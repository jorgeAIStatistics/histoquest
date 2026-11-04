import type { Objective } from '../content/curriculum'
import type { Attempt, SimRun } from '../store/state'

/** Wilson score interval: honest uncertainty for small samples. */
export function wilson(successes: number, n: number, z = 1.96): { low: number; high: number; p: number } {
  if (n === 0) return { low: 0, high: 1, p: 0 }
  const p = successes / n
  const d = 1 + (z * z) / n
  const centre = (p + (z * z) / (2 * n)) / d
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d
  return { low: Math.max(0, centre - half), high: Math.min(1, centre + half), p }
}

export interface ObjectiveEvidence {
  objective: string
  fresh: { n: number; correct: number }
  immediate: { n: number; correct: number } // repeats within a day
  delayed: { n: number; correct: number } // repeats after ≥1 day: retention
  sims: { n: number; correct: number }
  lessonDone: boolean
  lastMissedAt?: string
  recentMisses: number
}

/** Separate the evidence streams the spec asks for, per objective. */
export function evidenceByObjective(
  objectives: Objective[],
  attempts: Attempt[],
  qObjective: Record<string, string>,
  sims: SimRun[],
  completedLessonObjectives: Set<string>,
  cardEvidence: { objective: string; correct: boolean; gapDays?: number }[] = [],
): Record<string, ObjectiveEvidence> {
  const out: Record<string, ObjectiveEvidence> = {}
  for (const o of objectives)
    out[o.id] = { objective: o.id, fresh: { n: 0, correct: 0 }, immediate: { n: 0, correct: 0 }, delayed: { n: 0, correct: 0 }, sims: { n: 0, correct: 0 }, lessonDone: completedLessonObjectives.has(o.id), recentMisses: 0 }
  const recentCut = Date.now() - 14 * 86_400_000
  for (const a of attempts) {
    const e = out[qObjective[a.qid]]
    if (!e) continue
    const bucket = a.first ? e.fresh : (a.gapDays ?? 0) >= 1 ? e.delayed : e.immediate
    bucket.n++
    if (a.correct) bucket.correct++
    if (!a.correct) {
      e.lastMissedAt = a.at
      if (Date.parse(a.at) >= recentCut) e.recentMisses++
    }
  }
  for (const c of cardEvidence) {
    const e = out[c.objective]
    if (!e || (c.gapDays ?? 0) < 1) continue
    e.delayed.n++
    if (c.correct) e.delayed.correct++
  }
  for (const r of sims) for (const o of r.objectives) if (out[o]) {
    out[o].sims.n += r.total
    out[o].sims.correct += r.correct
  }
  return out
}

export type MasteryBand = 'not-started' | 'learning' | 'developing' | 'secure'

/**
 * Heuristic mastery band (documented in the UI). Reading and XP never move this.
 * - secure: ≥4 fresh answers with Wilson lower bound ≥ 0.6 AND ≥2 delayed retentions with ≥ 75% correct
 * - developing: ≥3 fresh or delayed answers with ≥ 60% correct
 * - learning: any question evidence
 */
export function masteryBand(e: ObjectiveEvidence): MasteryBand {
  const n = e.fresh.n + e.delayed.n
  if (n === 0) return 'not-started'
  const freshW = wilson(e.fresh.correct, e.fresh.n)
  if (e.fresh.n >= 4 && freshW.low >= 0.6 && e.delayed.n >= 2 && e.delayed.correct / e.delayed.n >= 0.75) return 'secure'
  if (n >= 3 && (e.fresh.correct + e.delayed.correct) / n >= 0.6) return 'developing'
  return 'learning'
}

export interface Readiness {
  coverage: number // share of objectives with any fresh evidence
  freshAccuracy: ReturnType<typeof wilson> & { n: number }
  retention: ReturnType<typeof wilson> & { n: number }
  sampleNote: string
  domainRows: { domain: string; fresh: ReturnType<typeof wilson> & { n: number } }[]
}

export function readiness(objectives: Objective[], ev: Record<string, ObjectiveEvidence>, domainNames: Record<string, string>): Readiness {
  const vals = Object.values(ev)
  const covered = objectives.filter((o) => ev[o.id]?.fresh.n > 0).length
  const fN = vals.reduce((a, e) => a + e.fresh.n, 0)
  const fC = vals.reduce((a, e) => a + e.fresh.correct, 0)
  const dN = vals.reduce((a, e) => a + e.delayed.n, 0)
  const dC = vals.reduce((a, e) => a + e.delayed.correct, 0)
  const domainRows = Object.entries(domainNames).map(([id, name]) => {
    const rows = objectives.filter((o) => o.domain === id).map((o) => ev[o.id])
    const n = rows.reduce((a, e) => a + e.fresh.n, 0)
    const c = rows.reduce((a, e) => a + e.fresh.correct, 0)
    return { domain: name, fresh: { ...wilson(c, n), n } }
  })
  const sampleNote =
    fN < 30
      ? `Only ${fN} first-attempt answers so far — too few to say much. Aim for at least 100 across all domains.`
      : fN < 100
        ? `${fN} first-attempt answers: the range below is still wide.`
        : `${fN} first-attempt answers: a reasonable sample, but still not a prediction of the ASCP result.`
  return { coverage: objectives.length ? covered / objectives.length : 0, freshAccuracy: { ...wilson(fC, fN), n: fN }, retention: { ...wilson(dC, dN), n: dN }, sampleNote, domainRows }
}
