import { describe, expect, it } from 'vitest'
import { beerLambert, blendVector, STAIN_VECTORS } from './optics'

describe('illustrative brightfield optics', () => {
  it('transmits the illuminant without absorber and multiplies transmittance with thickness', () => {
    expect(beerLambert([], [0.8, 0.9, 1])).toEqual([0.8, 0.9, 1])
    const single = beerLambert([{ density: 1, vector: STAIN_VECTORS.hematoxylin }])
    const double = beerLambert([{ density: 2, vector: STAIN_VECTORS.hematoxylin }])
    single.forEach((channel, i) => expect(double[i]).toBeCloseTo(channel * channel, 12))
  })

  it('combines stains by optical density, independently of ordering', () => {
    const h = { density: 0.8, vector: STAIN_VECTORS.hematoxylin }
    const e = { density: 0.5, vector: STAIN_VECTORS.eosin }
    expect(beerLambert([h, e])).toEqual(beerLambert([e, h]))
    expect(beerLambert([h, e])[1]).toBeLessThan(beerLambert([h])[1])
  })

  it('retains the sourced vectors and clamps invalid scalar input', () => {
    expect(STAIN_VECTORS.dab).toEqual([0.268, 0.57, 0.776])
    expect(beerLambert([{ density: -5, vector: STAIN_VECTORS.eosin }])).toEqual([1, 1, 1])
    expect(beerLambert([{ density: NaN, vector: STAIN_VECTORS.eosin }])).toEqual([1, 1, 1])
    expect(blendVector(STAIN_VECTORS.eosin, STAIN_VECTORS.dab, 1)).toEqual(STAIN_VECTORS.dab)
  })
})
