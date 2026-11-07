import { PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { PROTOCOL_PARAMETERS } from '../params/protocols'
import { PROCESS as P } from '../params/process'
import { referenceTwin } from '../core/reference'
import { reduceEvent } from '../core/replay'
import { createScenario } from '../core/scenarios'
import { createTwin } from '../specimen/initial'
import { slideAppearance } from '../specimen/appearance'
import {
  createPhenotype,
  FIELD_HEIGHT_UM,
  FIELD_WIDTH_UM,
  samplePhenotype,
} from '../specimen/phenotype'
import type { TissueSample } from '../specimen/phenotype'
import type { Twin } from '../specimen/types'
import { adjacentSection } from './ihcExperiments'
import { specialStep, specialControls } from './special'

export type SpecialChallenge =
  'matched' | 'inactive-diastase' | 'omit-oxidation' | 'overdevelop' | 'wrong-ph'
const durations = Object.fromEntries(PROTOCOL_PARAMETERS.map((p) => [p.id, p.value as number]))

type ControlTarget =
  | 'carbohydrate'
  | 'digestion-pair'
  | 'mucin'
  | 'collagen'
  | 'reticulin'
  | 'amyloid'
  | 'organism'
  | 'iron-deposit'
  | 'melanin'
  | 'lipid'
  | 'myelin'
  | 'mineral'
interface SpecialControlSpec {
  archetype: string
  target: ControlTarget | null
  description: string
  unsupportedReason?: string
}
/** Explicit synthetic target assignments, not recommendations of clinical control blocks.
 * A reaction graph does not establish that the corresponding tissue compartment exists. */
export const SPECIAL_CONTROL_SPECS: Record<string, SpecialControlSpec> = {
  pas: {
    archetype: 'liver-core',
    target: 'carbohydrate',
    description: 'Authored hepatocyte carbohydrate and reticulin cues',
  },
  'pas-d': {
    archetype: 'liver-core',
    target: 'digestion-pair',
    description:
      'Authored glycogen component with retained reticulin reaction in the paired section',
  },
  'alcian-blue': {
    archetype: 'colon-biopsy',
    target: 'mucin',
    description: 'Authored mucin-bearing crypt compartment',
  },
  'alcian-blue-1': {
    archetype: 'colon-biopsy',
    target: 'mucin',
    description:
      'Authored mucin-bearing crypt compartment; mucin subtypes are not separately rendered',
  },
  mucicarmine: {
    archetype: 'colon-biopsy',
    target: 'mucin',
    description: 'Authored mucin-bearing crypt compartment',
  },
  'colloidal-iron': {
    archetype: 'colon-biopsy',
    target: 'mucin',
    description: 'Authored mucin-bearing crypt compartment',
  },
  masson: {
    archetype: 'skin-ellipse',
    target: 'collagen',
    description: 'Authored dermal collagen compartment',
  },
  reticulin: {
    archetype: 'liver-core',
    target: 'reticulin',
    description: 'Authored reticulin network around hepatic cords',
  },
  'congo-red': {
    archetype: 'skin-ellipse',
    target: 'amyloid',
    description: 'Authored amyloid-deposit cue, not normal skin or a diagnostic amyloid pattern',
  },
  gram: {
    archetype: 'colon-biopsy',
    target: 'organism',
    description: 'Authored organism cue; Gram classes are not distinguished',
  },
  'ziehl-neelsen': {
    archetype: 'colon-biopsy',
    target: 'organism',
    description: 'Authored organism cue; species and bacillary morphology are not modeled',
  },
  fite: {
    archetype: 'colon-biopsy',
    target: 'organism',
    description: 'Authored organism cue; species and bacillary morphology are not modeled',
  },
  gms: {
    archetype: 'colon-biopsy',
    target: 'organism',
    description: 'Authored organism cue; fungal morphology is not modeled',
  },
  steiner: {
    archetype: 'colon-biopsy',
    target: 'organism',
    description: 'Authored organism cue; species morphology is not modeled',
  },
  giemsa: {
    archetype: 'colon-biopsy',
    target: 'organism',
    description: 'Authored organism cue with cellular contrast',
  },
  'prussian-blue': {
    archetype: 'liver-core',
    target: 'iron-deposit',
    description:
      'Authored pigment deposit within the hepatocyte target compartment; not measured tissue iron',
  },
  'fontana-masson': {
    archetype: 'skin-ellipse',
    target: 'melanin',
    description: 'Authored follicular pigment compartment',
  },
  'melanin-bleach': {
    archetype: 'skin-ellipse',
    target: 'melanin',
    description: 'Authored follicular pigment loss compared with an unbleached field',
  },
  'oil-red-o': {
    archetype: 'fatty-tissue',
    target: 'lipid',
    description: 'Authored adipocyte lipid compartment preserved by a frozen pathway',
  },
  'luxol-fast-blue': {
    archetype: 'brain',
    target: 'myelin',
    description: 'Authored neural background as a myelin cue; individual sheaths are not resolved',
  },
  'von-kossa': {
    archetype: 'bone-core',
    target: 'mineral',
    description:
      'Authored mineral compartment without decalcification; not an elemental-calcium assay',
  },
  'alizarin-red': {
    archetype: 'bone-core',
    target: 'mineral',
    description: 'Authored mineral compartment without decalcification',
  },
  vvg: {
    archetype: 'skin-ellipse',
    target: null,
    description: 'Elastic-fiber comparator unavailable',
    unsupportedReason:
      'No elastic-fiber compartment is implemented. Generic connective-tissue coloring cannot validate a VVG positive control.',
  },
  'toluidine-blue': {
    archetype: 'skin-ellipse',
    target: null,
    description: 'Metachromatic granule comparator unavailable',
    unsupportedReason:
      'No mast-cell granule or metachromasia compartment is implemented. Nuclear coloring cannot validate this positive control.',
  },
  rhodanine: {
    archetype: 'liver-core',
    target: null,
    description: 'Copper-deposit comparator unavailable',
    unsupportedReason:
      'No copper-deposit compartment is implemented. Generic hepatocyte coloring cannot validate a rhodanine positive control.',
  },
}

function targetDensity(s: TissueSample, target: ControlTarget, t: Twin): number {
  switch (target) {
    case 'carbohydrate':
      return s.cytoplasm + s.reticulin + s.mucin
    case 'digestion-pair':
      return Math.min(s.cytoplasm, s.reticulin)
    case 'iron-deposit':
      return s.target * s.pigment
    case 'melanin':
      return s.pigment
    case 'lipid':
      return t.scenario.family === 'fat' ? s.tissue * (1 - s.membrane) : 0
    case 'myelin':
      return t.scenario.family === 'neural' ? s.tissue * (1 - s.target) : 0
    case 'mineral':
      return t.regions.some((r) => r.mineral > 0) ? s.mineral : 0
    default:
      return s[target]
  }
}

/** Presence check against the same procedural tissue sampled by microscopy.
 * The grid is a deterministic software inspection, not a clinical positivity cutoff. */
export function specialTargetEvidence(t: Twin, protocolId: string) {
  const spec = SPECIAL_CONTROL_SPECS[protocolId]
  if (!spec?.target)
    return {
      supported: false,
      targetAvailable: false,
      peakDensity: null,
      reason:
        spec?.unsupportedReason ??
        'No target-bearing synthetic comparator is defined for this protocol.',
    }
  const phenotype = createPhenotype(t.scenario.family, t.scenario.seed, t.scenario.archetype)
  let peakDensity = 0
  if (t.scenario.targetPresent) {
    // Pixel-independent inspection across the entire authored field (64 × 48 sites).
    for (let row = 0; row < 48; row++)
      for (let column = 0; column < 64; column++) {
        const sample = samplePhenotype(
          phenotype,
          ((column + 0.5) * FIELD_WIDTH_UM) / 64,
          ((row + 0.5) * FIELD_HEIGHT_UM) / 48,
        )
        peakDensity = Math.max(peakDensity, sample.tissue * targetDensity(sample, spec.target, t))
      }
  }
  return {
    supported: true,
    targetAvailable: peakDensity > 0,
    peakDensity,
    reason:
      peakDensity > 0
        ? spec.description
        : 'The required authored target compartment is absent; this section cannot serve as a positive control.',
  }
}

/** Separate reference preparation; tissue targets and preparation path are explicit. */
export function createSpecialControl(seed: string, protocolId: string): Twin {
  const spec = SPECIAL_CONTROL_SPECS[protocolId]
  if (!spec) throw new Error('Unknown special-stain control')
  const scenario = {
    ...createScenario(`${seed}:known-control`, spec.archetype, 1),
    targetPresent: true,
    faults: [],
    discrepancy: 'none',
  }
  if (protocolId === 'oil-red-o')
    return reduceEvent(createTwin(scenario), {
      sequence: 0,
      t: 0,
      station: 'frozen',
      intent: 'frozen.freeze',
      params: { temperature: P['frozen.temperature'], rate: P['frozen.rate'], biohazard: true },
    })
  const reference = referenceTwin(scenario)
  if (spec.target !== 'mineral') return reference
  // Do not silently put mineral back into a decalcified block. Replay a separate
  // undecalcified teaching preparation; its mechanics are not a resin/ground-section SOP.
  return reference.events
    .filter((event) => event.station !== 'decalcification')
    .reduce(
      (t, event) => reduceEvent(t, { ...event, sequence: t.events.length, t: t.time }),
      createTwin(scenario),
    )
}
/** Comparison clones receive a new section; source history and irreversible assay state are untouched. */
export function runSpecialExperiment(
  source: Twin,
  protocolId: string,
  challenge: SpecialChallenge = 'matched',
) {
  const t = structuredClone(source)
  adjacentSection(t, 'Special-stain adjacent section')
  const protocol = PROTOCOL_BY_ID[protocolId]
  if (!protocol) throw new Error('Unknown special stain')
  for (const step of protocol.steps) {
    if (challenge === 'omit-oxidation' && step.action === 'oxidize') continue
    const exposure =
      durations[step.durationParam] *
      (challenge === 'overdevelop' && step.action === 'stain'
        ? P['special.overexposure-onset'] + P['special.overexposure-scale']
        : 1)
    const ph =
      challenge === 'wrong-ph'
        ? protocolId === 'alcian-blue-1'
          ? P['special.alcian-standard-ph']
          : P['special.alcian-low-ph']
        : protocolId === 'alcian-blue-1'
          ? P['special.alcian-low-ph']
          : P['special.alcian-standard-ph']
    specialStep(
      t,
      protocolId,
      step.id,
      exposure,
      ph,
      challenge === 'inactive-diastase' && step.action === 'digest' ? 0 : 1,
    )
  }
  specialControls(t, true, true, (t.staining.specialGlycogen ?? 1) < P['special.control-minimum'])
  const targetEvidence = specialTargetEvidence(t, protocolId)
  if (!targetEvidence.targetAvailable) {
    t.staining.controls.positive = targetEvidence.supported ? 0 : null
    t.staining.controls.valid = false
    t.notes.push(targetEvidence.reason)
  }
  return { twin: t, appearance: slideAppearance(t), targetEvidence }
}

export function prepareSpecialSection(t: Twin) {
  if (
    !t.instrument.locked ||
    !t.instrument.guarded ||
    !t.embedding.cooled ||
    !t.embedding.pieces.length ||
    t.block.remaining <= t.instrument.thickness
  ) {
    t.notes.push(
      'Lock and guard a prepared block with tissue remaining before preparing an adjacent section.',
    )
    return false
  }
  adjacentSection(t, 'Unstained adjacent assay section')
  t.time += P['bath.minutes'] + P['drying.minutes']
  t.notes.push(
    'Prepared a charged, correctly labeled adjacent section for a new assay. Previous slide chemistry remains archived.',
  )
  return true
}
