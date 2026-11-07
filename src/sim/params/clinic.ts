import { teachingParameter } from './registry'

/** Authored teaching cases and evidence thresholds, not clinical limits. */
export const CLINIC_PARAMETERS = [
  teachingParameter(
    'clinic.input-temperature-max',
    40,
    '°C',
    'Clinic input bound',
    'Interface bound for this paraffin-block teaching exercise, not a recommended setting.',
  ),
  teachingParameter(
    'clinic.input-speed-max',
    10,
    'relative pace',
    'Clinic input bound',
    'Interface bound for exploring the synthetic cutting model.',
  ),
  teachingParameter(
    'clinic.input-thickness-max',
    20,
    'model µm',
    'Clinic input bound',
    'Interface bound for these repeat-section exercises, not a clinical sectioning range.',
  ),
  teachingParameter(
    'clinic.input-he-max',
    30,
    'simulation minute',
    'Clinic input bound',
    'Interface bound for controlled hematoxylin comparisons, not a recipe.',
  ),
  teachingParameter(
    'clinic.input-retrieval-max',
    60,
    'simulation minute',
    'Clinic input bound',
    'Interface bound for exploring synthetic retrieval response and damage.',
  ),
  teachingParameter(
    'clinic.warm-block',
    32,
    '°C',
    'Compressed-ribbon case',
    'Authored warm block condition for comparing mechanical compression.',
  ),
  teachingParameter(
    'clinic.loose-clamp',
    0.25,
    'relative tightness',
    'Periodic-band case',
    'Authored clamp fault; no instrument-specific calibration is implied.',
  ),
  teachingParameter(
    'clinic.dull-blade',
    0.15,
    'relative sharpness',
    'Parallel-track case',
    'Authored blade condition; the core model derives the knife lines.',
  ),
  teachingParameter(
    'clinic.short-fixation',
    0.5,
    'hour',
    'Poor center-preservation case',
    'Deliberately inadequate exposure for the synthetic tissue geometry; not a bench instruction.',
  ),
  teachingParameter(
    'clinic.ischemia',
    24,
    'hour',
    'Poor center-preservation case',
    'Authored delay produces irreversible loss in this illustrative model.',
  ),
  teachingParameter(
    'clinic.short-infiltration',
    0.5,
    'simulation minute',
    'Poor-support case',
    'Authored incomplete infiltration; a recut cannot replace absent wax support.',
  ),
  teachingParameter(
    'clinic.note-minimum',
    60,
    'characters',
    'Investigation documentation',
    'Completeness check only; the software cannot validate the scientific correctness of prose.',
  ),
  teachingParameter(
    'clinic.improvement',
    0.05,
    'relative defect score',
    'Controlled comparison',
    'Minimum modeled change reported as improvement/worsening; not a clinical acceptance threshold.',
  ),
  teachingParameter(
    'clinic.resolved-defect',
    0.2,
    'relative defect score',
    'Mechanical outcome',
    'Illustrative threshold for technical improvement in these authored cases.',
  ),
]
export const CLINIC = Object.fromEntries(
  CLINIC_PARAMETERS.map((parameter) => [parameter.id, parameter.value as number]),
)
