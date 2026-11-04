import { describe, expect, it } from 'vitest'
import { ATLAS, ATLAS_BY_ID, CARDS, contentProblems, LESSON_BY_ID, LESSONS, QUESTION_BY_ID, QUESTIONS, SIMULATIONS } from '.'
import { ACTIVE_GUIDELINE, OBJECTIVE_BY_ID, OBJECTIVES } from './curriculum'
import { SOURCE_BY_ID } from './sources'

/** Software validation of content structure. This does NOT establish scientific accuracy. */
describe('content bank', () => {
  it('parses every item', () => {
    expect(contentProblems).toEqual([])
  })

  it('meets release targets', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(15)
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(120)
    expect(CARDS.length).toBeGreaterThanOrEqual(60)
  })

  it('has unique ids everywhere', () => {
    for (const list of [QUESTIONS, CARDS, LESSONS, ATLAS] as { id: string }[][]) {
      const ids = list.map((x) => x.id)
      expect(ids.length).toBe(new Set(ids).size)
    }
  })

  it('maps every question, card and lesson to a known objective and source', () => {
    for (const q of QUESTIONS) {
      expect(OBJECTIVE_BY_ID[q.objective], q.id).toBeDefined()
      expect(OBJECTIVE_BY_ID[q.objective].domain, q.id).toBe(q.domain)
      for (const r of q.references) expect(SOURCE_BY_ID[r.sourceId], `${q.id} ${r.sourceId}`).toBeDefined()
    }
    for (const c of CARDS) expect(OBJECTIVE_BY_ID[c.objective], c.id).toBeDefined()
    for (const l of LESSONS) for (const o of l.objectives) expect(OBJECTIVE_BY_ID[o], l.id).toBeDefined()
  })

  it('covers every objective with at least one question, and every domain with a lesson', () => {
    const uncovered = OBJECTIVES.filter((o) => !QUESTIONS.some((q) => q.objective === o.id)).map((o) => o.id)
    expect(uncovered).toEqual([])
    for (const d of ACTIVE_GUIDELINE.domains) expect(LESSONS.some((l) => l.domain === d.id), d.id).toBe(true)
  })

  it('resolves cross-references', () => {
    for (const l of LESSONS) {
      for (const id of l.retrieval) expect(QUESTION_BY_ID[id], `${l.id} retrieval ${id}`).toBeDefined()
      for (const p of l.prerequisites) expect(LESSON_BY_ID[p], `${l.id} prereq ${p}`).toBeDefined()
      if (l.simulation) expect(SIMULATIONS.some((s) => s.id === l.simulation), `${l.id} sim`).toBe(true)
      if (l.demo.key === 'sequence') expect(l.demo.steps.length, `${l.id} steps`).toBeGreaterThanOrEqual(2)
      expect(l.prediction.options.some((o) => o.id === l.prediction.answer)).toBe(true)
      expect(l.troubleshooting.options.some((o) => o.id === l.troubleshooting.answer)).toBe(true)
    }
    for (const a of ATLAS) {
      for (const c of a.compareWith) expect(ATLAS_BY_ID[c], `${a.id} compare ${c}`).toBeDefined()
      for (const l of a.lessons) expect(LESSON_BY_ID[l], `${a.id} lesson ${l}`).toBeDefined()
    }
  })

  it('has well-formed choice questions with balanced keys', () => {
    const keys: Record<string, number> = {}
    for (const q of QUESTIONS) {
      if (q.format !== 'choice') continue
      expect(q.options.some((o) => o.id === q.answer), q.id).toBe(true)
      expect(new Set(q.options.map((o) => o.text.trim().toLowerCase())).size, `${q.id} duplicate options`).toBe(q.options.length)
      keys[q.answer] = (keys[q.answer] ?? 0) + 1
    }
    const counts = Object.values(keys)
    expect(Math.max(...counts) / Math.min(...counts)).toBeLessThan(1.6)
  })

  it('has no near-duplicate stems (word-set Jaccard < 0.8)', () => {
    const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3))
    const sets = QUESTIONS.map((q) => ({ id: q.id, w: words(q.stem) }))
    const dupes: string[] = []
    for (let i = 0; i < sets.length; i++)
      for (let j = i + 1; j < sets.length; j++) {
        const a = sets[i].w
        const b = sets[j].w
        const inter = [...a].filter((x) => b.has(x)).length
        const jac = inter / (a.size + b.size - inter)
        if (jac >= 0.8) dupes.push(`${sets[i].id}~${sets[j].id}`)
      }
    expect(dupes).toEqual([])
  })

  it('never claims expert review and never cites pages for unread sources', () => {
    for (const item of [...QUESTIONS, ...CARDS, ...LESSONS, ...ATLAS]) {
      expect(item.review.status).not.toBe('expert-reviewed')
      for (const r of item.references) {
        if (SOURCE_BY_ID[r.sourceId]?.access === 'not-accessed') expect(r.note ?? '', `${item.id}`).not.toMatch(/\bp{1,2}\.\s*\d/)
      }
    }
  })
})
