export interface CapacityInputs {
  cases: number
  blocksPerCase: number
  workPerBlock: number
  qualityMinutes: number
  maintenanceMinutes: number
  trainingMinutes: number
  qualifiedStaff: number
  shiftMinutes: number
  breakMinutes: number
  otherUnavailableMinutes: number
  reagentCostPerBlock: number
  controlCostPerDay: number
  laborCostPerHour: number
}
export interface CapacityResult {
  blocks: number
  activeWork: number
  protectedWork: number
  demand: number
  capacity: number
  balance: number
  utilization: number | null
  reagentCost: number
  laborCost: number
  includedCost: number
  valid: boolean
}
/** Arithmetic only: capacity is constrained by the role/qualification assumptions the learner supplies. */
export function calculateCapacity(input: CapacityInputs): CapacityResult {
  const valid =
    Object.values(input).every((value) => Number.isFinite(value) && value >= 0) &&
    input.breakMinutes <= input.shiftMinutes
  if (!valid)
    return {
      blocks: 0,
      activeWork: 0,
      protectedWork: 0,
      demand: 0,
      capacity: 0,
      balance: 0,
      utilization: null,
      reagentCost: 0,
      laborCost: 0,
      includedCost: 0,
      valid: false,
    }
  const blocks = input.cases * input.blocksPerCase
  const activeWork = blocks * input.workPerBlock
  const protectedWork = input.qualityMinutes + input.maintenanceMinutes + input.trainingMinutes
  const demand = activeWork + protectedWork
  const capacity = Math.max(
    0,
    input.qualifiedStaff * (input.shiftMinutes - input.breakMinutes) -
      input.otherUnavailableMinutes,
  )
  const reagentCost = blocks * input.reagentCostPerBlock + input.controlCostPerDay
  const laborCost = ((input.qualifiedStaff * input.shiftMinutes) / 60) * input.laborCostPerHour
  if (
    ![
      blocks,
      activeWork,
      protectedWork,
      demand,
      capacity,
      reagentCost,
      laborCost,
      reagentCost + laborCost,
    ].every(Number.isFinite)
  )
    return {
      blocks: 0,
      activeWork: 0,
      protectedWork: 0,
      demand: 0,
      capacity: 0,
      balance: 0,
      utilization: null,
      reagentCost: 0,
      laborCost: 0,
      includedCost: 0,
      valid: false,
    }
  return {
    blocks,
    activeWork,
    protectedWork,
    demand,
    capacity,
    balance: capacity - demand,
    utilization: capacity > 0 ? demand / capacity : null,
    reagentCost,
    laborCost,
    includedCost: reagentCost + laborCost,
    valid: true,
  }
}

export interface ValidationPlan {
  intendedUse: string
  scope: string
  comparator: string
  expressionRange: string
  acceptance: string
  variation: string
  limitations: string
  reviewer: string
}
export function validationPlanSummary(plan: ValidationPlan): string {
  return Object.entries(plan)
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join('\n')
}
export function completeValidationPlan(plan: ValidationPlan): boolean {
  return Object.values(plan).every((value) => value.trim().length > 0)
}
