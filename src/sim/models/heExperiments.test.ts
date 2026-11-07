import { expect, it } from 'vitest'
import { referenceTwin } from '../core/reference'
import { createScenario } from '../core/scenarios'
import { createStainingState } from '../specimen/initial'
import { slideAppearance } from '../specimen/appearance'
import { HE_REAGENTS, heControl } from './heExperiments'
import { stainStep } from './staining'
import { PROCESS as P } from '../params/process'
it('replays the same actual reagent activity and lot on an independent prepared H&E control', () => {
  const t = referenceTwin({ ...createScenario('HE-CONTROL'), faults: [], discrepancy: 'none' })
  t.staining = createStainingState()
  for (const reagent of HE_REAGENTS)
    stainStep(
      t,
      reagent,
      P[`he.${reagent}-time`],
      reagent === 'hematoxylin' ? 0 : 1,
      'EXHAUSTED-HEMA',
    )
  const control = heControl(t)
  expect(control.staining.history).toEqual(t.staining.history)
  expect(control.staining.hematoxylin).toBe(0)
  expect(control.staining.eosin).toBe(t.staining.eosin)
  expect(control.scenario.seed).not.toBe(t.scenario.seed)
})
it('preserves case-specific preanalytic injury when a control stains successfully', () => {
  const t = referenceTwin({ ...createScenario('HE-INJURY'), faults: [], discrepancy: 'none' })
  t.regions.forEach((r) => (r.fixed = 0.1))
  t.ihc.preservation = 0.2
  const before = structuredClone(t)
  const control = heControl(t)
  expect(slideAppearance(control).preservation).toBeGreaterThan(slideAppearance(t).preservation)
  expect(control.staining.hematoxylin).toBe(t.staining.hematoxylin)
  expect(t).toEqual(before)
})
