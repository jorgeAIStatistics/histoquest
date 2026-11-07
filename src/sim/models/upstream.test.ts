import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { createScenario, RECEIPT_DISCREPANCIES } from '../core/scenarios'
import { nominalEvent, reduceEvent, replayRun } from '../core/replay'
import { createTwin } from '../specimen/initial'
import { average } from '../core/units'
import { fix, decalcify } from './preservation'
import { processStep } from './processing'
const fresh = (archetype = 'skin-ellipse') => createTwin(createScenario('UPSTREAM-TEST', archetype))
const fixed = (t: ReturnType<typeof fresh>) => average(t.regions.map((r) => r.fixed))

describe('preservation history boundaries', () => {
  it('does not turn transport time into fixation or aldehyde cross-links', () => {
    const transported = fresh(),
      control = fresh()
    fix(transported, 24, 22, 15, 'michel', 0)
    expect(fixed(transported)).toBe(0)
    expect(transported.fixation.crosslink).toBe(0)
    fix(transported, 1, 22, 15, 'nbf', 0)
    fix(control, 1, 22, 15, 'nbf', 0)
    expect(transported.regions).toEqual(control.regions)
    expect(transported.fixation.crosslink).toBe(control.fixation.crosslink)
    expect(transported.fixation.hours).toBe(25)
  })
  it('coagulative stabilization does not masquerade as aldehyde cross-link maturity', () => {
    for (const preparation of ['alcohol', 'carnoy', 'acetone']) {
      const t = fresh(),
        aldehyde = fresh()
      fix(t, 12, 22, 15, preparation, 0)
      expect(fixed(t)).toBeGreaterThan(0)
      expect(t.fixation.crosslink).toBe(0)
      fix(t, 1, 22, 15, 'nbf', 0)
      fix(aldehyde, 1, 22, 15, 'nbf', 0)
      expect(t.fixation.crosslink).toBe(aldehyde.fixation.crosslink)
    }
  })
  it('integrates conditions without retroactively changing prior exposure', () => {
    const split = fresh(),
      combined = fresh()
    fix(split, 8, 22, 15, 'nbf', 0)
    fix(split, 4, 22, 15, 'nbf', 0)
    fix(combined, 12, 22, 15, 'nbf', 0)
    expect(split.regions).toEqual(combined.regions)
    const before = structuredClone(split.regions)
    fix(split, 0, 80, 40, 'nbf', 0)
    expect(split.regions).toEqual(before)
  })
  it('records endpoint assessment separately and probing cannot restore targets', () => {
    const t = fresh('bone-core')
    decalcify(t, 'edta', 1, 'none')
    expect(t.decal.result).toBe('Not assessed')
    decalcify(t, 'edta', 0, 'radiographic')
    expect(t.decal.result).toContain('Residual mineral')
    const before = t.ihc.preservation
    decalcify(t, 'edta', 0, 'physical probing')
    expect(t.ihc.preservation).toBeLessThan(before)
  })
})
describe('reagent exchange and seeded scenarios', () => {
  it('dilute alcohol has a water-containing endpoint even after unlimited teaching time', () => {
    const t = fresh()
    t.gross.thickness = 1
    processStep(t, 'alcohol', 10000, 22, 70, 0, true)
    for (const region of t.regions) expect(region.water).toBeCloseTo(0.3)
    processStep(t, 'alcohol', 1000, 22, 100, 0, true)
    expect(average(t.regions.map((r) => r.water))).toBeLessThan(0.01)
  })
  it('shows tissue-class resistance and preserves solvent conservation', () => {
    const routine = fresh(),
      fat = fresh('fatty-tissue')
    fat.scenario.family = 'fat'
    routine.gross.thickness = fat.gross.thickness = 3
    processStep(routine, 'alcohol', 5, 22, 100, 0, true)
    processStep(fat, 'alcohol', 5, 22, 100, 0, true)
    expect(average(fat.regions.map((r) => r.water))).toBeGreaterThan(
      average(routine.regions.map((r) => r.water)),
    )
    for (const t of [routine, fat])
      for (const r of t.regions) expect(r.water + r.alcohol + r.clearant + r.wax).toBeCloseTo(1)
  })
  it('requires documented reagent replacement to resolve a seeded exhausted bottle', () => {
    let t = createTwin({
      ...createScenario('EXHAUSTED', 'skin-ellipse', 1, 2),
      faults: ['exhausted-alcohol'],
    })
    t = reduceEvent(
      t,
      nominalEvent('processing', 'processing.step', {
        reagent: 'alcohol',
        minutes: 45,
        concentration: 100,
        temperature: 22,
        exhaustion: 0,
      }),
    )
    expect(t.regions.every((r) => r.water === 1)).toBe(true)
    t = reduceEvent(
      t,
      nominalEvent('processing', 'processing.reagent-change', {
        reagent: 'alcohol',
        lot: 'NEW',
        documentation: 'Replacement checked against teaching reagent register.',
      }),
    )
    t = reduceEvent(
      t,
      nominalEvent('processing', 'processing.step', {
        reagent: 'alcohol',
        minutes: 45,
        concentration: 100,
        temperature: 22,
        exhaustion: 0,
      }),
    )
    expect(t.regions[0].water).toBeLessThan(1)
    expect(t.processing.reagentChanges).toHaveLength(1)
  })
  it('draws exactly the requested number of unique relevant faults, reproducibly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(1 as const, 2 as const, 3 as const),
        (seed, difficulty) => {
          const a = createScenario(seed, 'skin-ellipse', difficulty, 2),
            b = createScenario(seed, 'skin-ellipse', difficulty, 2)
          expect(a).toEqual(b)
          expect(new Set(a.faults).size).toBe(difficulty)
          if (a.request !== 'ihc') expect(a.faults).not.toContain('control-failure')
          expect(['none', ...RECEIPT_DISCREPANCIES]).toContain(a.discrepancy)
        },
      ),
      { numRuns: 100, seed: 20261106 },
    )
  })
  it('retains the original scenario algorithm for stored logs without a version marker', () => {
    const record = {
      id: 'old',
      version: 1 as const,
      seed: 'LEGACY',
      archetype: 'skin-ellipse',
      difficulty: 2 as const,
      mode: 'free' as const,
      startedAt: '2026-11-06',
      title: 'Legacy',
      events: [],
    }
    expect(replayRun(record).scenario).toEqual(
      createScenario(record.seed, record.archetype, record.difficulty, 1),
    )
    expect(replayRun({ ...record, scenarioVersion: 2 }).scenario).toEqual(
      createScenario(record.seed, record.archetype, record.difficulty, 2),
    )
    expect(replayRun(record).scenario).not.toEqual(
      replayRun({ ...record, scenarioVersion: 2 }).scenario,
    )
  })
})
