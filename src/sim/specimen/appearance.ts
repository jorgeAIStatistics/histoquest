import { average, clamp } from '../core/units'
import type { SlideAppearance, Twin } from './types'

/** No station verdicts are read: appearance is derived from continuous preparation fields. */
export function slideAppearance(t: Twin): SlideAppearance {
  const s = t.block.sections.at(-1)
  const morphology = t.frozen.prepared
    ? 1 - t.frozen.ice / 2
    : average(t.regions.map((r) => r.fixed))
  return {
    seed: t.scenario.seed,
    family: t.scenario.family,
    archetype: t.scenario.archetype,
    target: t.ihc.marker,
    targetPresent: t.scenario.targetPresent,
    hematoxylin: t.staining.hematoxylin,
    eosin: t.staining.eosin,
    dab: t.ihc.dab,
    background: t.ihc.background,
    bluing: t.staining.bluing,
    special: t.staining.special,
    specialIntensity: t.staining.specialIntensity,
    localization: t.ihc.location,
    thickness: s?.thickness ?? t.instrument.thickness,
    preservation: morphology * t.ihc.preservation,
    centerPreservation:
      (t.frozen.prepared ? 1 - t.frozen.ice / 2 : t.regions.at(-1)!.fixed) * t.ihc.preservation,
    masking: t.ihc.masking,
    representation: t.embedding.representation,
    compression: s?.compression ?? 0,
    chatter: Math.max(s?.chatter ?? 0, s?.thicknessVariation ?? 0),
    knifeLines: s?.knifeLines ?? [],
    holes: s?.holes ?? 0,
    folds: s?.folds ?? 0,
    wrinkles: s?.wrinkles ?? 0,
    bubbles: clamp((s?.bubbles ?? 0) + t.mounting.bubbles),
    ice: s?.ice ?? 0,
    dewax: t.frozen.prepared ? 1 : t.staining.dewax,
    haze: t.mounting.haze,
    edge: t.ihc.edge,
    lifting: t.ihc.retrieval > 0 ? clamp(1 - (s?.adhesion ?? 0)) : 0,
    pigment: t.fixation.pigment,
    retraction: t.mounting.retraction,
    floaters: s?.floaters ?? [],
    mounted: t.mounting.mounted,
  }
}
