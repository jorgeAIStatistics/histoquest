import { describe, expect, it } from 'vitest'
import { gradeNumeric } from '../../../engine/grading'
import { generate, MATH_KINDS } from './mathProblems'
import { evaluateSequence, STATIONS } from './processingRules'
import { FIXATION_CASES, scoreCase } from './fixationCases'
import { IHC_RUNS, scoreRun } from './ihcRuns'

const by = (...ids: string[]) => ids.map((id) => STATIONS.find((s) => s.id === id)!)

describe('processing bench rules', () => {
  it('accepts the textbook sequence', () => {
    expect(evaluateSequence(STATIONS)).toEqual([])
  })
  it('flags xylene before dehydration is complete', () => {
    const f = evaluateSequence(by('s1', 's2', 's3', 's6', 's4', 's5', 's7', 's8', 's9'))
    expect(f[0].problem).toMatch(/Xylene comes before/)
  })
  it('flags wax straight after alcohol', () => {
    const f = evaluateSequence(by('s1', 's2', 's3', 's4', 's5', 's8', 's9', 's6', 's7'))
    expect(f.some((x) => /no clearing step/.test(x.problem))).toBe(true)
  })
  it('flags decreasing alcohol and fixation not first', () => {
    const f = evaluateSequence(by('s2', 's1', 's4', 's3', 's5', 's6', 's7', 's8', 's9'))
    expect(f.map((x) => x.problem).join(' ')).toMatch(/Fixation is not first/)
    expect(f.map((x) => x.problem).join(' ')).toMatch(/goes down/)
  })
})

describe('lab math generator', () => {
  it('produces problems whose stated answer passes the grader, for every kind and many seeds', () => {
    for (const { kind } of MATH_KINDS) {
      for (let seed = 1; seed < 40; seed++) {
        const q = generate(kind, seed)
        expect(gradeNumeric(q, String(q.answer), q.unit).correct).toBe(true)
        for (const e of q.commonErrors) if (Math.abs(e.value - q.answer) > q.tolerance + 1e-6) expect(gradeNumeric(q, String(e.value), q.unit).correct).toBe(false)
      }
    }
  })
  it('computes known values', () => {
    // 70% from 95%, 500 mL → 368.42 mL
    let found = false
    for (let seed = 1; seed < 400 && !found; seed++) {
      const q = generate('dilution', seed)
      if (q.stem.includes('500 mL of 70%') && q.stem.includes('95%')) {
        expect(q.answer).toBeCloseTo(368.42, 2)
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

describe('fixation detective cases', () => {
  it('has well-formed cases: one best approach, mixed variable and artifact sets', () => {
    for (const c of FIXATION_CASES) {
      expect(c.approaches.filter((o) => o.correct).length, c.id).toBe(1)
      for (const set of [c.variables, c.artifacts]) {
        expect(set.some((o) => o.correct), c.id).toBe(true)
        expect(set.some((o) => !o.correct), c.id).toBe(true)
      }
      expect(new Set([...c.variables, ...c.approaches, ...c.artifacts].map((o) => o.why)).size).toBe(c.variables.length + c.approaches.length + c.artifacts.length)
    }
  })
  it('scores sets with penalties for wrong picks', () => {
    const c = FIXATION_CASES[0]
    const right = c.variables.filter((o) => o.correct).map((o) => o.id)
    const wrong = c.variables.filter((o) => !o.correct).map((o) => o.id)
    const best = c.approaches.find((o) => o.correct)!.id
    const arts = c.artifacts.filter((o) => o.correct).map((o) => o.id)
    expect(scoreCase(c, { variables: right, approach: best, artifacts: arts }).total).toBe(3)
    expect(scoreCase(c, { variables: [...right, ...wrong], approach: best, artifacts: arts }).variables).toBeLessThan(1)
    expect(scoreCase(c, { variables: wrong, approach: undefined, artifacts: [] }).total).toBe(0)
  })
})

describe('IHC troubleshooting runs', () => {
  it('has exactly one correct answer per decision and all four slide types', () => {
    for (const r of IHC_RUNS) {
      for (const opts of [r.interpretable, r.control, r.investigate]) expect(opts.filter((o) => o.correct).length, r.id).toBe(1)
      expect(r.slides.map((s) => s.id).sort()).toEqual(['external', 'internal', 'negative', 'patient'])
    }
  })
  it('encodes standard control logic', () => {
    const byId = Object.fromEntries(IHC_RUNS.map((r) => [r.id, r]))
    // A failed external positive control always means the run is not interpretable.
    for (const r of IHC_RUNS) if (r.slides.find((s) => s.id === 'external')!.pattern === 'none') expect(r.interpretable.find((o) => o.correct)!.id).toBe('no')
    // Signal in the negative reagent control always invalidates the run.
    for (const r of IHC_RUNS) if (['background', 'edge'].includes(r.slides.find((s) => s.id === 'negative')!.pattern)) expect(r.interpretable.find((o) => o.correct)!.id).toBe('no')
    // External control passes and internal controls fail: a specimen problem.
    expect(byId['patient-only'].interpretable.find((o) => o.correct)!.id).toBe('patient')
    const r = byId['peroxidase']
    expect(scoreRun(r, { interpretable: 'no', control: 'negative', investigate: 'block' }).total).toBe(3)
    expect(scoreRun(r, { interpretable: 'yes', control: 'external', investigate: 'primary' }).total).toBe(0)
  })
})
