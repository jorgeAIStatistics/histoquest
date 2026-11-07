import { describe, expect, it } from 'vitest'
import { createPhenotype, FAMILY_FEATURES, samplePhenotype } from './phenotype'
import type { TissueFamily } from './types'

const families = Object.keys(FAMILY_FEATURES) as TissueFamily[]

describe('seeded tissue phenotype', () => {
  it('supports eleven distinct tissue families with deterministic coordinates', () => {
    expect(families).toHaveLength(11)
    const signatures = new Set<string>()
    for (const family of families) {
      const phenotype = createPhenotype(family, 'geometry-reference')
      const a = Array.from({ length: 160 }, (_, i) =>
        samplePhenotype(phenotype, 400 + (i % 16) * 73, 330 + Math.floor(i / 16) * 79),
      )
      const b = a.map((_, i) =>
        samplePhenotype(
          createPhenotype(family, 'geometry-reference'),
          400 + (i % 16) * 73,
          330 + Math.floor(i / 16) * 79,
        ),
      )
      expect(a).toEqual(b)
      signatures.add(
        JSON.stringify(
          a.map((sample) =>
            [sample.nucleus, sample.cytoplasm, sample.collagen].map((v) => Number(v.toFixed(3))),
          ),
        ),
      )
      for (const sample of a)
        for (const value of Object.values(sample)) {
          expect(Number.isFinite(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(0)
        }
    }
    expect(signatures.size).toBe(families.length)
  })

  it('changes architecture with its seed and returns empty field outside tissue', () => {
    const a = createPhenotype('bone', 'a')
    const b = createPhenotype('bone', 'b')
    expect(samplePhenotype(a, 1010, 750)).not.toEqual(samplePhenotype(b, 1010, 750))
    expect(samplePhenotype(a, 0, 0).tissue).toBe(0)
  })

  it('keeps structures anchored when a tile is sampled in a different order', () => {
    const phenotype = createPhenotype('skin', 'stable-coordinates')
    const points = [
      [900, 430],
      [1000, 850],
      [1100, 790],
    ]
    const forward = points.map(([x, y]) => samplePhenotype(phenotype, x, y))
    const reverse = points
      .toReversed()
      .map(([x, y]) => samplePhenotype(phenotype, x, y))
      .toReversed()
    expect(forward).toEqual(reverse)
  })
})
