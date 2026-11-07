import { EventLogSchema, MAX_RUN_EVENTS } from '../../sim/core/events'
import { replayRun } from '../../sim/core/replay'
import { assessShift, shiftRecordIdentity } from '../../sim/core/shifts'
import { mergeLabRuns } from '../../store/labArchive'
import { LabRecordSchema, type LabRecord } from '../../store/labSchema'
import type { AppState } from '../../store/state'

type TransitionResult =
  { ok: true; record: LabRecord } | { ok: false; record: LabRecord; reason: string }

const limitMessage = `This shift transition was not recorded. A run can hold up to ${MAX_RUN_EVENTS} actions. Your existing history is unchanged. Save or export this case and start a new run to continue.`

/** Automatic queue actions obey the same event boundary as learner actions. */
export function appendShiftTransition(
  record: LabRecord,
  intent: 'shift.pause' | 'shift.resume',
  queueMinute: number,
): TransitionResult {
  if (record.events.length >= MAX_RUN_EVENTS) return { ok: false, record, reason: limitMessage }
  const twin = replayRun(record)
  const result = EventLogSchema.safeParse([
    ...record.events,
    {
      sequence: record.events.length,
      t: twin.time,
      station: twin.station,
      intent,
      params: { queueMinute },
    },
  ])
  if (!result.success) return { ok: false, record, reason: limitMessage }
  return {
    ok: true,
    record: {
      ...record,
      completedAt: intent === 'shift.resume' ? undefined : record.completedAt,
      events: result.data,
    },
  }
}

type LabState = AppState['lab']
type LaunchResult = { ok: true; lab: LabState } | { ok: false; lab: LabState; reason: string }

/** Prepare both sides before committing: a failed pause cannot replace the draft. */
export function prepareLabLaunch(
  lab: LabState,
  record: LabRecord,
  archived: readonly LabRecord[],
): LaunchResult {
  if (!LabRecordSchema.safeParse(record).success) return { ok: false, lab, reason: limitMessage }
  let previous = lab.draft
  const identity = previous ? shiftRecordIdentity(previous) : null
  if (
    previous &&
    identity &&
    previous.id !== record.id &&
    !previous.completedAt &&
    previous.events.at(-1)?.intent !== 'shift.pause'
  ) {
    const queue = assessShift(
      identity.seed,
      mergeLabRuns(archived, lab.runs, previous),
    ).currentQueueMinute
    const paused = appendShiftTransition(previous, 'shift.pause', queue)
    if (!paused.ok) return { ok: false, lab, reason: paused.reason }
    previous = paused.record
  }
  const runs = previous?.events.length
    ? [previous, ...lab.runs.filter((run) => run.id !== previous!.id)]
    : lab.runs
  return { ok: true, lab: { ...lab, runs, draft: record } }
}
