import { describe, expect, it } from 'vitest'
import { PROTOCOLS } from '../../content/lab/protocols'
import { createSlideField, sampleSlide } from '../../render2d/field'
import { referenceTwin } from '../core/reference'
import { createScenario } from '../core/scenarios'
import { FIELD_HEIGHT_UM, FIELD_WIDTH_UM } from '../specimen/phenotype'
import type { SlideAppearance } from '../specimen/types'
import {
  createSpecialControl,
  runSpecialExperiment,
  SPECIAL_CONTROL_SPECS,
} from './specialExperiments'

/** Compare the actual shared microscope sampler with and without the reaction.
 * Counterstaining, anatomy and artifacts stay identical, so counterstain alone
 * cannot satisfy this test. A display-channel step is not a biological cutoff. */
function visibleReactionDifference(appearance: SlideAppearance): number {
  const reacted = createSlideField(appearance)
  const unreacted = createSlideField({ ...appearance, specialIntensity: 0 })
  let difference = 0
  for (let row = 0; row < 48; row++)
    for (let column = 0; column < 64; column++) {
      const x = ((column + 0.5) * FIELD_WIDTH_UM) / 64
      const y = ((row + 0.5) * FIELD_HEIGHT_UM) / 48
      const a = sampleSlide(reacted, x, y)
      const b = sampleSlide(unreacted, x, y)
      difference = Math.max(difference, ...a.map((v, i) => Math.abs(v - b[i])))
    }
  return difference
}

it('defines every graph explicitly and distinguishes 22 synthetic comparators from 3 unsupported targets', () => {
  expect(Object.keys(SPECIAL_CONTROL_SPECS).sort()).toEqual(PROTOCOLS.map((p) => p.id).sort())
  expect(Object.values(SPECIAL_CONTROL_SPECS).filter((s) => s.target)).toHaveLength(22)
  expect(
    Object.entries(SPECIAL_CONTROL_SPECS)
      .filter(([, s]) => !s.target)
      .map(([id]) => id)
      .sort(),
  ).toEqual(['rhodanine', 'toluidine-blue', 'vvg'])
  expect(SPECIAL_CONTROL_SPECS.reticulin.archetype).toBe('liver-core')
  expect(SPECIAL_CONTROL_SPECS['colloidal-iron'].archetype).toBe('colon-biopsy')
  expect(SPECIAL_CONTROL_SPECS['prussian-blue'].archetype).toBe('liver-core')
})

describe.each(PROTOCOLS)('$id control target', ({ id }) => {
  it('requires an actual authored target and visible reaction, or reports the missing model explicitly', () => {
    const control = createSpecialControl(`CONTROL-COVERAGE-${id}`, id)
    const snapshot = structuredClone(control)
    const result = runSpecialExperiment(control, id)
    expect(control).toEqual(snapshot)
    const supported = SPECIAL_CONTROL_SPECS[id].target !== null
    expect(result.targetEvidence.supported).toBe(supported)
    expect(result.twin.staining.controls.valid).toBe(supported)
    if (supported) {
      expect(result.targetEvidence.targetAvailable).toBe(true)
      expect(result.targetEvidence.peakDensity).toBeGreaterThan(0)
      expect(visibleReactionDifference(result.appearance)).toBeGreaterThan(1 / 255)
      control.scenario.targetPresent = false
      const absent = runSpecialExperiment(control, id)
      expect(absent.targetEvidence.targetAvailable).toBe(false)
      expect(absent.twin.staining.controls.positive).toBe(0)
      expect(absent.twin.staining.controls.valid).toBe(false)
    } else {
      expect(result.targetEvidence.reason).toMatch(/No .* compartment is implemented/)
      expect(result.twin.staining.controls.positive).toBeNull()
      expect(result.targetEvidence.peakDensity).toBeNull()
    }
  })
})

it.each([
  ['reticulin', 'skin-ellipse'],
  ['colloidal-iron', 'liver-core'],
  ['prussian-blue', 'skin-ellipse'],
])('does not credit %s on target-absent %s despite completed chemistry', (protocol, archetype) => {
  const source = referenceTwin({
    ...createScenario(`WRONG-CONTROL-${protocol}`, archetype),
    faults: [],
    discrepancy: 'none',
    targetPresent: true,
  })
  const result = runSpecialExperiment(source, protocol)
  expect(result.twin.staining.specialIntensity).toBeGreaterThan(0)
  expect(result.targetEvidence.peakDensity).toBe(0)
  expect(result.twin.staining.controls.positive).toBe(0)
  expect(result.twin.staining.controls.valid).toBe(false)
})

it('preserves preparation requirements for lipid and mineral control blocks', () => {
  const lipid = createSpecialControl('LIPID-CONTROL', 'oil-red-o')
  expect(lipid.frozen.prepared).toBe(true)
  expect(lipid.processing.history).toHaveLength(0)
  for (const id of ['von-kossa', 'alizarin-red']) {
    const mineral = createSpecialControl('MINERAL-CONTROL', id)
    expect(mineral.decal.hours).toBe(0)
    expect(mineral.events.some((e) => e.station === 'decalcification')).toBe(false)
    expect(mineral.regions.every((r) => r.mineral === 1)).toBe(true)
  }
})

it('does not let target presence override failed chemistry or paired digestion', () => {
  const pas = createSpecialControl('FAILED-CONTROL', 'pas-d')
  for (const challenge of ['inactive-diastase', 'omit-oxidation'] as const) {
    const result = runSpecialExperiment(pas, 'pas-d', challenge)
    expect(result.targetEvidence.targetAvailable).toBe(true)
    expect(result.twin.staining.controls.valid).toBe(false)
  }
})
