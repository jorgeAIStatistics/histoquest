import { MARKER_BY_ID } from '../../content/lab/markers'
import type { SimEvent } from '../core/events'
import { clamp } from '../core/units'
import { IHC_EXPERIMENT as E } from '../params/ihcExperiments'
import { PROCESS as P } from '../params/process'
import { MOLECULAR as M } from '../params/molecular'
import { slideAppearance } from '../specimen/appearance'
import { createTwin } from '../specimen/initial'
import type { Twin } from '../specimen/types'
import { retrieve, primary, detect, evaluateControls } from './ihc'
import { hybridize, stringencyWash, ishControls, ishSignal } from './ish'
import { fix, decalcify } from './preservation'
import { cut, dry, floatSection } from './sectioning'
import { mount, stainStep } from './staining'

export interface IhcCondition {
  marker: string
  method: 'hier' | 'pier'
  device: string
  retrievalMinutes: number
  temperature: number
  ph: number
  dilution: number
  primaryMinutes: number
  detectionMinutes: number
  chromogenMinutes: number
  sectionAge: number
  blocked: boolean
  humid: boolean
  washed: boolean
  compatible: boolean
  positive: boolean
  lowPositive: boolean
  negative: boolean
  faultCorrected: boolean
}
export function defaultCondition(marker = 'sox10'): IhcCondition {
  return {
    marker,
    method: 'hier',
    device: 'water bath',
    retrievalMinutes: P['ihc.retrieval-time'],
    temperature: P['ihc.retrieval-temperature'],
    ph: P['ihc.retrieval-ph'],
    dilution: P['ihc.primary-dilution'],
    primaryMinutes: P['ihc.primary-minutes'],
    detectionMinutes: P['ihc.detect-minutes'],
    chromogenMinutes: P['ihc.chromogen-minutes'],
    sectionAge: 0,
    blocked: true,
    humid: true,
    washed: true,
    compatible: true,
    positive: true,
    lowPositive: true,
    negative: true,
    faultCorrected: false,
  }
}
export function conditionFromParams(params: SimEvent['params']): IhcCondition {
  const defaults = defaultCondition()
  const next = { ...defaults }
  for (const key of Object.keys(defaults) as (keyof IhcCondition)[]) {
    const value = params[key]
    if (typeof defaults[key] === 'boolean' && typeof value === 'boolean')
      Object.assign(next, { [key]: value })
    if (typeof defaults[key] === 'string' && typeof value === 'string')
      Object.assign(next, { [key]: value })
    if (typeof defaults[key] === 'number' && typeof value === 'number' && Number.isFinite(value))
      Object.assign(next, { [key]: Math.max(0, value) })
  }
  next.method = next.method === 'pier' ? 'pier' : 'hier'
  if (!MARKER_BY_ID[next.marker] || MARKER_BY_ID[next.marker].modality !== 'IHC')
    next.marker = defaults.marker
  next.dilution = clamp(next.dilution, 1, E['academy.max-dilution'])
  next.temperature = clamp(next.temperature, 0, E['academy.maximum-temperature'])
  next.ph = clamp(next.ph, 0, E['academy.maximum-ph'])
  next.sectionAge = clamp(next.sectionAge, 0, E['academy.maximum-section-age'])
  for (const key of [
    'retrievalMinutes',
    'primaryMinutes',
    'detectionMinutes',
    'chromogenMinutes',
  ] as const)
    next[key] = clamp(next[key], 0, E['academy.max-duration'])
  return next
}
export const RUN_STEPS = [
  'select-block',
  'dewax',
  'hydrate',
  'retrieve',
  'block',
  'primary',
  'wash',
  'detect',
  'counterstain',
  'finish',
  'mount',
  'controls',
] as const
export type RunStep = (typeof RUN_STEPS)[number]
export const RUN_LABELS: Record<RunStep, string> = {
  'select-block': 'Select block and prepare adjacent section',
  dewax: 'Dewax',
  hydrate: 'Hydrate',
  retrieve: 'Retrieve epitope',
  block: 'Block endogenous / nonspecific activity',
  primary: 'Apply primary',
  wash: 'Wash after primary',
  detect: 'Detection and chromogen',
  counterstain: 'Counterstain and blue',
  finish: 'Dehydrate and clear',
  mount: 'Coverslip',
  controls: 'Review analytical controls',
}

/** Controlled adjacent-section preparation. This consumes tissue and preserves earlier slides/history. */
export function adjacentSection(t: Twin, purpose = 'IHC academy adjacent section') {
  const section = cut(t, purpose, (t.block.sections.at(-1)?.level ?? 0) + 1)
  if (!t.frozen.prepared) floatSection(t, P['bath.temperature'], P['bath.minutes'], true, true)
  section.pickedUp = true
  section.charged = true
  section.slideId = `${t.scenario.accession}-A1-L${section.level}`
  section.labelCorrect = true
  if (!t.frozen.prepared) dry(t, P['drying.temperature'], P['drying.minutes'])
  else section.adhesion = 1
}
function setMarker(t: Twin, markerId: string) {
  const marker = MARKER_BY_ID[markerId]
  if (!marker) return
  t.ihc.marker = marker.label
  t.ihc.locations = [...marker.localization]
  t.ihc.location = marker.localization.includes('nuclear')
    ? 'nuclear'
    : marker.localization.includes('membranous')
      ? 'membranous'
      : 'cytoplasmic'
}
export function experimentMetrics(t: Twin) {
  const signal = t.ihc.dab
  const background = t.ihc.background
  const tissue = t.block.sections.at(-1)?.adhesion ?? 0
  const utility = (signal / (background + E['academy.noise-floor'])) * tissue
  const acceptable = t.ihc.valid && tissue >= E['academy.tissue-minimum']
  return { signal, background, tissue, utility, acceptable }
}
/** Pure wrapper: every chemistry response is the shared core function, never a second model. */
export function runIhcExperiment(
  source: Twin,
  input: IhcCondition,
  steps: readonly RunStep[] = RUN_STEPS,
) {
  const t = structuredClone(source)
  const c = conditionFromParams({ ...input })
  let blocked = false,
    primaryBlocked = false,
    primaryApplied = false,
    washed = false,
    prepared = false
  const completed: RunStep[] = []
  for (const step of steps) {
    if (step === 'select-block') {
      adjacentSection(t)
      setMarker(t, c.marker)
      prepared = true
    } else if (!prepared) continue
    else if (step === 'dewax') stainStep(t, 'dewax', P['he.dewax-time'])
    else if (step === 'hydrate') stainStep(t, 'hydrate', P['he.hydrate-time'])
    else if (step === 'retrieve') retrieve(t, c.retrievalMinutes, c.temperature, c.ph, c.method)
    else if (step === 'block') blocked = c.blocked
    else if (step === 'primary') {
      primaryBlocked = blocked
      primaryApplied = true
      washed = false
      primary(t, c.dilution, c.primaryMinutes, primaryBlocked, c.humid, false, c.sectionAge)
    } else if (step === 'wash') washed = primaryApplied && c.washed
    else if (step === 'detect') {
      // Re-evaluate background with observed post-primary washing, preserving binding already achieved.
      const bound = t.ihc.primary
      if (primaryApplied)
        primary(t, c.dilution, c.primaryMinutes, primaryBlocked, c.humid, washed, c.sectionAge)
      t.ihc.primary = bound
      detect(t, c.detectionMinutes, c.chromogenMinutes, c.compatible)
    } else if (step === 'counterstain') {
      stainStep(t, 'hematoxylin', P['he.hematoxylin-time'])
      stainStep(t, 'blue', P['he.blue-time'])
    } else if (step === 'finish') {
      stainStep(t, 'dehydrate', P['he.dehydrate-time'])
      stainStep(t, 'clear', P['he.clear-time'])
    } else if (step === 'mount') mount(t, 'resinous', P['mount.volume'], P['mount.angle'], 0)
    else if (step === 'controls')
      evaluateControls(t, c.positive, c.lowPositive, c.negative, c.faultCorrected)
    completed.push(step)
  }
  return {
    twin: t,
    condition: c,
    appearance: slideAppearance(t),
    metrics: experimentMetrics(t),
    completed,
  }
}
export type IhcExperimentResult = ReturnType<typeof runIhcExperiment>

/** Called by the reducer after its sharps gate. Returns false without changing biology when setup is unavailable. */
export function applyIhcExperiment(t: Twin, params: SimEvent['params']): boolean {
  if (
    !t.instrument.locked ||
    !t.instrument.guarded ||
    !t.embedding.cooled ||
    !t.embedding.pieces.length ||
    t.block.remaining <= t.instrument.thickness
  ) {
    t.notes.push(
      'IHC adjacent-section application requires a prepared block, remaining tissue, and the instrument locked and guarded before the controlled sequence.',
    )
    return false
  }
  const result = runIhcExperiment(t, conditionFromParams(params))
  Object.assign(t, result.twin)
  t.time +=
    result.condition.retrievalMinutes +
    result.condition.primaryMinutes +
    result.condition.detectionMinutes +
    result.condition.chromogenMinutes +
    P['drying.minutes'] +
    P['bath.minutes'] +
    result.twin.staining.history.reduce((sum, step) => sum + step.minutes, 0)
  t.notes.push(
    `IHC academy prepared a new charged, correctly labeled adjacent section and applied ${result.condition.marker}; ${result.condition.method}, ${result.condition.device}, dilution 1:${result.condition.dilution}. Earlier slides and preanalytic losses remain recorded.`,
  )
  return true
}

export interface Loading {
  registered: boolean
  expired: boolean
  loaded: number
  dead: number
  slides: number
  dispense: number
}
export function evaluateRun(
  result: IhcExperimentResult,
  program: readonly RunStep[],
  loading: Loading,
  automated: boolean,
  blockConfirmed: boolean,
) {
  const issues: string[] = []
  if (!blockConfirmed) issues.push('Block/target request was not reconciled.')
  if (program.length !== RUN_STEPS.length || RUN_STEPS.some((step, i) => program[i] !== step))
    issues.push('The selected exercise sequence is incomplete or out of order.')
  if (loading.dispense < E['academy.dispense'])
    issues.push('The fictitious section coverage requirement was not met.')
  if (automated && (!loading.registered || loading.expired))
    issues.push('Reagent registration and current status were not established.')
  if (automated && loading.loaded - loading.dead < loading.slides * loading.dispense)
    issues.push('Usable volume does not cover all programmed dispenses after dead volume.')
  if (!result.condition.humid)
    issues.push('Drying during staining produced the core edge/background response.')
  if (!result.metrics.acceptable)
    issues.push('Modeled controls or tissue retention do not meet this exercise rubric.')
  return { passed: issues.length === 0, issues }
}
export function retrievalConditions(base: IhcCondition) {
  return [E['academy.buffer-acid'], E['academy.buffer-alkaline']].flatMap((ph) =>
    [E['academy.retrieval-short'], E['academy.retrieval-middle'], E['academy.retrieval-long']].map(
      (retrievalMinutes) => ({ ...base, ph, retrievalMinutes }),
    ),
  )
}
export function checkerboardConditions(base: IhcCondition) {
  return [
    E['academy.dilution-strong'],
    E['academy.dilution-middle'],
    E['academy.dilution-weak'],
  ].flatMap((dilution) =>
    [E['academy.detect-short'], E['academy.detect-middle'], E['academy.detect-long']].map(
      (detectionMinutes) => ({ ...base, dilution, detectionMinutes }),
    ),
  )
}
export function bestCondition(results: IhcExperimentResult[]) {
  const valid = results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result.metrics.acceptable)
  return valid.sort((a, b) => b.result.metrics.utility - a.result.metrics.utility)[0]?.index ?? -1
}
export interface PreanalyticCondition {
  ischemia: number
  fixationHours: number
  decal: 'none' | 'edta' | 'strong-acid'
  sectionAge: number
}
export function preanalyticExperiment(source: Twin, c: IhcCondition, p: PreanalyticCondition) {
  const biology = createTwin(source.scenario)
  biology.gross = structuredClone(source.gross)
  biology.processing = structuredClone(source.processing)
  fix(biology, p.fixationHours, P['fixation.temperature'], P['fixation.ratio'], 'nbf', p.ischemia)
  if (p.decal !== 'none')
    decalcify(biology, p.decal, E['academy.decalc-duration'], 'exercise comparison only')
  const paired = structuredClone(source)
  paired.fixation = biology.fixation
  paired.regions = biology.regions
  paired.decal = biology.decal
  paired.ihc.preservation = biology.ihc.preservation
  paired.ihc.masking = biology.ihc.masking
  // Preserve the actual block support fields while varying only the declared preanalytic biology.
  paired.regions.forEach((region, i) => {
    const original = source.regions[i]
    if (original) {
      region.wax = original.wax
      region.water = original.water
      region.clearant = original.clearant
      region.alcohol = original.alcohol
    }
  })
  return runIhcExperiment(paired, { ...c, sectionAge: p.sectionAge })
}
export interface MultiplexPlan {
  mode: 'simultaneous' | 'sequential' | 'fluorescence'
  hostA: string
  hostB: string
  separatedDetection: boolean
  cycleControl: boolean
  strippingValidated: boolean
  singleStains: boolean
  channelsDistinct: boolean
}
export function evaluateMultiplex(p: MultiplexPlan) {
  const failures: string[] = []
  if (p.hostA === p.hostB && p.mode !== 'sequential' && !p.separatedDetection)
    failures.push(
      'Same-host primaries share recognition by the generic secondary: use an independently established separation strategy.',
    )
  if (p.mode === 'sequential' && (!p.strippingValidated || !p.cycleControl))
    failures.push(
      'Sequential cycles need validated inactivation/removal and a carryover challenge.',
    )
  if (!p.singleStains)
    failures.push('Single-target controls are needed to distinguish channel-specific performance.')
  if (!p.channelsDistinct)
    failures.push(
      'Distinct chromogens or validated fluorescence separation are needed to resolve channels.',
    )
  return { passed: failures.length === 0, issues: failures }
}
export function runIshExperiment(
  source: Twin,
  probe: string,
  stringency: number,
  integrity: boolean,
  negative: boolean,
  positive: boolean,
  modality: 'CISH' | 'FISH' = 'CISH',
  denatured = false,
) {
  const t = structuredClone(source)
  adjacentSection(t)
  stainStep(t, 'dewax', P['he.dewax-time'])
  stainStep(t, 'hydrate', P['he.hydrate-time'])
  hybridize(
    t,
    probe,
    M['ish.hybridization-time'],
    M['ish.temperature'],
    M['ish.protease'],
    modality,
    denatured,
  )
  stringencyWash(t, stringency)
  ishControls(t, positive, negative, integrity)
  const control = structuredClone(t)
  hybridize(
    control,
    /DNA/i.test(probe) ? 'reference DNA' : 'housekeeping RNA',
    M['ish.hybridization-time'],
    M['ish.temperature'],
    M['ish.protease'],
    modality,
    denatured,
  )
  stringencyWash(control, stringency)
  const integrityPass = integrity && ishSignal(control) >= M['ish.positive-min']
  const passed = t.ihc.valid && integrityPass
  if (modality === 'CISH') {
    stainStep(t, 'hematoxylin', P['he.hematoxylin-time'])
    stainStep(t, 'blue', P['he.blue-time'])
  }
  mount(t, 'aqueous', P['mount.volume'], 0, 0)
  return {
    twin: t,
    appearance: slideAppearance(t),
    passed,
    integritySignal: integrity ? ishSignal(control) : null,
    issues: [
      ...(!t.ihc.valid ? ['External target/background controls failed or were not included.'] : []),
      ...(!integrityPass
        ? ['Specimen nucleic-acid integrity has not been established by its independent control.']
        : []),
    ],
  }
}
export interface ValidationPlan {
  change: string
  scope: string
  cases: string
  comparison: string
  criteria: string
  discrepancies: string
  approval: string
}
export function evaluateValidation(p: ValidationPlan) {
  const expected = {
    scope: 'defined',
    cases: 'range',
    comparison: 'validated',
    criteria: 'prespecified',
    discrepancies: 'investigate',
    approval: 'review',
  }
  const issues = Object.entries(expected)
    .filter(([key, value]) => p[key as keyof ValidationPlan] !== value)
    .map(([key]) => `Complete the ${key} criterion using the published exercise rubric.`)
  if (!['new-clone', 'new-lot', 'new-platform', 'new-fixative', 'decalcified'].includes(p.change))
    issues.push('Select the proposed assay change.')
  return { passed: issues.length === 0, issues }
}

/** Both channels are predictions from the shared core on adjacent section clones.
 * Combining them illustrates compartment overlap, not validated colocalization.
 * Fast Red uses authored optics with a shared relative development response;
 * enzyme-specific kinetics, bleed-through and spectral unmixing are not modeled. */
export function multiplexAppearance(
  a: IhcExperimentResult,
  b: IhcExperimentResult,
  fluorescence: boolean,
) {
  const appearance = structuredClone(a.appearance)
  const secondary = {
    signal: b.metrics.signal,
    background: b.metrics.background,
    localizations: b.appearance.localizations ?? [b.appearance.localization],
  }
  if (fluorescence) {
    appearance.dab = 0
    appearance.background = 0
    appearance.fluorescence = {
      signal: a.metrics.signal,
      background: a.metrics.background,
      counterstain: M['ish.counterstain'],
      targetType: 'protein',
      secondary,
    }
  } else appearance.secondaryChromogen = secondary
  return appearance
}
