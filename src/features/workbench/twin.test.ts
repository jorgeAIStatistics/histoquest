import { describe, expect, it } from 'vitest'
import { startRun, advanceRun } from './model'
import { idealControls, workbenchTwin, workbenchQuality } from './twin'
import { slideAppearance } from '../../sim/specimen/appearance'
function prepared() {
  const r = startRun('skin', 'stable-render-seed')
  r.controls = idealControls('skin')
  return r
}
describe('Workbench causal bridge', () => {
  it('uses a graded section interval rather than one exact number', () => {
    for (const section of [3, 4, 5]) {
      const r = prepared()
      r.controls.section = section
      r.station = 5
      r.findings = Array.from({ length: 5 }, (_, station) => ({
        station,
        ok: true,
        title: 'prior',
        detail: '',
        consequence: '',
        repair: '',
      }))
      expect(advanceRun(r).findings.at(-1)?.ok).toBe(true)
    }
  })
  it('carries preanalytics into nuclear preservation and instrument choices into spatial defects', () => {
    const good = prepared()
    const baseline = slideAppearance(workbenchTwin(good))
    const rush = prepared()
    rush.controls.fixation = 'rush'
    expect(slideAppearance(workbenchTwin(rush)).centerPreservation).toBeLessThan(
      baseline.centerPreservation,
    )
    const nick = prepared()
    nick.controls.blade = 'nicked'
    expect(slideAppearance(workbenchTwin(nick)).knifeLines.length).toBeGreaterThan(0)
    const warm = prepared()
    warm.controls.block = 'warm'
    expect(slideAppearance(workbenchTwin(warm)).compression).toBeGreaterThan(baseline.compression)
  })
  it('does not make an identity break look like a morphological defect', () => {
    const good = prepared()
    const bad = prepared()
    bad.controls.identity = 'relabel'
    expect(slideAppearance(workbenchTwin(bad))).toEqual(slideAppearance(workbenchTwin(good)))
    expect(workbenchQuality(bad, 0).safety).toBe(0)
  })
  it('renders ancillary preparations on separate synthetic sections', () => {
    const r = prepared()
    const routine = workbenchTwin(r, 'he')
    const ihc = workbenchTwin(r, 'ihc')
    expect(routine.staining.eosin).toBeGreaterThan(0)
    expect(ihc.staining.eosin).toBe(0)
    expect(ihc.ihc.dab).toBeGreaterThan(0)
    expect(ihc.ihc.valid).toBe(true)
  })
})
