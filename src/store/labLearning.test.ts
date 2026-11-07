import { describe, expect, it } from 'vitest'
import { CARDS } from '../content'
import { OBJECTIVES } from '../content/curriculum'
import { createScenario } from '../sim/core/scenarios'
import { createTwin } from '../sim/specimen/initial'
import { reduceEvent, nominalEvent } from '../sim/core/replay'
import { initialState, exportJson, importJson } from './state'
import { applyLabLearning, STATION_OBJECTIVES } from './labLearning'
const record = {
  id: 'learn-run',
  version: 1 as const,
  seed: 'LEARN',
  archetype: 'skin-ellipse',
  difficulty: 1 as const,
  mode: 'practical' as const,
  startedAt: '2026-11-06T15:00:00Z',
  completedAt: '2026-11-06T15:05:00Z',
  title: 'Practice accessioning',
  events: [],
}
const faulty = () =>
  reduceEvent(
    createTwin({ ...createScenario('LEARN'), discrepancy: 'dob-mismatch' }),
    nominalEvent('accessioning', 'identity.accept', {}),
  )
describe('lab practice recommendations', () => {
  it('schedules related recall without manufacturing exam or recall evidence', () => {
    const original = initialState()
    const next = applyLabLearning(original, record, faulty())
    expect(next.lab.remediation[0].critical).toBe(true)
    expect(next.lab.remediation[0].objectives).toContain('OPS-08')
    expect(next.attempts).toBe(original.attempts)
    expect(next.cardReviews).toBe(original.cardReviews)
    expect(next.sims).toBe(original.sims)
    expect(Object.keys(next.srs).length).toBeGreaterThan(0)
    for (const [key, s] of Object.entries(next.srs)) {
      expect(CARDS.find((c) => `c:${c.id}` === key)?.objective).toBe('OPS-08')
      expect(s.reps).toBe(0)
      expect(s.lapses).toBe(0)
      expect(s.last).toBeUndefined()
    }
    expect(importJson(exportJson(next)).ok).toBe(true)
  })
  it('preserves established recall intervals and makes completion idempotent', () => {
    const state = initialState(),
      card = CARDS.find((c) => c.objective === 'OPS-08')!
    state.srs[`c:${card.id}`] = {
      ease: 2.8,
      interval: 60,
      reps: 8,
      lapses: 2,
      due: '2026-12-31',
      last: '2026-10-31',
    }
    const next = applyLabLearning(state, record, faulty())
    expect(next.srs[`c:${card.id}`]).toMatchObject({
      ease: 2.8,
      interval: 60,
      reps: 8,
      lapses: 2,
      last: '2026-10-31',
    })
    expect(next.srs[`c:${card.id}`].due).toBe('2026-11-06')
    expect(applyLabLearning(next, record, faulty())).toBe(next)
  })
  it('does not schedule an unfinished attempt or a clean receipt', () => {
    const state = initialState()
    expect(applyLabLearning(state, { ...record, completedAt: undefined }, faulty())).toBe(state)
    const clean = reduceEvent(
      createTwin({ ...createScenario('CLEAN'), discrepancy: 'none' }),
      nominalEvent('accessioning', 'identity.accept', {}),
    )
    expect(applyLabLearning(state, record, clean)).toBe(state)
  })
  it('does not mistake orientation evidence for a failed physical procedure', () => {
    const state = initialState()
    const t = reduceEvent(
      createTwin(createScenario('L0')),
      nominalEvent('microtomy', 'practice.evidence', {
        checkId: 'safety',
        text: 'Identified the lock and guard before the procedure.',
      }),
    )
    expect(applyLabLearning(state, record, t)).toBe(state)
  })
  it('maps only to real curriculum objectives', () => {
    for (const id of Object.values(STATION_OBJECTIVES).flat())
      expect(
        OBJECTIVES.some((o) => o.id === id),
        id,
      ).toBe(true)
  })
})
