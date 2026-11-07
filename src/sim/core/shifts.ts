import type { LabRecord } from '../../store/labSchema'
import type { SimEvent, StationId } from './events'
import { referenceTwin } from './reference'
import { reduceEvent, replayRun } from './replay'
import { createTwin } from '../specimen/initial'
import type { ModelIssue, Twin } from '../specimen/types'
import { assessTwin, releaseProblems, stationQuality } from '../scoring/assess'
import { PROCESS as P } from '../params/process'
import { parameterValue } from '../params/registry'
import {
  scenarioForShiftRecord,
  SHIFT_CASES,
  shiftRecordIdentity,
  shiftRecordSeed,
  validateShiftSeed,
} from './shiftScenarios'
import type { ShiftCase } from './shiftScenarios'

export { scenarioForShiftRecord, shiftRecordIdentity } from './shiftScenarios'
export interface Shift {
  seed: string
  cases: ShiftCase[]
  boundary: string
}
export interface ShiftCaseAssessment {
  case: ShiftCase
  record?: LabRecord
  status: 'waiting' | 'in-progress' | 'paused' | 'needs-correction' | 'complete'
  score: number
  passed: boolean
  started: number | null
  clock: number
  turnaround: number | null
  withinTarget: boolean
  checks: { label: string; passed: boolean }[]
  critical: ModelIssue[]
}
export interface ShiftAssessment {
  seed: string
  cases: ShiftCaseAssessment[]
  currentQueueMinute: number
  score: number
  passed: boolean
  complete: boolean
  critical: ModelIssue[]
  priorityFindings: { caseId: string; urgentCaseId: string; minute: number; event: number }[]
}
export function createShift(seed: string): Shift {
  return {
    seed: validateShiftSeed(seed),
    cases: SHIFT_CASES.map((entry) => ({ ...entry, requirements: [...entry.requirements] })),
    boundary:
      'All arrivals, priorities and turnaround targets are authored scenario assumptions. They are not clinical service standards. Safety, identity and control validity take precedence over speed.',
  }
}

export function createShiftCase(seed: string, caseId: string, queueMinute?: number): LabRecord {
  const shift = createShift(seed)
  const entry = shift.cases.find((row) => row.id === caseId)
  if (!entry) throw new Error(`Unknown shift case: ${caseId}`)
  const record: LabRecord = {
    id: crypto.randomUUID(),
    version: 1,
    seed: shiftRecordSeed(seed, caseId),
    archetype: entry.archetype,
    difficulty: 1,
    mode: 'shift',
    startedAt: new Date().toISOString(),
    title: `${shift.seed} · ${entry.title}`,
    events: [],
  }
  const scenario = scenarioForShiftRecord(record)!
  if (entry.preparation !== 'bottle') {
    const reference = referenceTwin(scenario)
    const stop = reference.events.findIndex((event) =>
      entry.preparation === 'fixed-cassettes'
        ? event.intent === 'processing.step'
        : event.intent === 'instrument.set',
    )
    record.events = reference.events
      .slice(0, stop)
      .map((event) => ({ ...event, params: { ...event.params, origin: 'scenario-setup' } }))
  }
  let state = record.events.reduce(reduceEvent, createTwin(scenario))
  if (entry.fault === 'exhausted-alcohol') {
    const alarm: SimEvent = {
      station: 'processing',
      intent: 'processing.step',
      params: {
        reagent: 'alcohol',
        minutes: P['processing.minutes'],
        temperature: P['fixation.temperature'],
        concentration: 100,
        exhaustion: 1,
        vacuum: true,
        origin: 'scenario-setup',
      },
      t: state.time,
      sequence: record.events.length,
    }
    record.events.push(alarm)
    state = reduceEvent(state, alarm)
  }
  const minute = Number.isFinite(queueMinute)
    ? Math.max(entry.arrival, queueMinute!)
    : entry.arrival
  record.events.push({
    station: 'accessioning',
    intent: 'shift.dispatch',
    params: { queueMinute: minute, caseId: entry.id },
    t: state.time,
    sequence: record.events.length,
  })
  return record
}

const learnerEvents = (record: LabRecord) =>
  record.events.filter(
    (event) => event.params.origin !== 'scenario-setup' && !event.intent.startsWith('shift.'),
  )
export function latestShiftCase(
  seed: string,
  caseId: string,
  records: readonly LabRecord[],
): LabRecord | undefined {
  return latestCases(seed, records).get(caseId)
}

function latestCases(seed: string, records: readonly LabRecord[]): Map<string, LabRecord> {
  const result = new Map<string, LabRecord>()
  for (const record of records) {
    const identity = shiftRecordIdentity(record)
    if (identity?.seed !== seed) continue
    const previous = result.get(identity.caseId)
    // Storage caches may be newest-first or oldest-first. Select the newest
    // attempt by its start, then the longest revision of that same attempt.
    if (
      !previous ||
      (previous.id === record.id
        ? record.events.length >= previous.events.length
        : record.startedAt > previous.startedAt ||
          (record.startedAt === previous.startedAt && record.id > previous.id))
    )
      result.set(identity.caseId, record)
  }
  return result
}

function scheduling(record: LabRecord, twin: Twin, entry: ShiftCase) {
  const events = record.events.filter((event) =>
    ['shift.dispatch', 'shift.pause', 'shift.resume'].includes(event.intent),
  )
  const first = events.find((event) => event.intent === 'shift.dispatch')
  const last = events.at(-1)
  const started =
    typeof first?.params.queueMinute === 'number'
      ? Math.max(entry.arrival, first.params.queueMinute)
      : entry.arrival
  const lastMinute =
    typeof last?.params.queueMinute === 'number'
      ? Math.max(started, last.params.queueMinute)
      : started
  const clock =
    last?.intent === 'shift.pause'
      ? lastMinute
      : lastMinute + Math.max(0, twin.time - (last?.t ?? 0))
  return { started, clock, paused: last?.intent === 'shift.pause' }
}

function recoveredControls(twin: Twin): boolean {
  let current = createTwin(twin.scenario)
  let failedSection = ''
  let held = false
  let recut = false
  for (const event of twin.events) {
    current = reduceEvent(current, event)
    if (event.params.origin === 'scenario-setup') continue
    if (event.intent === 'ihc.controls' && !current.ihc.valid) {
      failedSection = current.block.sections.at(-1)?.id ?? ''
      held = false
      recut = false
    }
    if (failedSection && event.intent === 'quality.hold') held = true
    if (
      held &&
      event.intent === 'microtomy.cut' &&
      current.block.sections.at(-1)?.id !== failedSection
    )
      recut = true
    if (recut && event.intent === 'ihc.controls' && current.ihc.valid) return true
  }
  return false
}

function assessCase(entry: ShiftCase, record?: LabRecord): ShiftCaseAssessment {
  if (!record)
    return {
      case: entry,
      status: 'waiting',
      score: 0,
      passed: false,
      started: null,
      clock: 0,
      turnaround: null,
      withinTarget: false,
      checks: [],
      critical: [],
    }
  const twin = replayRun(record)
  const events = learnerEvents(record)
  const intent = (name: string) => events.some((event) => event.intent === name)
  const { started, clock, paused } = scheduling(record, twin, entry)
  const activeStations = [...new Set(events.map((event) => event.station))] as StationId[]
  const score = assessTwin({ ...twin, events }, activeStations)
  const checks = [
    {
      label: 'A learner receipt check maintains this case identity',
      passed:
        intent('identity.accept') &&
        twin.identity.accepted &&
        twin.identity.resolved &&
        !twin.identity.broken,
    },
    {
      label: 'A new section is cut, identified and picked up during this shift',
      passed:
        intent('microtomy.cut') &&
        intent('section.pickup') &&
        !!twin.block.sections.at(-1)?.labelCorrect,
    },
    {
      label: 'The learner records technical QC and a valid release',
      passed:
        intent('quality.release') &&
        twin.disposition === 'release' &&
        releaseProblems(twin).length === 0 &&
        events.some(
          (event) =>
            event.station === 'quality' &&
            event.intent === 'document' &&
            typeof event.params.text === 'string' &&
            event.params.text.trim().length >= P['practical.note-minimum'],
        ),
    },
  ]
  if (entry.id !== 'controls')
    checks.push({
      label: 'Stain and mount the section during this shift',
      passed:
        intent('stain.step') &&
        intent('coverslip.apply') &&
        stationQuality(twin, 'he') >= P['quality.preservation-min'],
    })
  if (entry.id === 'processor')
    checks.push({
      label: 'Hold the alarm and repeat compatible solvent exchange with active reagents',
      passed:
        intent('quality.hold') &&
        ['alcohol', 'clearant', 'paraffin'].every((reagent) =>
          events.some(
            (event) =>
              event.intent === 'processing.step' &&
              event.params.reagent === reagent &&
              Number(event.params.exhaustion) < 1,
          ),
        ) &&
        stationQuality(twin, 'processing') >= P['quality.preservation-min'],
    })
  if (entry.id === 'frozen')
    checks.push({
      label: 'Prepare a separate frozen case with recorded biohazard precautions',
      passed: intent('frozen.freeze') && twin.frozen.prepared && twin.frozen.biohazardChecked,
    })
  if (entry.id === 'controls')
    checks.push({
      label:
        'Preserve the failed-control history, hold, recut and repeat a valid controlled IHC run',
      passed:
        recoveredControls(twin) &&
        twin.ihc.valid &&
        intent('ihc.primary') &&
        intent('ihc.detect') &&
        intent('coverslip.apply'),
    })
  if (entry.id === 'levels') {
    const sections = twin.block.sections.filter(
      (section) => section.pickedUp && section.labelCorrect,
    )
    const depth = sections.length
      ? Math.max(...sections.map((section) => section.depth)) -
        Math.min(...sections.map((section) => section.depth))
      : 0
    checks.push({
      label: 'Collect the requested levels and depth gap without exhausting the block',
      passed:
        new Set(sections.map((section) => section.level)).size >= P['practical.minimum-levels'] &&
        depth >= P['practical.level-gap'] &&
        twin.block.remaining > 0,
    })
  }
  const passed =
    !!record.completedAt &&
    checks.every((check) => check.passed) &&
    score.critical.length === 0 &&
    score.total >= parameterValue('quality.pass-threshold')
  return {
    case: entry,
    record,
    status: record.completedAt
      ? passed
        ? 'complete'
        : 'needs-correction'
      : paused
        ? 'paused'
        : 'in-progress',
    score: score.total,
    passed,
    started,
    clock,
    turnaround: clock - entry.arrival,
    withinTarget: !!record.completedAt && clock - entry.arrival <= entry.targetMinutes,
    checks,
    critical: score.critical,
  }
}

export function assessShift(seed: string, records: readonly LabRecord[]): ShiftAssessment {
  const shift = createShift(seed)
  const latest = latestCases(shift.seed, records)
  const cases = shift.cases.map((entry) => assessCase(entry, latest.get(entry.id)))
  const currentQueueMinute = Math.max(0, ...cases.map((entry) => entry.clock))
  const priorityFindings: ShiftAssessment['priorityFindings'] = []
  for (const row of cases) {
    for (const event of row.record?.events ?? []) {
      if (
        !['shift.dispatch', 'shift.resume'].includes(event.intent) ||
        typeof event.params.queueMinute !== 'number'
      )
        continue
      const minute = event.params.queueMinute
      for (const urgent of cases) {
        if (
          urgent.case.id !== row.case.id &&
          urgent.case.priority < row.case.priority &&
          urgent.case.arrival <= minute &&
          (!urgent.passed || urgent.clock > minute)
        )
          priorityFindings.push({
            caseId: row.case.id,
            urgentCaseId: urgent.case.id,
            minute,
            event: event.sequence,
          })
      }
    }
  }
  const quality = cases.reduce((sum, entry) => sum + entry.score, 0) / cases.length
  const timing = (cases.filter((entry) => entry.withinTarget).length / cases.length) * 100
  const dispatches = cases.reduce(
    (sum, entry) =>
      sum +
      (entry.record?.events.filter((event) =>
        ['shift.dispatch', 'shift.resume'].includes(event.intent),
      ).length ?? 0),
    0,
  )
  const priority = Math.max(0, 1 - priorityFindings.length / Math.max(1, dispatches)) * 100
  const score = Math.round(
    quality * P['shift.quality-weight'] +
      timing * P['shift.timing-weight'] +
      priority * P['shift.priority-weight'],
  )
  const critical = cases.flatMap((entry) => entry.critical)
  const complete = cases.every((entry) => !!entry.record?.completedAt)
  return {
    seed: shift.seed,
    cases,
    currentQueueMinute,
    score,
    passed:
      complete &&
      cases.every((entry) => entry.passed) &&
      critical.length === 0 &&
      score >= parameterValue('quality.pass-threshold'),
    complete,
    critical,
    priorityFindings,
  }
}
