import { z } from 'zod'
import { WorkbenchSchema } from '../features/workbench/model'

export const SCHEMA_VERSION = 3

const Srs = z.object({
  ease: z.number(),
  interval: z.number(),
  reps: z.number(),
  lapses: z.number(),
  due: z.string(),
  last: z.string().optional(),
})

export const AttemptSchema = z.object({
  qid: z.string(),
  qVersion: z.number(),
  at: z.string(), // ISO timestamp
  day: z.string(), // learner-local date
  correct: z.boolean(),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  mode: z.enum(['study', 'quiz', 'exam', 'lesson', 'review']),
  /** True only the first time this learner ever answered this question. */
  first: z.boolean(),
  /** For a repeat: whole days since the previous attempt of this item (retention signal). */
  gapDays: z.number().optional(),
})
export type Attempt = z.infer<typeof AttemptSchema>

export const CardReviewSchema = z.object({ cid: z.string(), at: z.string(), day: z.string(), correct: z.boolean(), confidence: z.number(), gapDays: z.number().optional() })

export const SimRunSchema = z.object({
  sim: z.string(),
  at: z.string(),
  day: z.string(),
  /** Reasoning decisions judged correct / total decisions. */
  correct: z.number(),
  total: z.number(),
  objectives: z.array(z.string()),
  summary: z.string(),
})
export type SimRun = z.infer<typeof SimRunSchema>

export const SessionSchema = z.object({
  id: z.string(),
  kind: z.enum(['quiz', 'domain', 'mixed', 'review', 'exam', 'case']),
  mode: z.enum(['study', 'exam']),
  title: z.string(),
  seed: z.string(),
  questionIds: z.array(z.string()),
  answers: z.record(z.string(), z.object({ value: z.string(), unit: z.string().optional(), confidence: z.number() })),
  flags: z.array(z.string()),
  index: z.number(),
  startedAt: z.string(),
  /** Exam mode: absolute deadline (ISO). Remaining time is derived from it, so refresh cannot reset the clock. */
  deadline: z.string().optional(),
  submittedAt: z.string().optional(),
  /** Study mode: ids whose feedback has been shown (answer locked). */
  revealed: z.array(z.string()).default([]),
})
export type Session = z.infer<typeof SessionSchema>

export const PlanItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['review', 'weak', 'new', 'challenge']),
  title: z.string(),
  why: z.string(),
  minutes: z.number(),
  href: z.string(),
  done: z.boolean(),
  skipped: z.boolean(),
})
export type PlanItem = z.infer<typeof PlanItemSchema>

const Route2 = z.object({
  degree: z.object({
    title: z.string(),
    major: z.string(),
    institution: z.string(),
    conferred: z.string(),
    accredited: z.enum(['unknown', 'yes', 'no']),
    bioChemHours: z.string(),
    transcript: z.enum(['none', 'requested', 'have-official', 'evaluated']),
  }),
  jobs: z.array(
    z.object({
      id: z.string(),
      employer: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      hoursPerWeek: z.number(),
      setting: z.enum(['clinical', 'veterinary', 'industry', 'research', 'unknown']),
      cliaStatus: z.enum(['unknown', 'clia', 'clip', 'jci', 'iso15189', 'none']),
      supervisor: z.string(),
      formStatus: z.enum(['not-started', 'requested', 'signed', 'letter-received']),
      notes: z.string(),
    }),
  ),
  competencies: z.record(
    z.string(),
    z.object({ self: z.enum(['none', 'some', 'routine']), documented: z.boolean(), notes: z.string() }),
  ),
})
export type Route2Data = z.infer<typeof Route2>

export const StateSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  createdAt: z.string(),
  onboarded: z.boolean(),
  profile: z.object({ name: z.string(), examDate: z.string(), focus: z.array(z.string()) }),
  settings: z.object({
    theme: z.enum(['system', 'light', 'dark']),
    sound: z.boolean(),
    motion: z.enum(['system', 'reduced', 'full']),
    sessionMinutes: z.union([z.literal(10), z.literal(20), z.literal(45)]),
    streaks: z.boolean(),
    accent: z.string(),
    tutorDepth: z.enum(['brief', 'standard', 'deep']),
  }),
  attempts: z.array(AttemptSchema),
  cardReviews: z.array(CardReviewSchema),
  srs: z.record(z.string(), Srs),
  lessons: z.record(z.string(), z.object({ startedAt: z.string(), step: z.number(), completedAt: z.string().optional(), predictionCorrect: z.boolean().optional() })),
  sims: z.array(SimRunSchema),
  sessions: z.array(SessionSchema),
  activeSessionId: z.string().optional(),
  plan: z.object({ day: z.string(), minutes: z.number(), items: z.array(PlanItemSchema), deferredTo: z.string().optional() }).optional(),
  xp: z.array(z.object({ at: z.string(), amount: z.number(), reason: z.string() })),
  activeDays: z.array(z.string()),
  route2: Route2,
  pathway: z.object({
    completed: z.array(z.string()).default([]),
    notes: z.record(z.string(), z.string()).default({}),
    lastChapter: z.string().default('tissue-language'),
  }).default({ completed: [], notes: {}, lastChapter: 'tissue-language' }),
  workbench: WorkbenchSchema.optional(),
})
export type AppState = z.infer<typeof StateSchema>

export function initialState(now = new Date()): AppState {
  return {
    version: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    onboarded: false,
    profile: { name: '', examDate: '', focus: [] },
    settings: { theme: 'system', sound: false, motion: 'system', sessionMinutes: 20, streaks: true, accent: 'hematoxylin', tutorDepth: 'standard' },
    attempts: [],
    cardReviews: [],
    srs: {},
    lessons: {},
    sims: [],
    sessions: [],
    xp: [],
    activeDays: [],
    pathway: { completed: [], notes: {}, lastChapter: 'tissue-language' },
    route2: {
      degree: { title: '', major: '', institution: '', conferred: '', accredited: 'unknown', bioChemHours: '', transcript: 'none' },
      jobs: [],
      competencies: {},
    },
  }
}

/**
 * Migrations from older stored versions. Each takes the raw object at version n and returns n+1.
 * v1 → v2: v1 stored `settings.minutes`; renamed to `sessionMinutes`, and added `tutorDepth`.
 */
const MIGRATIONS: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  2: (s) => ({ ...s, version: 3, pathway: { completed: [], notes: {}, lastChapter: 'tissue-language' } }),
  1: (s) => {
    const settings = { ...(s.settings as Record<string, unknown>) }
    settings.sessionMinutes = settings.minutes ?? 20
    delete settings.minutes
    settings.tutorDepth ??= 'standard'
    return { ...s, settings, version: 2 }
  },
}

export type LoadResult = { ok: true; state: AppState; migratedFrom?: number } | { ok: false; error: string }

export function migrateAndValidate(raw: unknown): LoadResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Not a HistoQuest progress file.' }
  let obj = raw as Record<string, unknown>
  const from = typeof obj.version === 'number' ? obj.version : NaN
  if (!Number.isFinite(from)) return { ok: false, error: 'Missing schema version.' }
  if (from > SCHEMA_VERSION) return { ok: false, error: `This file is from a newer HistoQuest (v${from}).` }
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const m = MIGRATIONS[v]
    if (!m) return { ok: false, error: `No migration from v${v}.` }
    obj = m(obj)
  }
  const parsed = StateSchema.safeParse(obj)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: `Invalid progress data at ${issue.path.join('.') || 'root'}: ${issue.message}` }
  }
  return { ok: true, state: parsed.data, migratedFrom: from < SCHEMA_VERSION ? from : undefined }
}

export const STORAGE_KEY = 'histoquest:state'
export const BACKUP_KEY = 'histoquest:state:backup'

export function exportJson(state: AppState): string {
  return JSON.stringify({ app: 'HistoQuest', exportedAt: new Date().toISOString(), ...state }, null, 2)
}

export function importJson(text: string): LoadResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }
  if (raw && typeof raw === 'object') {
    const { app: _app, exportedAt: _e, ...rest } = raw as Record<string, unknown>
    raw = rest
  }
  return migrateAndValidate(raw)
}
