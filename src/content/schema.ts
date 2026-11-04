import { z } from 'zod'

/** A citation. `note` says what the source supports; never invent page numbers for unread sources. */
export const RefSchema = z.object({
  sourceId: z.string(),
  note: z.string().optional(),
})
export type Ref = z.infer<typeof RefSchema>

/** Honest review status. Source-backed is not the same as expert-reviewed. */
export const ReviewSchema = z.object({
  status: z.enum(['draft', 'author-checked', 'expert-reviewed', 'retired']),
  /** What was verified and how. */
  verification: z.string(),
  reviewer: z.string().optional(),
  reviewedOn: z.string().optional(),
})

/** Demonstrations implemented in src/features/learn/demos. */
export const DEMO_KEYS = [
  'penetration-vs-fixation',
  'crosslink',
  'sequence',
  'embedding-plane',
  'section-ribbon',
  'pas-diastase',
  'ihc-layers',
  'dilution-bench',
] as const

/** Schematic illustrations available for question images (src/art/schematics.tsx). */
export const SCHEMATIC_KEYS = [
  'artifact-chatter',
  'artifact-compression',
  'artifact-knife-lines',
  'artifact-folds',
  'artifact-holes',
  'embed-skin-ellipse',
  'embed-tubular',
  'ihc-layers',
] as const

const DomainEnum = z.enum(['FIX', 'PROC', 'EMB', 'STAIN', 'OPS'])

export const ImageSchema = z.object({
  /** Key into the schematic illustration registry (src/art/schematics.tsx). */
  schematic: z.enum(SCHEMATIC_KEYS),
  alt: z.string(),
  kind: z.literal('schematic'),
  license: z.string(),
  attribution: z.string(),
})

const Base = {
  id: z.string().regex(/^Q-[A-Z]+-\d{3}$/),
  version: z.number().int().positive(),
  domain: DomainEnum,
  objective: z.string(),
  difficulty: z.number().int().min(1).max(3).describe('Author estimate: 1 recall, 2 application, 3 analysis'),
  kind: z.enum(['recall', 'application', 'case', 'calculation']),
  stem: z.string().min(10),
  references: z.array(RefSchema).min(1),
  review: ReviewSchema,
  image: ImageSchema.optional(),
  tags: z.array(z.string()).default([]),
}

export const ChoiceQuestionSchema = z.object({
  ...Base,
  format: z.literal('choice'),
  options: z
    .array(z.object({ id: z.string(), text: z.string(), rationale: z.string().min(8) }))
    .min(4)
    .max(5),
  answer: z.string(),
  explanation: z.string().min(20),
})

export const NumericQuestionSchema = z.object({
  ...Base,
  format: z.literal('numeric'),
  answer: z.number(),
  unit: z.string(),
  /** Other spellings of the unit that are accepted as equivalent. */
  unitAliases: z.array(z.string()).default([]),
  /** Absolute tolerance in the answer's unit. */
  tolerance: z.number().nonnegative(),
  steps: z.array(z.string()).min(1),
  explanation: z.string(),
  commonErrors: z.array(z.object({ value: z.number(), why: z.string() })).default([]),
})

export const QuestionSchema = z.discriminatedUnion('format', [ChoiceQuestionSchema, NumericQuestionSchema])
export type Question = z.infer<typeof QuestionSchema>
export type ChoiceQuestion = z.infer<typeof ChoiceQuestionSchema>
export type NumericQuestion = z.infer<typeof NumericQuestionSchema>

export const CardSchema = z.object({
  id: z.string().regex(/^C-[A-Z]+-\d{3}$/),
  objective: z.string(),
  front: z.string(),
  back: z.string(),
  references: z.array(RefSchema).min(1),
  review: ReviewSchema,
})
export type Card = z.infer<typeof CardSchema>

const ChoiceBlock = z.object({
  prompt: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
  answer: z.string(),
  reveal: z.string(),
})

export const LessonSchema = z.object({
  id: z.string().regex(/^L-\d{2}$/),
  version: z.number().int().positive(),
  slug: z.string(),
  title: z.string(),
  domain: DomainEnum,
  objectives: z.array(z.string()).min(1),
  minutes: z.number().int().positive(),
  prerequisites: z.array(z.string()).default([]),
  /** 1. A practical laboratory question. */
  labQuestion: z.string(),
  /** Dermatopathology connection, when there is a natural one. */
  dermConnection: z.string().optional(),
  /** Optional "Explain the basics" layer. */
  basics: z.array(z.string()).default([]),
  /** 2. Concise explanation, as short paragraphs. */
  explanation: z.array(z.string()).min(2),
  keyPoints: z.array(z.string()).default([]),
  /** 3. Demonstration: key into the demo registry, plus what it shows. */
  demo: z.object({
    key: z.enum(DEMO_KEYS),
    caption: z.string(),
    /** For key 'sequence': ordered steps the animator plays through. */
    steps: z.array(z.object({ label: z.string(), detail: z.string() })).default([]),
  }),
  /** 4. Predict before reveal. */
  prediction: ChoiceBlock,
  /** 5. Worked example. */
  workedExample: z.object({ problem: z.string(), steps: z.array(z.string()).min(2), result: z.string() }),
  /** 6. Retrieval practice: question ids from the bank. */
  retrieval: z.array(z.string()).min(2),
  /** 7. Troubleshooting problem. */
  troubleshooting: ChoiceBlock,
  /** 8. Takeaway and sources. */
  takeaway: z.string(),
  references: z.array(RefSchema).min(1),
  review: ReviewSchema,
  /** Virtual-lab simulation that pairs with this lesson. */
  simulation: z.string().optional(),
})
export type Lesson = z.infer<typeof LessonSchema>

export const AtlasEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(['stain', 'fixative', 'artifact', 'concept', 'calculation', 'glossary']),
  name: z.string(),
  aka: z.array(z.string()).default([]),
  summary: z.string(),
  facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  compareWith: z.array(z.string()).default([]),
  objectives: z.array(z.string()).min(1),
  lessons: z.array(z.string()).default([]),
  references: z.array(RefSchema).min(1),
  review: ReviewSchema,
})
export type AtlasEntry = z.infer<typeof AtlasEntrySchema>
