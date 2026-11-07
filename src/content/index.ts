import { z } from 'zod'
import { ACTIVE_GUIDELINE, OBJECTIVES } from './curriculum'
import {
  AtlasEntrySchema,
  CardSchema,
  LessonSchema,
  QuestionSchema,
  type AtlasEntry,
  type Card,
  type Lesson,
  type Question,
} from './schema'
import * as fixProc from './data/fixation-processing'
import * as staining from './data/staining'
import * as microOps from './data/microtomy-operations'
import * as atlasData from './data/atlas'
import { pathwayQuestions } from './pathway'
import { LAB_QUESTIONS, LAB_LESSONS } from './lab/education'

/** Parse once at startup so defaults are applied; invalid items are excluded and reported, never shown. */
function parseAll<T>(
  schema: z.ZodType<T>,
  items: unknown[],
  label: string,
  problems: string[],
): T[] {
  const out: T[] = []
  for (const item of items) {
    const r = schema.safeParse(item)
    if (r.success) out.push(r.data)
    else problems.push(`${label} ${(item as { id?: string }).id}: ${r.error.issues[0]?.message}`)
  }
  return out
}

export const contentProblems: string[] = []

const allQuestions = parseAll(
  QuestionSchema,
  [
    ...fixProc.questions,
    ...staining.questions,
    ...microOps.questions,
    ...pathwayQuestions,
    ...LAB_QUESTIONS,
  ],
  'question',
  contentProblems,
)
/** Retired items stay in the source for history but are never served. */
export const QUESTIONS: Question[] = allQuestions.filter((q) => q.review.status !== 'retired')
export const CARDS: Card[] = parseAll(
  CardSchema,
  [...fixProc.cards, ...staining.cards, ...microOps.cards],
  'card',
  contentProblems,
)

const LESSON_ORDER = [
  'L-01',
  'L-02',
  'L-03',
  'L-04',
  'L-05',
  'L-06',
  'L-07',
  'L-08',
  'L-09',
  'L-10',
  'L-11',
  'L-12',
  'L-13',
  'L-14',
  'L-15',
  'L-16',
  'L-17',
  'L-18',
  'L-19',
  'L-20',
  'L-21',
  'L-22',
  'L-23',
]
export const LESSONS: Lesson[] = parseAll(
  LessonSchema,
  [...fixProc.lessons, ...staining.lessons, ...microOps.lessons, ...LAB_LESSONS],
  'lesson',
  contentProblems,
).sort((a, b) => LESSON_ORDER.indexOf(a.id) - LESSON_ORDER.indexOf(b.id))
export const ATLAS: AtlasEntry[] = parseAll(
  AtlasEntrySchema,
  atlasData.atlas,
  'atlas',
  contentProblems,
)

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<
  string,
  Question
>
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<string, Card>
export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<
  string,
  Lesson
>
export const ATLAS_BY_ID = Object.fromEntries(ATLAS.map((a) => [a.id, a])) as Record<
  string,
  AtlasEntry
>
export const Q_OBJECTIVE = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.objective])) as Record<
  string,
  string
>
export const C_OBJECTIVE = Object.fromEntries(CARDS.map((c) => [c.id, c.objective])) as Record<
  string,
  string
>

export const DOMAIN_NAMES = Object.fromEntries(
  ACTIVE_GUIDELINE.domains.map((d) => [d.id, d.name]),
) as Record<string, string>

export const SIMULATIONS: {
  id: string
  title: string
  station: string
  status: 'ready' | 'in-development'
  objectives: string[]
  blurb: string
}[] = [
  {
    id: 'specimen-journey',
    title: 'Specimen journey',
    station: 'accessioning',
    status: 'ready',
    objectives: ['FIX-02', 'PROC-01', 'EMB-01', 'STAIN-07', 'OPS-08'],
    blurb:
      'Follow a fictional shave biopsy from receipt to slide review. Every decision has downstream consequences.',
  },
  {
    id: 'fixation-detective',
    title: 'Fixation detective',
    station: 'fixation',
    status: 'ready',
    objectives: ['FIX-02', 'FIX-03', 'FIX-04', 'FIX-05'],
    blurb:
      'Five fixation problems: pick the variables that matter, choose an approach, and predict the artifacts.',
  },
  {
    id: 'processing-bench',
    title: 'Processing bench',
    station: 'processor',
    status: 'ready',
    objectives: ['PROC-01', 'PROC-02', 'PROC-06'],
    blurb: 'Arrange a processing schedule and troubleshoot what goes wrong when the order breaks.',
  },
  {
    id: 'embedding-studio',
    title: 'Embedding studio',
    station: 'embedding',
    status: 'ready',
    objectives: ['EMB-01'],
    blurb: 'Rotate tissue in the mold and preview what the sectioning plane will show.',
  },
  {
    id: 'microtomy-challenge',
    title: 'Microtomy challenge',
    station: 'microtome',
    status: 'ready',
    objectives: ['EMB-02', 'EMB-03'],
    blurb: 'Investigate chatter, compression, folds and knife lines. Weigh competing causes.',
  },
  {
    id: 'stain-studio',
    title: 'Stain studio',
    station: 'stainer',
    status: 'ready',
    objectives: ['STAIN-01', 'STAIN-02', 'STAIN-07'],
    blurb: 'Build H&E and PAS/PAS-D sequences, match targets, and predict results.',
  },
  {
    id: 'ihc-room',
    title: 'IHC troubleshooting room',
    station: 'ihc',
    status: 'ready',
    objectives: ['STAIN-08', 'STAIN-09'],
    blurb:
      'Six failed IHC runs: read the controls, decide if the run is interpretable, and choose what to investigate first.',
  },
  {
    id: 'lab-math',
    title: 'Laboratory mathematics',
    station: 'bench',
    status: 'ready',
    objectives: ['OPS-03', 'OPS-04'],
    blurb: 'Step-by-step solutions and dilutions, graded on number and unit.',
  },
]
export const SIM_TITLES = {
  ...Object.fromEntries(SIMULATIONS.map((s) => [s.id, s.title])),
  'specimen-workbench': 'Specimen workbench',
} as Record<string, string>

export const OBJECTIVE_TITLES = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o.title]))
