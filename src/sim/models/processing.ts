import { average, clamp } from '../core/units'
import { UPSTREAM as U } from '../params/upstream'
import { PROCESS as P } from '../params/process'
import type { Twin } from '../specimen/types'
import { updateIntegrity } from './preservation'

/** Compartments exchange only with compatible reagents; thick and crowded pieces exchange more slowly. */
export function processStep(
  t: Twin,
  reagent: string,
  minutes: number,
  temperature: number,
  concentration: number,
  exhaustion: number,
  vacuum: boolean,
  agitation = false,
) {
  exhaustion = t.processing.exhaustedAlcohol && reagent === 'alcohol' ? 1 : clamp(exhaustion)
  t.processing.history.push({
    reagent,
    minutes,
    temperature,
    concentration,
    exhaustion,
    vacuum,
    agitation,
  })
  const geometry = Math.max(1, t.gross.thickness ** 2 / P['processing.geometry-reference'])
  const strength =
    clamp(concentration / 100) * (1 - clamp(exhaustion)) * (1 - clamp(t.gross.crowding))
  const tissueRate =
    t.scenario.family === 'fat'
      ? U['upstream.fat-exchange']
      : t.scenario.family === 'neural'
        ? U['upstream.neural-exchange']
        : t.scenario.family === 'bone'
          ? U['upstream.bone-exchange']
          : 1
  const referenceTemperature =
    reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature']
  const temperatureRate = Math.exp(
    (temperature - referenceTemperature) / P['fixation.temperature-scale'],
  )
  const rate =
    (P['processing.exchange-rate'] *
      Math.max(0, minutes) *
      strength *
      tissueRate *
      temperatureRate *
      (agitation ? U['upstream.agitation-gain'] : 1) *
      (vacuum ? P['processing.vacuum-gain'] : 1)) /
    geometry
  for (const region of t.regions) {
    const change = 1 - Math.exp(-rate / (1 + region.depth))
    if (reagent === 'alcohol') {
      // Dilute alcohol approaches a water-containing equilibrium; time alone
      // cannot turn 70% alcohol into an anhydrous dehydrant.
      const exchange = Math.max(0, region.water - (1 - clamp(concentration / 100))) * change
      region.water -= exchange
      region.alcohol += exchange
    } else if (reagent === 'clearant') {
      const exchange = region.alcohol * change * (1 - region.water)
      region.alcohol -= exchange
      region.clearant += exchange
    } else if (reagent === 'paraffin' && temperature >= P['processing.wax-melting']) {
      const exchange = region.clearant * change * (1 - region.water)
      region.clearant -= exchange
      region.wax += exchange
    }
  }
  const excessiveHeat =
    Math.max(0, temperature - P['processing.heat-limit']) / P['drying.heat-scale']
  t.processing.heatDamage = clamp(
    t.processing.heatDamage +
      (excessiveHeat * Math.max(0, minutes)) / P['processing.overprocess-scale'],
  )
  const solventTime = t.processing.history
    .filter((h) => h.reagent !== 'paraffin')
    .reduce((a, h) => a + Math.max(0, h.minutes), 0)
  t.processing.brittleness = clamp(
    Math.max(0, solventTime - P['processing.overprocess-scale']) /
      P['processing.overprocess-scale'] +
      t.processing.heatDamage,
  )
  t.processing.hardness = clamp(
    average(t.regions.map((r) => r.wax)) +
      t.processing.brittleness * P['processing.brittleness-hardness-weight'],
  )
  updateIntegrity(t)
}
