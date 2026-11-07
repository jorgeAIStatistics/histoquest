import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  CLINIC_CASES,
  createClinicRecord,
  recordClinicHypothesis,
  runClinicTrial,
  latestClinicComparison,
  verifyClinic,
  gradeClinic,
  clinicSettings,
} from './clinic'
import { replayRun } from './replay'
import { PROCESS as P } from '../params/process'
import type { ClinicVariable } from './clinic'

const note =
  'The observed artifact is compared with the recorded preparation. I predict one specific setting will change its extent while other conditions remain fixed.'
function trial(id: string, variable: ClinicVariable, value: number) {
  const original = createClinicRecord(id, 'MODEL-TEST')
  const hypothesis = recordClinicHypothesis(original, note, variable, value)
  const repeated = runClinicTrial(hypothesis)
  return { original, hypothesis, repeated }
}
describe('real-event troubleshooting clinic', () => {
  it('recreates all six supplied bad slides deterministically from seed, with no appearance overrides', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (seed) => {
        for (const entry of CLINIC_CASES) {
          const a = createClinicRecord(entry.id, `FIXTURE-${seed}`)
          const b = createClinicRecord(entry.id, `FIXTURE-${seed}`)
          expect(a.events).toEqual(b.events)
          expect(replayRun(a)).toEqual(replayRun(b))
          expect(a.events.every((event) => event.params.origin === 'scenario-setup')).toBe(true)
          expect(replayRun(a).block.sections).toHaveLength(1)
          expect(replayRun(a).issues.filter((issue) => issue.severity === 'critical')).toEqual([])
        }
      }),
      { seed: 20261107, numRuns: 5 },
    )
  })
  it.each([
    ['compressed', 'blockTemperature', P['microtomy.block-temperature']],
    ['bands', 'clamp', 1],
    ['tracks', 'sharpness', 1],
    ['controls', 'detectionCompatible', 1],
  ] as const)(
    'a controlled %s correction changes the actual artifact/control result',
    (id, variable, value) => {
      const { original, hypothesis, repeated } = trial(id, variable, value)
      const result = latestClinicComparison(repeated)!
      expect(result.outcome).toBe('improved')
      expect(result.after).toBeLessThan(result.before)
      const before = replayRun(hypothesis)
      const after = replayRun(repeated)
      expect(after.events.slice(0, original.events.length)).toEqual(original.events)
      expect(after.block.sections).toHaveLength(2)
      expect(after.archivedSlides).toHaveLength(1)
      expect(after.block.remaining).toBeLessThan(before.block.remaining)
      expect(after.issues.filter((issue) => issue.severity === 'critical')).toEqual([])
      const beforeSettings = clinicSettings(before)
      const afterSettings = clinicSettings(after)
      expect(
        Object.keys(beforeSettings).filter(
          (key) => beforeSettings[key as ClinicVariable] !== afterSettings[key as ClinicVariable],
        ),
      ).toEqual([variable])
      const verified = verifyClinic(repeated, note, 'improved', 'review')
      expect(gradeClinic(verified).complete).toBe(true)
      expect(gradeClinic(verified).reviewRequired).toBe(true)
    },
  )
  it.each(['center', 'support'])(
    'a downstream %s recut retains preparation damage and requires hold/escalation',
    (id) => {
      const { original, repeated } = trial(id, 'thickness', 3)
      expect(latestClinicComparison(repeated)?.outcome).toBe('persisted')
      expect(replayRun(repeated).regions).toEqual(replayRun(original).regions)
      expect(replayRun(repeated).ihc.preservation).toBe(replayRun(original).ihc.preservation)
      expect(gradeClinic(verifyClinic(repeated, note, 'persisted', 'review')).complete).toBe(false)
      expect(gradeClinic(verifyClinic(repeated, note, 'persisted', 'hold')).complete).toBe(true)
    },
  )
  it('accepts an incorrect hypothesis and produces a non-improving result rather than forcing the answer', () => {
    const { repeated } = trial('compressed', 'clamp', 0.5)
    expect(latestClinicComparison(repeated)?.outcome).toBe('persisted')
    expect(gradeClinic(verifyClinic(repeated, note, 'improved', 'review')).complete).toBe(false)
    expect(gradeClinic(verifyClinic(repeated, note, 'persisted', 'hold')).complete).toBe(true)
  })
  it('requires an explicit fresh, applicable change and preserves a verified log until further action', () => {
    const original = createClinicRecord('compressed')
    expect(() => runClinicTrial(original)).toThrow('hypothesis')
    expect(() => recordClinicHypothesis(original, 'too short', 'clamp', 0.5)).toThrow('60')
    expect(() => recordClinicHypothesis(original, note, 'clamp', 1)).toThrow('different')
    expect(() => recordClinicHypothesis(original, note, 'retrievalMinutes', 10)).toThrow(
      'applicable',
    )
    const repeated = runClinicTrial(
      recordClinicHypothesis(original, note, 'blockTemperature', P['microtomy.block-temperature']),
    )
    expect(() => runClinicTrial(repeated)).toThrow('fresh')
    expect(() => verifyClinic(original, note, 'improved', 'review')).toThrow('repeat')
    const verified = verifyClinic(repeated, note, 'improved', 'review')
    const next = recordClinicHypothesis(verified, note, 'clamp', 0.5)
    expect(next.completedAt).toBeUndefined()
    expect(next.events.slice(0, verified.events.length)).toEqual(verified.events)
    expect(() => verifyClinic(next, note, 'improved', 'review')).toThrow('newly proposed')
  })
})
