import { teachingParameter } from './registry'
const rows: [string, number, string, string][] = [
  ['workbench.thickness', 2, 'mm', 'Reference sampling thickness'],
  ['workbench.rushed-fixation', 1, 'hour', 'Deliberately abbreviated synthetic fixation'],
  ['workbench.excess-heat', 80, '°C', 'Deliberately excessive teaching exposure'],
  [
    'workbench.heat-injury-proxy',
    6,
    'hour-equivalent',
    'Irreversible preservation penalty for an inappropriate heated shortcut; not a physiological calibration',
  ],
  ['workbench.chelation', 120, 'hour', 'Synthetic chelation response demonstration'],
  ['workbench.acid', 18, 'hour', 'Synthetic prolonged acid-damage demonstration'],
  [
    'workbench.rapid-processing',
    10,
    'minute',
    'Deliberately abbreviated exchange for mismatched large tissue',
  ],
  ['workbench.piece-spacing', 2, 'mm', 'Authored placement spacing'],
  ['workbench.unaligned-depth', 0.8, 'mm', 'Mismatched sampling depth'],
  ['workbench.wrong-plane', 50, 'degree', 'Mismatch to the requested face'],
  ['workbench.enface-tilt', 40, 'degree', 'Plane relation for the sampling error'],
  ['workbench.warm-block', 32, '°C', 'Synthetic warm-block compression demonstration'],
  ['workbench.nicked-blade', 0.3, 'relative sharpness', 'Synthetic defective blade'],
  [
    'workbench.gut-retrieval-ph',
    9,
    'pH',
    'Synthetic target retrieval preference; not a universal gut-tissue protocol',
  ],
  [
    'workbench.alcian-ph',
    2.5,
    'pH',
    'Named Alcian blue method condition; timing remains illustrative',
  ],
  ['workbench.mount-angle', 30, 'degree', 'Synthetic coverslip placement reference'],
  [
    'workbench.quality-min',
    60,
    '%',
    'Learning quality threshold combined with independent process and safety checks',
  ],
]
export const WORKBENCH_PARAMETERS = rows.map(([id, value, unit, note]) =>
  teachingParameter(
    id,
    value,
    unit,
    'Curated Workbench bridge',
    `${note}. Educational assumption, not an approved bench setting.`,
  ),
)
export const WORKBENCH = Object.fromEntries(
  WORKBENCH_PARAMETERS.map((p) => [p.id, p.value as number]),
)
