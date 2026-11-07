import { useSyncExternalStore } from 'react'
import { localDate } from '../engine/dates'
import { review, type Confidence } from '../engine/srs'
import {
  BACKUP_KEY,
  STORAGE_KEY,
  initialState,
  migrateAndValidate,
  type AppState,
  type Attempt,
  type Session,
  type SimRun,
} from './state'

/**
 * Module-level store persisted to localStorage on every change (synchronously, so an
 * interrupted session normally resumes at the last saved action). Save failures are surfaced.
 * The previous snapshot is kept under BACKUP_KEY when storage capacity permits.
 */
type Listener = () => void
let listeners: Listener[] = []
let loadError: string | undefined
let persistenceMessage: string | undefined

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const r = migrateAndValidate(JSON.parse(raw))
    if (r.ok) return r.state
    loadError = r.error
    localStorage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, raw)
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Unreadable progress data'
  }
  return initialState()
}

let state: AppState = typeof localStorage === 'undefined' ? initialState() : load()

function persist() {
  let backupUnavailable = false
  try {
    const previous = localStorage.getItem(STORAGE_KEY)
    if (previous) localStorage.setItem(BACKUP_KEY, previous)
  } catch {
    // A quota failure while duplicating the previous snapshot must never stop
    // the smaller, archive-pruned current state from reaching its primary key.
    backupUnavailable = true
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    persistenceMessage = backupUnavailable
      ? 'Current progress was saved, but the automatic previous-snapshot backup could not be refreshed. Export a complete backup from Settings.'
      : undefined
  } catch {
    persistenceMessage =
      'Progress could not be saved (storage full or blocked). Export a backup from Settings.'
  }
}

export function getState() {
  return state
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state)
  if (typeof localStorage !== 'undefined') persist()
  for (const l of listeners) l()
}

export function replaceState(next: AppState) {
  setState(() => next)
}

export function resetForTests(next: AppState = initialState()) {
  state = next
  loadError = undefined
  persistenceMessage = undefined
}

export function storageError() {
  return persistenceMessage ?? loadError
}

function subscribe(l: Listener) {
  listeners.push(l)
  return () => {
    listeners = listeners.filter((x) => x !== l)
  }
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}

// ---------- actions ----------

const nowIso = () => new Date().toISOString()

function touchDay(s: AppState): AppState {
  const day = localDate()
  return s.activeDays.includes(day) ? s : { ...s, activeDays: [...s.activeDays, day] }
}

/** XP is awarded only for meaningful work: a first-time correct answer, a completed lesson, a reasoned simulation. */
export function awardXp(s: AppState, amount: number, reason: string): AppState {
  return { ...s, xp: [...s.xp, { at: nowIso(), amount, reason }] }
}

export function recordAttempt(
  qid: string,
  qVersion: number,
  correct: boolean,
  confidence: Confidence,
  mode: Attempt['mode'],
) {
  setState((s) => {
    const day = localDate()
    const prior = [...s.attempts].reverse().find((a) => a.qid === qid)
    const first = !prior
    const gapDays = prior
      ? Math.round((Date.parse(nowIso()) - Date.parse(prior.at)) / 86_400_000)
      : undefined
    const attempt: Attempt = {
      qid,
      qVersion,
      at: nowIso(),
      day,
      correct,
      confidence,
      mode,
      first,
      gapDays,
    }
    let next: AppState = {
      ...s,
      attempts: [...s.attempts, attempt],
      srs: { ...s.srs, [`q:${qid}`]: review(s.srs[`q:${qid}`], correct, confidence, day) },
    }
    if (first && correct) next = awardXp(next, 10, 'First-attempt correct answer')
    return touchDay(next)
  })
}

export function recordCard(cid: string, correct: boolean, confidence: Confidence) {
  setState((s) => {
    const day = localDate()
    const prior = [...s.cardReviews].reverse().find((r) => r.cid === cid)
    const gapDays = prior ? Math.round((Date.now() - Date.parse(prior.at)) / 86_400_000) : undefined
    return touchDay({
      ...s,
      cardReviews: [...s.cardReviews, { cid, at: nowIso(), day, correct, confidence, gapDays }],
      srs: { ...s.srs, [`c:${cid}`]: review(s.srs[`c:${cid}`], correct, confidence, day) },
    })
  })
}

export function lessonStep(
  lessonId: string,
  step: number,
  extra: Partial<AppState['lessons'][string]> = {},
) {
  setState((s) => {
    const cur = s.lessons[lessonId] ?? { startedAt: nowIso(), step: 0 }
    return {
      ...s,
      lessons: { ...s.lessons, [lessonId]: { ...cur, ...extra, step: Math.max(cur.step, step) } },
    }
  })
}

export function completeLesson(lessonId: string) {
  setState((s) => {
    const cur = s.lessons[lessonId] ?? { startedAt: nowIso(), step: 0 }
    if (cur.completedAt) return s
    return touchDay(
      awardXp(
        { ...s, lessons: { ...s.lessons, [lessonId]: { ...cur, completedAt: nowIso() } } },
        25,
        `Completed lesson ${lessonId}`,
      ),
    )
  })
}

export function recordSim(run: Omit<SimRun, 'at' | 'day'>) {
  setState((s) => {
    const firstOfSim = !s.sims.some((r) => r.sim === run.sim)
    let next: AppState = { ...s, sims: [...s.sims, { ...run, at: nowIso(), day: localDate() }] }
    // XP scales with reasoning, and only the first run of each simulation per day earns it.
    const today = localDate()
    const earnedToday = s.sims.some((r) => r.sim === run.sim && r.day === today)
    if (!earnedToday && run.total > 0)
      next = awardXp(
        next,
        Math.round((20 * run.correct) / run.total) + (firstOfSim ? 10 : 0),
        `Simulation: ${run.sim}`,
      )
    return touchDay(next)
  })
}

export function upsertSession(session: Session) {
  setState((s) => ({
    ...s,
    sessions: [...s.sessions.filter((x) => x.id !== session.id), session],
    activeSessionId: session.submittedAt
      ? s.activeSessionId === session.id
        ? undefined
        : s.activeSessionId
      : session.id,
  }))
}

export function updateSession(id: string, fn: (x: Session) => Session) {
  setState((s) => {
    const cur = s.sessions.find((x) => x.id === id)
    if (!cur) return s
    const next = fn(cur)
    return {
      ...s,
      sessions: s.sessions.map((x) => (x.id === id ? next : x)),
      activeSessionId: next.submittedAt && s.activeSessionId === id ? undefined : s.activeSessionId,
    }
  })
}
