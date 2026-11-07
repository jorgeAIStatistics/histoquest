import { average, clamp } from '../core/units'
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
) {
  t.processing.history.push({ reagent, minutes, temperature, concentration, exhaustion })
  const geometry = Math.max(1, t.gross.thickness ** 2 / P['processing.geometry-reference'])
  const strength =
    clamp(concentration / 100) * (1 - clamp(exhaustion)) * (1 - clamp(t.gross.crowding))
  const rate =
    (P['processing.exchange-rate'] *
      Math.max(0, minutes) *
      strength *
      (vacuum ? P['processing.vacuum-gain'] : 1)) /
    geometry
  for (const region of t.regions) {
    const change = 1 - Math.exp(-rate / (1 + region.depth))
    if (reagent === 'alcohol') {
      const exchange = region.water * change
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
