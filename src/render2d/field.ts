import { hashString, rng } from '../engine/random'
import {
  APPROXIMATE_VECTORS,
  beerLambert,
  blendVector,
  specialVector,
  STAIN_VECTORS,
  additiveEmission,
} from '../sim/models/optics'
import { EMISSION_COLORS, EMISSION_PATTERN, PAS_GLYCOGEN_WEIGHT } from '../sim/params/optics'
import type { Absorber, RGB } from '../sim/models/optics'
import {
  clamp01,
  createPhenotype,
  FAMILY_FEATURES,
  FIELD_HEIGHT_UM,
  FIELD_WIDTH_UM,
  noise,
  samplePhenotype,
  smoothstep,
} from '../sim/specimen/phenotype'
import type { Phenotype, TissueSample } from '../sim/specimen/phenotype'
import type { SlideAppearance } from '../sim/specimen/types'

export interface OpticalView {
  illumination: number
  polarization: number
  condenser: number
  fluorescenceChannel?: 'composite' | 'probe' | 'nuclear' | 'primary' | 'secondary'
}
export interface Spot {
  x: number
  y: number
  radius: number
  aspect: number
}
export interface SlideField {
  appearance: SlideAppearance
  phenotype: Phenotype
  foreign: Phenotype
  spots: Spot[]
  key: string
}

export const DEFAULT_OPTICAL_VIEW: OpticalView = {
  illumination: 1,
  polarization: 0,
  condenser: 0.8,
}

function mapRGB(
  color: RGB,
  transform: (channel: number, index: number) => number,
): [number, number, number] {
  return [transform(color[0], 0), transform(color[1], 1), transform(color[2], 2)]
}

export function createSlideField(appearance: SlideAppearance): SlideField {
  const random = rng(hashString(`${appearance.seed}:artifacts`))
  return {
    appearance,
    phenotype: createPhenotype(appearance.family, appearance.seed, appearance.archetype),
    foreign: createPhenotype('gland', `${appearance.seed}:foreign`),
    spots: Array.from({ length: 28 }, () => ({
      x: 230 + random() * 1540,
      y: 220 + random() * 1060,
      radius: 18 + random() * 75,
      aspect: 0.6 + random() * 0.8,
    })),
    key: JSON.stringify(appearance),
  }
}

function spotMask(
  field: SlideField,
  x: number,
  y: number,
  amount: number,
  offset: number,
  scale = 1,
): number {
  if (amount <= 0) return 0
  let mask = 0
  const count = Math.ceil(clamp01(amount) * 6)
  for (let i = 0; i < count; i++) {
    const spot = field.spots[(i + offset) % field.spots.length]
    const radius = spot.radius * scale * (0.25 + amount * 0.8)
    const distance = Math.hypot((x - spot.x) / radius, (y - spot.y) / (radius * spot.aspect))
    mask = Math.max(mask, 1 - smoothstep(0.75, 1, distance))
  }
  return mask
}

function specialDensity(sample: TissueSample, a: SlideAppearance): number {
  const name = a.special.toLowerCase()
  if (!name || a.specialIntensity <= 0) return 0
  if (/melanin.bleach/.test(name)) return 0
  if (/fontana/.test(name)) return sample.pigment
  if (/oil.red/.test(name)) return a.family === 'fat' ? sample.tissue * (1 - sample.membrane) : 0
  if (/luxol/.test(name)) return a.family === 'neural' ? sample.tissue * (1 - sample.target) : 0
  if (/alcian|mucicarmine|colloidal.iron/.test(name)) return sample.mucin + sample.cytoplasm * 0.02
  if (/prussian|iron|perls/.test(name)) return sample.target * sample.pigment
  if (/retic/.test(name)) return sample.reticulin
  if (/gms|grocott|warthin|steiner|gram|afb|ziehl|fite/.test(name)) return sample.organism
  if (/congo/.test(name)) return a.targetPresent ? sample.amyloid : 0
  if (/trichrome|masson/.test(name)) return sample.collagen
  if (/elastic|vvg/.test(name)) return sample.reticulin + sample.collagen * 0.15
  if (/von.kossa|alizarin|calcium/.test(name)) return sample.mineral
  if (/giemsa|toluidine/.test(name)) return sample.nucleus * 0.5 + sample.organism
  if (/pas/.test(name))
    return (
      sample.mucin +
      sample.reticulin * 0.5 +
      sample.cytoplasm * PAS_GLYCOGEN_WEIGHT * (a.specialGlycogen ?? 1)
    )
  return sample.target * 0.3
}

/** Compartment-specific DAB; membrane staining is not a filled cell or nuclear dot. */
export function localizationDensity(
  sample: TissueSample,
  location: SlideAppearance['localization'],
): number {
  if (location === 'nuclear') return sample.nucleus
  if (location === 'membranous') return sample.membrane * (1 - clamp01(sample.nucleus))
  return sample.cytoplasm * (1 - clamp01(sample.nucleus))
}

/** Shared CPU field sampler for cached tiles, fallback, and deterministic tests. */
export function sampleSlide(
  field: SlideField,
  worldX: number,
  worldY: number,
  view: OpticalView = DEFAULT_OPTICAL_VIEW,
): RGB {
  const a = field.appearance
  const illuminant = Math.min(1.1, Math.max(0.3, view.illumination))
  if (worldX < 0 || worldX > FIELD_WIDTH_UM || worldY < 0 || worldY > FIELD_HEIGHT_UM)
    return a.fluorescence
      ? [0, 0, 0]
      : [clamp01(illuminant), clamp01(illuminant), clamp01(illuminant)]
  const x = (worldX - 1000) / (1 - clamp01(a.compression) * 0.43) + 1000
  const wrinkle = a.wrinkles * 6 * Math.sin(worldX / 25 + field.phenotype.phase)
  const y = worldY + wrinkle
  let sample = samplePhenotype(field.phenotype, x, y)
  const isForeign = a.floaters.some(
    (floater) =>
      Math.hypot(worldX - floater.x * FIELD_WIDTH_UM, worldY - floater.y * FIELD_HEIGHT_UM) < 48,
  )
  if (isForeign) {
    const floater = a.floaters.find(
      (entry) =>
        Math.hypot(worldX - entry.x * FIELD_WIDTH_UM, worldY - entry.y * FIELD_HEIGHT_UM) < 48,
    )!
    sample = samplePhenotype(
      field.foreign,
      1010 + (worldX - floater.x * FIELD_WIDTH_UM) * 1.5,
      750 + (worldY - floater.y * FIELD_HEIGHT_UM) * 1.5,
    )
    sample.tissue = 1
    sample.nucleus *= 1.5
  }
  const tissue = sample.tissue
  const center = Math.exp(-Math.pow((x - 1000) / 430, 2) - Math.pow((y - 750) / 340, 2))
  const preservation = clamp01(a.preservation * (1 - center) + a.centerPreservation * center)
  const clarity = 0.14 + preservation * 0.86
  // Autolytic loss of nuclear contrast is strongest in a poorly preserved center.
  sample.nucleus *= clarity
  sample.cytoplasm += (1 - preservation) * 0.14
  const representation = clamp01(a.representation)
  const lostPlane =
    representation < 0.98
      ? smoothstep(
          0.2 + representation * 0.8,
          0.3 + representation * 0.8,
          noise(x / 300, y / 300, field.phenotype.seed + 412),
        )
      : 0
  const hole = spotMask(field, x, y, a.holes, 0)
  const lift = spotMask(field, x, y, a.lifting, 5, 1.9)
  const wax = spotMask(field, x, y, 1 - clamp01(a.dewax), 12, 3)
  const icePattern = noise(x / 17, y / 17, field.phenotype.seed + 100)
  const ice =
    a.ice > 0
      ? smoothstep(0.75 - clamp01(a.ice) * 0.24, 0.84 - clamp01(a.ice) * 0.24, icePattern) *
        clamp01(a.ice * 1.8)
      : 0
  let tear = 0
  for (const knife of a.knifeLines) {
    const position = knife * FIELD_WIDTH_UM + 1.2 * Math.sin(y / 31)
    tear = Math.max(tear, 1 - smoothstep(1.2, 3.1, Math.abs(worldX - position)))
  }
  const foldPath = 560 + 100 * Math.sin(x / 255 + field.phenotype.phase)
  const fold = a.folds > 0 ? 1 - smoothstep(3, 8 + a.folds * 24, Math.abs(y - foldPath)) : 0
  const foldSeam = a.folds > 0 ? Math.exp(-Math.pow((y - foldPath) / 2.5, 2)) * a.folds : 0
  const chatter = 1 + clamp01(a.chatter) * 0.72 * Math.sin(y / 8.5)
  const wrinkleThickness = 1 + a.wrinkles * 0.35 * Math.sin(x / 24)
  const thickness =
    Math.max(0.1, a.thickness / 4) * chatter * (1 + fold * a.folds) * wrinkleThickness
  const sectionMask = tissue * (1 - Math.max(hole, tear, ice, lift * 0.9, lostPlane))
  const staining = sectionMask * (1 - wax * 0.94) * thickness
  const edge = a.edge * smoothstep(0.64, 0.95, Math.hypot((x - 1000) / 890, (y - 750) / 635))
  const target = a.targetPresent ? sample.target : 0
  if (a.fluorescence) {
    const channel = view.fluorescenceChannel ?? 'composite'
    const puncta =
      a.fluorescence.targetType === 'protein'
        ? 1
        : smoothstep(
            EMISSION_PATTERN.thresholdLow,
            EMISSION_PATTERN.thresholdHigh,
            noise(x / EMISSION_PATTERN.period, y / EMISSION_PATTERN.period, field.phenotype.seed),
          )
    return additiveEmission(
      [
        {
          density:
            channel === 'nuclear' || channel === 'secondary'
              ? 0
              : staining *
                (a.fluorescence.signal *
                  (a.targetPresent ? sample.target : 0) *
                  Math.max(
                    ...(a.localizations ?? [a.localization]).map((location) =>
                      localizationDensity(sample, location),
                    ),
                  ) *
                  puncta +
                  a.fluorescence.background * sample.cytoplasm),
          vector: EMISSION_COLORS.probe,
        },
        {
          density:
            channel === 'probe' || channel === 'primary' || channel === 'secondary'
              ? 0
              : sectionMask * sample.nucleus * a.fluorescence.counterstain,
          vector: EMISSION_COLORS.nuclear,
        },
        {
          density:
            !a.fluorescence.secondary || channel === 'nuclear' || channel === 'primary'
              ? 0
              : staining *
                (a.fluorescence.secondary.signal *
                  (a.targetPresent ? sample.target : 0) *
                  Math.max(
                    ...a.fluorescence.secondary.localizations.map((location) =>
                      localizationDensity(sample, location),
                    ),
                  ) +
                  a.fluorescence.secondary.background * sample.cytoplasm),
          vector: EMISSION_COLORS.secondary,
        },
      ],
      illuminant,
    )
  }
  const hematoxylin = blendVector(
    APPROXIMATE_VECTORS.unbluedHematoxylin,
    STAIN_VECTORS.hematoxylin,
    a.bluing,
  )
  const stainAmount = Math.max(0, a.specialIntensity)
  const special = specialDensity(sample, a) * stainAmount
  const polarized = clamp01(view.polarization)
  const absorbers: Absorber[] = [
    {
      density:
        staining * Math.max(0, a.hematoxylin) * (sample.nucleus * 1.65 + sample.cytoplasm * 0.045),
      vector: hematoxylin,
    },
    {
      density:
        staining *
        Math.max(0, a.eosin) *
        (sample.cytoplasm * 0.88 + sample.collagen * 0.85 + sample.rbc * 1.25),
      vector: STAIN_VECTORS.eosin,
    },
    {
      density:
        staining *
        (Math.max(0, a.dab) *
          target *
          Math.max(
            ...(a.localizations ?? [a.localization]).map((location) =>
              localizationDensity(sample, location),
            ),
          ) *
          1.8 +
          Math.max(0, a.background) * (0.2 + sample.cytoplasm + sample.collagen) +
          edge),
      vector: STAIN_VECTORS.dab,
    },
    {
      density: staining * (special * 1.7 + (a.specialBackground ?? 0) * sample.tissue),
      vector: specialVector(a.special),
    },
    {
      density:
        staining *
        (sample.pigment *
          0.6 *
          (/melanin.bleach/i.test(a.special) && a.family === 'skin'
            ? 1 - clamp01(a.specialIntensity)
            : 1) +
          a.pigment * (noise(x / 1.8, y / 1.8, field.phenotype.seed + 24) > 0.63 ? 1.2 : 0) +
          foldSeam * 0.35),
      vector: APPROXIMATE_VECTORS.pigment,
    },
  ]
  if (a.secondaryChromogen)
    absorbers.push({
      density:
        staining *
        (a.secondaryChromogen.signal *
          target *
          Math.max(
            ...a.secondaryChromogen.localizations.map((location) =>
              localizationDensity(sample, location),
            ),
          ) +
          a.secondaryChromogen.background * sample.cytoplasm),
      vector: APPROXIMATE_VECTORS.fastRed,
    })
  let rgb = beerLambert(absorbers, [illuminant, illuminant * 0.994, illuminant * 0.98])
  if (polarized > 0) {
    // Authored qualitative effect; a polarization teaching cue, not retardance data.
    const congo = /congo/i.test(a.special) ? special * thickness * 0.9 : 0
    const birefringence =
      clamp01(congo + sample.collagen * 0.28 + sample.mineral * 0.22) * sectionMask
    const green = congo > 0.02 ? [0.38, 0.77, 0.18] : [0.78, 0.72, 0.48]
    rgb = mapRGB(
      rgb,
      (channel, i) => channel * (1 - polarized * 0.87) + polarized * birefringence * green[i],
    )
  }
  const bubble = spotMask(field, worldX, worldY, a.bubbles, 20, 1.6)
  const bubbleRim = bubble > 0 && bubble < 0.98 ? Math.sin(bubble * Math.PI) * 0.75 : 0
  const retract =
    a.retraction *
    Math.exp(-Math.pow((Math.hypot((x - 1000) / 890, (y - 750) / 635) - 0.9) * 35, 2))
  const haze =
    clamp01(
      a.haze * (0.35 + 0.5 * noise(x / 150, y / 150, field.phenotype.seed + 101)) +
        (a.mounted ? 0 : 0.1),
    ) * sectionMask
  const condenser = 0.82 + clamp01(view.condenser) * 0.18
  return mapRGB(rgb, (channel) =>
    clamp01(
      (channel * (1 - haze * 0.5) + haze * 0.5) * (1 - bubbleRim) * condenser * (1 - retract * 0.4),
    ),
  )
}

const ARTIFACT_DESCRIPTIONS: [keyof SlideAppearance, string][] = [
  [
    'compression',
    'Anisotropic compression narrows the tissue and crowds nuclei along the cutting direction.',
  ],
  [
    'chatter',
    'Regular light and dark thickness bands cross the section parallel to the knife edge.',
  ],
  ['holes', 'Missing tissue leaves irregular, clear holes.'],
  ['folds', 'A folded seam doubles tissue thickness and increases stain density.'],
  ['wrinkles', 'Wrinkles bend local architecture and vary thickness.'],
  ['bubbles', 'Refractile bubble rims interrupt the mounted field.'],
  ['ice', 'Ice-crystal spaces disrupt cellular architecture.'],
  ['haze', 'Milky haze reduces transmitted-light contrast.'],
  ['edge', 'Peripheral chromogen deposition produces an edge artifact.'],
  ['lifting', 'Lifted areas lose tissue and staining continuity.'],
  ['pigment', 'Coarse brown pigment can be confused with chromogen.'],
  ['retraction', 'A refractile gap follows the tissue boundary.'],
]

export function describeSlide(appearance: SlideAppearance): string[] {
  const descriptions = [FAMILY_FEATURES[appearance.family]]
  if (appearance.fluorescence) {
    descriptions.push(
      `Simulated ${appearance.fluorescence.targetType.toUpperCase()} fluorescence: green probe emission in the ${appearance.localization} compartment and blue nuclear counterstain on a dark background. Channels add; this is not a chromogenic image. Puncta are procedural cues and cannot establish molecule counts, gene copies or rearrangements.`,
    )
  }
  if (!appearance.fluorescence && appearance.hematoxylin < 0.2)
    descriptions.push('Nuclear hematoxylin is very weak or absent.')
  if (!appearance.fluorescence && appearance.eosin < 0.2)
    descriptions.push('Cytoplasmic eosin is very weak or absent.')
  if (appearance.bluing < 0.4 && appearance.hematoxylin > 0.2)
    descriptions.push('Insufficient bluing shifts nuclei toward reddish purple.')
  if (appearance.centerPreservation < 0.65)
    descriptions.push('The section center has reduced nuclear preservation.')
  if (appearance.representation < 0.7)
    descriptions.push('The represented tissue plane is incomplete.')
  if (appearance.dewax < 0.8)
    descriptions.push('Residual wax produces spatially patchy stain exclusion.')
  if (appearance.knifeLines.length)
    descriptions.push(
      `${appearance.knifeLines.length} blade-nick line${appearance.knifeLines.length === 1 ? '' : 's'} cut through the tissue perpendicular to the knife edge.`,
    )
  for (const [key, description] of ARTIFACT_DESCRIPTIONS)
    if (typeof appearance[key] === 'number' && (appearance[key] as number) > 0.08)
      descriptions.push(description)
  for (const floater of appearance.floaters)
    descriptions.push(
      `Foreign tissue from accession ${floater.accession} appears near ${Math.round(floater.x * 100)}% across, ${Math.round(floater.y * 100)}% down the synthetic field.`,
    )
  if (appearance.dab > 0)
    descriptions.push(
      `DAB is modeled in the ${(appearance.localizations ?? [appearance.localization]).join(' and ')} compartment${appearance.targetPresent ? '' : '; the target is absent, so specific staining is absent'}.`,
    )
  if (appearance.background > 0.1)
    descriptions.push('Nonspecific chromogen deposition stains background tissue.')
  if (appearance.secondaryChromogen)
    descriptions.push(
      'A second target uses approximate Fast Red absorption in its declared compartments. This synthetic overlay is not validated colocalization.',
    )
  if (appearance.special)
    descriptions.push(`${appearance.special} uses illustrative, uncalibrated stain optics.`)
  if (!appearance.mounted)
    descriptions.push('This section is not yet mounted; its display has reduced clarity.')
  return descriptions
}
