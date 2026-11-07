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
) {
  const protocol = PROTOCOL_BY_ID[protocolId]
  const step = protocol?.steps.find((s) => s.id === stepId)
  if (!protocol || !step) return
  if (t.staining.protocol !== protocolId) {
    t.staining.protocol = protocolId
    t.staining.completedSteps = []
    t.staining.specialIntensity = 0
    t.staining.reactionRetention = 1
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
  if (['dewax', 'hydrate', 'dehydrate', 'clear'].includes(step.action))
    stainStep(t, step.action, minutes)
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
  const lipidPreserved = protocol.pathway !== 'frozen' || t.frozen.prepared
  const expectedPH =
    protocolId === 'alcian-blue-1' ? P['special.alcian-low-ph'] : P['special.alcian-standard-ph']
  const phResponse =
    protocolId.includes('alcian') && step.action === 'stain' && exposure > 0
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
export function specialControls(t: Twin, positive: boolean, negative: boolean) {
  const protocol = PROTOCOL_BY_ID[t.staining.protocol]
  const complete = protocol?.steps.every((s) => t.staining.completedSteps.includes(s.id)) ?? false
  t.staining.controls = {
    positive: positive ? t.staining.specialIntensity : null,
    negative: negative
      ? Math.max(0, 1 - t.staining.specialIntensity) / P['special.negative-background-scale']
      : null,
    valid:
      positive &&
      negative &&
      complete &&
      t.staining.specialIntensity >= P['special.control-minimum'],
  }
}
