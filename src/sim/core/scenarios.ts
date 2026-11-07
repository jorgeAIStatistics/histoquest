import { ARCHETYPES } from '../../content/lab/archetypes'
import { ARCHETYPE_PARAMETERS } from '../params/archetypes'
import { UPSTREAM as U } from '../params/upstream'
import { choose, randomStream } from './random'
import type { Scenario, TissueFamily } from '../specimen/types'

const dimensions = Object.fromEntries(ARCHETYPE_PARAMETERS.map((p) => [p.id, p.value as number]))
const kinds = ARCHETYPES.map((a) => ({
  id: a.id,
  title: a.label,
  family: a.family as TissueFamily,
  dimensions: a.dimensionsParam.map((id) => dimensions[id]) as [number, number, number],
  fragments: a.shape === 'fragments' ? 4 : a.shape === 'ellipse' ? 3 : 1,
}))
export const BASE_ARCHETYPES = kinds
const faults = [
  'dob-mismatch',
  'missing-site',
  'missing-fixation-time',
  'exhausted-alcohol',
  'loose-clamp',
  'nick',
  'control-failure',
  'bath-carryover',
]
/** Reproducible synthetic scenarios; size values are exercise geometry, not clinical norms. */
export function createScenario(
  seed: string,
  archetype = 'skin-ellipse',
  difficulty: 1 | 2 | 3 = 1,
  version: 1 | 2 = 1,
): Scenario {
  if (version === 2) return createScenarioV2(seed, archetype, difficulty)
  const r = randomStream(seed, 'scenario')
  const kind = kinds.find((k) => k.id === archetype) ?? kinds[0]
  const selected = [...new Set(Array.from({ length: difficulty }, () => choose(faults, r)))]
  return {
    seed,
    archetype: kind.id,
    family: kind.family,
    title: kind.title,
    difficulty,
    accession: `TRAIN-${String(Math.floor(r() * 90000 + 10000))}`,
    identifiers: ['Synthetic learner case', '2000-01-01'],
    dimensions: [...kind.dimensions],
    fragments: kind.fragments,
    discrepancy:
      selected.find((f) => ['dob-mismatch', 'missing-site', 'missing-fixation-time'].includes(f)) ??
      'none',
    request: choose(['routine', 'levels', 'ihc', 'special'] as const, r),
    faults: selected,
    target: kind.family === 'skin' ? 'SOX10' : kind.family === 'gut' ? 'pan-CK' : 'Ki-67',
    targetLocalization: kind.family === 'gut' ? 'cytoplasmic' : 'nuclear',
    targetPresent: r() > 0.25,
    tat: 120,
  }
}
export const CURATED_SCENARIOS = [
  {
    ...createScenario('HQ-SKIN-01', 'skin-ellipse'),
    discrepancy: 'dob-mismatch',
    request: 'routine' as const,
    faults: ['dob-mismatch'],
  },
  {
    ...createScenario('HQ-GI-01', 'colon-biopsy'),
    discrepancy: 'none',
    request: 'levels' as const,
    faults: [],
  },
  {
    ...createScenario('HQ-BONE-01', 'bone-core'),
    discrepancy: 'none',
    request: 'ihc' as const,
    faults: [],
  },
]

/** Version 2 draws without replacement from relevant faults. Version 1 remains
 * available for every previously stored run and curated seed. */
export const RECEIPT_DISCREPANCIES = [
  'dob-mismatch',
  'missing-site',
  'unlabeled-container',
  'container-count-mismatch',
  'wrong-fixative',
  'leaking-container',
  'fixative-missing',
  'missing-fixation-time',
] as const
function createScenarioV2(seed: string, archetype: string, difficulty: 1 | 2 | 3): Scenario {
  const kind = kinds.find((k) => k.id === archetype) ?? kinds[0]
  const requestRandom = randomStream(seed, 'request-v2')
  const request: Scenario['request'] =
    archetype === 'frozen-consult' || archetype === 'muscle-biopsy'
      ? 'frozen'
      : choose(['routine', 'levels', 'ihc', 'special', 'molecular'] as const, requestRandom)
  const r = randomStream(seed, 'faults-v2')
  // A receipt discrepancy is one candidate category; three-fault cases do not
  // collapse into three versions of the same unresolved label problem.
  const candidates = [
    choose(RECEIPT_DISCREPANCIES, r),
    'loose-clamp',
    'nick',
    'bath-carryover',
    ...(request === 'frozen' ? [] : ['exhausted-alcohol']),
    ...(request === 'ihc' ? ['control-failure'] : []),
  ]
  const selected: string[] = []
  while (selected.length < difficulty)
    selected.push(candidates.splice(Math.floor(r() * candidates.length), 1)[0])
  const identity = randomStream(seed, 'identity-v2')
  return {
    seed,
    archetype: kind.id,
    family: kind.family,
    title: kind.title,
    difficulty,
    generatorVersion: 2,
    accession: `TRAIN-${String(Math.floor(identity() * 90000 + 10000))}`,
    identifiers: ['Synthetic learner case', '2000-01-01'],
    dimensions: [...kind.dimensions],
    fragments: kind.fragments,
    discrepancy:
      selected.find((f) => (RECEIPT_DISCREPANCIES as readonly string[]).includes(f)) ?? 'none',
    request,
    faults: selected,
    target: kind.family === 'skin' ? 'SOX10' : kind.family === 'gut' ? 'pan-CK' : 'Ki-67',
    targetLocalization: kind.family === 'gut' ? 'cytoplasmic' : 'nuclear',
    targetPresent: requestRandom() > 0.25,
    tat: request === 'frozen' ? U['upstream.frozen-tat'] : U['upstream.default-tat'],
    instruction:
      request === 'molecular'
        ? 'Prepare one identified unstained section for an assay-specific molecular preparation exercise. Document the receiving laboratory requirements and limitations; the simulator does not establish assay suitability.'
        : request === 'levels'
          ? 'Prepare three identified levels, recording the depth interval and material consumed. Use the stated practical rubric when one is assigned.'
          : request === 'frozen'
            ? 'Rehearse an urgent frozen preparation and technical handoff. The displayed turnaround target is an authored practice condition.'
            : 'Prepare an identified representative section and evaluate the controls required by the requested method.',
  }
}
