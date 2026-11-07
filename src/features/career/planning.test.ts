import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { calculateCapacity, completeValidationPlan, validationPlanSummary } from './planning'
import type { CapacityInputs } from './planning'
const inputs: CapacityInputs = {
  cases: 40,
  blocksPerCase: 3,
  workPerBlock: 4,
  qualityMinutes: 60,
  maintenanceMinutes: 30,
  trainingMinutes: 45,
  qualifiedStaff: 3,
  shiftMinutes: 480,
  breakMinutes: 45,
  otherUnavailableMinutes: 0,
  reagentCostPerBlock: 1.2,
  controlCostPerDay: 20,
  laborCostPerHour: 30,
}
describe('transparent planning arithmetic', () => {
  it('includes protected work and discloses exactly which costs are included', () => {
    const result = calculateCapacity(inputs)
    expect(result.blocks).toBe(120)
    expect(result.demand).toBe(615)
    expect(result.capacity).toBe(1305)
    expect(result.balance).toBe(690)
    expect(result.includedCost).toBe(884)
  })
  it('does not manufacture capacity when staffing is zero or unavailable', () => {
    const result = calculateCapacity({ ...inputs, qualifiedStaff: 0 })
    expect(result.capacity).toBe(0)
    expect(result.utilization).toBeNull()
    expect(result.balance).toBeLessThan(0)
    expect(calculateCapacity({ ...inputs, breakMinutes: 500 }).valid).toBe(false)
    expect(calculateCapacity({ ...inputs, cases: 1e308, blocksPerCase: 1e308 }).valid).toBe(false)
  })
  it('increasing workload cannot improve the balance with fixed capacity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (cases, extra) => {
          expect(
            calculateCapacity({ ...inputs, cases: cases + extra }).balance,
          ).toBeLessThanOrEqual(calculateCapacity({ ...inputs, cases }).balance)
        },
      ),
      { numRuns: 60, seed: 20261107 },
    )
  })
  it('records plan completeness without judging clinical validity', () => {
    const plan = {
      intendedUse: 'Fictional method',
      scope: '',
      comparator: 'Proposed comparator',
      expressionRange: 'Low to high',
      acceptance: 'Prospective rule',
      variation: 'Day and operator',
      limitations: 'Synthetic',
      reviewer: 'Qualified reviewer required',
    }
    expect(completeValidationPlan(plan)).toBe(false)
    plan.scope = 'Exercise boundary'
    expect(completeValidationPlan(plan)).toBe(true)
    expect(validationPlanSummary(plan)).toContain('acceptance: Prospective rule')
  })
})
