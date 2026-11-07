import { z } from 'zod'

/** Catalogs describe technical teaching examples, never diagnostic rules or approved procedures. */
export const LabReviewSchema = z.object({
  status: z.literal('author-checked'),
  verification: z.string().min(20),
  needsQualifiedReview: z.literal(true),
})
export const LAB_REVIEW = {
  status: 'author-checked',
  verification:
    'Technical teaching summary checked against the listed public references. Verify with a qualified histotechnology reviewer and the laboratory method before clinical use.',
  needsQualifiedReview: true,
} as const

export const ArchetypeSchema = z.object({
  id: z.string(),
  label: z.string(),
  family: z.enum([
    'skin',
    'gut',
    'gland',
    'lymphoid',
    'bone',
    'fat',
    'neural',
    'muscle',
    'placenta',
    'renal',
    'hepatic',
  ]),
  shape: z.enum(['ellipse', 'disc', 'core', 'fragments', 'wedge', 'sheet']),
  dimensionsParam: z.tuple([z.string(), z.string(), z.string()]),
  features: z.array(z.string()).min(2),
  orientation: z.string(),
  containment: z.string(),
  pathways: z.array(z.enum(['paraffin', 'frozen', 'if', 'em', 'molecular'])).min(1),
  risks: z.array(z.string()).min(2),
  sourceIds: z.array(z.string()).min(1),
  review: LabReviewSchema,
})
export type Archetype = z.infer<typeof ArchetypeSchema>

export const ProtocolActionSchema = z.enum([
  'dewax',
  'hydrate',
  'oxidize',
  'digest',
  'stain',
  'differentiate',
  'blue',
  'reduce',
  'tone',
  'wash',
  'dehydrate',
  'clear',
  'mount',
  'sensitize',
  'block',
  'retrieve',
  'hybridize',
])
export const ProtocolStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  reagent: z.string(),
  action: ProtocolActionSchema,
  durationParam: z.string(),
  dependencies: z.array(z.string()),
  note: z.string(),
})
export const ProtocolSchema = z.object({
  id: z.string(),
  label: z.string(),
  target: z.string(),
  pathway: z.enum(['paraffin', 'frozen', 'either']),
  mounting: z.enum(['resinous', 'aqueous']),
  principle: z.string(),
  result: z.string(),
  steps: z.array(ProtocolStepSchema).min(3),
  controls: z.array(z.string()).min(1),
  failures: z
    .array(z.object({ cause: z.string(), effect: z.string(), investigation: z.string() }))
    .min(1),
  sourceIds: z.array(z.string()).min(1),
  review: LabReviewSchema,
})
export type StainProtocol = z.infer<typeof ProtocolSchema>
export type ProtocolAction = z.infer<typeof ProtocolActionSchema>

export const MarkerSchema = z.object({
  id: z.string(),
  label: z.string(),
  modality: z.enum(['IHC', 'ISH']),
  localization: z.array(z.enum(['nuclear', 'cytoplasmic', 'membranous'])).min(1),
  normalExpression: z.string(),
  externalControl: z.string(),
  internalControl: z.string(),
  pitfalls: z.string(),
  technicalUse: z.string(),
  sourceIds: z.array(z.string()).min(1),
  review: LabReviewSchema,
})
export type Marker = z.infer<typeof MarkerSchema>

export const CompetencySchema = z.object({
  id: z.string(),
  label: z.string(),
  level: z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']),
  station: z.string(),
  objectiveIds: z.array(z.string()),
  evidence: z.array(z.string()).min(1),
  criticalErrors: z.array(z.string()),
  remediation: z.array(z.string()),
  sourceIds: z.array(z.string()).min(1),
  review: LabReviewSchema,
})
export type Competency = z.infer<typeof CompetencySchema>
export const CareerLevelSchema = z.object({
  id: z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']),
  title: z.string(),
  description: z.string(),
  boundary: z.string(),
  competencies: z.array(z.string()).min(1),
  theory: z.array(z.string()),
  practical: z.object({
    id: z.string(),
    title: z.string(),
    scenario: z.string(),
    rubric: z.array(z.string()).min(3),
  }),
  sourceIds: z.array(z.string()).min(1),
  review: LabReviewSchema,
})
export type CareerLevel = z.infer<typeof CareerLevelSchema>
