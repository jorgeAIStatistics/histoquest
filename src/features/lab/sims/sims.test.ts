import { describe, expect, it } from 'vitest'
import { gradeNumeric } from '../../../engine/grading'
import { generate, MATH_KINDS } from './mathProblems'
import { evaluateSequence, STATIONS } from './processingRules'

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
