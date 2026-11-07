import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { ADDITIONAL_MICROGRAPHS } from './micrographs'

/** Byte preservation and attribution checks; not image-diagnostic validation. */
it('preserves verified source bytes and image-specific attribution', () => {
  const attribution = readFileSync(resolve('public/micrographs/ATTRIBUTION.md'), 'utf8')
  expect(ADDITIONAL_MICROGRAPHS.length).toBeGreaterThanOrEqual(4)
  expect(new Set(ADDITIONAL_MICROGRAPHS.map((m) => m.id)).size).toBe(ADDITIONAL_MICROGRAPHS.length)
  for (const m of ADDITIONAL_MICROGRAPHS) {
    const bytes = readFileSync(resolve('public/micrographs', m.file))
    expect(createHash('sha256').update(bytes).digest('hex'), m.file).toBe(m.sha256)
    expect(bytes.subarray(0, 2).toString('hex')).toBe('ffd8')
    expect(m.width).toBeGreaterThan(500)
    expect(m.height).toBeGreaterThan(500)
    expect(m.pairedWithSimulation).toBe(false)
    expect(m.author.length).toBeGreaterThan(3)
    expect(m.licenseUrl).toMatch(/^https:\/\/creativecommons.org\/licenses\//)
    expect(m.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/)
    expect(m.prompts).toHaveLength(3)
    expect(m.observations).toHaveLength(3)
    for (const value of [m.file, m.source, m.author, m.licenseUrl])
      expect(attribution).toContain(value)
  }
})
