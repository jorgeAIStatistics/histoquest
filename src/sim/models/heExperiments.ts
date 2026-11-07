import { referenceTwin } from '../core/reference'
import { createStainingState } from '../specimen/initial'
import type { Twin } from '../specimen/types'
import { stainStep } from './staining'
export const HE_REAGENTS = [
  'dewax',
  'hydrate',
  'hematoxylin',
  'differentiate',
  'blue',
  'eosin',
  'dehydrate',
  'clear',
] as const
/** A separate, known-prepared synthetic control receives the exact recorded
 * reagent sequence, lot and activity. It does not inherit the case's fixation
 * injury and is not a matched real micrograph. Old logs lack activity metadata
 * and use their original nominal activity assumption. */
export function heControl(twin: Twin): Twin {
  const control = referenceTwin({
    ...twin.scenario,
    seed: `${twin.scenario.seed}-HE-CONTROL`,
    faults: [],
    discrepancy: 'none',
    request: 'routine',
  })
  control.staining = createStainingState()
  control.mounting = {
    medium: 'none',
    volume: 0,
    bubbles: 0,
    haze: 0,
    retraction: 0,
    mounted: false,
  }
  for (const step of twin.staining.history) {
    if ((HE_REAGENTS as readonly string[]).includes(step.reagent))
      stainStep(control, step.reagent, step.minutes, step.freshness ?? 1, step.lot)
  }
  return control
}
