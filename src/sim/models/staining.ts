import { clamp } from '../core/units'
import { PROCESS as P } from '../params/process'
import type { Twin } from '../specimen/types'

/** Exposure responds continuously and saturates; order controls reagent access to tissue. */
export function stainStep(
  t: Twin,
  reagent: string,
  minutes: number,
  freshness = 1,
  lot = 'TRAIN-LOT',
) {
  const s = t.staining
  if (t.frozen.prepared) s.dewax = 1
  s.history.push({ reagent, minutes, lot, freshness: clamp(freshness) })
  const exposure = Math.max(0, minutes) * clamp(freshness)
  const response = (scale: number) => 1 - Math.exp(-exposure / scale)
  if (reagent === 'dewax')
    s.dewax =
      1 - (1 - s.dewax) * (1 - response(P['he.dewax-time'] * P['he.preparation-time-weight']))
  if (reagent === 'hydrate')
    s.hydrated = s.dewax * response(P['he.hydrate-time'] * P['he.preparation-time-weight'])
  if (reagent === 'hematoxylin')
    s.hematoxylin = clamp(
      s.hematoxylin + response(P['he.hematoxylin-time']) * s.hydrated,
      0,
      P['he.maximum-od'],
    )
  if (reagent === 'differentiate') {
    s.differentiated += exposure
    s.hematoxylin *= Math.exp(
      -exposure / (P['he.differentiate-time'] * P['he.differentiation-scale']),
    )
  }
  if (reagent === 'blue')
    s.bluing = Math.max(s.bluing, response(P['he.blue-time'] * P['he.preparation-time-weight']))
  if (reagent === 'eosin')
    s.eosin = clamp(s.eosin + response(P['he.eosin-time']) * s.hydrated, 0, P['he.maximum-od'])
  if (reagent === 'dehydrate')
    s.dehydration = response(P['he.dehydrate-time'] * P['he.preparation-time-weight'])
  if (reagent === 'clear')
    s.clearing = response(P['he.clear-time'] * P['he.preparation-time-weight']) * s.dehydration
}
export function mount(t: Twin, medium: string, volume: number, angle: number, delay: number) {
  const s = t.block.sections.at(-1)
  const aqueousRequired = ['aec', 'oil-red-o'].includes(t.staining.special)
  t.mounting = {
    medium,
    volume,
    mounted: !!s?.pickedUp,
    bubbles: clamp(
      Math.abs(volume - P['mount.volume']) * P['mount.volume-bubble-weight'] +
        Math.abs(angle - P['mount.angle']) / P['mount.angle-scale'],
    ),
    haze: medium === 'resinous' ? clamp(1 - t.staining.clearing) : 0,
    retraction: clamp(Math.max(0, delay) / P['mount.retraction-time']),
  }
  if (aqueousRequired && medium !== 'aqueous') t.staining.specialIntensity = 0
}
