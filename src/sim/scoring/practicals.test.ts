import { describe, expect, it } from 'vitest'
import { CAREER_LEVELS } from '../../content/lab/curriculum'
import { PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { PROTOCOL_PARAMETERS } from '../params/protocols'
import { PROCESS as P } from '../params/process'
import { referenceTwin } from '../core/reference'
import { reduceEvent, replayRun } from '../core/replay'
import type { SimEvent, StationId } from '../core/events'
import type { Twin } from '../specimen/types'
import {
  competencyEvidence,
  createPracticalRecord,
  gradePractical,
  PRACTICAL_SPECS,
  requiredStations,
  practicalAvailability,
} from './practicals'

const note =
  'Synthetic observation: identity, specimen preparation, outcome and remaining limitations were recorded for this exercise.'
function driver(initial: Twin) {
  let twin = initial
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
  }
}
function proceduralStart(id: string) {
  const record = createPracticalRecord(id)
  const d = driver(referenceTwin(replayRun(record).scenario))
  return { record, d }
}
function documentRequired(d: ReturnType<typeof driver>, id: string) {
  for (const station of requiredStations(id)) d.act(station, 'document', { text: note })
}
function collect(d: ReturnType<typeof driver>, level: number, interveningDepth = 0) {
  d.act('microtomy', 'instrument.set', { locked: false, guarded: false })
  if (interveningDepth) d.act('microtomy', 'microtomy.trim', { microns: interveningDepth })
  d.act('microtomy', 'microtomy.cut', { level, purpose: 'level' })
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
function pas(d: ReturnType<typeof driver>) {
  const protocol = PROTOCOL_BY_ID.pas
  const durations = Object.fromEntries(
    PROTOCOL_PARAMETERS.map((parameter) => [parameter.id, parameter.value]),
  )
  for (const step of protocol.steps)
    d.act('special', 'special.step', {
      protocol: 'pas',
      step: step.id,
      minutes: durations[step.durationParam] as number,
      ph: P['special.alcian-standard-ph'],
    })
  d.act('special', 'special.controls', { positive: true, negative: true })
}

describe('published practical contracts', () => {
  it('enforces prerequisites even for a direct practical launch', () => {
    expect(practicalAvailability('orientation-practical', []).allowed).toBe(true)
    expect(practicalAvailability('routine-practical', []).allowed).toBe(false)
    expect(practicalAvailability('routine-practical', ['assistant-practical']).allowed).toBe(true)
    expect(practicalAvailability('missing', []).allowed).toBe(false)
  })
  it('covers the complete catalog and creates stable scenario identities', () => {
    expect(PRACTICAL_SPECS.map((spec) => spec.id)).toEqual(
      CAREER_LEVELS.map((level) => level.practical.id),
    )
    for (const spec of PRACTICAL_SPECS) {
      const a = createPracticalRecord(spec.id)
      const b = createPracticalRecord(spec.id)
      expect(a.id).not.toBe(b.id)
      expect(a.seed).toBe(b.seed)
      expect(replayRun(a)).toEqual(replayRun(b))
      expect(gradePractical(replayRun(a), spec.id).passed).toBe(false)
    }
    expect(() => createPracticalRecord('missing')).toThrow('Unknown practical')
  })

  it.each([2, 4])(
    'allows L0 through explicit recorded actions at a %s× overview, with no default pass',
    (overview) => {
      const record = createPracticalRecord('orientation-practical')
      const d = driver(replayRun(record))
      d.act('quality', 'practice.evidence', {
        checkId: 'safe-start',
        text: note,
        ppe: true,
        sds: true,
        escalation: true,
      })
      d.act('microtomy', 'instrument.set', { locked: true, guarded: true })
      d.act('quality', 'practice.evidence', {
        checkId: 'microscope-basics',
        text: note,
        overview,
        detail: 20,
        focusCompared: true,
        illuminationCompared: true,
      })
      expect(gradePractical(d.twin, record.practicalId!).passed).toBe(true)
      expect(gradePractical(d.twin, record.practicalId!).total).toBe(100)
      expect(replayRun({ ...record, events: d.twin.events })).toEqual(d.twin)
    },
  )

  it('allows L1 to be completed through held identity resolution, reconciliation and a represented block', () => {
    const { record, d } = proceduralStart('assistant-practical')
    documentRequired(d, record.practicalId!)
    const grade = gradePractical(d.twin, record.practicalId!)
    expect(grade.checks.filter((check) => !check.passed)).toEqual([])
    expect(grade.passed).toBe(true)
  })

  it('allows L2 to be completed through a routine section, comparison and technical disposition', () => {
    const { record, d } = proceduralStart('routine-practical')
    d.act('quality', 'practice.evidence', { checkId: 'reference-comparison', text: note })
    d.act('quality', 'quality.hold')
    documentRequired(d, record.practicalId!)
    const grade = gradePractical(d.twin, record.practicalId!)
    expect(grade.checks.filter((check) => !check.passed)).toEqual([])
    expect(grade.passed).toBe(true)
    const saved = { ...record, events: d.twin.events, completedAt: '2026-11-07' }
    const evidence = competencyEvidence([saved])
    expect(evidence.find((row) => row.id === 'routine-he')?.demonstrated).toBe(1)
    expect(evidence.find((row) => row.id === 'ish-rna-integrity')?.demonstrated).toBe(0)
  })

  it('allows L3 through collected levels and a held failed-control run repeated on a separate section', () => {
    const { record, d } = proceduralStart('ht-practical')
    collect(d, 2, P['practical.level-gap'])
    d.act('special', 'special.controls', { positive: true, negative: true })
    d.act('quality', 'quality.hold')
    collect(d, 3)
    pas(d)
    d.act('quality', 'practice.evidence', {
      checkId: 'frozen-interruption',
      text: note,
      otherAccession: 'TRAIN-FROZEN-02',
      secured: true,
      biohazard: true,
    })
    d.act('quality', 'practice.evidence', { checkId: 'corrective-action', text: note })
    d.act('quality', 'quality.hold')
    documentRequired(d, record.practicalId!)
    const grade = gradePractical(d.twin, record.practicalId!)
    expect(grade.checks.filter((check) => !check.passed)).toEqual([])
    expect(grade.passed).toBe(true)
    expect(
      gradePractical(replayRun({ ...record, events: d.twin.events }), record.practicalId!),
    ).toEqual(grade)
  })

  it('does not accept a hold before the failure or a corrected reaction on the same section', () => {
    const { record, d } = proceduralStart('ht-practical')
    d.act('quality', 'quality.hold')
    d.act('special', 'special.controls', { positive: true, negative: true })
    pas(d)
    const check = gradePractical(d.twin, record.practicalId!).checks.find(
      (row) => row.id === 'special-stain-controls',
    )
    expect(check?.passed).toBe(false)
  })

  it('fails critical history even when all observable L0 checks are recorded', () => {
    const record = createPracticalRecord('orientation-practical')
    const d = driver(replayRun(record))
    d.act('microtomy', 'instrument.set', { locked: false, guarded: false })
    d.act('microtomy', 'block.mount')
    d.act('microtomy', 'instrument.set', { locked: true, guarded: true })
    d.act('quality', 'practice.evidence', {
      checkId: 'safe-start',
      text: note,
      ppe: true,
      sds: true,
      escalation: true,
    })
    d.act('quality', 'practice.evidence', {
      checkId: 'microscope-basics',
      text: note,
      overview: 2,
      detail: 20,
      focusCompared: true,
      illuminationCompared: true,
    })
    const grade = gradePractical(d.twin, record.practicalId!)
    expect(grade.critical).toHaveLength(1)
    expect(grade.passed).toBe(false)
  })

  it.each(['lead-practical', 'supervisor-practical'])(
    'records %s completeness without claiming a qualified assessment',
    (id) => {
      const record = createPracticalRecord(id)
      const d = driver(replayRun(record))
      const level = CAREER_LEVELS.find((entry) => entry.practical.id === id)!
      level.practical.rubric.forEach((_criterion, index) =>
        d.act('quality', 'practice.evidence', {
          checkId: `planning-${index + 1}`,
          text: `${note} The plan remains a draft and requires qualified review before any workplace use.`,
        }),
      )
      const grade = gradePractical(d.twin, id)
      expect(grade.checks.every((check) => check.passed)).toBe(true)
      expect(grade.total).toBe(100)
      expect(grade.passed).toBe(false)
      expect(grade.requiresQualifiedReview).toBe(true)
      expect(grade.status).toBe('requires-qualified-review')
      const matrix = competencyEvidence([
        { ...record, events: d.twin.events, completedAt: '2026-11-07' },
      ])
      expect(
        matrix.filter((row) => row.reviewRequired).every((row) => row.demonstrated === 0),
      ).toBe(true)
    },
  )
})
