import { ARCHETYPES } from '../../content/lab/archetypes'
import { ARCHETYPE_PARAMETERS } from '../params/archetypes'
import { choose, randomStream } from './random'
import type { Scenario, TissueFamily } from '../specimen/types'

const dimensions = Object.fromEntries(ARCHETYPE_PARAMETERS.map(p => [p.id, p.value as number]))
const kinds = ARCHETYPES.map(a => ({ id: a.id, title: a.label, family: a.family as TissueFamily, dimensions: a.dimensionsParam.map(id => dimensions[id]) as [number, number, number], fragments: a.shape === 'fragments' ? 4 : a.shape === 'ellipse' ? 3 : 1 }))
export const BASE_ARCHETYPES = kinds
const faults = ['dob-mismatch', 'missing-site', 'missing-fixation-time', 'exhausted-alcohol', 'loose-clamp', 'nick', 'control-failure', 'bath-carryover']
/** Reproducible synthetic scenarios; size values are exercise geometry, not clinical norms. */
export function createScenario(seed: string, archetype = 'skin-ellipse', difficulty: 1 | 2 | 3 = 1): Scenario {
  const r = randomStream(seed, 'scenario')
  const kind = kinds.find(k => k.id === archetype) ?? kinds[0]
  const selected = [...new Set(Array.from({ length: difficulty }, () => choose(faults, r)))]
  return {
    seed, archetype: kind.id, family: kind.family, title: kind.title, difficulty,
    accession: `TRAIN-${String(Math.floor(r() * 90000 + 10000))}`, identifiers: ['Synthetic learner case', '2000-01-01'],
    dimensions: [...kind.dimensions], fragments: kind.fragments,
    discrepancy: selected.find(f => ['dob-mismatch', 'missing-site', 'missing-fixation-time'].includes(f)) ?? 'none',
    request: choose(['routine', 'levels', 'ihc', 'special'] as const, r), faults: selected,
    target: kind.family === 'skin' ? 'SOX10' : kind.family === 'gut' ? 'pan-CK' : 'Ki-67',
    targetLocalization: kind.family === 'gut' ? 'cytoplasmic' : 'nuclear', targetPresent: r() > .25, tat: 120,
  }
}
export const CURATED_SCENARIOS = [
  { ...createScenario('HQ-SKIN-01', 'skin-ellipse'), discrepancy: 'dob-mismatch', request: 'routine' as const, faults: ['dob-mismatch'] },
  { ...createScenario('HQ-GI-01', 'colon-biopsy'), discrepancy: 'none', request: 'levels' as const, faults: [] },
  { ...createScenario('HQ-BONE-01', 'bone-core'), discrepancy: 'none', request: 'ihc' as const, faults: [] },
]
