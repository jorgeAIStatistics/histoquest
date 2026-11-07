/**
 * Illustrative forward brightfield optics; not a quantitative assay model.
 * H/E/DAB numeric presets: Fiji Colour Deconvolution, H&E DAB row,
 * https://raw.githubusercontent.com/fiji/Colour_Deconvolution/master/src/main/resources/sc/fiji/colourDeconvolution/colourdeconvolution.txt
 * (Ruifrok & Johnston method; Landini implementation/preset documentation).
 * Presets require per-method calibration for experimental use. No implementation
 * from that repository is copied. Other vectors below are authored approximations.
 */
export type RGB = readonly [number, number, number]
export interface Absorber {
  density: number
  vector: RGB
}

/** Independent emitted channels add on black; clamp is display saturation.
 * No Beer–Lambert absorption, photon calibration, bleed-through or copy counts. */
export function additiveEmission(
  channels: readonly Absorber[],
  gain = 1,
): [number, number, number] {
  return [0, 1, 2].map((i) =>
    Math.min(
      1,
      Math.max(0, gain) *
        channels.reduce((sum, c) => sum + Math.max(0, c.density) * Math.max(0, c.vector[i]), 0),
    ),
  ) as [number, number, number]
}

import { APPROXIMATE_VECTORS } from '../params/optics'
export { STAIN_VECTORS, APPROXIMATE_VECTORS, OPTICS_PROVENANCE } from '../params/optics'

/** I / I₀ = exp(−Σ ODᵢ · stainVectorᵢ), independently for R, G, and B. */
export function beerLambert(
  absorbers: readonly Absorber[],
  illuminant: RGB = [1, 1, 1],
): [number, number, number] {
  const opticalDensity = [0, 0, 0]
  for (const absorber of absorbers) {
    const density = Number.isFinite(absorber.density) ? Math.max(0, absorber.density) : 0
    for (let channel = 0; channel < 3; channel++) {
      opticalDensity[channel] += density * Math.max(0, absorber.vector[channel])
    }
  }
  return opticalDensity.map((od, channel) =>
    Math.max(0, Math.min(1, illuminant[channel] * Math.exp(-od))),
  ) as [number, number, number]
}

export function blendVector(from: RGB, to: RGB, fraction: number): RGB {
  const t = Math.max(0, Math.min(1, fraction))
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ]
}

export function specialVector(name: string): RGB {
  const key = name.toLowerCase()
  if (/alcian|mucin|luxol/.test(key)) return APPROXIMATE_VECTORS.alcian
  if (/prussian|iron|perls/.test(key)) return APPROXIMATE_VECTORS.prussian
  if (/silver|gms|retic|grocott|warthin|steiner|vvg|von.kossa|fontana/.test(key))
    return APPROXIMATE_VECTORS.silver
  if (/congo/.test(key)) return APPROXIMATE_VECTORS.congo
  if (/trichrome|masson/.test(key)) return APPROXIMATE_VECTORS.trichrome
  if (/giemsa|toluidine/.test(key)) return APPROXIMATE_VECTORS.giemsa
  if (/fast.red|afb|ziehl|fite|oil.red|alizarin|rhodanine/.test(key))
    return APPROXIMATE_VECTORS.fastRed
  return APPROXIMATE_VECTORS.pas
}
