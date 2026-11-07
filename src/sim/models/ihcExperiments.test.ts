import { describe, expect, it } from 'vitest'
import { referenceTwin } from '../core/reference'
import { createScenario } from '../core/scenarios'
import { IHC_EXPERIMENT as E, IHC_EXPERIMENT_PARAMETERS } from '../params/ihcExperiments'
import { PROCESS as P } from '../params/process'
import { retrieve, primary, detect, evaluateControls } from './ihc'
import {
  applyIhcExperiment,
  bestCondition,
  checkerboardConditions,
  conditionFromParams,
  defaultCondition,
  evaluateMultiplex,
  evaluateRun,
  evaluateValidation,
  preanalyticExperiment,
  retrievalConditions,
  RUN_STEPS,
  runIhcExperiment,
  runIshExperiment,
} from './ihcExperiments'
function base() {
  return referenceTwin({
    ...createScenario('IHC-ACADEMY-TEST', 'skin-ellipse'),
    faults: [],
    discrepancy: 'none',
    request: 'ihc',
  })
}
const loading = {
  registered: true,
  expired: false,
  loaded: E['academy.loaded-volume'],
  dead: E['academy.dead-volume'],
  slides: E['academy.slide-count'],
  dispense: E['academy.dispense'],
}
const validPlan = {
  change: 'new-clone',
  scope: 'defined',
  cases: 'range',
  comparison: 'validated',
  criteria: 'prespecified',
  discrepancies: 'investigate',
  approval: 'review',
}

describe('IHC experiment composition and evidence', () => {
  it('never mutates the source and runs the shared chemistry exactly', () => {
    const source = base(),
      snapshot = structuredClone(source),
      c = defaultCondition()
    const result = runIhcExperiment(source, c)
    expect(source).toEqual(snapshot)
    const prepared = runIhcExperiment(source, c, RUN_STEPS.slice(0, 3)).twin
    retrieve(prepared, c.retrievalMinutes, c.temperature, c.ph, c.method)
    primary(prepared, c.dilution, c.primaryMinutes, c.blocked, c.humid, c.washed, c.sectionAge)
    detect(prepared, c.detectionMinutes, c.chromogenMinutes, c.compatible)
    evaluateControls(prepared, c.positive, c.lowPositive, c.negative, c.faultCorrected)
    expect(result.twin.ihc).toEqual(prepared.ihc)
    expect(result.metrics.acceptable).toBe(true)
  })
  it('cannot generate bound primary from a skipped primary step', () => {
    const r = runIhcExperiment(
      base(),
      defaultCondition(),
      RUN_STEPS.filter((step) => step !== 'primary'),
    )
    expect(r.metrics.signal).toBe(0)
    expect(r.twin.ihc.valid).toBe(false)
  })
  it('does not retroactively block already-bound primary by moving block after primary', () => {
    const order = [...RUN_STEPS]
    ;[order[4], order[5]] = [order[5], order[4]]
    const r = runIhcExperiment(base(), defaultCondition(), order)
    expect(r.metrics.background).toBeGreaterThan(0)
    expect(evaluateRun(r, order, loading, false, true).passed).toBe(false)
  })
  it('requires block confirmation, volume, registration and observed control performance', () => {
    const r = runIhcExperiment(base(), defaultCondition())
    expect(evaluateRun(r, RUN_STEPS, loading, true, true).passed).toBe(true)
    expect(evaluateRun(r, RUN_STEPS, loading, false, false).passed).toBe(false)
    for (const bad of [
      { ...loading, expired: true },
      { ...loading, registered: false },
      { ...loading, loaded: loading.dead },
      { ...loading, dispense: 0 },
    ])
      expect(evaluateRun(r, RUN_STEPS, bad, true, true).passed).toBe(false)
    expect(
      evaluateRun(
        runIhcExperiment(base(), { ...defaultCondition(), humid: false }),
        RUN_STEPS,
        loading,
        false,
        true,
      ).passed,
    ).toBe(false)
  })
  it('uses the same full core sequence for manual and automated chemistry', () => {
    const c = defaultCondition(),
      t = base()
    const manual = runIhcExperiment(t, c, [...RUN_STEPS]),
      automated = runIhcExperiment(t, c, RUN_STEPS)
    expect(manual.appearance).toEqual(automated.appearance)
  })
  it('ranks controls and tissue before the darkest checkerboard condition', () => {
    const results = checkerboardConditions(defaultCondition()).map((c) =>
      runIhcExperiment(base(), c),
    )
    const best = bestCondition(results),
      darkest = results
        .map((r, i) => ({ signal: r.metrics.signal, i }))
        .sort((a, b) => b.signal - a.signal)[0].i
    expect(best).toBeGreaterThanOrEqual(0)
    expect(results[best].metrics.acceptable).toBe(true)
    expect(results[darkest].metrics.background).toBeGreaterThan(P['ihc.background-max'])
    expect(best).not.toBe(darkest)
    const grid = retrievalConditions(defaultCondition()).map((c) => runIhcExperiment(base(), c))
    expect(grid.some((r) => r.twin.ihc.damage > 0)).toBe(true)
  })
  it('keeps low positive and negative controls necessary for this disclosed exercise policy', () => {
    for (const c of [
      { ...defaultCondition(), lowPositive: false },
      { ...defaultCondition(), negative: false },
      { ...defaultCondition(), positive: false },
    ])
      expect(runIhcExperiment(base(), c).metrics.acceptable).toBe(false)
  })
  it('applies only to an available guarded block and consumes a new section while preserving identity', () => {
    const t = base(),
      before = t.block.remaining,
      oldSections = t.block.sections.length,
      oldArchive = t.archivedSlides.length
    t.identity.broken = true
    expect(applyIhcExperiment(t, { ...defaultCondition() })).toBe(true)
    expect(t.block.remaining).toBeLessThan(before)
    expect(t.block.sections).toHaveLength(oldSections + 1)
    expect(t.archivedSlides).toHaveLength(oldArchive + 1)
    expect(t.block.sections.at(-1)?.labelCorrect).toBe(true)
    expect(t.identity.broken).toBe(true)
    const unsafe = base()
    unsafe.instrument.guarded = false
    const remaining = unsafe.block.remaining
    expect(applyIhcExperiment(unsafe, { ...defaultCondition() })).toBe(false)
    expect(unsafe.block.remaining).toBe(remaining)
  })
  it('preanalytic comparisons preserve upstream loss and cannot be repaired by retrieval alone', () => {
    const t = base(),
      c = defaultCondition(),
      normal = {
        ischemia: 0,
        fixationHours: E['academy.fixation-middle'],
        decal: 'none' as const,
        sectionAge: 0,
      }
    const baseline = preanalyticExperiment(t, c, normal),
      delayed = preanalyticExperiment(t, c, { ...normal, ischemia: E['academy.ischemia-delayed'] }),
      acid = preanalyticExperiment(t, c, { ...normal, decal: 'strong-acid' })
    expect(delayed.metrics.signal).toBeLessThan(baseline.metrics.signal)
    expect(acid.metrics.signal).toBeLessThan(baseline.metrics.signal)
    expect(
      preanalyticExperiment(t, c, { ...normal, sectionAge: E['academy.section-old'] }).metrics
        .signal,
    ).toBeLessThan(baseline.metrics.signal)
  })
  it('requires same-host separation and sequential carryover controls', () => {
    const p = {
      mode: 'simultaneous' as const,
      hostA: 'mouse',
      hostB: 'mouse',
      separatedDetection: false,
      cycleControl: false,
      strippingValidated: false,
      singleStains: true,
      channelsDistinct: true,
    }
    expect(evaluateMultiplex(p).passed).toBe(false)
    expect(evaluateMultiplex({ ...p, mode: 'fluorescence' }).passed).toBe(false)
    expect(evaluateMultiplex({ ...p, hostB: 'rabbit' }).passed).toBe(true)
    expect(evaluateMultiplex({ ...p, mode: 'sequential' }).passed).toBe(false)
    expect(
      evaluateMultiplex({ ...p, mode: 'sequential', cycleControl: true, strippingValidated: true })
        .passed,
    ).toBe(true)
  })
  it('never treats missing RNA-integrity evidence as a valid ISH interpretation', () => {
    expect(runIshExperiment(base(), 'EBER', 1, false, true, true).passed).toBe(false)
    expect(runIshExperiment(base(), 'EBER', 1, true, true, true).passed).toBe(true)
    expect(runIshExperiment(base(), 'EBER', 100, true, true, true).passed).toBe(false)
  })
  it('grades explicit validation choices rather than the presence of generic prose', () => {
    expect(evaluateValidation(validPlan).passed).toBe(true)
    expect(evaluateValidation({ ...validPlan, cases: 'strong' }).passed).toBe(false)
    expect(evaluateValidation({ ...validPlan, criteria: 'anything typed' }).passed).toBe(false)
  })
  it('clamps invalid event conditions and records every numeric setting provenance', () => {
    const c = conditionFromParams({
      dilution: -1,
      marker: 'invented',
      temperature: Infinity,
      ph: 999,
    })
    expect(c.dilution).toBe(1)
    expect(c.marker).toBe('sox10')
    expect(c.ph).toBe(E['academy.maximum-ph'])
    for (const p of IHC_EXPERIMENT_PARAMETERS) {
      expect(p.illustrative).toBe(true)
      expect(p.sourceIds.length).toBeGreaterThan(0)
      expect(p.note.length).toBeGreaterThan(10)
    }
  })
})
