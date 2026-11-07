import { teachingParameter } from './registry'

/** Fictitious planning inputs. These are neither staffing norms nor price estimates. */
export const PLANNING_PARAMETERS = [
  teachingParameter(
    'planning.cases',
    40,
    'cases/day',
    'Capacity exercise',
    'Fictitious daily case count; not a service benchmark.',
  ),
  teachingParameter(
    'planning.blocks',
    3,
    'blocks/case',
    'Capacity exercise',
    'Fictitious case mix average; actual work varies by specimen.',
  ),
  teachingParameter(
    'planning.work',
    4,
    'active minutes/block',
    'Capacity exercise',
    'Fictitious active work time; excludes instrument incubation and is not a productivity standard.',
  ),
  teachingParameter(
    'planning.quality',
    60,
    'staff minutes/day',
    'Capacity exercise',
    'Fictitious protected QC allocation; not a laboratory requirement.',
  ),
  teachingParameter(
    'planning.maintenance',
    30,
    'staff minutes/day',
    'Capacity exercise',
    'Fictitious maintenance allocation; actual instructions and needs prevail.',
  ),
  teachingParameter(
    'planning.training',
    45,
    'staff minutes/day',
    'Capacity exercise',
    'Fictitious supervised training allocation.',
  ),
  teachingParameter(
    'planning.staff',
    3,
    'qualified staff equivalents',
    'Capacity exercise',
    'Fictitious available role-qualified staff; the tool does not verify personnel qualifications.',
  ),
  teachingParameter(
    'planning.shift',
    480,
    'minutes/person',
    'Capacity exercise',
    'Fictitious shift length; not an employment or coverage recommendation.',
  ),
  teachingParameter(
    'planning.breaks',
    45,
    'minutes/person',
    'Capacity exercise',
    'Fictitious unavailable time; not a statement of legal break entitlements.',
  ),
  teachingParameter(
    'planning.other',
    0,
    'staff minutes/day',
    'Capacity exercise',
    'Additional unavailability such as leave, meetings or supervision.',
  ),
  teachingParameter(
    'planning.reagents',
    1.2,
    'fictional currency units/block',
    'Budget exercise',
    'Invented reagent cost for arithmetic practice, not a price quote.',
  ),
  teachingParameter(
    'planning.controls',
    20,
    'fictional currency units/day',
    'Budget exercise',
    'Invented control-material allocation, not an adequacy recommendation.',
  ),
  teachingParameter(
    'planning.labor',
    30,
    'fictional currency units/hour',
    'Budget exercise',
    'Invented loaded labor rate for transparent arithmetic, not compensation advice.',
  ),
] as const
export const PLANNING = Object.fromEntries(
  PLANNING_PARAMETERS.map((parameter) => [parameter.id, parameter.value as number]),
)
