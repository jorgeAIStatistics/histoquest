import { describe, expect, it } from 'vitest'
import {
  archiveCapacity,
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_RUNS,
  mergeLabRuns,
  pruneLocalRuns,
  runBytes,
  localRunBytes,
  localRunWarning,
  MAX_LOCAL_RUN_BYTES,
} from './labArchive'
import type { LabRecord } from './labSchema'
import { initialState, importJson, exportJson } from './state'

function run(index: number, changes: Partial<LabRecord> = {}): LabRecord {
  const at = new Date(Date.UTC(2026, 0, index + 1)).toISOString()
  return {
    id: `archive-${index}`,
    version: 1,
    seed: `fixture-${index}`,
    archetype: 'skin-ellipse',
    difficulty: 1,
    mode: 'free',
    title: `Saved run ${index}`,
    startedAt: at,
    completedAt: at,
    events: [],
    ...changes,
  }
}

describe('complete laboratory history', () => {
  const largeRun = (index: number) =>
    run(index, {
      events: Array.from({ length: 2000 }, (_, sequence) => ({
        sequence,
        t: sequence,
        station: 'quality' as const,
        intent: 'document',
        params: { text: 'a'.repeat(260) },
      })),
    })
  it('keeps fewer than twenty large logs while retaining the newest ones that fit the byte budget', () => {
    const all = [largeRun(0), largeRun(1), largeRun(2)]
    const recent = pruneLocalRuns(all, all)
    expect(recent).toHaveLength(1)
    expect(recent[0].id).toBe(all[2].id)
    expect(localRunBytes(recent)).toBeLessThanOrEqual(MAX_LOCAL_RUN_BYTES)
    expect(mergeLabRuns(all, recent)).toEqual(all)
    expect(localRunWarning(recent)).toBeUndefined()
  })

  it('counts the active draft against the budget but never deletes protected large logs', () => {
    const all = [largeRun(0), largeRun(1), largeRun(2)]
    const draft = { ...all[2], completedAt: undefined }
    expect(pruneLocalRuns(all, all, 20, draft)).toEqual([])
    const changed = { ...all[0], title: 'Not yet archived correction' }
    const incomplete = { ...all[1], completedAt: undefined }
    const protectedRuns = [changed, incomplete, { ...all[2], id: 'unarchived-large-run' }]
    expect(pruneLocalRuns(protectedRuns, all, 20, draft)).toEqual(protectedRuns)
    expect(localRunWarning(protectedRuns, draft)).toContain('were retained')
    expect(mergeLabRuns(all, protectedRuns, draft)).toHaveLength(4)
  })
  it('preserves every unique run and gives the local revision and active draft precedence', () => {
    const old = run(0)
    const local = { ...old, title: 'Recent revision' }
    const draft = { ...local, title: 'Current draft', completedAt: undefined }
    const merged = mergeLabRuns([old, run(1)], [local, run(2)], draft)
    expect(merged).toHaveLength(3)
    expect(merged.find((record) => record.id === old.id)).toEqual(draft)
    expect(merged.map((record) => record.id)).toEqual(['archive-0', 'archive-1', 'archive-2'])
  })

  it('keeps the twenty newest completed runs regardless of cache ordering', () => {
    const runs = Array.from({ length: 25 }, (_, i) => run(i))
    const expected = runs
      .slice(5)
      .map((record) => record.id)
      .sort()
    expect(
      pruneLocalRuns(runs, runs)
        .map((record) => record.id)
        .sort(),
    ).toEqual(expected)
    expect(
      pruneLocalRuns(runs.toReversed(), runs)
        .map((record) => record.id)
        .sort(),
    ).toEqual(expected)
    expect(pruneLocalRuns(runs, [])).toEqual(runs)
  })

  it('never prunes an unarchived, modified, or incomplete record', () => {
    const archived = Array.from({ length: 25 }, (_, i) => run(i))
    const local = archived.map((record) => ({ ...record }))
    local[0] = { ...local[0], title: 'A correction not yet durable' }
    local[1] = { ...local[1], completedAt: undefined }
    const pruned = pruneLocalRuns(
      local,
      archived.filter((record) => record.id !== 'archive-2'),
    )
    expect(pruned).toContainEqual(local[0])
    expect(pruned).toContainEqual(local[1])
    expect(pruned).toContainEqual(local[2])
    expect(pruned).not.toContainEqual(local[3])
    expect(pruned).not.toContainEqual(local[4])
    expect(pruned).toHaveLength(23)
  })

  it('enforces the count cap and computes actual UTF-8 bytes after deduplication', () => {
    const record = run(0, { title: 'Microscopía · µm' })
    expect(runBytes(record)).toBe(new TextEncoder().encode(JSON.stringify(record)).byteLength)
    expect(archiveCapacity([record, record])).toEqual({
      count: 1,
      bytes: runBytes(record),
      fits: true,
    })
    expect(archiveCapacity(Array.from({ length: MAX_ARCHIVE_RUNS }, (_, i) => run(i))).fits).toBe(
      true,
    )
    expect(
      archiveCapacity(Array.from({ length: MAX_ARCHIVE_RUNS + 1 }, (_, i) => run(i))).fits,
    ).toBe(false)
    expect(MAX_ARCHIVE_BYTES).toBe(50 * 1024 * 1024)
  })

  it('rejects corrupt records instead of silently omitting them from a backup', () => {
    expect(() => mergeLabRuns([run(0, { version: 2 as 1 })], [])).toThrow()
    expect(() => runBytes(run(0, { id: '' }))).toThrow()
  })

  it('keeps the complete run union and pre-existing study data in one valid v4 JSON', () => {
    const state = initialState()
    state.pathway.notes.fixation = 'Existing study note to preserve.'
    state.lab.runs = mergeLabRuns([run(0), run(1)], [run(2)])
    state.lab.draft = run(3, { completedAt: undefined })
    const restored = importJson(exportJson(state))
    expect(restored.ok).toBe(true)
    if (restored.ok) expect(restored.state).toEqual(state)
  })
})
