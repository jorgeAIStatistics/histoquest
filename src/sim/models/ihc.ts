import { clamp } from '../core/units'
import { PROCESS as P } from '../params/process'
import type { Twin } from '../specimen/types'
import { targetIntegrity } from './targetIntegrity'

function developed(t: Twin): boolean {
  return !!t.ihc.detectionApplied || t.ihc.dab > 0 || !!t.ihc.ish
}
function requireFreshSection(t: Twin, action: string) {
  t.ihc.valid = false
  t.notes.push(
    `${action} was not reapplied: this section already has detection chemistry. Prepare an adjacent unstained section to change the assay; deposited chromogen and earlier background cannot be erased by new settings.`,
  )
}

/** Retrieval reverses some masking, not irreversible target loss. Excess exposure damages sections. */
export function retrieve(
  t: Twin,
  minutes: number,
  temperature: number,
  ph: number,
  method = 'hier',
) {
  if (developed(t)) {
    requireFreshSection(t, 'Retrieval')
    return
  }
  const thermal = Math.max(0, temperature) / P['ihc.retrieval-temperature']
  const targetOptimum =
    t.scenario.family === 'gut' ? P['ihc.gut-retrieval-ph'] : P['ihc.retrieval-ph']
  const compatibility = Math.exp(-(((ph - targetOptimum) / P['ihc.ph-width']) ** 2))
  const priorExposure = -Math.log(Math.max(Number.EPSILON, 1 - t.ihc.retrieval))
  const exposure =
    priorExposure +
    (Math.max(0, minutes) / P['ihc.retrieval-time']) *
      (method === 'pier' ? 1 : thermal) *
      compatibility
  t.ihc.retrieval = 1 - Math.exp(-exposure)
  const priorDamage = t.ihc.damage
  t.ihc.damage = Math.max(
    t.ihc.damage,
    clamp(Math.max(0, exposure - P['ihc.overretrieval']) / P['ihc.retrieval-damage-scale']),
  )
  const s = t.block.sections.at(-1)
  if (s && t.ihc.damage > priorDamage)
    s.adhesion *= (1 - t.ihc.damage) / Math.max(Number.EPSILON, 1 - priorDamage)
  t.ihc.valid = false
}
export function primary(
  t: Twin,
  dilution: number,
  minutes: number,
  blocked: boolean,
  humid: boolean,
  wash: boolean,
  age: number,
) {
  if (developed(t)) {
    requireFreshSection(t, 'Primary antibody')
    return
  }
  const concentration = P['ihc.primary-dilution'] / Math.max(1, dilution)
  const binding = 1 - Math.exp((-concentration * Math.max(0, minutes)) / P['ihc.primary-minutes'])
  t.ihc.primary =
    binding *
    targetIntegrity(t, 'protein') *
    (t.frozen.prepared ? 1 : t.staining.dewax * t.staining.hydrated) *
    (1 - t.ihc.damage) *
    (1 - t.ihc.masking * (1 - t.ihc.retrieval)) *
    Math.exp(-Math.max(0, age) / P['ihc.section-age-scale'])
  t.ihc.persistentBackground = Math.max(
    t.ihc.persistentBackground ?? 0,
    clamp(
      (blocked ? 0 : P['ihc.unblocked-background']) +
        Math.max(0, concentration - 1) / P['ihc.concentration-background-scale'] +
        (humid ? 0 : P['ihc.dry-background']),
    ),
  )
  // Washing can remove the modeled unbound-reagent component before development;
  // later blocking/humidity declarations cannot undo earlier binding or drying.
  t.ihc.background = clamp(t.ihc.persistentBackground + (wash ? 0 : P['ihc.unwashed-background']))
  t.ihc.edge = Math.max(t.ihc.edge, humid ? 0 : P['ihc.dry-edge'])
  t.ihc.ish = undefined
  t.ihc.valid = false
}
export function detect(t: Twin, minutes: number, chromogenMinutes: number, compatible: boolean) {
  if (developed(t)) {
    requireFreshSection(t, 'Detection')
    return
  }
  t.ihc.detectionApplied = true
  t.ihc.detection = compatible ? 1 - Math.exp(-Math.max(0, minutes) / P['ihc.detect-minutes']) : 0
  const bound =
    (t.ihc.primary * t.ihc.detection * Math.max(0, chromogenMinutes)) / P['ihc.chromogen-minutes']
  t.ihc.dab = P['ihc.od-saturation'] * (1 - Math.exp(-bound))
  t.ihc.background = clamp(
    t.ihc.background +
      Math.max(0, chromogenMinutes / P['ihc.chromogen-minutes'] - 1) /
        P['ihc.chromogen-background-scale'],
  )
  t.ihc.valid = false
}
export function evaluateControls(
  t: Twin,
  includePositive: boolean,
  includeLow: boolean,
  includeNegative: boolean,
  faultCorrected: boolean,
) {
  const reagentFault = t.scenario.faults.includes('control-failure') && !faultCorrected
  t.ihc.positive = includePositive ? (reagentFault ? 0 : t.ihc.dab) : null
  t.ihc.lowPositive = includeLow
    ? reagentFault
      ? 0
      : t.ihc.dab * P['ihc.low-positive-expression']
    : null
  t.ihc.negative = includeNegative ? t.ihc.background : null
  t.ihc.internal = t.ihc.dab * t.ihc.preservation
  t.ihc.valid =
    t.ihc.positive !== null &&
    t.ihc.positive >= P['ihc.positive-min'] &&
    t.ihc.lowPositive !== null &&
    t.ihc.lowPositive >= P['ihc.low-positive-min'] &&
    t.ihc.negative !== null &&
    t.ihc.negative <= P['ihc.background-max']
}
