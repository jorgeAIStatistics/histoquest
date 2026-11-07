import { describe, expect, it } from 'vitest'
import { createScenario } from '../core/scenarios'
import { referenceTwin } from '../core/reference'
import { createTwin } from '../specimen/initial'
import { cut, trim, updateBlockFace } from './sectioning'
import { reduceEvent, nominalEvent } from '../core/replay'
import { stainStep } from './staining'
const prepared = () => referenceTwin(createScenario('mechanical-field', 'skin-ellipse', 1))
describe('instrument response and tissue geometry', () => {
  it('irregular cutting changes thickness while low humidity disrupts ribbon continuity', () => {
    const good = prepared(),
      uneven = prepared(),
      dry = prepared()
    uneven.instrument.consistency = 0.2
    dry.instrument.humidity = 0
    const a = cut(good),
      b = cut(uneven),
      c = cut(dry)
    expect(b.thicknessVariation).toBeGreaterThan(a.thicknessVariation!)
    expect(new Set(b.thicknessMap).size).toBeGreaterThan(1)
    expect(c.ribbonContinuity).toBeLessThan(a.ribbonContinuity!)
    expect(c.curling).toBeGreaterThan(0)
  })
  it('surface conditioning moderates brittle chatter without reversing processing injury', () => {
    const a = prepared(),
      b = prepared()
    a.processing.brittleness = b.processing.brittleness = 0.8
    b.block.hydration = 0.6
    expect(cut(b).chatter).toBeLessThan(cut(a).chatter)
    expect(b.processing.brittleness).toBe(0.8)
  })
  it('face cells retain geometric tissue depth and deeper cuts consume it', () => {
    const t = prepared()
    updateBlockFace(t)
    expect(new Set(t.block.face).size).toBeGreaterThan(1)
    const before = [...t.block.face]
    trim(t, 100)
    expect(t.block.face.every((n, i) => n <= before[i])).toBe(true)
    trim(t, 4000)
    expect(cut(t).holes).toBe(1)
  })
  it('frozen support survives sectioning and aqueous staining does not require paraffin removal', () => {
    let t = createTwin({ ...createScenario('frozen', 'frozen-consult'), request: 'frozen' })
    t = reduceEvent(
      t,
      nominalEvent('frozen', 'frozen.freeze', { rate: 3, temperature: -22, biohazard: true }),
    )
    cut(t)
    expect(t.embedding.representation).toBe(1)
    expect(t.block.sections.at(-1)?.chatter).toBeLessThan(0.1)
    stainStep(t, 'hydrate', 3)
    stainStep(t, 'hematoxylin', 5)
    expect(t.staining.hematoxylin).toBeGreaterThan(0)
    expect(t.fixation.crosslink).toBe(0)
  })
})
