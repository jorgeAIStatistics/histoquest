import { teachingParameter } from './registry'
const rows: [string, number, string, string][] = [
  ['mechanics.mold-span', 18, 'mm', 'Authored mold footprint'],
  ['mechanics.minimum-width', 2, 'mm', 'Minimum geometric display width'],
  ['mechanics.hydration-benefit', 0.6, 'fraction', 'Brittleness moderation by surface hydration'],
  ['mechanics.static-scale', 35, '% humidity', 'Synthetic low-humidity response scale'],
  ['mechanics.consistency-weight', 0.5, 'fraction', 'Thickness variation from irregular cutting'],
  ['mechanics.clamp-variation', 0.5, 'fraction', 'Thickness variation from loose clamping'],
  ['mechanics.curl-weight', 0.4, 'fraction', 'Static/temperature ribbon-curl sensitivity'],
  ['mechanics.excess-hydration', 0.8, 'fraction', 'Illustrative onset of over-soaking injury'],
  [
    'mechanics.fat-frozen-temperature',
    -28,
    '°C',
    'Relative teaching condition for fatty frozen tissue; not a clinical setting',
  ],
  [
    'mechanics.neural-frozen-temperature',
    -18,
    '°C',
    'Relative teaching condition for brain-like tissue; not a clinical setting',
  ],
  [
    'mechanics.cold-margin',
    12,
    '°C',
    'Cold brittleness onset below a synthetic paraffin condition',
  ],
  ['mechanics.minimum-thickness', 0.1, 'µm', 'Reject a physically empty section'],
]
export const MECHANICS_PARAMETERS = rows.map(([id, value, unit, note]) =>
  teachingParameter(
    id,
    value,
    unit,
    'Qualitative instrument and geometry model',
    `${note}. Uncalibrated teaching assumption.`,
  ),
)
export const MECHANICS = Object.fromEntries(
  MECHANICS_PARAMETERS.map((p) => [p.id, p.value as number]),
)
