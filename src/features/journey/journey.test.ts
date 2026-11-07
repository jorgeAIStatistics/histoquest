import { describe, expect, it } from 'vitest'
import { LESSONS, SIMULATIONS } from '../../content'
import { CAREER_LEVELS } from '../../content/lab/curriculum'
import { PATHWAY } from '../../content/pathway'
import {
  CLINIC_CASES,
  createClinicRecord,
  recordClinicHypothesis,
  runClinicTrial,
  verifyClinic,
} from '../../sim/core/clinic'
import { reduceEvent, replayRun } from '../../sim/core/replay'
import {
  createShift,
  createShiftCase,
  scenarioForShiftRecord,
  assessShift,
} from '../../sim/core/shifts'
import { createTwin } from '../../sim/specimen/initial'
import { PROCESS as P } from '../../sim/params/process'
import type { SimEvent, StationId } from '../../sim/core/events'
import { createPracticalRecord } from '../../sim/scoring/practicals'
import type { LabRecord } from '../../store/labSchema'
import {
  exportJson,
  importJson,
  initialState,
  type AppState,
  type Session,
} from '../../store/state'
import { findTaskForRoute, getJourney, JOURNEY_STAGES } from './journey'

const at = '2026-11-07T10:00:00Z'
const allTasks = JOURNEY_STAGES.flatMap((stage) => stage.tasks)
const task = (state: AppState, id: string, runs: LabRecord[] = []) =>
  getJourney(state, runs)
    .stages.flatMap((stage) => stage.tasks)
    .find((row) => row.id === id)!
const note =
  'Synthetic observation: I recorded identity, specimen preparation, controls, safe disposition and the limitations needing qualified review. This is a proposed educational plan, not an approved clinical procedure.'

function act(record: LabRecord, station: StationId, intent: string, params: SimEvent['params']) {
  const twin = replayRun(record)
  return {
    ...record,
    events: reduceEvent(twin, {
      station,
      intent,
      params,
      t: twin.time,
      sequence: twin.events.length,
    }).events,
  }
}
function orientation() {
  let record = createPracticalRecord('orientation-practical')
  record = act(record, 'quality', 'practice.evidence', {
    checkId: 'safe-start',
    text: note,
    ppe: true,
    sds: true,
    escalation: true,
  })
  record = act(record, 'microtomy', 'instrument.set', { locked: true, guarded: true })
  record = act(record, 'quality', 'practice.evidence', {
    checkId: 'microscope-basics',
    text: note,
    overview: 4,
    detail: 20,
    focusCompared: true,
    illuminationCompared: true,
  })
  return { ...record, completedAt: at }
}
function planning(id: string) {
  let record = createPracticalRecord(id)
  CAREER_LEVELS.find((level) => level.practical.id === id)!.practical.rubric.forEach((_, index) => {
    record = act(record, 'quality', 'practice.evidence', {
      checkId: `planning-${index + 1}`,
      text: note,
    })
  })
  return { ...record, completedAt: at }
}
function session(kind: 'mixed' | 'exam', count = kind === 'exam' ? 100 : 25): Session {
  const ids = Array.from({ length: count }, (_, index) => `q-${index}`)
  return {
    id: `${kind}-${count}`,
    kind,
    mode: kind === 'exam' ? 'exam' : 'study',
    title: 'Practice',
    seed: 'course-test',
    questionIds: ids,
    answers: Object.fromEntries(ids.map((id) => [id, { value: 'a', confidence: 2 }])),
    flags: [],
    index: count - 1,
    startedAt: at,
    submittedAt: at,
    revealed: kind === 'mixed' ? ids : [],
  }
}

// The same real event sequence used by the shift integration tests; no mocked assessment.
function run(record: LabRecord) {
  let twin = record.events.reduce(reduceEvent, createTwin(scenarioForShiftRecord(record)!))
  return {
    get twin() {
      return twin
    },
    act(station: StationId, intent: string, params: SimEvent['params'] = {}) {
      twin = reduceEvent(twin, {
        station,
        intent,
        params,
        t: twin.time,
        sequence: twin.events.length,
      })
    },
    record(completed = false): LabRecord {
      return { ...record, events: twin.events, completedAt: completed ? '2026-11-07' : undefined }
    },
  }
}
function section(d: ReturnType<typeof run>, level = 1, depth = 0) {
  d.act('microtomy', 'instrument.set', {
    locked: true,
    guarded: true,
    clamp: 1,
    sharpness: 1,
    angle: P['microtomy.angle'],
  })
  d.act('microtomy', 'block.mount')
  d.act('microtomy', 'instrument.set', { locked: false, guarded: false })
  if (depth) d.act('microtomy', 'microtomy.trim', { microns: depth })
  d.act('microtomy', 'microtomy.cut', { purpose: 'routine', level })
  d.act('microtomy', 'instrument.set', { locked: true, guarded: true })
  d.act('bath', 'bath.float', {
    temperature: P['bath.temperature'],
    minutes: P['bath.minutes'],
    clean: true,
    gentle: true,
  })
  d.act('bath', 'section.pickup', {
    label: `${d.twin.scenario.accession}-A1-L${level}`,
    charged: true,
  })
  d.act('drying', 'drying.run', {
    temperature: P['drying.temperature'],
    minutes: P['drying.minutes'],
  })
}
function he(d: ReturnType<typeof run>) {
  for (const reagent of [
    'dewax',
    'hydrate',
    'hematoxylin',
    'differentiate',
    'blue',
    'eosin',
    'dehydrate',
    'clear',
  ])
    d.act('he', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
  d.act('coverslip', 'coverslip.apply', {
    medium: 'resinous',
    volume: P['mount.volume'],
    angle: P['mount.angle'],
    delay: 0,
  })
}
function ihc(d: ReturnType<typeof run>, corrected: boolean) {
  for (const reagent of ['dewax', 'hydrate'])
    d.act('ihc', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
  d.act('ihc', 'ihc.retrieve', {
    minutes: P['ihc.retrieval-time'],
    temperature: P['ihc.retrieval-temperature'],
    ph: P['ihc.retrieval-ph'],
    method: 'hier',
  })
  d.act('ihc', 'ihc.primary', {
    dilution: P['ihc.primary-dilution'],
    minutes: P['ihc.primary-minutes'],
    blocked: true,
    humid: true,
    washed: true,
    sectionAge: 0,
  })
  d.act('ihc', 'ihc.detect', {
    minutes: P['ihc.detect-minutes'],
    chromogenMinutes: P['ihc.chromogen-minutes'],
    compatible: true,
  })
  d.act('ihc', 'ihc.controls', {
    positive: true,
    lowPositive: true,
    negative: true,
    faultCorrected: corrected,
  })
  for (const reagent of ['dehydrate', 'clear'])
    d.act('ihc', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
  d.act('coverslip', 'coverslip.apply', {
    medium: 'resinous',
    volume: P['mount.volume'],
    angle: P['mount.angle'],
    delay: 0,
  })
}
function finish(d: ReturnType<typeof run>) {
  for (const station of [
    ...new Set(
      d.twin.events
        .filter((event) => event.params.origin !== 'scenario-setup')
        .map((event) => event.station),
    ),
  ])
    d.act(station, 'document', { text: note })
  d.act('quality', 'document', { text: note })
  d.act('quality', 'quality.release')
  return d.record(true)
}
function completedCase(seed: string, id: string) {
  const d = run(createShiftCase(seed, id))
  d.act('accessioning', 'identity.accept')
  if (id === 'processor') {
    d.act('quality', 'quality.hold')
    for (const reagent of ['alcohol', 'clearant', 'paraffin'])
      d.act('processing', 'processing.step', {
        reagent,
        minutes: P['processing.minutes'],
        temperature:
          reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature'],
        concentration: 100,
        exhaustion: 0,
        vacuum: true,
      })
    for (let i = 0; i < d.twin.scenario.fragments; i++)
      d.act('embedding', 'embedding.place', {
        piece: `A1-${i + 1}`,
        x: i * P['reference.piece-spacing'],
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0,
      })
    d.act('embedding', 'embedding.cool', { temperature: P['microtomy.block-temperature'] })
  }
  if (id === 'frozen') {
    d.act('grossing', 'gross.sample', {
      thickness: P['reference.gross-thickness'],
      fragments: d.twin.scenario.fragments,
      cassette: 'biopsy',
      key: 'A1: intact frozen consultation tissue',
      extraction: true,
    })
    d.act('frozen', 'frozen.freeze', {
      temperature: P['frozen.temperature'],
      rate: P['frozen.rate'],
      biohazard: true,
    })
  }
  section(d)
  if (id === 'controls') {
    ihc(d, false)
    d.act('quality', 'quality.hold')
    section(d, 2)
    ihc(d, true)
  } else {
    if (id === 'levels') section(d, 2, P['practical.level-gap'])
    he(d)
  }
  return finish(d)
}

describe('one guided course', () => {
  it('covers all published chapters, lessons and practicals exactly once in a finite sequence', () => {
    expect(JOURNEY_STAGES).toHaveLength(8)
    expect(new Set(allTasks.map((row) => row.id)).size).toBe(allTasks.length)
    expect(
      allTasks
        .filter((row) => row.kind === 'chapter')
        .map((row) => row.sourceId)
        .sort(),
    ).toEqual(PATHWAY.map((row) => row.id).sort())
    expect(
      allTasks
        .filter((row) => row.kind === 'lesson')
        .map((row) => row.sourceId)
        .sort(),
    ).toEqual(LESSONS.map((row) => row.id).sort())
    expect(allTasks.filter((row) => row.kind === 'practical').map((row) => row.sourceId)).toEqual(
      CAREER_LEVELS.map((row) => row.practical.id),
    )
    for (const row of allTasks)
      expect(findTaskForRoute(...(row.href.split('?') as [string, string]))?.task.id).toBe(row.id)
  })

  it('starts at tissue foundations and never treats a chapter view as completion', () => {
    const state = initialState()
    state.pathway.lastChapter = 'ihc'
    const journey = getJourney(state)
    expect(journey.nextTask?.href).toBe('/pathway/tissue-language')
    expect(journey.completedTasks).toBe(0)
    expect(journey.nextStage?.number).toBe(1)
    expect(journey.allComplete).toBe(false)
    expect(journey.nextTask?.status).toBe('not-started')
  })

  it('finds the earliest remaining gap while preserving out-of-order study evidence', () => {
    const state = initialState()
    state.pathway.completed = PATHWAY.map((row) => row.id)
    for (const row of LESSONS) state.lessons[row.id] = { startedAt: at, completedAt: at, step: 5 }
    delete state.lessons['L-02'].completedAt
    state.lab.passedPracticals = CAREER_LEVELS.slice(0, 5).map((row) => row.practical.id)
    const journey = getJourney(state)
    expect(journey.nextTask?.id).toBe('lesson:L-02')
    expect(journey.nextStage?.number).toBe(2)
    expect(journey.stages[2].complete).toBe(true)
    expect(journey.nextTask?.status).toBe('in-progress')
  })

  it('does not infer lesson completion from a related chapter or chapter completion from a question', () => {
    const state = initialState()
    state.pathway.completed = ['fixation']
    state.attempts.push({
      qid: PATHWAY[0].checks[0],
      qVersion: 1,
      at,
      day: at.slice(0, 10),
      correct: true,
      confidence: 2,
      mode: 'lesson',
      first: true,
    })
    expect(task(state, 'lesson:L-02').complete).toBe(false)
    expect(task(state, 'chapter:tissue-language').status).toBe('in-progress')
    expect(task(state, 'chapter:tissue-language').complete).toBe(false)
  })

  it('uses archived practical evidence, while an unfinished or empty attempt cannot pass', () => {
    const state = initialState()
    const good = orientation()
    expect(task(state, 'practical:orientation-practical', [good]).complete).toBe(true)
    expect(
      task(state, 'practical:orientation-practical', [{ ...good, completedAt: undefined }])
        .complete,
    ).toBe(false)
    expect(
      task(state, 'practical:orientation-practical', [
        { ...createPracticalRecord('orientation-practical'), completedAt: at },
      ]).complete,
    ).toBe(false)
    // The archived completed revision must survive a stale cache of the same run.
    state.lab.runs = [{ ...good, events: good.events.slice(0, 1), completedAt: undefined }]
    expect(task(state, 'practical:orientation-practical', [good]).complete).toBe(true)
  })

  it('keeps recorded plans visibly pending review and rejects a fabricated planning pass cache', () => {
    const state = initialState()
    state.lab.passedPracticals = ['lead-practical', 'supervisor-practical']
    expect(task(state, 'practical:lead-practical').complete).toBe(false)
    const plan = planning('lead-practical')
    const progress = task(state, 'practical:lead-practical', [plan])
    expect(progress).toMatchObject({
      complete: true,
      pendingReview: true,
      status: 'review-pending',
    })
    expect(getJourney(state, [plan]).pendingReview).toBe(true)
    expect(
      task(state, 'practical:lead-practical', [{ ...plan, events: plan.events.slice(0, 1) }])
        .complete,
    ).toBe(false)
  })

  it('resumes a matching practical without letting an unrelated draft replace the beginning', () => {
    const state = initialState()
    state.lab.draft = { ...orientation(), id: 'draft with spaces', completedAt: undefined }
    expect(getJourney(state).nextTask?.href).toBe('/pathway/tissue-language')
    state.pathway.completed = ['tissue-language']
    state.lessons['L-18'] = { startedAt: at, completedAt: at, step: 5 }
    expect(getJourney(state).nextTask?.href).toBe(
      '/lab3d?practical=orientation-practical&replay=draft%20with%20spaces',
    )
    state.lab.draft = createPracticalRecord('assistant-practical')
    expect(getJourney(state).nextTask?.href).toBe('/lab3d?practical=orientation-practical')
  })

  it('requires a submitted, fully answered full-length exam, not a short or blank timed attempt', () => {
    const state = initialState()
    state.sessions = [session('exam', 25)]
    expect(task(state, 'exam:full-length').complete).toBe(false)
    const full = session('exam')
    state.sessions = [{ ...full, submittedAt: undefined }]
    expect(task(state, 'exam:full-length').href).toBe('/practice/session/exam-100?course=exam')
    expect(task(state, 'exam:full-length').complete).toBe(false)
    state.sessions = [
      { ...full, answers: { ...full.answers, 'q-99': { value: ' ', confidence: 2 } } },
    ]
    expect(task(state, 'exam:full-length').complete).toBe(false)
    state.sessions = [{ ...full, questionIds: Array(100).fill('q-0') }]
    expect(task(state, 'exam:full-length').complete).toBe(false)
    state.sessions = [full]
    expect(task(state, 'exam:full-length').complete).toBe(true)
  })

  it('distinguishes a mixed study review from a short quiz or exam session', () => {
    const state = initialState()
    state.sessions = [{ ...session('mixed'), kind: 'quiz' }, session('exam')]
    expect(task(state, 'mixed:review').complete).toBe(false)
    state.sessions.push(session('mixed'))
    expect(task(state, 'mixed:review').complete).toBe(true)
  })

  it('does not finish an entire shift from one saved case or a clinic from a completion timestamp alone', () => {
    const state = initialState()
    state.lab.runs = [{ ...createShiftCase('JOURNEY', 'routine'), completedAt: at }]
    expect(task(state, 'shift:complete-queue').complete).toBe(false)
    const clinic = createClinicRecord(CLINIC_CASES[0].id)
    state.lab.runs = [{ ...clinic, completedAt: at }]
    expect(task(state, 'clinic:investigation').complete).toBe(false)
    expect(task(state, 'clinic:investigation').pendingReview).toBe(false)
  })

  it('preserves saved progress and derives the same journey after export/import without mutating state', () => {
    const state = initialState()
    state.pathway.completed = ['tissue-language']
    state.lessons['L-18'] = { startedAt: at, completedAt: at, step: 5 }
    state.lab.runs = [orientation()]
    const original = exportJson(state)
    const snapshot = structuredClone(state)
    const first = getJourney(state)
    expect(state).toEqual(snapshot)
    const loaded = importJson(original)
    expect(loaded.ok).toBe(true)
    if (loaded.ok) expect(getJourney(loaded.state)).toEqual(first)
    expect(first.nextStage?.id).toBe('receive-preserve')
  })

  it('recognizes explicit course context without assigning a generic practice page to the wrong task', () => {
    expect(findTaskForRoute('/practice')).toBeUndefined()
    expect(findTaskForRoute('/lab3d', '?replay=unrelated')).toBeUndefined()
    expect(
      findTaskForRoute('/lab3d', '?practical=orientation-practical&replay=some-id')?.task.id,
    ).toBe('practical:orientation-practical')
    expect(findTaskForRoute('/practice/session/example', '?course=exam')?.stage.id).toBe(
      'exam-review',
    )
  })

  it('keeps optional simulation resources tied to ready activities', () => {
    for (const resource of JOURNEY_STAGES.flatMap((stage) => stage.resources)) {
      if (resource.href.startsWith('/lab/')) {
        expect(SIMULATIONS.find((entry) => resource.href === `/lab/${entry.id}`)?.status).toBe(
          'ready',
        )
      }
    }
  })

  it('reaches the course ending from real shift, clinic and planning evidence without implying qualified review', () => {
    const state = initialState()
    state.pathway.completed = PATHWAY.map((entry) => entry.id)
    for (const entry of LESSONS)
      state.lessons[entry.id] = { startedAt: at, completedAt: at, step: 5 }
    state.lab.passedPracticals = CAREER_LEVELS.slice(0, 5).map((entry) => entry.practical.id)
    state.sims.push({
      sim: 'specimen-workbench',
      at,
      day: at.slice(0, 10),
      correct: 10,
      total: 10,
      objectives: [],
      summary: 'Saved complete workbench.',
    })
    state.sessions = [session('mixed'), session('exam')]
    const shifted = createShift('JOURNEY-END').cases.map((entry) =>
      completedCase('JOURNEY-END', entry.id),
    )
    expect(assessShift('JOURNEY-END', shifted).passed).toBe(true)
    const clinic = verifyClinic(
      runClinicTrial(
        recordClinicHypothesis(
          createClinicRecord('compressed'),
          note,
          'blockTemperature',
          P['microtomy.block-temperature'],
        ),
      ),
      note,
      'improved',
      'review',
    )
    const records = [
      ...shifted,
      clinic,
      planning('lead-practical'),
      planning('supervisor-practical'),
    ]
    const journey = getJourney(state, records)
    expect(journey.completedTasks).toBe(47)
    expect(journey.totalTasks).toBe(47)
    expect(journey.completedStages).toBe(8)
    expect(journey.allComplete).toBe(true)
    expect(journey.nextTask).toBeUndefined()
    expect(journey.nextStage).toBeUndefined()
    expect(journey.pendingReview).toBe(true)
    // Removing a required final attempt exposes the precise remaining task rather than restarting.
    state.sessions = [session('mixed')]
    const unfinished = getJourney(state, records)
    expect(unfinished.completedTasks).toBe(46)
    expect(unfinished.allComplete).toBe(false)
    expect(unfinished.nextTask?.id).toBe('exam:full-length')
  })
})
