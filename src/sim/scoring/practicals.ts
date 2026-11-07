import { CAREER_LEVELS, COMPETENCIES } from '../../content/lab/curriculum'
import type { CareerLevel } from '../../content/lab/schemas'
import type { LabRecord } from '../../store/labSchema'
import type { SimEvent, StationId } from '../core/events'
import { reduceEvent, replayRun } from '../core/replay'
import { createTwin } from '../specimen/initial'
import type { ModelIssue, Twin } from '../specimen/types'
import { PROCESS as P } from '../params/process'
import { parameterValue } from '../params/registry'
import { assessTwin, releaseProblems, stationQuality } from './assess'
import type { Assessment } from './assess'

export interface PracticalCheck {
  id: string
  label: string
  passed: boolean
  evidence: string
  competencyIds: string[]
}
export interface PracticalGrade {
  passed: boolean
  total: number
  checks: PracticalCheck[]
  critical: ModelIssue[]
  assessment: Assessment
  requiresQualifiedReview: boolean
  status: 'passed' | 'needs-practice' | 'requires-qualified-review'
  reviewNote: string
}
export interface PracticalSpec {
  id: string
  level: CareerLevel['id']
  stations: StationId[]
  seed: string
  archetype: string
  reviewRequired: boolean
  instructions: string[]
}

const routineStations: StationId[] = [
  'accessioning',
  'grossing',
  'fixation',
  'processing',
  'embedding',
  'microtomy',
  'bath',
  'drying',
  'he',
  'coverslip',
  'quality',
]
export const PRACTICAL_SPECS: PracticalSpec[] = [
  {
    id: 'orientation-practical',
    level: 'L0',
    stations: ['microtomy', 'quality'],
    seed: 'HQ-SKIN-01',
    archetype: 'skin-ellipse',
    reviewRequired: false,
    instructions: [
      'Record a hazard, PPE, SDS and escalation plan before touching the station.',
      'Explicitly lock and guard the instrument.',
      'Inspect the microscope from overview to detail and record how focus and illumination differ from staining. This check records your observations; it does not validate your interpretation.',
    ],
  },
  {
    id: 'assistant-practical',
    level: 'L1',
    stations: ['accessioning', 'grossing', 'processing', 'embedding'],
    seed: 'HQ-SKIN-01',
    archetype: 'skin-ellipse',
    reviewRequired: false,
    instructions: [
      'Hold the discrepant accession and record an authorized resolution before acceptance.',
      'Account for all submitted fragments and record the cassette key.',
      'Run compatible solvent exchange and represent all pieces in the requested cutting plane.',
      'Document each required station.',
    ],
  },
  {
    id: 'routine-practical',
    level: 'L2',
    stations: routineStations,
    seed: 'HQ-GI-01',
    archetype: 'colon-biopsy',
    reviewRequired: false,
    instructions: [
      'Prepare a complete H&E section through a controlled specimen-to-slide path.',
      'Use a protected instrument adjustment and clean pickup with a matching label.',
      'Record the reference comparison and your technical disposition.',
      'Document each required station; retain any error in the history.',
    ],
  },
  {
    id: 'ht-practical',
    level: 'L3',
    stations: [...routineStations.filter((station) => station !== 'he'), 'special'],
    seed: 'HQ-GI-01',
    archetype: 'colon-biopsy',
    reviewRequired: false,
    instructions: [
      `Collect at least ${P['practical.minimum-levels']} correctly labeled levels separated by at least ${P['practical.level-gap']} model µm.`,
      'Run and inspect a failed special-stain control, hold the affected work, then repeat on a new section until the controls support the run.',
      'Record how the main case stays secure during a separately identified frozen consultation. This is an interruption plan, not a frozen procedure on the paraffin block.',
      'Record a technical hold or justified release and the corrective action.',
    ],
  },
  {
    id: 'htl-practical',
    level: 'L4',
    stations: [
      'accessioning',
      'fixation',
      'decalcification',
      'processing',
      'embedding',
      'microtomy',
      'bath',
      'drying',
      'ihc',
      'ish',
      'quality',
    ],
    seed: 'HQ-BONE-01',
    archetype: 'bone-core',
    reviewRequired: false,
    instructions: [
      'Keep low-expression sensitivity, background, tissue retention and localization visible during optimization.',
      'Compare at least two primary or retrieval conditions, preserving the failed attempt in the log.',
      'Review positive, low-positive, negative and internal controls before disposition.',
      'Record the ISH preservation-control limitation and the single-marker controls needed before multiplexing. Narrative interpretation remains author-checked practice.',
    ],
  },
  {
    id: 'lead-practical',
    level: 'L5',
    stations: ['quality'],
    seed: 'HQ-LEAD-PLAN',
    archetype: 'skin-ellipse',
    reviewRequired: true,
    instructions: [
      'Record a response to every published planning criterion.',
      'Preserve assumptions, acceptance rules, comparators, incident history and proposed corrective action.',
      'The software checks that the plan was recorded. A qualified reviewer must judge its scientific and operational adequacy.',
    ],
  },
  {
    id: 'supervisor-practical',
    level: 'L6',
    stations: ['quality'],
    seed: 'HQ-SUPERVISOR-PLAN',
    archetype: 'skin-ellipse',
    reviewRequired: true,
    instructions: [
      'Record workload, qualification, coverage, equipment and document-control assumptions.',
      'Separate a proposed schedule or budget from an approved operational plan.',
      'The software checks that the plan was recorded. A qualified reviewer must assess it against current institutional requirements.',
    ],
  },
]
export const PRACTICAL_BY_ID = Object.fromEntries(PRACTICAL_SPECS.map((spec) => [spec.id, spec]))
export function requiredStations(id: string): StationId[] {
  return [...(PRACTICAL_BY_ID[id]?.stations ?? [])]
}

export function practicalAvailability(
  id: string,
  passedIds: readonly string[],
  records: readonly LabRecord[] = [],
): { allowed: boolean; reason: string } {
  const index = CAREER_LEVELS.findIndex((level) => level.practical.id === id)
  if (index < 0)
    return { allowed: false, reason: 'This practical is not in the published learning ladder.' }
  if (index === 0) return { allowed: true, reason: 'Orientation is available to every learner.' }
  const previous = CAREER_LEVELS[index - 1]
  if (passedIds.includes(previous.practical.id))
    return { allowed: true, reason: 'The preceding practical is recorded as passed.' }
  const acceptable = records.some((record) => {
    if (!record.completedAt || record.practicalId !== previous.practical.id) return false
    const grade = gradePractical(replayRun(record), previous.practical.id)
    return (
      grade.passed ||
      (grade.requiresQualifiedReview &&
        !grade.critical.length &&
        grade.checks.every((check) => check.passed))
    )
  })
  return acceptable
    ? {
        allowed: true,
        reason:
          previous.id === 'L5'
            ? 'The preceding plan is recorded; its qualified review remains pending.'
            : 'The preceding practical has passing event evidence.',
      }
    : {
        allowed: false,
        reason: `Complete ${previous.id}: ${previous.practical.title} before starting this assessed milestone. Free laboratory practice remains available.`,
      }
}

/** Seed is scenario identity; wall-clock metadata is never used by replay or grading. */
export function createPracticalRecord(id: string): LabRecord {
  const spec = PRACTICAL_BY_ID[id]
  const level = CAREER_LEVELS.find((entry) => entry.practical.id === id)
  if (!spec || !level) throw new Error(`Unknown practical: ${id}`)
  return {
    id: crypto.randomUUID(),
    version: 1,
    seed: spec.seed,
    archetype: spec.archetype,
    difficulty: 1,
    mode: 'practical',
    startedAt: new Date().toISOString(),
    events: [],
    title: `${spec.level} · ${level.practical.title}`,
    practicalId: id,
  }
}

export function recordedEvidence(t: Twin, checkId: string): SimEvent | undefined {
  return t.events.findLast(
    (event) =>
      event.intent === 'practice.evidence' &&
      event.params.checkId === checkId &&
      typeof event.params.text === 'string' &&
      event.params.text.trim().length >= P['practical.note-minimum'],
  )
}
const hasIntent = (t: Twin, intent: string) => t.events.some((event) => event.intent === intent)
const check = (
  id: string,
  label: string,
  passed: boolean,
  evidence: string,
  competencyIds: string[],
): PracticalCheck => ({ id, label, passed, evidence, competencyIds })
const documented = (t: Twin, stations: StationId[]) =>
  stations.filter((station) =>
    t.documentation.some(
      (note) => note.station === station && note.text.trim().length >= P['practical.note-minimum'],
    ),
  )

/** Observe state at the recorded control event, not a guessed explanation or a later corrected state. */
function controlledRecovery(t: Twin): boolean {
  let state = createTwin(t.scenario)
  let failedSection = ''
  let held = false
  let recut = false
  for (const event of t.events) {
    state = reduceEvent(state, event)
    if (event.intent === 'special.controls' && !state.staining.controls.valid) {
      failedSection = state.block.sections.at(-1)?.id ?? ''
      held = false
      recut = false
    }
    if (failedSection && event.intent === 'quality.hold') held = true
    if (
      held &&
      event.intent === 'microtomy.cut' &&
      state.block.sections.at(-1)?.id !== failedSection
    )
      recut = true
    if (recut && event.intent === 'special.controls' && state.staining.controls.valid) return true
  }
  return false
}

export function gradePractical(t: Twin, id: string): PracticalGrade {
  const spec = PRACTICAL_BY_ID[id]
  if (!spec) throw new Error(`Unknown practical: ${id}`)
  const assessment = assessTwin(t, spec.stations)
  const threshold = P['quality.preservation-min']
  const checks: PracticalCheck[] = []
  const add = (row: PracticalCheck) => checks.push(row)
  const last = t.block.sections.at(-1)
  if (spec.level === 'L0') {
    const safe = recordedEvidence(t, 'safe-start')
    const microscope = recordedEvidence(t, 'microscope-basics')
    add(
      check(
        'safe-start',
        'Record the hazard, PPE, SDS and escalation checks',
        !!safe &&
          safe.params.ppe === true &&
          safe.params.sds === true &&
          safe.params.escalation === true,
        safe
          ? 'A safety observation and explicit acknowledgements are recorded.'
          : 'No complete safety observation is recorded.',
        ['safe-start'],
      ),
    )
    add(
      check(
        'secure-sharps',
        'Explicitly lock and guard before adjustment',
        t.events.some(
          (event) =>
            event.intent === 'instrument.set' &&
            event.params.locked === true &&
            event.params.guarded === true,
        ) && !t.issues.some((issue) => issue.id === 'unsafe-sharps'),
        'The event log is checked for an explicit lock-and-guard action and unsafe adjustment history.',
        ['safe-start'],
      ),
    )
    add(
      check(
        'microscope-basics',
        'Record an overview/detail, focus and illumination comparison',
        !!microscope &&
          [2, 4].includes(Number(microscope.params.overview)) &&
          Number(microscope.params.detail) >= 10 &&
          microscope.params.focusCompared === true &&
          microscope.params.illuminationCompared === true,
        microscope
          ? 'The learner recorded settings and a structural description; interpretation is not independently validated.'
          : 'Record the microscope comparison in the practical evidence panel.',
        ['microscope-basics'],
      ),
    )
  } else if (spec.reviewRequired) {
    const level = CAREER_LEVELS.find((entry) => entry.practical.id === id)!
    level.practical.rubric.forEach((label, index) => {
      const evidence = recordedEvidence(t, `planning-${index + 1}`)
      const sufficient =
        !!evidence && String(evidence.params.text).trim().length >= P['practical.plan-minimum']
      add(
        check(
          `planning-${index + 1}`,
          label,
          sufficient,
          sufficient
            ? 'A response is recorded; adequacy requires qualified review.'
            : 'A substantive response is still needed for reviewer discussion.',
          level.competencies,
        ),
      )
    })
  } else {
    add(
      check(
        'identity-chain',
        'Maintain an accepted and resolved identity chain',
        t.identity.accepted && t.identity.resolved && !t.identity.broken,
        t.identity.broken
          ? 'The run retains an identity break.'
          : t.identity.custody.join(' → ') || 'No accepted custody chain is recorded.',
        ['identity-chain'],
      ),
    )
    if (spec.level === 'L1')
      add(
        check(
          'authorized-hold',
          'Hold and document the discrepancy before acceptance',
          hasIntent(t, 'identity.hold') && hasIntent(t, 'identity.resolve') && t.identity.resolved,
          'The log must retain both the hold and authorized resolution.',
          ['identity-chain'],
        ),
      )
    if (spec.level !== 'L4')
      add(
        check(
          'cassette-reconciliation',
          'Account for every fragment and the cassette key',
          t.gross.sampled &&
            t.gross.fragments === t.scenario.fragments &&
            t.gross.key.trim().length > 0,
          `${t.gross.fragments} of ${t.scenario.fragments} fragments recorded; key ${t.gross.key ? 'present' : 'missing'}.`,
          ['load-and-log'],
        ),
      )
    add(
      check(
        'processing-program',
        'Replace water through compatible processing steps',
        stationQuality(t, 'processing') >= threshold &&
          ['alcohol', 'clearant', 'paraffin'].every((reagent) =>
            t.processing.history.some((entry) => entry.reagent === reagent),
          ),
        `Modeled processing quality: ${Math.round(stationQuality(t, 'processing') * 100)}%.`,
        ['processing-program', 'load-and-log'],
      ),
    )
    add(
      check(
        'oriented-embedding',
        'Represent every piece in the requested cutting plane',
        t.embedding.pieces.length >= t.gross.fragments &&
          t.embedding.representation >= threshold &&
          t.embedding.cooled,
        `${t.embedding.pieces.length} placed pieces; ${Math.round(t.embedding.representation * 100)}% modeled plane representation.`,
        ['simple-embedding', 'oriented-embedding'],
      ),
    )
    if (spec.level !== 'L1') {
      add(
        check(
          'preservation-plan',
          'Preserve tissue and downstream targets',
          stationQuality(t, 'fixation') >= threshold,
          `Modeled fixation/preservation quality: ${Math.round(stationQuality(t, 'fixation') * 100)}%.`,
          ['preservation-plan'],
        ),
      )
      add(
        check(
          'routine-section',
          'Collect a supported, safely cut, identified section',
          !!last?.pickedUp &&
            last.labelCorrect &&
            last.floaters.length === 0 &&
            last.thickness > 0 &&
            stationQuality(t, 'microtomy') >= threshold &&
            last.adhesion >= threshold,
          last
            ? `Last section ${last.slideId || last.id}, depth ${last.depth} µm; mechanical quality ${Math.round(stationQuality(t, 'microtomy') * 100)}%.`
            : 'No section has been collected.',
          ['routine-section'],
        ),
      )
    }
    if (spec.level === 'L2') {
      add(
        check(
          'routine-he',
          'Complete a technically adequate H&E and mount',
          stationQuality(t, 'he') >= threshold && stationQuality(t, 'coverslip') >= threshold,
          `Stain quality ${Math.round(stationQuality(t, 'he') * 100)}%; mounting quality ${Math.round(stationQuality(t, 'coverslip') * 100)}%.`,
          ['routine-he'],
        ),
      )
      add(
        check(
          'reference-comparison',
          'Record the control/reference comparison',
          !!recordedEvidence(t, 'reference-comparison'),
          'A recorded comparison is required; its interpretation remains practice evidence.',
          ['routine-he'],
        ),
      )
      add(
        check(
          'technical-disposition',
          'Release a usable run or record a justified technical hold',
          t.disposition === 'hold' ||
            (t.disposition === 'release' && releaseProblems(t).length === 0),
          `Current disposition: ${t.disposition}.`,
          ['routine-he'],
        ),
      )
    }
    if (spec.level === 'L3') {
      const levels = t.block.sections.filter((section) => section.pickedUp && section.labelCorrect)
      const distinct = new Set(levels.map((section) => section.level)).size
      const depthGap = levels.length
        ? Math.max(...levels.map((section) => section.depth)) -
          Math.min(...levels.map((section) => section.depth))
        : 0
      add(
        check(
          'levels-and-conservation',
          'Collect the requested levels with an auditable depth gap',
          distinct >= P['practical.minimum-levels'] &&
            depthGap >= P['practical.level-gap'] &&
            t.block.remaining > 0,
          `${distinct} distinct collected levels; ${depthGap} µm between first and last; ${t.block.remaining} µm remaining.`,
          ['levels-and-conservation'],
        ),
      )
      add(
        check(
          'special-stain-controls',
          'Repeat a held failed control on a new section until controls pass',
          controlledRecovery(t) && t.archivedSlides.length > 0 && t.staining.controls.valid,
          'The history must contain a failed control, a hold, a separate section, and current valid special-stain controls.',
          ['special-stain-controls'],
        ),
      )
      const interruption = recordedEvidence(t, 'frozen-interruption')
      add(
        check(
          'frozen-interruption',
          'Record separation and precautions for the interrupted frozen case',
          !!interruption &&
            interruption.params.secured === true &&
            interruption.params.biohazard === true &&
            typeof interruption.params.otherAccession === 'string' &&
            interruption.params.otherAccession !== t.scenario.accession &&
            interruption.params.otherAccession.trim().length > 0,
          'This is a recorded separate-case interruption plan. It is not evidence of a physical frozen procedure.',
          ['frozen-workflow'],
        ),
      )
      add(
        check(
          'corrective-action',
          'Record the cause, correction and technical disposition',
          !!recordedEvidence(t, 'corrective-action') && t.disposition !== 'pending',
          `Disposition: ${t.disposition}; the corrective-action explanation is checked for presence, not expert validity.`,
          ['special-stain-controls'],
        ),
      )
    }
    if (spec.level === 'L4') {
      const conditionCounts = ['ihc.primary', 'ihc.retrieve'].map(
        (intent) =>
          new Set(
            t.events
              .filter((event) => event.intent === intent)
              .map((event) => JSON.stringify(event.params)),
          ).size,
      )
      const conditions = Math.max(...conditionCounts)
      add(
        check(
          'ihc-optimization',
          'Compare multiple conditions with sensitivity and background controls',
          conditions >= 2 &&
            t.ihc.valid &&
            t.ihc.damage < 1 &&
            t.ihc.location === t.scenario.targetLocalization,
          `${conditions} distinct conditions within primary exposure or retrieval; controls ${t.ihc.valid ? 'valid' : 'not valid'}; localization ${t.ihc.location}.`,
          ['ihc-optimization', 'ihc-control-strategy'],
        ),
      )
      add(
        check(
          'ish-rna-integrity',
          'Record why failed RNA controls prevent a negative interpretation',
          !!recordedEvidence(t, 'ish-rna-integrity'),
          'A preservation-control explanation is recorded for later review.',
          ['ish-rna-integrity'],
        ),
      )
      add(
        check(
          'multiplex-planning',
          'Record single-marker controls and cross-reaction limits',
          !!recordedEvidence(t, 'multiplex-planning'),
          'A control-design explanation is recorded; the simulator does not validate a clinical multiplex assay.',
          ['multiplex-planning', 'molecular-ready'],
        ),
      )
    }
    const docs = documented(t, spec.stations)
    add(
      check(
        'station-records',
        'Document each required station',
        docs.length === spec.stations.length,
        `${docs.length} of ${spec.stations.length} station records meet the completeness prompt. Required: ${spec.stations.join(', ')}.`,
        [],
      ),
    )
  }
  const evidenceScore = checks.length
    ? (checks.filter((row) => row.passed).length / checks.length) * 100
    : 0
  const total = Math.round(
    spec.level === 'L0' || spec.reviewRequired
      ? evidenceScore
      : evidenceScore * P['practical.evidence-weight'] +
          assessment.total * P['practical.model-weight'],
  )
  const passed =
    !spec.reviewRequired &&
    assessment.critical.length === 0 &&
    checks.every((row) => row.passed) &&
    total >= parameterValue('quality.pass-threshold')
  return {
    passed,
    total,
    checks,
    critical: assessment.critical,
    assessment,
    requiresQualifiedReview: spec.reviewRequired,
    status: spec.reviewRequired
      ? 'requires-qualified-review'
      : passed
        ? 'passed'
        : 'needs-practice',
    reviewNote: spec.reviewRequired
      ? 'Documentation completeness only. Requires qualified review; no automatic professional or scientific approval is awarded.'
      : 'Software checks recorded actions and this illustrative model. This is practice evidence inside HistoQuest, not verified workplace competency.',
  }
}

export interface CompetencyEvidence {
  id: string
  label: string
  level: string
  attempts: number
  demonstrated: number
  lastRunId?: string
  reviewRequired: boolean
}
export function competencyEvidence(runs: readonly LabRecord[]): CompetencyEvidence[] {
  const graded = runs
    .filter(
      (record) => record.completedAt && record.practicalId && PRACTICAL_BY_ID[record.practicalId],
    )
    .map((record) => ({ record, grade: gradePractical(replayRun(record), record.practicalId!) }))
  return COMPETENCIES.map((competency) => {
    const evidence = graded.filter(({ grade }) =>
      grade.checks.some((row) => row.competencyIds.includes(competency.id)),
    )
    const successful = evidence.filter(
      ({ grade }) =>
        !grade.critical.length &&
        !grade.requiresQualifiedReview &&
        grade.checks
          .filter((row) => row.competencyIds.includes(competency.id))
          .every((row) => row.passed),
    )
    return {
      id: competency.id,
      label: competency.label,
      level: competency.level,
      attempts: evidence.length,
      demonstrated: successful.length,
      lastRunId: evidence.at(-1)?.record.id,
      reviewRequired: competency.level === 'L5' || competency.level === 'L6',
    }
  })
}
