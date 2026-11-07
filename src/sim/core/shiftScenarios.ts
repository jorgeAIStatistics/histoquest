import type { LabRecord } from '../../store/labSchema'
import { PROCESS as P } from '../params/process'
import type { Scenario } from '../specimen/types'
import { createScenario } from './scenarios'

export interface ShiftCase {
  id: string
  title: string
  archetype: string
  request: Scenario['request']
  priority: number
  arrival: number
  targetMinutes: number
  preparation: 'bottle' | 'fixed-cassettes' | 'processed-block'
  fault: string
  brief: string
  requirements: string[]
}
export const SHIFT_CASES: ShiftCase[] = [
  {
    id: 'routine',
    title: 'Routine section and H&E',
    archetype: 'skin-ellipse',
    request: 'routine',
    priority: 4,
    arrival: 0,
    targetMinutes: P['shift.routine-target'],
    preparation: 'processed-block',
    fault: '',
    brief:
      'A prepared block arrives with a documented upstream history. Verify its identity, cut and finish a routine slide while watching for incoming urgent work.',
    requirements: [
      'Record your receipt check.',
      'Cut, pick up, stain and mount a new identified section.',
      'Document technical QC before release.',
    ],
  },
  {
    id: 'processor',
    title: 'Processor alarm and reagent replacement',
    archetype: 'fatty-tissue',
    request: 'routine',
    priority: 2,
    arrival: P['shift.processor-arrival'],
    targetMinutes: P['shift.processor-target'],
    preparation: 'fixed-cassettes',
    fault: 'exhausted-alcohol',
    brief:
      'A fixed cassette batch reached an exhausted alcohol stage. The provided record shows no effective water replacement. Hold the work and investigate before running a controlled recovery.',
    requirements: [
      'Hold and record the alarm investigation.',
      'Run fresh compatible exchanges through infiltration.',
      'Embed, section and finish a new identified slide before technical release.',
    ],
  },
  {
    id: 'frozen',
    title: 'Urgent frozen consultation interruption',
    archetype: 'frozen-consult',
    request: 'frozen',
    priority: 1,
    arrival: P['shift.frozen-arrival'],
    targetMinutes: P['shift.frozen-target'],
    preparation: 'bottle',
    fault: '',
    brief:
      'A separate unfixed specimen arrives urgently. Secure the current case and establish this accession before freezing. The time target is a scenario assumption, never a reason to bypass safety.',
    requirements: [
      'Keep this case separate from any paraffin block.',
      'Record biohazard precautions and prepare an oriented frozen support.',
      'Cut, pick up, stain and mount an identified section.',
      'Document the preparation limits and technical handoff.',
    ],
  },
  {
    id: 'controls',
    title: 'Reagent-lot control failure',
    archetype: 'breast-core',
    request: 'ihc',
    priority: 3,
    arrival: P['shift.controls-arrival'],
    targetMinutes: P['shift.controls-target'],
    preparation: 'processed-block',
    fault: 'control-failure',
    brief:
      'A prepared block needs IHC after a reagent-lot change. The first control run will fail until the fault is addressed. Preserve that record, hold the run, and repeat the controlled preparation on a new section.',
    requirements: [
      'Observe a failed positive control before recording corrective action.',
      'Hold the failed run and recut a separate section.',
      'Repeat retrieval, primary and detection with the fault corrected.',
      'Release only with valid positive, low-positive and negative controls.',
    ],
  },
  {
    id: 'levels',
    title: 'Additional levels on limited tissue',
    archetype: 'colon-biopsy',
    request: 'levels',
    priority: 5,
    arrival: P['shift.levels-arrival'],
    targetMinutes: P['shift.levels-target'],
    preparation: 'processed-block',
    fault: '',
    brief: `A new work order requests ${P['practical.minimum-levels']} identified levels separated by at least ${P['practical.level-gap']} model µm. Keep the order, depths, retained sections and tissue budget connected.`,
    requirements: [
      'Collect and identify at least two separate levels.',
      'Keep the stated depth gap and remaining tissue visible.',
      'Stain, mount and review the final section before handoff.',
    ],
  },
]

export function validateShiftSeed(seed: string): string {
  const value = seed.trim()
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(value))
    throw new Error('Use 1–40 letters, numbers, underscores or hyphens for the shift seed.')
  return value
}
export function shiftRecordSeed(seed: string, caseId: string): string {
  return `SHIFT:${validateShiftSeed(seed)}:${caseId}`
}
export function shiftRecordIdentity(
  record: Pick<LabRecord, 'mode' | 'seed'>,
): { seed: string; caseId: string } | null {
  if (record.mode !== 'shift') return null
  const match = /^SHIFT:([A-Za-z0-9_-]{1,40}):([a-z]+)$/.exec(record.seed)
  return match && SHIFT_CASES.some((entry) => entry.id === match[2])
    ? { seed: match[1], caseId: match[2] }
    : null
}

/** Kept separate from shifts.ts so the replay reducer can import this without a cycle. */
export function scenarioForShiftRecord(
  record: Pick<LabRecord, 'mode' | 'seed' | 'archetype' | 'difficulty'>,
): Scenario | null {
  const identity = shiftRecordIdentity(record)
  if (!identity) return null
  const index = SHIFT_CASES.findIndex((entry) => entry.id === identity.caseId)
  const entry = SHIFT_CASES[index]
  const scenario = createScenario(record.seed, entry.archetype, record.difficulty)
  return {
    ...scenario,
    accession: `${scenario.accession}-${index + 1}`,
    request: entry.request,
    faults: entry.fault ? [entry.fault] : [],
    discrepancy: 'none',
    tat: entry.targetMinutes,
    targetPresent: true,
  }
}
