import { describe, expect, it } from 'vitest'
import { MAX_RUN_EVENTS } from '../../sim/core/events'
import { createShiftCase } from '../../sim/core/shifts'
import { LabRecordSchema, type LabRecord } from '../../store/labSchema'
import { initialState, migrateAndValidate } from '../../store/state'
import { appendShiftTransition, prepareLabLaunch } from './shiftTransitions'

function shiftRecord(eventCount: number): LabRecord {
  return {
    ...createShiftCase('LIMIT-REGRESSION', 'routine'),
    events: Array.from({ length: eventCount }, (_, sequence) => ({
      sequence,
      t: 0,
      station: 'quality' as const,
      intent: 'document',
      params: { text: `Preserved action ${sequence}` },
    })),
  }
}

describe('automatic shift transition event boundaries', () => {
  it.each(['shift.pause', 'shift.resume'] as const)(
    'rejects %s at the limit without altering the valid record or completion evidence',
    (intent) => {
      const record = {
        ...shiftRecord(MAX_RUN_EVENTS),
        completedAt: '2026-11-07T12:00:00.000Z',
      }
      const before = JSON.stringify(record)
      const result = appendShiftTransition(record, intent, 60)
      expect(result.ok).toBe(false)
      expect(result.record).toBe(record)
      expect(JSON.stringify(record)).toBe(before)
      expect(LabRecordSchema.safeParse(result.record).success).toBe(true)
      if (!result.ok) expect(result.reason).toContain('Your existing history is unchanged')
    },
  )

  it.each(['shift.pause', 'shift.resume'] as const)(
    'allows %s to use the last available event slot',
    (intent) => {
      const record = shiftRecord(MAX_RUN_EVENTS - 1)
      const result = appendShiftTransition(record, intent, 60)
      expect(result.ok).toBe(true)
      expect(record.events).toHaveLength(MAX_RUN_EVENTS - 1)
      expect(result.record.events).toHaveLength(MAX_RUN_EVENTS)
      expect(result.record.events.at(-1)?.intent).toBe(intent)
      expect(LabRecordSchema.safeParse(result.record).success).toBe(true)
    },
  )

  it('retains the full current draft and all saved history when switching would require an invalid pause', () => {
    const state = initialState()
    const draft = shiftRecord(MAX_RUN_EVENTS)
    const prior = { ...shiftRecord(2), id: 'earlier-run' }
    state.lab = { ...state.lab, draft, runs: [prior] }
    const before = JSON.stringify(state)
    const incoming = createShiftCase('LIMIT-REGRESSION', 'frozen')
    const prepared = prepareLabLaunch(state.lab, incoming, [])
    expect(prepared.ok).toBe(false)
    expect(prepared.lab).toBe(state.lab)
    expect(prepared.lab.draft).toBe(draft)
    expect(prepared.lab.runs).toEqual([prior])
    const retained = { ...state, lab: prepared.lab }
    expect(JSON.stringify(retained)).toBe(before)
    expect(migrateAndValidate(JSON.parse(JSON.stringify(retained))).ok).toBe(true)
  })

  it('preserves the valid source state if an oversized target reaches the launch boundary', () => {
    const state = initialState()
    state.lab.draft = shiftRecord(2)
    const prepared = prepareLabLaunch(state.lab, shiftRecord(MAX_RUN_EVENTS + 1), [])
    expect(prepared.ok).toBe(false)
    expect(prepared.lab).toBe(state.lab)
    expect(migrateAndValidate({ ...state, lab: prepared.lab }).ok).toBe(true)
  })

  it('saves a last-slot pause before switching and leaves the whole app state parseable', () => {
    const state = initialState()
    state.lab.draft = shiftRecord(MAX_RUN_EVENTS - 1)
    const incoming = createShiftCase('LIMIT-REGRESSION', 'frozen')
    const prepared = prepareLabLaunch(state.lab, incoming, [])
    expect(prepared.ok).toBe(true)
    expect(prepared.lab.draft).toBe(incoming)
    expect(prepared.lab.runs[0].events).toHaveLength(MAX_RUN_EVENTS)
    expect(prepared.lab.runs[0].events.at(-1)?.intent).toBe('shift.pause')
    expect(state.lab.draft.events).toHaveLength(MAX_RUN_EVENTS - 1)
    expect(migrateAndValidate({ ...state, lab: prepared.lab }).ok).toBe(true)
  })
})
