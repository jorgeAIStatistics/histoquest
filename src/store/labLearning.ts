import { CARDS } from '../content'
import { localDate } from '../engine/dates'
import { newState } from '../engine/srs'
import type { StationId } from '../sim/core/events'
import { assessTwin } from '../sim/scoring/assess'
import type { Twin } from '../sim/specimen/types'
import type { LabRecord } from './labSchema'
import type { AppState } from './state'

/** Educational mappings; these schedule practice, never manufacture an answered item. */
export const STATION_OBJECTIVES: Record<StationId, string[]> = {
  accessioning: ['OPS-08'],
  grossing: ['FIX-02', 'EMB-01'],
  fixation: ['FIX-01', 'FIX-02', 'FIX-03'],
  decalcification: ['PROC-03'],
  processing: ['PROC-01', 'PROC-02', 'PROC-04'],
  embedding: ['EMB-01'],
  microtomy: ['EMB-02', 'EMB-03'],
  bath: ['EMB-02', 'EMB-05'],
  drying: ['EMB-05'],
  he: ['STAIN-01'],
  special: ['STAIN-07'],
  ihc: ['STAIN-08', 'STAIN-09'],
  ish: ['STAIN-10'],
  coverslip: ['STAIN-11'],
  frozen: ['EMB-04', 'PROC-05'],
  quality: ['OPS-01', 'OPS-08'],
}
const LESSONS: Record<StationId, string> = {
  accessioning: '/pathway/accessioning',
  grossing: '/pathway/grossing',
  fixation: '/pathway/fixation',
  decalcification: '/learn/L-07',
  processing: '/pathway/processing',
  embedding: '/pathway/embedding',
  microtomy: '/pathway/microtomy',
  bath: '/pathway/microtomy',
  drying: '/pathway/microtomy',
  he: '/pathway/he',
  special: '/pathway/special-stains',
  ihc: '/pathway/ihc',
  ish: '/learn/L-16',
  coverslip: '/learn/L-20',
  frozen: '/pathway/alternate-pathways',
  quality: '/pathway/quality-handoff',
}
export function applyLabLearning(state: AppState, record: LabRecord, twin: Twin): AppState {
  if (!record.completedAt || state.lab.remediation.some((r) => r.runId === record.id)) return state
  const physicalStations = [
    ...new Set(
      twin.events
        .filter(
          (e) =>
            e.params.origin !== 'scenario-setup' &&
            /^(identity\.accept|gross\.sample|fixation\.run|decalcification\.run|processing\.step|embedding\.place|microtomy\.cut|bath\.float|section\.pickup|drying\.run|stain\.step|special\.step|ihc\.(detect|experiment\.apply)|ish\.hybridize|coverslip\.apply|frozen\.freeze|quality\.(hold|release))$/.test(
              e.intent,
            ),
        )
        .map((e) => e.station),
    ),
  ]
  const report = assessTwin(twin, physicalStations)
  const issues = report.issues.filter((i) => !i.resolved || i.severity === 'critical')
  const stations = [
    ...new Set([
      ...issues.map((i) => i.station),
      ...report.stations.filter((s) => s.quality < 60).map((s) => s.station),
    ]),
  ]
  if (!stations.length) return state
  const objectives = [...new Set(stations.flatMap((s) => STATION_OBJECTIVES[s]))]
  const today = localDate(new Date(record.completedAt))
  const srs = { ...state.srs }
  // Bring up to six relevant cards into the review queue without changing ease,
  // repetitions, lapse counts, last review, answer history or readiness evidence.
  const cards = CARDS.filter((c) => objectives.includes(c.objective)).slice(0, 6)
  for (const card of cards) {
    const key = `c:${card.id}`
    const prior = srs[key]
    srs[key] = prior ? { ...prior, due: prior.due < today ? prior.due : today } : newState(today)
  }
  return {
    ...state,
    srs,
    lab: {
      ...state.lab,
      remediation: [
        {
          runId: record.id,
          at: record.completedAt,
          title: record.title,
          objectives,
          lessons: [
            ...new Set([...issues.map((i) => i.lesson), ...stations.map((s) => LESSONS[s])]),
          ],
          stations,
          critical: issues.some((i) => i.severity === 'critical'),
          dismissed: false,
        },
        ...state.lab.remediation,
      ].slice(0, 60),
    },
  }
}
