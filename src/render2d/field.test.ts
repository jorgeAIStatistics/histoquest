import { describe, expect, it } from 'vitest'
import { createPhenotype, samplePhenotype } from '../sim/specimen/phenotype'
import type { SlideAppearance } from '../sim/specimen/types'
import {
  createSlideField,
  DEFAULT_OPTICAL_VIEW,
  describeSlide,
  localizationDensity,
  sampleSlide,
} from './field'
import { rendererFixture } from './testFixtures'
import {
  clampCenter,
  measureMicrometers,
  renderTile,
  screenToWorld,
  TileCache,
  viewportAt,
} from './tiles'

function preview(appearance: SlideAppearance) {
  const field = createSlideField(appearance)
  return Array.from({ length: 1200 }, (_, i) =>
    sampleSlide(field, 200 + (i % 40) * 40, 180 + Math.floor(i / 40) * 40).map((value) =>
      Math.round(value * 255),
    ),
  )
}

describe('procedural slide field', () => {
  it('reproduces pixels from the same specimen and retains all finite RGB values', () => {
    const appearance = rendererFixture()
    const a = preview(appearance)
    expect(preview(structuredClone(appearance))).toEqual(a)
    for (const pixel of a)
      for (const channel of pixel) {
        expect(channel).toBeGreaterThanOrEqual(0)
        expect(channel).toBeLessThanOrEqual(255)
      }
  })

  it.each([
    ['compression', { compression: 0.7 }],
    ['chatter', { chatter: 0.7 }],
    ['knife lines', { knifeLines: [0.5] }],
    ['holes', { holes: 0.8 }],
    ['folds', { folds: 0.8 }],
    ['wrinkles', { wrinkles: 0.7 }],
    ['bubbles', { bubbles: 0.8 }],
    ['ice', { ice: 0.8 }],
    ['incomplete dewax', { dewax: 0.1 }],
    ['haze', { haze: 0.8 }],
    ['edge deposition', { edge: 0.8 }],
    ['lifting', { lifting: 0.8 }],
    ['pigment', { pigment: 0.8 }],
    ['retraction', { retraction: 0.8 }],
    ['foreign tissue', { floaters: [{ accession: 'OTHER-CASE', x: 0.5, y: 0.5 }] }],
    ['preservation', { preservation: 0.2, centerPreservation: 0.1 }],
    ['representation', { representation: 0.1 }],
    ['thickness', { thickness: 8 }],
    ['weak bluing', { bluing: 0 }],
    ['weak eosin', { eosin: 0.1 }],
  ] satisfies [string, Partial<SlideAppearance>][])(
    'propagates %s into spatially different pixels',
    (_name, change) => {
      const appearance = rendererFixture()
      expect(preview({ ...appearance, ...change })).not.toEqual(preview(appearance))
    },
  )

  it('places DAB in different cellular compartments', () => {
    const p = createPhenotype('gut', 'localization')
    const points = Array.from({ length: 100 }, (_, i) =>
      samplePhenotype(p, 900 + (i % 10) * 5, 700 + Math.floor(i / 10) * 5),
    )
    const nuclear = points.map((sample) => localizationDensity(sample, 'nuclear'))
    const membrane = points.map((sample) => localizationDensity(sample, 'membranous'))
    const cytoplasm = points.map((sample) => localizationDensity(sample, 'cytoplasmic'))
    expect(nuclear).not.toEqual(membrane)
    expect(membrane).not.toEqual(cytoplasm)
    expect(nuclear.some((value) => value > 0.2)).toBe(true)
    expect(membrane.some((value) => value > 0.2)).toBe(true)
  })

  it('keeps specific DAB absent when no target is present and describes contamination', () => {
    const a = { ...rendererFixture(), targetPresent: false }
    expect(preview({ ...a, dab: 2 })).toEqual(preview({ ...a, dab: 0 }))
    expect(
      describeSlide({ ...a, floaters: [{ accession: 'FOREIGN-42', x: 0.7, y: 0.3 }] }).join(' '),
    ).toContain('FOREIGN-42')
  })

  it('changes polarization without changing tissue geometry', () => {
    const field = createSlideField({
      ...rendererFixture('skin'),
      special: 'Congo red',
      specialIntensity: 1,
    })
    const a = sampleSlide(field, 900, 700)
    const b = sampleSlide(field, 900, 700, { ...DEFAULT_OPTICAL_VIEW, polarization: 1 })
    expect(a).not.toEqual(b)
    expect(field.phenotype).toEqual(createSlideField(field.appearance).phenotype)
  })

  it('renders matching tile bytes and bounds the tile cache', () => {
    const field = createSlideField(rendererFixture('skin'))
    const a = renderTile(field, DEFAULT_OPTICAL_VIEW, 1, 1, 0.25, 16)
    const b = renderTile(field, DEFAULT_OPTICAL_VIEW, 1, 1, 0.25, 16)
    expect(a.data).toEqual(b.data)
    expect(a.data).toHaveLength(16 * 16 * 4)
    const cache = new TileCache(2)
    const first = cache.get(field, DEFAULT_OPTICAL_VIEW, 1, 1, 0.25)
    expect(cache.get(field, DEFAULT_OPTICAL_VIEW, 1, 1, 0.25)).toBe(first)
    cache.get(field, DEFAULT_OPTICAL_VIEW, 2, 1, 0.25)
    cache.get(field, DEFAULT_OPTICAL_VIEW, 3, 1, 0.25)
    expect(cache.size).toBe(2)
    cache.clear()
    expect(cache.size).toBe(0)
  })
})

describe('synthetic field coordinates', () => {
  it('measures authored model micrometers independently of objective', () => {
    expect(measureMicrometers({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    const viewport = viewportAt({ x: 1000, y: 750 }, 40, 1.6)
    expect(viewport.width).toBe(100)
    expect(screenToWorld({ x: 400, y: 250 }, viewport, 800, 500)).toEqual({ x: 1000, y: 750 })
    expect(clampCenter({ x: -400, y: 3000 }, 40, 1.6)).toEqual({ x: 50, y: 1468.75 })
  })
})
