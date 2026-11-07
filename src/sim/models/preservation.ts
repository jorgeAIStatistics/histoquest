import { clamp, average } from '../core/units'
import { UPSTREAM as U } from '../params/upstream'
import { PROCESS as P } from '../params/process'
import { parameterValue } from '../params/registry'
import type { Twin } from '../specimen/types'

/** Diffusion-like access and a separate reaction lag. The coefficient is illustrative. */
export function fix(
  t: Twin,
  hours: number,
  temperature: number,
  ratio: number,
  fixative: string,
  ischemia: number,
) {
  t.fixation.hours += Math.max(0, hours)
  Object.assign(t.fixation, {
    temperature,
    ratio,
    fixative,
    ischemia: Math.max(t.fixation.ischemia, Math.max(0, ischemia)),
  })
  // Transport medium does not chemically fix tissue. Integrate each exposure's
  // conditions so changing temperature or medium cannot rewrite the past.
  t.fixation.history = [
    ...(t.fixation.history ?? []),
    { fixative, hours: Math.max(0, hours), temperature, ratio },
  ]
  const reactive = [
    'nbf',
    'zinc-formalin',
    'glutaraldehyde',
    'acid-formalin',
    'bouin',
    'alcohol',
    'carnoy',
    'acetone',
  ].includes(fixative)
  const aldehyde = ['nbf', 'zinc-formalin', 'glutaraldehyde', 'acid-formalin', 'bouin'].includes(
    fixative,
  )
  const exposure =
    Math.max(0, hours) *
    clamp(ratio / P['fixation.ratio']) *
    Math.exp(
      (U['upstream.temperature-dose-power'] * (temperature - P['fixation.temperature'])) /
        P['fixation.temperature-scale'],
    )
  t.fixation.effectiveDose = (t.fixation.effectiveDose ?? 0) + (reactive ? exposure : 0)
  t.fixation.aldehydeHours = (t.fixation.aldehydeHours ?? 0) + (aldehyde ? Math.max(0, hours) : 0)
  t.fixation.aldehydeDose = (t.fixation.aldehydeDose ?? 0) + (aldehyde ? exposure : 0)
  const coefficient = parameterValue('fixation.penetration-coefficient')
  for (const region of t.regions) {
    const distance = (region.depth * t.gross.thickness) / 2
    const arrival = coefficient > 0 ? (distance / coefficient) ** 2 : Infinity
    region.access = Math.max(
      region.access,
      clamp(
        (coefficient * Math.sqrt(t.fixation.effectiveDose)) / Math.max(distance, Number.EPSILON),
      ),
    )
    const mature =
      1 -
      Math.exp(
        -Math.max(0, t.fixation.effectiveDose - arrival) / parameterValue('fixation.reaction-time'),
      )
    region.fixed = Math.max(region.fixed, mature)
  }
  t.fixation.crosslink = Math.max(
    t.fixation.crosslink,
    average(
      t.regions.map((region) => {
        const distance = (region.depth * t.gross.thickness) / 2
        const arrival = (distance / coefficient) ** 2
        return (
          1 -
          Math.exp(
            -Math.max(0, (t.fixation.aldehydeDose ?? 0) - arrival) /
              parameterValue('fixation.reaction-time'),
          )
        )
      }),
    ),
  )
  t.fixation.pigment = Math.max(
    t.fixation.pigment,
    fixative === 'acid-formalin' ? clamp(t.fixation.hours / P['fixation.overexposure']) : 0,
  )
  updateIntegrity(t)
}

/** Mineral removal and target preservation trade off; endpoint is a separate learner action. */
export function decalcify(
  t: Twin,
  agent: string,
  hours: number,
  endpoint: string,
  temperature = P['fixation.temperature'],
  agitation = false,
) {
  t.decal.agent = agent
  t.decal.hours += Math.max(0, hours)
  t.decal.endpoint = endpoint
  t.decal.temperature = temperature
  t.decal.agitation = agitation
  const rate =
    agent === 'edta'
      ? P['decalc.chelator-rate']
      : agent === 'weak-acid'
        ? P['decalc.weak-rate']
        : agent === 'strong-acid'
          ? P['decalc.strong-rate']
          : 0
  for (const region of t.regions)
    region.mineral *= Math.exp(
      (-rate *
        Math.max(0, hours) *
        Math.exp((temperature - P['fixation.temperature']) / P['fixation.temperature-scale']) *
        (agitation ? U['upstream.agitation-gain'] : 1)) /
        (1 + region.depth * t.gross.thickness),
    )
  if (agent === 'strong-acid')
    t.decal.damage = clamp(t.decal.damage + Math.max(0, hours) * P['decalc.acid-damage'])
  if (agent === 'weak-acid')
    t.decal.damage = clamp(
      t.decal.damage +
        Math.max(0, hours) * P['decalc.acid-damage'] * P['decalc.weak-damage-weight'],
    )
  t.decal.result =
    endpoint === 'none'
      ? 'Not assessed'
      : average(t.regions.map((r) => r.mineral)) > P['decalc.endpoint']
        ? 'Residual mineral in the teaching field'
        : 'Teaching endpoint reached; confirm against the laboratory method'
  if (endpoint === 'physical probing')
    t.decal.damage = clamp(t.decal.damage + U['upstream.probe-damage'])
  updateIntegrity(t)
}

export function updateIntegrity(t: Twin) {
  const incompatible =
    ['bouin', 'strong-acid'].includes(t.fixation.fixative) && t.scenario.request === 'molecular'
  t.ihc.preservation = Math.min(
    t.ihc.preservation,
    clamp(
      Math.exp(-t.fixation.ischemia / P['fixation.ischemia-scale']) *
        (1 - t.decal.damage) *
        (1 - t.processing.heatDamage) *
        (incompatible ? 0 : 1),
    ),
  )
  t.ihc.masking = clamp(
    t.fixation.crosslink * P['fixation.crosslink-masking-weight'] +
      Math.max(0, (t.fixation.aldehydeHours ?? 0) - P['fixation.overexposure']) /
        P['fixation.masking-scale'],
  )
}
