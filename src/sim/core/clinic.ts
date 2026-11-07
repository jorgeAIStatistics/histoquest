import type { LabRecord } from '../../store/labSchema'
import { EventLogSchema, type SimEvent, type StationId } from './events'
import { createScenario } from './scenarios'
import { referenceTwin } from './reference'
import { reduceEvent, replayRun } from './replay'
import { createTwin } from '../specimen/initial'
import type { Twin } from '../specimen/types'
import { PROCESS as P } from '../params/process'
import { CLINIC as C } from '../params/clinic'
import { average } from './units'

export const CLINIC_CASES = [
  {
    id: 'compressed',
    title: 'A shortened ribbon',
    archetype: 'skin-ellipse',
    stain: 'he',
    metric: 'compression',
    upstream: false,
    question:
      'The architecture looks squeezed along the cutting direction. Which part of the recorded cutting conditions could explain it?',
    lesson: '/pathway/microtomy',
  },
  {
    id: 'bands',
    title: 'Repeated dense and pale bands',
    archetype: 'colon-biopsy',
    stain: 'he',
    metric: 'chatter',
    upstream: false,
    question:
      'The section alternates in thickness. Inspect the instrument and preparation history before choosing a mechanical test.',
    lesson: '/pathway/microtomy',
  },
  {
    id: 'tracks',
    title: 'Parallel tracks through tissue',
    archetype: 'skin-ellipse',
    stain: 'he',
    metric: 'knifeLines',
    upstream: false,
    question:
      'Straight discontinuities cross otherwise represented tissue. Compare the cutting record with what you see.',
    lesson: '/pathway/microtomy',
  },
  {
    id: 'center',
    title: 'Poor detail toward the center',
    archetype: 'lymph-node',
    stain: 'he',
    metric: 'preservation',
    upstream: true,
    question:
      'Peripheral and central tissue do not preserve detail equally. Test whether a downstream sectioning or staining change can address the recorded pre-analytic problem.',
    lesson: '/pathway/fixation',
  },
  {
    id: 'support',
    title: 'Fragmented tissue in a weak block',
    archetype: 'fatty-tissue',
    stain: 'he',
    metric: 'holes',
    upstream: true,
    question:
      'The section contains gaps despite careful pickup. Trace solvent exchange and block support before deciding whether a recut is sufficient.',
    lesson: '/pathway/processing',
  },
  {
    id: 'controls',
    title: 'An IHC run with absent positive controls',
    archetype: 'breast-core',
    stain: 'ihc',
    metric: 'controls',
    upstream: false,
    question:
      'Patient-tissue signal alone cannot explain this run. Compare positive, low-positive and negative control readings with the detection record.',
    lesson: '/pathway/ihc',
  },
] as const
export type ClinicCase = (typeof CLINIC_CASES)[number]
export type ClinicVariable =
  | 'blockTemperature'
  | 'clamp'
  | 'sharpness'
  | 'speed'
  | 'thickness'
  | 'hematoxylinMinutes'
  | 'retrievalMinutes'
  | 'detectionCompatible'
export const CLINIC_VARIABLES: {
  id: ClinicVariable
  label: string
  unit: string
  min: number
  max: number
  stain?: 'he' | 'ihc'
}[] = [
  {
    id: 'blockTemperature',
    label: 'Block temperature',
    unit: '°C',
    min: 0,
    max: C['clinic.input-temperature-max'],
  },
  { id: 'clamp', label: 'Clamp tightness', unit: 'relative 0–1', min: 0, max: 1 },
  { id: 'sharpness', label: 'Blade sharpness', unit: 'relative 0–1', min: 0, max: 1 },
  {
    id: 'speed',
    label: 'Cutting speed',
    unit: 'relative pace',
    min: 0,
    max: C['clinic.input-speed-max'],
  },
  {
    id: 'thickness',
    label: 'Section thickness',
    unit: 'model µm',
    min: 1,
    max: C['clinic.input-thickness-max'],
  },
  {
    id: 'hematoxylinMinutes',
    label: 'Hematoxylin exposure',
    unit: 'simulation minute',
    min: 0,
    max: C['clinic.input-he-max'],
    stain: 'he',
  },
  {
    id: 'retrievalMinutes',
    label: 'Retrieval exposure',
    unit: 'simulation minute',
    min: 0,
    max: C['clinic.input-retrieval-max'],
    stain: 'ihc',
  },
  {
    id: 'detectionCompatible',
    label: 'Detection chemistry compatibility',
    unit: '0 incompatible / 1 compatible',
    min: 0,
    max: 1,
    stain: 'ihc',
  },
]
const caseById = (id: string) => {
  const entry = CLINIC_CASES.find((row) => row.id === id)
  if (!entry) throw new Error('Choose a case from the troubleshooting clinic.')
  return entry
}
export function clinicCase(record: LabRecord): ClinicCase {
  if (record.mode !== 'clinic') throw new Error('This is not a troubleshooting clinic record.')
  return caseById(record.seed.split(':')[1])
}
function driver(record: LabRecord) {
  let twin = replayRun(record)
  return {
    get twin() {
      return twin
    },
    act(station: StationId, intent: string, params: SimEvent['params'] = {}) {
      twin = reduceEvent(twin, {
        station,
        intent,
        params,
        sequence: twin.events.length,
        t: twin.time,
      })
    },
    record(): LabRecord {
      return { ...record, completedAt: undefined, events: EventLogSchema.parse(twin.events) }
    },
  }
}
type Driver = ReturnType<typeof driver>
function staining(
  d: Driver,
  kind: ClinicCase['stain'],
  settings: Partial<Record<ClinicVariable, number>>,
) {
  const step = (reagent: string) =>
    d.act(kind === 'ihc' ? 'ihc' : 'he', 'stain.step', {
      reagent,
      minutes:
        reagent === 'hematoxylin'
          ? (settings.hematoxylinMinutes ?? P['he.hematoxylin-time'])
          : P[`he.${reagent}-time`],
      freshness: 1,
      origin: 'clinic-controlled-repeat',
    })
  step('dewax')
  step('hydrate')
  if (kind === 'he')
    for (const reagent of ['hematoxylin', 'differentiate', 'blue', 'eosin']) step(reagent)
  else {
    d.act('ihc', 'ihc.retrieve', {
      method: 'hier',
      minutes: settings.retrievalMinutes ?? P['ihc.retrieval-time'],
      temperature: P['ihc.retrieval-temperature'],
      ph: P['ihc.retrieval-ph'],
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
      compatible: settings.detectionCompatible === 1,
    })
    d.act('ihc', 'ihc.controls', {
      positive: true,
      lowPositive: true,
      negative: true,
      faultCorrected: true,
    })
  }
  step('dehydrate')
  step('clear')
  d.act('coverslip', 'coverslip.apply', {
    medium: 'resinous',
    volume: P['mount.volume'],
    angle: P['mount.angle'],
    delay: 0,
  })
}

/** A disclosed bad preparation is built from real model events; no appearance field is painted by verdict. */
export function createClinicRecord(id: string, seed = 'CLINIC-01'): LabRecord {
  const entry = caseById(id)
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(seed))
    throw new Error('Use 1–40 letters, numbers, underscores or hyphens for the case seed.')
  const scenario = createScenario(`CLINIC:${id}:${seed}`, entry.archetype, 1)
  const supplied = referenceTwin(scenario).events.filter((event) => event.intent !== 'document')
  const stop =
    entry.stain === 'ihc'
      ? supplied.findIndex((event) => event.intent === 'stain.step')
      : supplied.length
  let twin = createTwin(scenario)
  for (const source of supplied.slice(0, stop)) {
    const params: SimEvent['params'] = { ...source.params, origin: 'scenario-setup' }
    if (source.intent === 'embedding.cool' && id === 'compressed')
      params.temperature = C['clinic.warm-block']
    if (source.intent === 'instrument.set' && 'clamp' in params && id === 'bands')
      params.clamp = C['clinic.loose-clamp']
    if (source.intent === 'instrument.set' && 'sharpness' in params && id === 'tracks')
      params.sharpness = C['clinic.dull-blade']
    if (source.intent === 'fixation.run' && id === 'center')
      Object.assign(params, { hours: C['clinic.short-fixation'], ischemia: C['clinic.ischemia'] })
    if (source.intent === 'processing.step' && params.reagent === 'paraffin' && id === 'support')
      params.minutes = C['clinic.short-infiltration']
    twin = reduceEvent(twin, { ...source, params, t: twin.time, sequence: twin.events.length })
  }
  const record: LabRecord = {
    id: crypto.randomUUID(),
    version: 1,
    seed: scenario.seed,
    archetype: entry.archetype,
    difficulty: 1,
    mode: 'clinic',
    title: `Clinic: ${entry.title}`,
    startedAt: new Date().toISOString(),
    events: twin.events,
  }
  if (entry.stain === 'ihc') {
    const d = driver(record)
    staining(d, 'ihc', { detectionCompatible: 0 })
    record.events = d
      .record()
      .events.map((event) => ({ ...event, params: { ...event.params, origin: 'scenario-setup' } }))
  }
  const d = driver(record)
  d.act('quality', 'quality.hold', { origin: 'scenario-setup' })
  return d.record()
}

export function clinicSettings(t: Twin): Record<ClinicVariable, number> {
  const last = (intent: string, key: string, fallback: number) =>
    Number(t.events.findLast((event) => event.intent === intent)?.params[key] ?? fallback)
  return {
    blockTemperature: t.block.temperature,
    clamp: t.instrument.clamp,
    sharpness: t.instrument.sharpness,
    speed: t.instrument.speed,
    thickness: t.instrument.thickness,
    hematoxylinMinutes: Number(
      t.staining.history.findLast((step) => step.reagent === 'hematoxylin')?.minutes ??
        P['he.hematoxylin-time'],
    ),
    retrievalMinutes: last('ihc.retrieve', 'minutes', P['ihc.retrieval-time']),
    detectionCompatible: last('ihc.detect', 'compatible', 0),
  }
}
export function recordClinicHypothesis(
  record: LabRecord,
  text: string,
  variable: ClinicVariable,
  value: number,
): LabRecord {
  const entry = clinicCase(record)
  const setting = CLINIC_VARIABLES.find(
    (row) => row.id === variable && (!row.stain || row.stain === entry.stain),
  )
  if (
    !setting ||
    !Number.isFinite(value) ||
    value < setting.min ||
    value > setting.max ||
    (variable === 'detectionCompatible' && ![0, 1].includes(value))
  )
    throw new Error('Choose one applicable setting within its disclosed teaching range.')
  if (text.trim().length < C['clinic.note-minimum'])
    throw new Error(
      `Record at least ${C['clinic.note-minimum']} characters explaining the observation, suspected cause and predicted change.`,
    )
  const d = driver(record)
  if (clinicSettings(d.twin)[variable] === value)
    throw new Error(
      'Choose a value different from the current setting so this is a testable change.',
    )
  d.act('quality', 'practice.evidence', {
    checkId: 'clinic-hypothesis',
    text: text.trim(),
    variable,
    value,
  })
  return d.record()
}
function defect(t: Twin, entry: ClinicCase): number {
  const section = t.block.sections.at(-1)
  if (entry.metric === 'preservation')
    return 1 - average(t.regions.map((region) => region.fixed)) * t.ihc.preservation
  if (entry.metric === 'controls') return t.ihc.valid ? 0 : 1
  if (entry.metric === 'knifeLines') return section?.knifeLines.length ? 1 : 0
  return section?.[entry.metric] ?? 1
}
export interface ClinicComparison {
  before: number
  after: number
  outcome: 'improved' | 'persisted' | 'worsened'
  beforeSequence: number
  variable: ClinicVariable
  value: number
}
export function latestClinicComparison(record: LabRecord): ClinicComparison | null {
  const result = record.events.findLast(
    (event) => event.intent === 'practice.evidence' && event.params.checkId === 'clinic-result',
  )
  if (!result) return null
  return {
    before: Number(result.params.before),
    after: Number(result.params.after),
    outcome: result.params.outcome as ClinicComparison['outcome'],
    beforeSequence: Number(result.params.beforeSequence),
    variable: result.params.variable as ClinicVariable,
    value: Number(result.params.value),
  }
}

/** Exactly one chosen setting changes; the fixed repeat recipe is disclosed and all operations are appended. */
export function runClinicTrial(record: LabRecord): LabRecord {
  const entry = clinicCase(record)
  const hypothesis = record.events.at(-1)
  if (hypothesis?.params.checkId !== 'clinic-hypothesis')
    throw new Error(
      'Record a fresh hypothesis and one changed setting before each controlled repeat.',
    )
  const variable = hypothesis.params.variable as ClinicVariable
  const value = Number(hypothesis.params.value)
  const d = driver(record)
  const beforeSequence = d.twin.events.length
  const before = defect(d.twin, entry)
  const settings = { ...clinicSettings(d.twin), [variable]: value }
  d.act('quality', 'quality.hold')
  d.act('microtomy', 'instrument.set', { locked: true, guarded: true })
  if (['blockTemperature', 'clamp', 'sharpness', 'speed', 'thickness'].includes(variable))
    d.act('microtomy', 'instrument.set', { [variable]: value })
  d.act('microtomy', 'block.mount')
  d.act('microtomy', 'instrument.set', { locked: false, guarded: false })
  const level = (d.twin.block.sections.at(-1)?.level ?? 0) + 1
  d.act('microtomy', 'microtomy.cut', { level, purpose: 'recut' })
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
  staining(d, entry.stain, settings)
  const after = defect(d.twin, entry)
  const outcome =
    before - after >= C['clinic.improvement']
      ? 'improved'
      : after - before >= C['clinic.improvement']
        ? 'worsened'
        : 'persisted'
  d.act('quality', 'practice.evidence', {
    checkId: 'clinic-result',
    text: 'Controlled recut completed; compare actual modeled fields and explain limitations.',
    variable,
    value,
    before,
    after,
    outcome,
    beforeSequence,
  })
  return d.record()
}

export function verifyClinic(
  record: LabRecord,
  observation: string,
  outcome: ClinicComparison['outcome'],
  disposition: 'hold' | 'review',
): LabRecord {
  const comparison = latestClinicComparison(record)
  if (!comparison) throw new Error('Run a controlled repeat before recording verification.')
  if (
    record.events.findLastIndex((event) => event.params.checkId === 'clinic-hypothesis') >
    record.events.findLastIndex((event) => event.params.checkId === 'clinic-result')
  )
    throw new Error('Run the newly proposed test before verifying this investigation.')
  if (observation.trim().length < C['clinic.note-minimum'])
    throw new Error(
      `Describe the comparison and remaining limits in at least ${C['clinic.note-minimum']} characters.`,
    )
  const d = driver(record)
  d.act('quality', 'practice.evidence', {
    checkId: 'clinic-verification',
    text: observation.trim(),
    outcome,
    disposition,
    comparisonEvent: record.events.findLastIndex(
      (event) => event.params.checkId === 'clinic-result',
    ),
  })
  if (disposition === 'hold') d.act('quality', 'quality.hold')
  return { ...d.record(), completedAt: new Date().toISOString() }
}
export function gradeClinic(record: LabRecord) {
  const entry = clinicCase(record)
  const comparison = latestClinicComparison(record)
  const verification = record.events.findLast(
    (event) => event.params.checkId === 'clinic-verification',
  )
  const latestResult = record.events.findLastIndex(
    (event) => event.params.checkId === 'clinic-result',
  )
  const critical = replayRun(record).issues.filter((issue) => issue.severity === 'critical')
  const verified =
    !!comparison &&
    !!verification &&
    verification.params.comparisonEvent === latestResult &&
    verification.params.outcome === comparison.outcome &&
    (entry.upstream || comparison.after > C['clinic.resolved-defect']
      ? verification.params.disposition === 'hold'
      : true)
  return {
    complete: !!record.completedAt && verified && !critical.length,
    comparison,
    critical,
    technicalImprovement: !!comparison && comparison.after <= C['clinic.resolved-defect'],
    reviewRequired: true,
    note: 'The software checks one-variable execution, modeled change and safe disposition. Scientific reasoning in free text requires qualified review; this is not an independent competency assessment.',
  }
}
