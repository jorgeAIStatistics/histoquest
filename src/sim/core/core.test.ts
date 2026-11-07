import { describe, expect, it } from 'vitest'
import { appendEvent, EventLogSchema } from './events'
import { randomStream } from './random'
import { millimetersToMicrometers, micrometersToMillimeters } from './units'
import { CORE_PARAMETERS } from '../params/registry'
import { exportJson, importJson, initialState } from '../../store/state'
import { SOURCE_BY_ID } from '../../content/sources'

describe('simulation foundations', () => {
  it('keeps deterministic independent random streams', () => {
    const a = randomStream('same', 'geometry'), b = randomStream('same', 'geometry'), c = randomStream('same', 'faults')
    expect(Array.from({ length: 30 }, a)).toEqual(Array.from({ length: 30 }, b))
    expect(randomStream('same', 'geometry')()).not.toBe(c())
  })
  it('validates event ordering and finite values', () => {
    const e = { t: 0, station: 'microtomy' as const, intent: 'set', params: { thickness: 4 } }
    const log = appendEvent([], e)
    expect(log[0].sequence).toBe(0)
    expect(EventLogSchema.safeParse([{ ...log[0], sequence: 2 }]).success).toBe(false)
    expect(() => appendEvent(log, { ...e, t: -1 })).toThrow()
    expect(() => appendEvent(log, { ...e, params: { thickness: NaN } })).toThrow()
  })
  it('makes gross and section units explicit', () => {
    expect(millimetersToMicrometers(3)).toBe(3000)
    expect(micrometersToMillimeters(4)).toBe(0.004)
  })
  it('requires provenance and a declared illustration flag for every parameter', () => {
    expect(new Set(CORE_PARAMETERS.map(p => p.id)).size).toBe(CORE_PARAMETERS.length)
    for (const p of CORE_PARAMETERS) {
      expect(p.sourceIds.length).toBeGreaterThan(0)
      expect(typeof p.illustrative).toBe('boolean')
      expect(p.unit.length).toBeGreaterThan(0)
      expect(p.note.length).toBeGreaterThan(10)
      for (const id of p.sourceIds) expect(SOURCE_BY_ID[id]).toBeDefined()
    }
  })
  it('migrates a v3 backup without rewriting its study or professional records', () => {
    const original = initialState(); original.route2.degree.major = 'Biology'
    original.pathway.notes.fixation = 'Preserve this note'
    original.attempts = [{ qid: 'Q-FIX-001', qVersion: 1, at: '2026-01-01', day: '2026-01-01', correct: true, confidence: 3, mode: 'study', first: true }]
    const { lab: _lab, ...v3 } = original
    const result = importJson(JSON.stringify({ ...v3, version: 3 }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.state.route2).toEqual(original.route2)
      expect(result.state.attempts).toEqual(original.attempts)
      expect(result.state.pathway).toEqual(original.pathway)
      expect(result.state.lab.runs).toEqual([])
      expect(importJson(exportJson(result.state))).toEqual({ ok: true, state: result.state, migratedFrom: undefined })
    }
  })
})
