import { PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { PROTOCOL_PARAMETERS } from '../params/protocols'
import { PROCESS as P } from '../params/process'
import { clamp } from '../core/units'
import type { Twin } from '../specimen/types'
import { mount, stainStep } from './staining'

const durations = Object.fromEntries(PROTOCOL_PARAMETERS.map((p) => [p.id, p.value as number]))
/** Reaction graph: inaccessible steps do not produce their target, and excessive exposure can obscure contrast. */
export function specialStep(
  t: Twin,
  protocolId: string,
  stepId: string,
  minutes: number,
  ph: number,
  activity = 1,
) {
  const protocol = PROTOCOL_BY_ID[protocolId]
  const step = protocol?.steps.find((s) => s.id === stepId)
  if (!protocol || !step) return
  if (
    !t.staining.protocol &&
    (t.staining.hematoxylin > 0 || t.staining.eosin > 0 || t.ihc.dab > 0 || t.ihc.ish)
  ) {
    t.notes.push(
      'This teaching graph requires an unstained adjacent section; a validated destain/restain procedure is not modeled.',
    )
    return
  }
  if (t.staining.protocol && t.staining.protocol !== protocolId) {
    t.notes.push(
      'Prepare an adjacent unstained section before changing the special-stain protocol. Prior chemistry is not erased.',
    )
    return
  }
  if (t.staining.protocol !== protocolId) {
    t.staining.protocol = protocolId
    t.staining.completedSteps = []
    t.staining.specialIntensity = 0
    t.staining.reactionRetention = 1
    t.staining.specialGlycogen = 1
    t.staining.specialBackground = 0
    t.staining.controls = { positive: null, negative: null, valid: false }
  }
  t.staining.special = protocolId
  const exposure = Math.max(0, minutes) / durations[step.durationParam]
  const accessible = step.dependencies.every((id) => t.staining.completedSteps.includes(id))
  t.staining.history.push({ reagent: `${protocolId}:${stepId}`, minutes, lot: 'TRAIN-SPECIAL' })
  if (!accessible) {
    t.notes.push(
      `${step.label}: its prerequisite reactions were not completed; no target reaction is credited.`,
    )
    return
  }
  if (['dewax', 'hydrate', 'dehydrate', 'clear', 'blue'].includes(step.action))
    stainStep(t, step.action, minutes)
  if (/hematoxylin/i.test(step.reagent)) stainStep(t, 'hematoxylin', minutes)
  if (protocolId === 'pas-d' && step.action === 'digest')
    t.staining.specialGlycogen =
      (t.staining.specialGlycogen ?? 1) * Math.exp(-exposure * clamp(activity))
  if (/gms|reticulin|steiner/.test(protocolId) && /silver/i.test(step.reagent))
    t.staining.specialBackground = clamp(
      (t.staining.specialBackground ?? 0) +
        Math.max(0, exposure - P['special.overexposure-onset']) / P['special.overexposure-scale'],
    )
  if (step.action === 'mount') mount(t, protocol.mounting, P['mount.volume'], P['mount.angle'], 0)
  if (exposure >= P['special.minimum-exposure'] && !t.staining.completedSteps.includes(stepId))
    t.staining.completedSteps.push(stepId)
  const chemistry = protocol.steps.filter((s) =>
    ['stain', 'oxidize', 'reduce', 'tone', 'digest', 'sensitize'].includes(s.action),
  )
  const chemistryCompletion = chemistry.length
    ? chemistry.filter((s) => t.staining.completedSteps.includes(s.id)).length / chemistry.length
    : 0
  const accessibleTissue = t.frozen.prepared ? 1 : t.staining.dewax
  const lipidPreserved =
    protocol.pathway !== 'frozen' ||
    (t.frozen.prepared &&
      !t.processing.history.some((step) =>
        ['alcohol', 'clearant', 'paraffin'].includes(step.reagent),
      ))
  const expectedPH =
    protocolId === 'alcian-blue-1' ? P['special.alcian-low-ph'] : P['special.alcian-standard-ph']
  const phResponse =
    protocolId.includes('alcian') && /alcian/i.test(step.reagent) && exposure > 0
      ? Math.exp(-(((ph - expectedPH) / P['special.ph-response-width']) ** 2))
      : 1
  const overshoot = ['stain', 'differentiate', 'oxidize'].includes(step.action)
    ? Math.exp(
        -Math.max(0, exposure - P['special.overexposure-onset']) / P['special.overexposure-scale'],
      )
    : 1
  t.staining.reactionRetention *= phResponse * overshoot
  t.staining.specialIntensity = clamp(
    chemistryCompletion * accessibleTissue * Number(lipidPreserved) * t.staining.reactionRetention,
  )
  t.staining.controls.valid = false
}
export function specialControls(
  t: Twin,
  positive: boolean,
  negative: boolean,
  digestionVerified = false,
) {
  const protocol = PROTOCOL_BY_ID[t.staining.protocol]
  const complete = protocol?.steps.every((s) => t.staining.completedSteps.includes(s.id)) ?? false
  t.staining.controls = {
    positive: positive ? t.staining.specialIntensity : null,
    negative: negative ? (t.staining.specialBackground ?? 0) : null,
    valid:
      positive &&
      negative &&
      complete &&
      (t.staining.protocol !== 'pas-d' || digestionVerified) &&
      t.staining.specialIntensity >= P['special.control-minimum'] &&
      (t.staining.specialBackground ?? 0) <= P['ihc.background-max'],
  }
}
