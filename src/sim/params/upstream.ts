import { teachingParameter } from './registry'
const rows: [string, number, string, string][] = [
  [
    'upstream.temperature-dose-power',
    2,
    'exponent',
    'Converts the authored penetration-speed temperature factor to cumulative equivalent exposure',
  ],
  [
    'upstream.fat-exchange',
    0.7,
    'relative rate',
    'Synthetic fatty-tissue exchange factor; no measured clinical processing kinetics',
  ],
  [
    'upstream.neural-exchange',
    0.85,
    'relative rate',
    'Synthetic lipid-rich neural-tissue exchange factor',
  ],
  [
    'upstream.bone-exchange',
    0.8,
    'relative rate',
    'Synthetic dense/decalcified-core exchange factor',
  ],
  [
    'upstream.agitation-gain',
    1.1,
    'relative rate',
    'Illustrative improvement from reagent movement',
  ],
  [
    'upstream.probe-damage',
    0.08,
    'fraction',
    'Illustrative mechanical cost of invasive endpoint probing',
  ],
  [
    'upstream.default-tat',
    120,
    'minute',
    'Synthetic routine case target; not a clinical turnaround requirement',
  ],
  [
    'upstream.frozen-tat',
    20,
    'minute',
    'Synthetic rush task target; not a clinical turnaround requirement',
  ],
]
export const UPSTREAM_PARAMETERS = rows.map(([id, value, unit, note]) =>
  teachingParameter(
    id,
    value,
    unit,
    'Upstream preparation teaching model',
    `${note}. Requires qualified educational review.`,
  ),
)
export const UPSTREAM = Object.fromEntries(
  UPSTREAM_PARAMETERS.map((p) => [p.id, p.value as number]),
)
