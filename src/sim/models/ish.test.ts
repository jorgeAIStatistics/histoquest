import { it, expect } from 'vitest'
import { referenceTwin } from '../core/reference'
import { createScenario } from '../core/scenarios'
import { hybridize, ishControls, stringencyWash } from './ish'
it('ISH control failure remains uninterpretable and excessive stringency loses target signal', () => {
  const t = referenceTwin(createScenario('ish-test', 'lymph-node', 1))
  hybridize(t, 'EBER', 30, 40, 1)
  const before = t.ihc.dab
  stringencyWash(t, 1)
  expect(t.ihc.dab).toBe(before)
  expect(t.ihc.background).toBeLessThan(0.2)
  ishControls(t, false, true)
  expect(t.ihc.valid).toBe(false)
  ishControls(t, true, true, true)
  expect(t.ihc.valid).toBe(true)
  stringencyWash(t, 6)
  expect(t.ihc.dab).toBeLessThan(before)
  expect(t.ihc.valid).toBe(false)
})
