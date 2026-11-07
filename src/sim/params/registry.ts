export interface ModelParameter {
  id: string
  value: number | number[]
  range?: [number, number]
  unit: string
  scope: string
  sourceIds: string[]
  accessStatus: 'verified' | 'not-verified' | 'illustrative'
  illustrative: boolean
  note: string
}
/** Coefficients are declared as educational assumptions, never clinical calibration. */
export function teachingParameter(id: string, value: number, unit: string, scope: string, note: string, range?: [number, number]): ModelParameter {
  return { id, value, range, unit, scope, sourceIds: ['hq-original'], accessStatus: 'illustrative', illustrative: true, note }
}
export const CORE_PARAMETERS: ModelParameter[] = [
  teachingParameter('fixation.penetration-coefficient', 0.8, 'mm/√hour', 'Illustrative diffusion front', 'Chosen to visualize thickness and square-root time dependence; not a measured rate for any fixative or tissue.'),
  teachingParameter('fixation.reaction-time', 4, 'hour', 'Illustrative stabilization time constant', 'A separate reaction process follows reagent access. No clinical endpoint is inferred.'),
  teachingParameter('section.thickness', 4, 'µm', 'Routine section teaching target', 'Scenario nominal setting; actual protocols vary.', [3, 5]),
  teachingParameter('section.maximum-depth', 4000, 'µm', 'Synthetic block depth', 'Budget for visible tissue consumption in the model.'),
  teachingParameter('quality.pass-threshold', 75, '%', 'Learning rubric', 'Educational threshold, not a professional competency standard.'),
]
export const PARAMETER_BY_ID = Object.fromEntries(CORE_PARAMETERS.map(p => [p.id, p]))
export function parameterValue(id: string): number {
  const p = PARAMETER_BY_ID[id]
  if (!p || typeof p.value !== 'number') throw new Error(`Unknown scalar model parameter: ${id}`)
  return p.value
}
