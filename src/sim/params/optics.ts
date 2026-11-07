import type { ModelParameter } from './registry'
import type { RGB } from '../models/optics'
export const STAIN_VECTORS = {
  hematoxylin: [0.65, 0.704, 0.286],
  eosin: [0.072, 0.99, 0.105],
  dab: [0.268, 0.57, 0.776],
} as const satisfies Record<string, RGB>

export const OPTICS_PROVENANCE = {
  sourceId: 'fiji-stain-vectors',
  url: 'https://raw.githubusercontent.com/fiji/Colour_Deconvolution/master/src/main/resources/sc/fiji/colourDeconvolution/colourdeconvolution.txt',
  note: 'Preset RGB absorbance vectors used for illustrative forward rendering. Not calibrated to a scanner, instrument, tissue, or quantitative antigen assay.',
}

export const APPROXIMATE_VECTORS = {
  unbluedHematoxylin: [0.42, 0.82, 0.46],
  fastRed: [0.08, 0.92, 0.77],
  pas: [0.15, 0.93, 0.4],
  alcian: [0.96, 0.48, 0.1],
  prussian: [0.98, 0.68, 0.12],
  silver: [0.92, 0.94, 0.96],
  congo: [0.07, 0.8, 0.91],
  trichrome: [0.95, 0.49, 0.1],
  giemsa: [0.71, 0.76, 0.2],
  pigment: [0.39, 0.64, 0.96],
  polarizedGreen: [0.93, 0.05, 0.82],
} as const satisfies Record<string, RGB>

export const OPTICS_PARAMETERS: ModelParameter[] = [
  ...Object.entries(STAIN_VECTORS).map(([name, value]) => ({
    id: `optics.${name}`,
    value: [...value],
    unit: 'RGB absorbance vector',
    scope: 'Illustrative Beer–Lambert forward renderer',
    sourceIds: ['fiji-stain-vectors'],
    accessStatus: 'verified' as const,
    illustrative: true,
    note: OPTICS_PROVENANCE.note,
  })),
  ...Object.entries(APPROXIMATE_VECTORS).map(([name, value]) => ({
    id: `optics.${name}`,
    value: [...value],
    unit: 'RGB absorbance vector',
    scope: 'Authored approximation for synthetic teaching images',
    sourceIds: ['hq-original'],
    accessStatus: 'illustrative' as const,
    illustrative: true,
    note: 'Authored color-direction approximation. Not measured, calibrated or suitable for quantitative stain analysis.',
  })),
]
