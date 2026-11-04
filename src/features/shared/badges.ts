import type { AppState } from '../../store/state'
import { evidence } from './derived'
import { OBJECTIVES } from '../../content/curriculum'
import { QUESTION_BY_ID } from '../../content'

/** Badges require demonstrated performance, never reading or clicking. */
export interface Badge { id: string; title: string; criterion: string; earned: boolean }

export function badges(s: AppState): Badge[] {
  const ev = evidence(s)
  const domainFresh = (d: string) => {
    const rows = OBJECTIVES.filter((o) => o.domain === d).map((o) => ev[o.id])
    const n = rows.reduce((a, e) => a + e.fresh.n, 0)
    const c = rows.reduce((a, e) => a + e.fresh.correct, 0)
    const dn = rows.reduce((a, e) => a + e.delayed.n, 0)
    const dc = rows.reduce((a, e) => a + e.delayed.correct, 0)
    return { n, c, dn, dc }
  }
  const domainBadge = (id: string, d: string, title: string) => {
    const f = domainFresh(d)
    return { id, title, criterion: 'At least 10 first-attempt answers in this area at 80% or better, plus 3 correct delayed reviews.', earned: f.n >= 10 && f.c / f.n >= 0.8 && f.dc >= 3 }
  }
  const simBest = (sim: string) => s.sims.filter((r) => r.sim === sim).reduce((a, r) => Math.max(a, r.total ? r.correct / r.total : 0), 0)
  const exams = s.sessions.filter((x) => x.kind === 'exam' && x.submittedAt && x.questionIds.length >= 100)
  const calc = s.attempts.filter((a) => a.first && QUESTION_BY_ID[a.qid]?.format === 'numeric')
  return [
    domainBadge('fix', 'FIX', 'Fixation foundations'),
    domainBadge('proc', 'PROC', 'Processing principles'),
    domainBadge('emb', 'EMB', 'Clean ribbons'),
    domainBadge('stain', 'STAIN', 'Stain chemist'),
    domainBadge('ops', 'OPS', 'Lab operations'),
    { id: 'units', title: 'Units, every time', criterion: 'Eight first-attempt calculation questions right, with units.', earned: calc.filter((a) => a.correct).length >= 8 },
    { id: 'bench', title: 'Clean processor', criterion: 'A perfect processing bench run: sequence first try, all cases diagnosed.', earned: simBest('processing-bench') >= 1 },
    { id: 'orient', title: 'Margin minded', criterion: 'Every embedding studio tissue oriented correctly in one run.', earned: simBest('embedding-studio') >= 1 },
    { id: 'pasd', title: 'Diastase detective', criterion: 'A stain studio run at 80% or better reasoning.', earned: simBest('stain-studio') >= 0.8 },
    { id: 'journey', title: 'Chain of custody', criterion: 'A specimen journey with every decision at best practice.', earned: simBest('specimen-journey') >= 1 },
    { id: 'stamina', title: 'Exam stamina', criterion: 'Submit a full-length timed practice exam.', earned: exams.length > 0 },
  ]
}

export const ACCENTS = [
  { id: 'hematoxylin', label: 'Hematoxylin violet', needs: 0 },
  { id: 'giemsa', label: 'Giemsa blue', needs: 1 },
  { id: 'trichrome', label: 'Trichrome green', needs: 3 },
  { id: 'congo', label: 'Congo red', needs: 5 },
]
