import { z } from 'zod'
import { EventLogSchema } from '../sim/core/events'

/** The versioned storage boundary contains no renderer or content-catalog imports. */
export const LabRecordSchema = z.object({
  id: z.string().min(1).max(100),
  version: z.literal(1),
  seed: z.string().min(1).max(100),
  archetype: z.string().min(1).max(80),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  mode: z.enum(['free', 'guided', 'practical', 'shift', 'clinic']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  events: EventLogSchema,
  title: z.string().max(200),
  practicalId: z.string().optional(),
})
export type LabRecord = z.infer<typeof LabRecordSchema>
export const LabStateSchema = z.object({
  draft: LabRecordSchema.optional(),
  runs: z.array(LabRecordSchema).default([]),
  passedPracticals: z.array(z.string()).default([]),
  tutorials: z.array(z.string()).default([]),
  reviewRecords: z.array(z.object({ itemId: z.string(), reviewer: z.string(), date: z.string(), notes: z.string(), disposition: z.enum(['needs-review', 'correction-proposed', 'review-recorded']) })).default([]),
  view: z.enum(['3d', '2d']).default('3d'),
  quality: z.enum(['auto', 'low', 'medium', 'high']).default('auto'),
})
export const initialLabState = () => LabStateSchema.parse({})
