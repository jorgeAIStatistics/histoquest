import { expect, it } from 'vitest'
import { MODEL_PARAMETERS } from './index'
import { SOURCE_BY_ID } from '../../content/sources'
it('every registered simulation setting has units, scope, sources and an explicit calibration status', () => {
  expect(new Set(MODEL_PARAMETERS.map((p) => p.id)).size).toBe(MODEL_PARAMETERS.length)
  for (const p of MODEL_PARAMETERS) {
    expect(p.unit, p.id).toBeTruthy()
    expect(p.scope, p.id).toBeTruthy()
    expect(p.note, p.id).toBeTruthy()
    expect(typeof p.illustrative, p.id).toBe('boolean')
    expect(p.sourceIds.length, p.id).toBeGreaterThan(0)
    for (const value of Array.isArray(p.value) ? p.value : [p.value])
      expect(Number.isFinite(value), p.id).toBe(true)
    for (const id of p.sourceIds) expect(SOURCE_BY_ID[id], `${p.id}: ${id}`).toBeDefined()
    expect(['verified', 'not-verified', 'illustrative']).toContain(p.accessStatus)
  }
})
