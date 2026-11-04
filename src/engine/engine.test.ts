import { describe, expect, it } from 'vitest'
import { ACTIVE_GUIDELINE, guidelineForExamDate, type DomainId } from '../content/curriculum'
import type { ChoiceQuestion, NumericQuestion } from '../content/schema'
import { exportJson, importJson, initialState, migrateAndValidate } from '../store/state'
import { allocate, buildForm } from './blueprint'
import { addDays, daysBetween, localDate } from './dates'
import { gradeChoice, gradeNumeric, optionOrder } from './grading'
import { readiness, evidenceByObjective, masteryBand, wilson } from './readiness'
import { review } from './srs'
import { buildPlan } from './planner'

const choice: ChoiceQuestion = {
  id: 'Q-FIX-999', version: 1, domain: 'FIX', objective: 'FIX-01', difficulty: 1, kind: 'recall', format: 'choice', stem: 'Which is right here?',
  options: ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id, rationale: 'because reasons' })), answer: 'c', explanation: 'c is right because of chemistry',
  references: [{ sourceId: 'hq-original' }], review: { status: 'draft', verification: 'test' }, tags: [],
}
const numeric: NumericQuestion = {
  id: 'Q-OPS-999', version: 1, domain: 'OPS', objective: 'OPS-03', difficulty: 1, kind: 'calculation', format: 'numeric', stem: 'How many mL of stock?',
  answer: 350, unit: 'mL', unitAliases: ['ml', 'milliliters'], tolerance: 0.5, steps: ['x'], explanation: 'C1V1', commonErrors: [{ value: 150, why: 'That is the water volume.' }],
  references: [{ sourceId: 'hq-original' }], review: { status: 'draft', verification: 'test' }, tags: [],
}

describe('dates', () => {
  it('uses local calendar dates and survives DST/month boundaries', () => {
    expect(localDate(new Date(2026, 10, 1, 23, 59))).toBe('2026-11-01')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09')
    expect(daysBetween('2026-11-01', '2026-11-08')).toBe(7)
  })
})

describe('guideline selection', () => {
  it('picks the guideline by exam date', () => {
    expect(guidelineForExamDate('2026-10-31')?.id).toBe('ascp-ht-htl-2025-11')
    expect(guidelineForExamDate('2026-11-01')?.id).toBe('ascp-ht-htl-2026-11')
    expect(ACTIVE_GUIDELINE.examModel).toMatchObject({ questions: 100, minutes: 150 })
  })
})

describe('grading', () => {
  it('grades choice answers by id, independent of shuffled order', () => {
    const order = optionOrder(choice, 'seed-1')
    expect([...order].sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(optionOrder(choice, 'seed-1')).toEqual(order) // stable across refresh
    expect(gradeChoice(choice, 'c')).toBe(true)
    expect(gradeChoice(choice, 'a')).toBe(false)
    expect(gradeChoice(choice, undefined)).toBe(false)
  })
  it('shuffles differently across seeds (not always identity)', () => {
    const orders = new Set(Array.from({ length: 20 }, (_, i) => optionOrder(choice, `s${i}`).join('')))
    expect(orders.size).toBeGreaterThan(5)
  })
  it('requires both value within tolerance and correct unit', () => {
    expect(gradeNumeric(numeric, '350', 'mL').correct).toBe(true)
    expect(gradeNumeric(numeric, '350 ml').correct).toBe(true)
    expect(gradeNumeric(numeric, '350.4', 'milliliters').correct).toBe(true)
    expect(gradeNumeric(numeric, '351', 'mL').correct).toBe(false)
    const noUnit = gradeNumeric(numeric, '350')
    expect(noUnit).toMatchObject({ correct: false, valueOk: true, unitOk: false })
    expect(noUnit.feedback).toMatch(/unit is missing/)
    expect(gradeNumeric(numeric, '350', 'L')).toMatchObject({ correct: false, valueOk: true })
    expect(gradeNumeric(numeric, '150', 'mL').feedback).toBe('That is the water volume.')
    expect(gradeNumeric(numeric, 'abc').feedback).toMatch(/Enter a number/)
  })
})

describe('spaced repetition', () => {
  it('grows intervals on confident recall and resets on a lapse', () => {
    let s = review(undefined, true, 3, '2026-11-01')
    expect(s).toMatchObject({ interval: 1, due: '2026-11-02', reps: 1 })
    s = review(s, true, 3, '2026-11-02')
    expect(s).toMatchObject({ interval: 3, due: '2026-11-05' })
    s = review(s, true, 3, '2026-11-05')
    expect(s.interval).toBeGreaterThanOrEqual(7)
    const lapsed = review(s, false, 3, '2026-11-12')
    expect(lapsed).toMatchObject({ interval: 1, reps: 0, lapses: 1, due: '2026-11-13' })
    expect(lapsed.ease).toBeLessThan(s.ease)
  })
  it('does not let same-day cramming inflate the interval', () => {
    let s = review(undefined, true, 3, '2026-11-01')
    s = review(s, true, 3, '2026-11-02')
    const before = s.interval
    for (let i = 0; i < 5; i++) s = review(s, true, 3, '2026-11-02')
    expect(s.interval).toBeLessThanOrEqual(Math.ceil(before * 2.8))
    expect(s.due <= addDays('2026-11-02', 9)).toBe(true)
  })
  it('treats a correct guess as weaker than sure recall', () => {
    const base = review(review(undefined, true, 3, '2026-11-01'), true, 3, '2026-11-02')
    expect(review(base, true, 1, '2026-11-05').interval).toBeLessThan(review(base, true, 3, '2026-11-05').interval)
  })
})

describe('blueprint selection', () => {
  const pool = (counts: Record<DomainId, number>) =>
    (Object.entries(counts) as [DomainId, number][]).flatMap(([d, n]) => Array.from({ length: n }, (_, i) => ({ id: `${d}-${i}`, domain: d })))
  it('allocates 100 items within every domain range', () => {
    const a = allocate(ACTIVE_GUIDELINE, 100, { FIX: 99, PROC: 99, EMB: 99, STAIN: 99, OPS: 99 })
    expect(Object.values(a).reduce((x, y) => x + y, 0)).toBe(100)
    for (const d of ACTIVE_GUIDELINE.domains) {
      expect(a[d.id]).toBeGreaterThanOrEqual(d.min)
      expect(a[d.id]).toBeLessThanOrEqual(d.max)
    }
  })
  it('never repeats a question in a form, even with duplicate pool entries', () => {
    const p = pool({ FIX: 26, PROC: 20, EMB: 26, STAIN: 44, OPS: 24 })
    const { ids } = buildForm(ACTIVE_GUIDELINE, [...p, ...p], 100, 'exam-1')
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(100)
  })
  it('is deterministic per seed and prefers unseen items', () => {
    const p = pool({ FIX: 30, PROC: 30, EMB: 30, STAIN: 40, OPS: 20 })
    expect(buildForm(ACTIVE_GUIDELINE, p, 20, 'x').ids).toEqual(buildForm(ACTIVE_GUIDELINE, p, 20, 'x').ids)
    const seen = new Set(p.filter((q) => q.domain === 'FIX').slice(0, 25).map((q) => q.id))
    const { ids } = buildForm(ACTIVE_GUIDELINE, p, 20, 'y', seen)
    expect(ids.filter((id) => seen.has(id)).length).toBe(0)
  })
  it('reports a shortfall honestly when the pool is too small', () => {
    const r = buildForm(ACTIVE_GUIDELINE, pool({ FIX: 2, PROC: 2, EMB: 2, STAIN: 2, OPS: 2 }), 100, 'z')
    expect(r.ids.length).toBe(10)
    expect(r.shortBy).toBe(90)
  })
})

describe('readiness', () => {
  it('counts only first attempts as fresh, and gaps ≥1 day as retention', () => {
    const at = new Date().toISOString()
    const attempts = [
      { qid: 'q1', qVersion: 1, at, day: '2026-11-01', correct: true, confidence: 3 as const, mode: 'study' as const, first: true },
      { qid: 'q1', qVersion: 1, at, day: '2026-11-01', correct: true, confidence: 3 as const, mode: 'study' as const, first: false, gapDays: 0 },
      { qid: 'q1', qVersion: 1, at, day: '2026-11-01', correct: true, confidence: 3 as const, mode: 'study' as const, first: false, gapDays: 0 },
      { qid: 'q1', qVersion: 1, at, day: '2026-11-04', correct: false, confidence: 2 as const, mode: 'review' as const, first: false, gapDays: 3 },
    ]
    const objectives = [{ id: 'FIX-01', domain: 'FIX' as const, title: 't', codes: [] }]
    const ev = evidenceByObjective(objectives, attempts, { q1: 'FIX-01' }, [], new Set())
    expect(ev['FIX-01'].fresh).toEqual({ n: 1, correct: 1 })
    expect(ev['FIX-01'].immediate).toEqual({ n: 2, correct: 2 })
    expect(ev['FIX-01'].delayed).toEqual({ n: 1, correct: 0 })
    const r = readiness(objectives, ev, { FIX: 'Fixation' })
    expect(r.freshAccuracy.n).toBe(1) // repeats did not inflate the sample
    expect(masteryBand(ev['FIX-01'])).not.toBe('secure')
  })
  it('wilson interval widens with small samples', () => {
    const small = wilson(4, 5)
    const big = wilson(80, 100)
    expect(small.high - small.low).toBeGreaterThan(big.high - big.low)
  })
})

describe('daily planner', () => {
  it('fits the selected duration and explains each item', () => {
    const srs = { 'q:Q-FIX-001': { ease: 2.5, interval: 1, reps: 1, lapses: 1, due: '2026-11-03' } }
    for (const minutes of [10, 20, 45] as const) {
      const plan = buildPlan({
        today: '2026-11-04', minutes, srs, evidence: {}, objectiveTitles: {}, completedLessons: new Set(), simTitles: {}, challengeSeed: 1,
        lessons: [{ id: 'L-01', title: 'Lesson', minutes: 12, prerequisites: [], objectives: ['FIX-01'] }],
      })
      expect(plan.reduce((a, i) => a + i.minutes, 0)).toBeLessThanOrEqual(minutes)
      expect(plan.every((i) => i.why.length > 10)).toBe(true)
      expect(plan[0].kind).toBe('review')
    }
  })
})

describe('persistence', () => {
  it('round-trips export → import', () => {
    const s = initialState(new Date('2026-11-04T12:00:00Z'))
    s.profile.name = 'Test'
    s.attempts.push({ qid: 'Q-FIX-001', qVersion: 1, at: '2026-11-04T12:00:00Z', day: '2026-11-04', correct: true, confidence: 3, mode: 'study', first: true })
    const r = importJson(exportJson(s))
    expect(r.ok && r.state).toEqual(s)
  })
  it('migrates v1 data and rejects invalid or newer files', () => {
    const s = initialState() as unknown as Record<string, unknown>
    const settings: Record<string, unknown> = { ...(s.settings as Record<string, unknown>), minutes: 45 }
    delete settings.sessionMinutes
    delete settings.tutorDepth
    const v1 = { ...s, version: 1, settings }
    const r = migrateAndValidate(v1)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.state.settings.sessionMinutes).toBe(45)
    expect(importJson('{nope').ok).toBe(false)
    expect(migrateAndValidate({ ...initialState(), version: 99 }).ok).toBe(false)
    expect(migrateAndValidate({ ...initialState(), attempts: [{ qid: 1 }] }).ok).toBe(false)
  })
})
