import { describe, expect, it } from 'vitest'
import { advanceRun, canRelease, CASES, ControlsSchema, evaluateStation, startRun, WorkbenchSchema, type SpecimenCase, type WorkbenchRun } from './model'
import { exportJson, importJson, initialState, migrateAndValidate } from '../../store/state'
import { PATHWAY, pathwayQuestions } from '../../content/pathway'
import { LESSON_BY_ID, QUESTION_BY_ID } from '../../content'
import { SOURCE_BY_ID } from '../../content/sources'

function preparedRun(specimen: SpecimenCase): WorkbenchRun {
  const run = startRun(specimen.id)
  run.controls = { ...run.controls, identity: 'hold', thickness: 3, fragments: specimen.fragments, sampling: 'profile', fixation: 'validated', decalcification: 'edta', schedule: specimen.schedule, sequence: ['dehydrate', 'clear', 'infiltrate'], orientation: specimen.orientation, section: 4, blade: 'sound', block: 'conditioned', safety: true, dewax: true, nuclei: true, eosin: true, mount: true, stain: specimen.stain, positive: true, ihcAction: 'repeat', location: specimen.compartment, handoff: 'release' }
  return run
}
describe('connected specimen reasoning', () => {
  for (const specimen of CASES) it(`${specimen.title}: a supported run survives refresh at every station`, () => {
    let run = preparedRun(specimen)
    for (let i = 0; i < 10; i++) {
      expect(canRelease(run.findings)).toBe(i === 9)
      run = advanceRun(run)
      expect(run.findings.at(-1)?.ok).toBe(true)
      const result = importJson(exportJson({ ...initialState(), workbench: run }))
      expect(result.ok).toBe(true)
      if (result.ok) run = result.state.workbench!
    }
    expect(run.station).toBe(10)
    expect(advanceRun(run)).toEqual(run)
    expect(canRelease(run.findings)).toBe(true)
  })
  it('never hides an early identity failure behind a beautiful final stain', () => {
    let run = preparedRun(CASES[0])
    run.controls.identity = 'relabel'
    for (let i = 0; i < 9; i++) run = advanceRun(run)
    expect(canRelease(run.findings)).toBe(false)
    expect(evaluateStation(9, { ...run.controls, handoff: 'release' }, CASES[0], run.findings).ok).toBe(false)
    expect(evaluateStation(9, { ...run.controls, handoff: 'hold' }, CASES[0], run.findings).ok).toBe(true)
  })
  it('requires both a corrected IHC run and the expected localization', () => {
    const c = preparedRun(CASES[0]).controls
    expect(evaluateStation(8, { ...c, ihcAction: 'release' }, CASES[0], []).ok).toBe(false)
    expect(evaluateStation(8, { ...c, location: 'cytoplasmic' }, CASES[0], []).ok).toBe(false)
    expect(evaluateStation(8, c, CASES[0], []).ok).toBe(true)
  })
  it('rejects missing material, wrong exchange order and unsafe cutting', () => {
    const c = preparedRun(CASES[1]).controls
    expect(evaluateStation(1, { ...c, fragments: 3 }, CASES[1], []).ok).toBe(false)
    expect(evaluateStation(3, { ...c, sequence: ['clear', 'dehydrate', 'infiltrate'] }, CASES[1], []).ok).toBe(false)
    expect(evaluateStation(5, { ...c, safety: false }, CASES[1], []).ok).toBe(false)
  })
  it('rejects malformed drafts instead of resuming into an impossible station', () => {
    expect(WorkbenchSchema.safeParse({ ...startRun('skin'), station: 8 }).success).toBe(false)
    expect(WorkbenchSchema.safeParse({ ...startRun('skin'), caseId: 'unknown' }).success).toBe(false)
    expect(ControlsSchema.safeParse({ sequence: ['clear', 'clear', 'infiltrate'] }).success).toBe(false)
    expect(ControlsSchema.safeParse({ section: NaN }).success).toBe(false)
  })
  it('migrates existing v2 data without changing clinical records or exam history', () => {
    const current = initialState()
    current.route2.degree.major = 'Biology'
    current.lessons['L-01'] = { startedAt: '2026-11-01T00:00:00Z', step: 4 }
    const { pathway: _p, ...old } = current
    const result = migrateAndValidate({ ...old, version: 2 })
    expect(result.ok).toBe(true)
    if (result.ok) { expect(result.state.route2).toEqual(current.route2); expect(result.state.lessons).toEqual(current.lessons); expect(result.state.pathway.completed).toEqual([]) }
  })
  it('exports and imports notes, chapter completion and specimen history together', () => {
    const s = initialState()
    s.pathway = { completed: ['fixation'], lastChapter: 'fixation', notes: { fixation: 'Ask about the validated fixation window.' } }
    s.workbench = preparedRun(CASES[2])
    const r = importJson(exportJson(s))
    expect(r.ok).toBe(true)
    if (r.ok) { expect(r.state.pathway).toEqual(s.pathway); expect(r.state.workbench).toEqual(s.workbench) }
  })
})
describe('pathway links and retrieval', () => {
  it('keeps every chapter connected to valid questions, lessons, and references', () => {
    expect(PATHWAY).toHaveLength(12)
    expect(new Set(PATHWAY.map(c => c.id)).size).toBe(12)
    expect(pathwayQuestions).toHaveLength(24)
    for (const c of PATHWAY) {
      expect(c.checks).toHaveLength(2)
      for (const id of c.checks) expect(QUESTION_BY_ID[id]).toBeDefined()
      for (const id of c.lessons) expect(LESSON_BY_ID[id]).toBeDefined()
      for (const id of c.sources) expect(SOURCE_BY_ID[id]).toBeDefined()
    }
  })
})
