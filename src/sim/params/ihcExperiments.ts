import { teachingParameter } from './registry'
const rows: [string, number, string, string][] = [
  ['academy.maximum-ph', 14, 'pH', 'Conventional aqueous pH input bound for this teaching editor.'],
  [
    'academy.retrieval-short',
    8,
    'simulation minute',
    'Short retrieval comparison, not a clinical protocol.',
  ],
  [
    'academy.retrieval-middle',
    20,
    'simulation minute',
    'Middle retrieval comparison, not a clinical protocol.',
  ],
  [
    'academy.retrieval-long',
    50,
    'simulation minute',
    'Long retrieval comparison intended to expose model damage.',
  ],
  [
    'academy.buffer-acid',
    6,
    'pH',
    'Synthetic acidic retrieval condition; marker-specific clinical methods vary.',
  ],
  [
    'academy.buffer-alkaline',
    9,
    'pH',
    'Synthetic alkaline retrieval condition; not an assay recommendation.',
  ],
  [
    'academy.pier-temperature',
    37,
    '°C',
    'Illustrative proteolytic condition; enzyme-specific calibration is absent.',
  ],
  ['academy.dilution-strong', 25, 'denominator', 'Concentrated primary comparison.'],
  ['academy.dilution-middle', 100, 'denominator', 'Middle primary dilution comparison.'],
  ['academy.dilution-weak', 400, 'denominator', 'Dilute primary comparison.'],
  ['academy.detect-short', 8, 'simulation minute', 'Short detection exposure comparison.'],
  ['academy.detect-middle', 20, 'simulation minute', 'Middle detection exposure comparison.'],
  ['academy.detect-long', 45, 'simulation minute', 'Long detection exposure comparison.'],
  [
    'academy.noise-floor',
    0.08,
    'relative OD',
    'Illustrative denominator floor for the teaching signal/background utility. Not an analytical SNR measurement.',
  ],
  [
    'academy.tissue-minimum',
    0.65,
    'fraction',
    'Exercise tissue-retention criterion, not a clinical acceptance threshold.',
  ],
  [
    'academy.dispense',
    150,
    'µL per slide',
    'Synthetic coverage requirement; does not specify a real slide or instrument.',
  ],
  ['academy.dead-volume', 100, 'µL', 'Fictitious automated reagent-container dead volume.'],
  ['academy.loaded-volume', 1000, 'µL', 'Fictitious loaded reagent amount.'],
  ['academy.slide-count', 4, 'slides', 'Small synthetic training batch.'],
  ['academy.fixation-short', 1, 'hour', 'Short preservation comparison; not a clinical minimum.'],
  [
    'academy.fixation-middle',
    12,
    'hour',
    'Illustrative preservation comparison; not a predictive-marker requirement.',
  ],
  ['academy.fixation-long', 96, 'hour', 'Extended exposure to show masking in the toy model.'],
  [
    'academy.ischemia-delayed',
    8,
    'hour',
    'Synthetic delay to show target loss; not a guideline threshold.',
  ],
  [
    'academy.section-old',
    120,
    'day',
    'Synthetic aged-section comparison; real stability varies by assay and storage.',
  ],
  [
    'academy.decalc-duration',
    6,
    'hour',
    'Same-time acid/chelator comparison, not a mineral-removal endpoint.',
  ],
  [
    'academy.max-duration',
    240,
    'simulation minute',
    'UI input bound to keep experimental values finite and reviewable.',
  ],
  ['academy.max-dilution', 10000, 'denominator', 'UI input bound; not a recommended titer.'],
  [
    'academy.maximum-temperature',
    120,
    '°C',
    'UI teaching bound; not an equipment safety specification.',
  ],
  ['academy.maximum-section-age', 1000, 'day', 'Bounded illustrative section-aging input.'],
]
export const IHC_EXPERIMENT_PARAMETERS = rows.map(([id, value, unit, note]) =>
  teachingParameter(id, value, unit, 'IHC academy synthetic experiment', note),
)
export const IHC_EXPERIMENT = Object.fromEntries(
  IHC_EXPERIMENT_PARAMETERS.map((p) => [p.id, p.value as number]),
)
