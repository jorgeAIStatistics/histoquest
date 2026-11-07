import { LESSON_BY_ID } from '../../content'
import { ACTIVE_GUIDELINE } from '../../content/curriculum'
import { CAREER_LEVELS } from '../../content/lab/curriculum'
import { PATHWAY } from '../../content/pathway'
import { gradeClinic } from '../../sim/core/clinic'
import { replayRun } from '../../sim/core/replay'
import { assessShift, shiftRecordIdentity } from '../../sim/core/shifts'
import { gradePractical, PRACTICAL_BY_ID } from '../../sim/scoring/practicals'
import type { LabRecord } from '../../store/labSchema'
import type { AppState, Session } from '../../store/state'

export type JourneyTaskKind =
  'chapter' | 'lesson' | 'practical' | 'workbench' | 'clinic' | 'shift' | 'mixed' | 'exam'
export interface JourneyTask {
  id: string
  kind: JourneyTaskKind
  sourceId: string
  title: string
  description: string
  href: string
}
export interface JourneyResource {
  title: string
  description: string
  href: string
}
export interface JourneyStage {
  id: string
  title: string
  description: string
  outcome: string
  tasks: JourneyTask[]
  resources: JourneyResource[]
}
export interface JourneyTaskProgress extends JourneyTask {
  complete: boolean
  pendingReview: boolean
  status: 'complete' | 'review-pending' | 'in-progress' | 'not-started'
}
export interface JourneyStageProgress extends Omit<JourneyStage, 'tasks'> {
  number: number
  tasks: JourneyTaskProgress[]
  complete: boolean
  completedTasks: number
  totalTasks: number
  pendingReview: boolean
}

const chapter = (id: string): JourneyTask => {
  const source = PATHWAY.find((entry) => entry.id === id)!
  return {
    id: `chapter:${id}`,
    kind: 'chapter',
    sourceId: id,
    title: source.title,
    description: 'Read the illustrated chapter, answer its checkpoints, then save completion.',
    href: `/pathway/${id}`,
  }
}
const lesson = (id: string): JourneyTask => ({
  id: `lesson:${id}`,
  kind: 'lesson',
  sourceId: id,
  title: LESSON_BY_ID[id].title,
  description: 'Work through the explanation and retrieval questions to finish this lesson.',
  href: `/learn/${id}`,
})
const practical = (id: string): JourneyTask => {
  const source = CAREER_LEVELS.find((entry) => entry.practical.id === id)!
  return {
    id: `practical:${id}`,
    kind: 'practical',
    sourceId: id,
    title: source.practical.title,
    description: PRACTICAL_BY_ID[id].reviewRequired
      ? 'Record the complete planning exercise. Scientific and operational adequacy still require qualified review.'
      : 'Apply what you learned in the guided laboratory and meet its published practical checks.',
    href: `/lab3d?practical=${id}`,
  }
}
const resource = (title: string, href: string, description: string): JourneyResource => ({
  title,
  href,
  description,
})

/** One ordered course. Reference libraries and repeatable drills support it without adding gates. */
export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'foundations',
    title: 'Start with tissue and safety',
    description:
      'Begin here. Learn what a tissue section shows and how to approach the laboratory safely.',
    outcome: 'Describe the tissue and establish a safe starting condition.',
    tasks: [chapter('tissue-language'), lesson('L-18'), practical('orientation-practical')],
    resources: [
      resource(
        'Look at real slides',
        '/slides',
        'Compare tissue structures with attributed micrographs.',
      ),
      resource(
        'Tissue and stain reference',
        '/atlas',
        'Look up an unfamiliar structure or technique.',
      ),
    ],
  },
  {
    id: 'receive-preserve',
    title: 'Receive and preserve a specimen',
    description: 'Follow the bottle through identity checks, gross sampling and fixation.',
    outcome: 'Explain what must be protected before processing begins.',
    tasks: [
      chapter('accessioning'),
      chapter('grossing'),
      chapter('fixation'),
      lesson('L-01'),
      lesson('L-02'),
      lesson('L-03'),
      lesson('L-04'),
    ],
    resources: [
      resource(
        'Preview a specimen journey',
        '/lab/specimen-journey',
        'Explore a guided biopsy example from receipt through slide review.',
      ),
      resource(
        'Explore fixation decisions',
        '/lab/fixation-detective',
        'Compare preparation choices and their consequences.',
      ),
    ],
  },
  {
    id: 'routine-slide',
    title: 'Make a routine H&E slide',
    description:
      'Move in order through processing, embedding, cutting, staining and technical review.',
    outcome: 'Connect every preparation step to the final slide.',
    tasks: [
      chapter('processing'),
      lesson('L-05'),
      lesson('L-06'),
      chapter('embedding'),
      lesson('L-08'),
      practical('assistant-practical'),
      chapter('microtomy'),
      lesson('L-09'),
      chapter('he'),
      lesson('L-11'),
      lesson('L-20'),
      chapter('quality-handoff'),
      practical('routine-practical'),
    ],
    resources: [
      resource(
        'Processing bench',
        '/lab/processing-bench',
        'Practise solvent exchange separately.',
      ),
      resource(
        'Embedding studio',
        '/lab/embedding-studio',
        'Explore how orientation changes the section.',
      ),
      resource(
        'Microtomy challenge',
        '/lab/microtomy-challenge',
        'Investigate sectioning artifacts.',
      ),
    ],
  },
  {
    id: 'special-methods',
    title: 'Add special preparation and stains',
    description:
      'Build on the routine workflow with decalcification, frozen sections and target-specific stains.',
    outcome: 'Choose an appropriate preparation and explain what its control should show.',
    tasks: [
      chapter('alternate-pathways'),
      lesson('L-07'),
      lesson('L-10'),
      lesson('L-17'),
      lesson('L-22'),
      chapter('special-stains'),
      lesson('L-12'),
      lesson('L-13'),
      lesson('L-14'),
      lesson('L-15'),
      lesson('L-23'),
      practical('ht-practical'),
    ],
    resources: [
      resource('Stain studio', '/lab/stain-studio', 'Compare reactions and controls.'),
      resource(
        'Laboratory calculations',
        '/lab/lab-math',
        'Rehearse units, concentrations and dilutions.',
      ),
    ],
  },
  {
    id: 'ihc-molecular',
    title: 'Understand IHC and molecular tests',
    description:
      'Connect retrieval, detection, localization and controls to your specimen’s earlier history.',
    outcome: 'Investigate an IHC run and recognize the limits of an ISH result.',
    tasks: [chapter('ihc'), lesson('L-16'), practical('htl-practical')],
    resources: [
      resource('IHC room', '/lab/ihc-room', 'Rehearse retrieval and control reasoning.'),
      resource(
        'Explore the full laboratory',
        '/lab3d',
        'Try additional markers and specimen types at your own pace.',
      ),
    ],
  },
  {
    id: 'quality-investigation',
    title: 'Bring the whole workflow together',
    description:
      'Follow a complete specimen, investigate a problem slide and review a multi-case shift.',
    outcome: 'Trace a technical problem to its history and document a safe disposition.',
    tasks: [
      lesson('L-21'),
      {
        id: 'workbench:specimen-workbench',
        kind: 'workbench',
        sourceId: 'specimen-workbench',
        title: 'Follow one specimen from bottle to slide',
        description: 'Finish all ten workbench stations and save the run to your notebook.',
        href: '/workbench',
      },
      {
        id: 'clinic:investigation',
        kind: 'clinic',
        sourceId: 'investigation',
        title: 'Investigate a problem slide',
        description:
          'Record a hypothesis, compare a controlled repeat and verify a safe disposition. Written reasoning requires qualified review.',
        href: '/clinic',
      },
      {
        id: 'shift:complete-queue',
        kind: 'shift',
        sourceId: 'complete-queue',
        title: 'Complete a simulated laboratory shift',
        description:
          'Finish all five cases in one queue and meet the shift’s technical and safety checks.',
        href: '/shift',
      },
    ],
    resources: [
      resource(
        'Your field notebook',
        '/notebook',
        'Review questions and observations from the pathway.',
      ),
      resource('Practice evidence', '/career', 'Inspect practical rubrics and saved evidence.'),
    ],
  },
  {
    id: 'laboratory-planning',
    title: 'Plan and improve laboratory work',
    description:
      'Use your workflow knowledge to study quality systems, investigation, teaching and resources.',
    outcome: 'Record two reasoned plans for discussion with a qualified reviewer.',
    tasks: [lesson('L-19'), practical('lead-practical'), practical('supervisor-practical')],
    resources: [
      resource(
        'Content review and sources',
        '/review',
        'See the provenance and review status of learning material.',
      ),
      resource(
        'Professional experience record',
        '/route2',
        'Keep supervised experience and eligibility evidence separate from study.',
      ),
    ],
  },
  {
    id: 'exam-review',
    title: 'Review and practise for the HTL exam',
    description:
      'Bring the subjects together, review your gaps and finish a full-length timed practice session.',
    outcome: 'Complete the course and use your results to choose what to revisit.',
    tasks: [
      {
        id: 'mixed:review',
        kind: 'mixed',
        sourceId: 'review',
        title: 'Complete a mixed review session',
        description:
          'Answer and submit 25 mixed study questions, reviewing their explanations as you go.',
        href: '/practice?course=mixed',
      },
      {
        id: 'exam:full-length',
        kind: 'exam',
        sourceId: 'full-length',
        title: 'Complete a full-length practice exam',
        description: `Answer and submit all ${ACTIVE_GUIDELINE.examModel.questions} questions in a full-length practice exam. This records an attempt, not a passing prediction.`,
        href: '/practice?course=exam',
      },
    ],
    resources: [
      resource(
        'Review due questions and cards',
        '/practice/review',
        'Keep using spaced review after the course.',
      ),
      resource(
        'Review your learning evidence',
        '/progress',
        'Use results to decide where to practise next.',
      ),
    ],
  },
]

function answeredSession(session: Session, kind: 'mixed' | 'exam') {
  const minimum = kind === 'exam' ? ACTIVE_GUIDELINE.examModel.questions : 25
  return (
    session.kind === kind &&
    session.mode === (kind === 'exam' ? 'exam' : 'study') &&
    new Set(session.questionIds).size >= minimum &&
    !!session.submittedAt &&
    session.questionIds.every((id) => !!session.answers[id]?.value.trim())
  )
}

/** Prefer the newest revision of a record; a stale archive cannot erase a finished local run. */
function mergeRuns(state: AppState, archived: readonly LabRecord[]) {
  const records = new Map<string, LabRecord>()
  for (const record of [
    ...archived,
    ...state.lab.runs,
    ...(state.lab.draft ? [state.lab.draft] : []),
  ]) {
    const prior = records.get(record.id)
    if (
      !prior ||
      record.events.length > prior.events.length ||
      (record.events.length === prior.events.length && (!prior.completedAt || !!record.completedAt))
    )
      records.set(record.id, record)
  }
  return [...records.values()]
}

export function getJourney(state: AppState, archiveRuns: readonly LabRecord[] = []) {
  const runs = mergeRuns(state, archiveRuns)
  const passed = new Set(
    state.lab.passedPracticals.filter(
      (id) => PRACTICAL_BY_ID[id] && !PRACTICAL_BY_ID[id].reviewRequired,
    ),
  )
  const recorded = new Set<string>()
  let clinicComplete = false
  const shiftSeeds = new Set<string>()
  for (const run of runs) {
    try {
      if (run.practicalId && PRACTICAL_BY_ID[run.practicalId] && run.completedAt) {
        const grade = gradePractical(replayRun(run), run.practicalId)
        if (grade.passed) passed.add(run.practicalId)
        if (
          grade.requiresQualifiedReview &&
          grade.checks.every((check) => check.passed) &&
          !grade.critical.length
        )
          recorded.add(run.practicalId)
      }
      if (run.mode === 'clinic' && run.completedAt && gradeClinic(run).complete)
        clinicComplete = true
      const shift = shiftRecordIdentity(run)
      if (shift) shiftSeeds.add(shift.seed)
    } catch {
      // Preserve unsupported imported records; they cannot establish course completion.
    }
  }
  const shiftComplete = [...shiftSeeds].some((seed) => {
    try {
      return assessShift(seed, runs).passed
    } catch {
      return false
    }
  })
  const stages: JourneyStageProgress[] = JOURNEY_STAGES.map((stage, index) => {
    const tasks = stage.tasks.map((task): JourneyTaskProgress => {
      let complete = false
      let pendingReview = false
      let started = false
      let href = task.href
      switch (task.kind) {
        case 'chapter':
          complete = state.pathway.completed.includes(task.sourceId)
          started =
            !!state.pathway.notes[task.sourceId]?.trim() ||
            PATHWAY.find((entry) => entry.id === task.sourceId)!.checks.some((qid) =>
              state.attempts.some((attempt) => attempt.qid === qid),
            )
          break
        case 'lesson':
          complete = !!state.lessons[task.sourceId]?.completedAt
          started = !!state.lessons[task.sourceId]
          break
        case 'practical': {
          pendingReview = recorded.has(task.sourceId)
          complete = passed.has(task.sourceId) || pendingReview
          started = runs.some((run) => run.practicalId === task.sourceId && run.events.length > 0)
          const draft = state.lab.draft
          if (
            !complete &&
            draft?.practicalId === task.sourceId &&
            !draft.completedAt &&
            draft.events.length
          )
            href = `${task.href}&replay=${encodeURIComponent(draft.id)}`
          break
        }
        case 'workbench':
          complete =
            state.sims.some((run) => run.sim === task.sourceId) || !!state.workbench?.recorded
          started = !!state.workbench
          break
        case 'clinic':
          complete = clinicComplete
          pendingReview = complete
          started = runs.some((run) => run.mode === 'clinic')
          if (!complete) {
            const current = runs
              .filter((run) => run.mode === 'clinic' && !run.completedAt)
              .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
            if (current) href = `/clinic?run=${encodeURIComponent(current.id)}`
          }
          break
        case 'shift':
          complete = shiftComplete
          started = shiftSeeds.size > 0
          if (!complete) {
            const current = runs
              .filter((run) => shiftRecordIdentity(run))
              .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
            if (current)
              href = `/shift?seed=${encodeURIComponent(shiftRecordIdentity(current)!.seed)}`
          }
          break
        case 'mixed':
        case 'exam': {
          complete = state.sessions.some((session) =>
            answeredSession(session, task.kind as 'mixed' | 'exam'),
          )
          const active = state.sessions
            .filter(
              (session) =>
                session.kind === task.kind &&
                session.mode === (task.kind === 'exam' ? 'exam' : 'study') &&
                !session.submittedAt &&
                new Set(session.questionIds).size >=
                  (task.kind === 'exam' ? ACTIVE_GUIDELINE.examModel.questions : 25),
            )
            .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
          started = state.sessions.some((session) => session.kind === task.kind)
          if (!complete && active)
            href = `/practice/session/${encodeURIComponent(active.id)}?course=${task.kind}`
          break
        }
      }
      return {
        ...task,
        href,
        complete,
        pendingReview,
        status: pendingReview
          ? 'review-pending'
          : complete
            ? 'complete'
            : started
              ? 'in-progress'
              : 'not-started',
      }
    })
    return {
      ...stage,
      number: index + 1,
      tasks,
      complete: tasks.every((task) => task.complete),
      completedTasks: tasks.filter((task) => task.complete).length,
      totalTasks: tasks.length,
      pendingReview: tasks.some((task) => task.pendingReview),
    }
  })
  const nextStage = stages.find((stage) => !stage.complete)
  return {
    stages,
    nextStage,
    nextTask: nextStage?.tasks.find((task) => !task.complete),
    completedTasks: stages.reduce((total, stage) => total + stage.completedTasks, 0),
    totalTasks: stages.reduce((total, stage) => total + stage.totalTasks, 0),
    completedStages: stages.filter((stage) => stage.complete).length,
    allComplete: !nextStage,
    pendingReview: stages.some((stage) => stage.pendingReview),
  }
}

export function findTaskForRoute(pathname: string, search = '') {
  const params = new URLSearchParams(search)
  for (const stage of JOURNEY_STAGES) {
    for (const task of stage.tasks) {
      const [path] = task.href.split('?')
      const matched =
        task.kind === 'practical'
          ? pathname === '/lab3d' && params.get('practical') === task.sourceId
          : task.kind === 'mixed' || task.kind === 'exam'
            ? (pathname === '/practice' || pathname.startsWith('/practice/session/')) &&
              params.get('course') === task.kind
            : pathname === path
      if (matched) return { stage, task }
    }
  }
  return undefined
}
