import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  createShift,
  createShiftCase,
  assessShift,
  scenarioForShiftRecord,
  shiftRecordIdentity,
} from './shifts'
import { reduceEvent, replayRun } from './replay'
import type { SimEvent, StationId } from './events'
import { createTwin } from '../specimen/initial'
import { PROCESS as P } from '../params/process'
import type { LabRecord } from '../../store/labSchema'

const note =
  'The synthetic accession and section were reconciled, control and preparation quality reviewed, and the technical disposition recorded.'
function run(record: LabRecord) {
  let twin = record.events.reduce(reduceEvent, createTwin(scenarioForShiftRecord(record)!))
  return {
    get twin() {
      return twin
    },
    act(station: StationId, intent: string, params: SimEvent['params'] = {}) {
      twin = reduceEvent(twin, {
        station,
        intent,
        params,
        t: twin.time,
        sequence: twin.events.length,
      })
    },
    record(completed = false): LabRecord {
      return { ...record, events: twin.events, completedAt: completed ? '2026-11-07' : undefined }
    },
  }
}
function section(d: ReturnType<typeof run>, level = 1, depth = 0) {
  d.act('microtomy', 'instrument.set', {
    locked: true,
    guarded: true,
    clamp: 1,
    sharpness: 1,
    angle: P['microtomy.angle'],
  })
  d.act('microtomy', 'block.mount')
  d.act('microtomy', 'instrument.set', { locked: false, guarded: false })
  if (depth) d.act('microtomy', 'microtomy.trim', { microns: depth })
  d.act('microtomy', 'microtomy.cut', { purpose: 'routine', level })
  d.act('microtomy', 'instrument.set', { locked: true, guarded: true })
  d.act('bath', 'bath.float', {
    temperature: P['bath.temperature'],
    minutes: P['bath.minutes'],
    clean: true,
    gentle: true,
  })
  d.act('bath', 'section.pickup', {
    label: `${d.twin.scenario.accession}-A1-L${level}`,
    charged: true,
  })
  d.act('drying', 'drying.run', {
    temperature: P['drying.temperature'],
    minutes: P['drying.minutes'],
  })
}
function he(d: ReturnType<typeof run>) {
  for (const reagent of [
    'dewax',
    'hydrate',
    'hematoxylin',
    'differentiate',
    'blue',
    'eosin',
    'dehydrate',
    'clear',
  ])
    d.act('he', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
  d.act('coverslip', 'coverslip.apply', {
    medium: 'resinous',
    volume: P['mount.volume'],
    angle: P['mount.angle'],
    delay: 0,
  })
}
function ihc(d: ReturnType<typeof run>, corrected: boolean) {
  for (const reagent of ['dewax', 'hydrate'])
    d.act('ihc', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
  d.act('ihc', 'ihc.retrieve', {
    minutes: P['ihc.retrieval-time'],
    temperature: P['ihc.retrieval-temperature'],
    ph: P['ihc.retrieval-ph'],
    method: 'hier',
  })
  d.act('ihc', 'ihc.primary', {
    dilution: P['ihc.primary-dilution'],
    minutes: P['ihc.primary-minutes'],
    blocked: true,
    humid: true,
    washed: true,
    sectionAge: 0,
  })
  d.act('ihc', 'ihc.detect', {
    minutes: P['ihc.detect-minutes'],
    chromogenMinutes: P['ihc.chromogen-minutes'],
    compatible: true,
  })
  d.act('ihc', 'ihc.controls', {
    positive: true,
    lowPositive: true,
    negative: true,
    faultCorrected: corrected,
  })
  for (const reagent of ['dehydrate', 'clear'])
    d.act('ihc', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
  d.act('coverslip', 'coverslip.apply', {
    medium: 'resinous',
    volume: P['mount.volume'],
    angle: P['mount.angle'],
    delay: 0,
  })
}
function finish(d: ReturnType<typeof run>) {
  for (const station of [
    ...new Set(
      d.twin.events
        .filter((event) => event.params.origin !== 'scenario-setup')
        .map((event) => event.station),
    ),
  ])
    d.act(station, 'document', { text: note })
  d.act('quality', 'document', { text: note })
  d.act('quality', 'quality.release')
  return d.record(true)
}
function completedCase(seed: string, id: string) {
  const d = run(createShiftCase(seed, id))
  d.act('accessioning', 'identity.accept')
  if (id === 'processor') {
    d.act('quality', 'quality.hold')
    for (const reagent of ['alcohol', 'clearant', 'paraffin'])
      d.act('processing', 'processing.step', {
        reagent,
        minutes: P['processing.minutes'],
        temperature:
          reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature'],
        concentration: 100,
        exhaustion: 0,
        vacuum: true,
      })
    for (let i = 0; i < d.twin.scenario.fragments; i++)
      d.act('embedding', 'embedding.place', {
        piece: `A1-${i + 1}`,
        x: i * P['reference.piece-spacing'],
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0,
      })
    d.act('embedding', 'embedding.cool', { temperature: P['microtomy.block-temperature'] })
  }
  if (id === 'frozen') {
    d.act('grossing', 'gross.sample', {
      thickness: P['reference.gross-thickness'],
      fragments: d.twin.scenario.fragments,
      cassette: 'biopsy',
      key: 'A1: intact frozen consultation tissue',
      extraction: true,
    })
    d.act('frozen', 'frozen.freeze', {
      temperature: P['frozen.temperature'],
      rate: P['frozen.rate'],
      biohazard: true,
    })
  }
  section(d)
  if (id === 'controls') {
    ihc(d, false)
    d.act('quality', 'quality.hold')
    section(d, 2)
    ihc(d, true)
  } else {
    if (id === 'levels') section(d, 2, P['practical.level-gap'])
    he(d)
  }
  return finish(d)
}

describe('seeded shift scenarios', () => {
  it('reproduces five independent cases, unique identities and declared setup histories', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (number) => {
        const seed = `SHIFT-${number}`
        expect(createShift(seed)).toEqual(createShift(seed))
        const records = createShift(seed).cases.map((entry) => createShiftCase(seed, entry.id))
        expect(
          new Set(records.map((record) => scenarioForShiftRecord(record)!.accession)).size,
        ).toBe(5)
        expect(records.map((record) => shiftRecordIdentity(record)?.seed)).toEqual(
          Array(5).fill(seed),
        )
        expect(
          scenarioForShiftRecord(
            records.find((record) => shiftRecordIdentity(record)?.caseId === 'frozen')!,
          )!.request,
        ).toBe('frozen')
        for (const record of records) {
          expect(replayRun(record).scenario).toEqual(scenarioForShiftRecord(record))
          expect(assessShift(seed, [{ ...record, completedAt: 'not-evidence' }]).passed).toBe(false)
        }
      }),
      { numRuns: 12, seed: 20261107 },
    )
  })

  it('rejects malformed seeds and unknown queue IDs', () => {
    expect(() => createShift('')).toThrow()
    expect(() => createShift('patient:123')).toThrow()
    expect(() => createShiftCase('VALID', 'missing')).toThrow('Unknown shift case')
  })

  it.each(['routine', 'processor', 'frozen', 'controls', 'levels'])(
    'completes %s through specimen actions, not a completion flag',
    (id) => {
      const record = completedCase('ACTION-SHIFT', id)
      const assessment = assessShift('ACTION-SHIFT', [record])
      const result = assessment.cases.find((entry) => entry.case.id === id)!
      expect(result.critical).toEqual([])
      expect(result.checks.filter((check) => !check.passed)).toEqual([])
      expect(result.passed).toBe(true)
    },
  )

  it('replays a complete shift with identical technical outcomes independent of wall-clock metadata', () => {
    const records = createShift('COMPLETE-SHIFT').cases.map((entry) =>
      completedCase('COMPLETE-SHIFT', entry.id),
    )
    const a = assessShift('COMPLETE-SHIFT', records)
    const b = assessShift(
      'COMPLETE-SHIFT',
      structuredClone(records).map((record) => ({
        ...record,
        startedAt: 'different-real-time',
        completedAt: 'different-real-time',
      })),
    )
    expect(a.complete).toBe(true)
    expect(a.passed).toBe(true)
    expect(a.score).toBe(b.score)
    expect(a.currentQueueMinute).toBe(b.currentQueueMinute)
    expect(
      a.cases.map(({ score, passed, clock, turnaround, checks }) => ({
        score,
        passed,
        clock,
        turnaround,
        checks,
      })),
    ).toEqual(
      b.cases.map(({ score, passed, clock, turnaround, checks }) => ({
        score,
        passed,
        clock,
        turnaround,
        checks,
      })),
    )
  })

  it('records paused waiting in turnaround and warns when higher priority work is pending', () => {
    const d = run(createShiftCase('PAUSED-SHIFT', 'routine', 0))
    d.act('quality', 'shift.pause', { queueMinute: 5 })
    expect(assessShift('PAUSED-SHIFT', [d.record()]).cases[0].status).toBe('paused')
    d.act('quality', 'shift.resume', { queueMinute: 100 })
    d.act('he', 'stain.step', { reagent: 'hydrate', minutes: 3 })
    const result = assessShift('PAUSED-SHIFT', [d.record()])
    expect(result.cases[0].clock).toBe(103)
    expect(result.cases[0].turnaround).toBe(103)
    expect(
      result.priorityFindings.some(
        (finding) => finding.urgentCaseId === 'frozen' && finding.minute === 100,
      ),
    ).toBe(true)
  })

  it('keeps a critical identity break in a completed shift record', () => {
    const record = completedCase('CRITICAL-SHIFT', 'routine')
    const d = run(record)
    d.act('accessioning', 'identity.relabel')
    const result = assessShift('CRITICAL-SHIFT', [d.record(true)])
    expect(result.critical.some((issue) => issue.id === 'unauthorized-relabel')).toBe(true)
    expect(result.cases[0].passed).toBe(false)
  })

  it('selects the newest attempt independently of newest-first local or oldest-first archive order', () => {
    const earlier = {
      ...createShiftCase('ORDER-SHIFT', 'routine'),
      id: 'earlier',
      startedAt: '2026-01-01T12:00:00Z',
      completedAt: '2026-01-05T12:00:00Z',
    }
    const later = {
      ...createShiftCase('ORDER-SHIFT', 'routine'),
      id: 'later',
      startedAt: '2026-01-02T12:00:00Z',
    }
    for (const records of [
      [earlier, later],
      [later, earlier],
    ]) {
      expect(assessShift('ORDER-SHIFT', records).cases[0].record?.id).toBe('later')
    }
    const d = run(later)
    d.act('accessioning', 'identity.accept')
    const revised = d.record(false)
    for (const records of [
      [revised, earlier, later],
      [later, earlier, revised],
    ]) {
      expect(assessShift('ORDER-SHIFT', records).cases[0].record?.events).toEqual(revised.events)
    }
  })
})
