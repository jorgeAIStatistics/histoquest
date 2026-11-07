import { z } from 'zod'

/** Null means no learner decision. False is an explicit negative decision. */
export const ControlsSchema = z.object({
  identity: z.enum(['hold', 'relabel', 'accept']).nullable().default(null),
  thickness: z.number().min(1).max(10).nullable().default(null),
  fragments: z.number().int().min(0).max(12).nullable().default(null),
  sampling: z.enum(['profile', 'enface', 'random']).nullable().default(null),
  fixation: z.enum(['validated', 'rush', 'heat']).nullable().default(null),
  decalcification: z.enum(['edta', 'acid', 'none']).nullable().default(null),
  schedule: z.enum(['biopsy', 'routine', 'bone']).nullable().default(null),
  sequence: z
    .array(z.enum(['dehydrate', 'clear', 'infiltrate']))
    .length(3)
    .refine((a) => new Set(a).size === 3, 'Use each processing stage once')
    .nullable()
    .default(null),
  orientation: z.enum(['flat', 'profile', 'longitudinal']).nullable().default(null),
  section: z.number().min(1).max(12).nullable().default(null),
  blade: z.enum(['sound', 'nicked']).nullable().default(null),
  block: z.enum(['conditioned', 'warm']).nullable().default(null),
  safety: z.boolean().nullable().default(null),
  dewax: z.boolean().nullable().default(null),
  nuclei: z.boolean().nullable().default(null),
  eosin: z.boolean().nullable().default(null),
  mount: z.boolean().nullable().default(null),
  stain: z.enum(['pas', 'alcian', 'iron', 'oil']).nullable().default(null),
  positive: z.boolean().nullable().default(null),
  ihcAction: z.enum(['release', 'repeat', 'ignore']).nullable().default(null),
  location: z.enum(['nuclear', 'cytoplasmic', 'membranous']).nullable().default(null),
  handoff: z.enum(['release', 'hold']).nullable().default(null),
})
export type Controls = z.infer<typeof ControlsSchema>
export const FindingSchema = z.object({
  station: z.number().int().min(0).max(9),
  ok: z.boolean(),
  title: z.string(),
  detail: z.string(),
  consequence: z.string(),
  repair: z.string(),
  quality: z.number().min(0).max(100).optional(),
  safety: z.number().min(0).max(100).optional(),
})
export type Finding = z.infer<typeof FindingSchema>
export const WorkbenchSchema = z
  .object({
    caseId: z.enum(['skin', 'colon', 'bone']),
    // Old v3 drafts retain every decision; their newly added seed is stable.
    seed: z.string().min(1).default('legacy-workbench-v3'),
    station: z.number().int().min(0).max(10),
    controls: ControlsSchema,
    findings: z.array(FindingSchema).max(10),
    startedAt: z.string(),
    recorded: z.boolean().default(false),
  })
  .superRefine((r, ctx) => {
    if (r.findings.length !== r.station || r.findings.some((f, i) => f.station !== i))
      ctx.addIssue({ code: 'custom', message: 'Station history must be sequential.' })
  })
export type WorkbenchRun = z.infer<typeof WorkbenchSchema>
