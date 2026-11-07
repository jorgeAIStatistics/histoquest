import { teachingParameter } from './registry'
const rows: [string, number, string, string][] = [
  ['ish.hybridization-time', 30, 'simulation minute', 'Synthetic hybridization exposure scale'],
  ['ish.temperature', 40, '°C', 'Synthetic target temperature, not an assay protocol'],
  ['ish.temperature-width', 20, '°C', 'Teaching temperature compatibility width'],
  ['ish.protease', 1, 'relative exposure', 'Synthetic access optimum'],
  ['ish.stringency', 1, 'relative exposure', 'Synthetic wash specificity optimum'],
  ['ish.signal', 2, 'relative signal', 'Synthetic signal scale'],
  ['ish.background', 0.3, 'relative background', 'Synthetic nonspecific probe signal'],
  ['ish.positive-min', 0.3, 'relative signal', 'Educational positive-control threshold'],
  ['ish.background-max', 0.2, 'relative background', 'Educational negative-control threshold'],
  [
    'ish.counterstain',
    0.65,
    'relative emission',
    'Authored blue nuclear counterstain strength; no photon calibration',
  ],
  [
    'integrity.rna-susceptibility',
    1.6,
    'exponent',
    'Authored generic RNA sensitivity applied to retained preanalytic loss; not a measured universal RNA/protein ranking',
  ],
  [
    'integrity.dna-susceptibility',
    1.2,
    'exponent',
    'Authored generic DNA sensitivity; no gene- or probe-specific calibration',
  ],
  [
    'integrity.protein-susceptibility',
    1,
    'exponent',
    'Retain the shared protein preservation factor; no antibody clone-specific rates',
  ],
]
export const MOLECULAR_PARAMETERS = rows.map(([id, value, unit, note]) =>
  teachingParameter(id, value, unit, 'Illustrative ISH response only', note),
)
export const MOLECULAR = Object.fromEntries(
  MOLECULAR_PARAMETERS.map((p) => [p.id, p.value as number]),
)
