import { ACTIVE_GUIDELINE, type DomainId } from '../../content/curriculum'
import { QUESTIONS } from '../../content'
import type { Question } from '../../content/schema'
import { buildForm } from '../../engine/blueprint'
import { localDate } from '../../engine/dates'
import { hashString, shuffle } from '../../engine/random'
import { isDue } from '../../engine/srs'
import { getState, upsertSession } from '../../store/store'
import type { Session } from '../../store/state'

const newId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

function seenSet() {
  return new Set(getState().attempts.map((a) => a.qid))
}

/** Prefer unseen questions, then the least-recently seen, so repetition doesn't masquerade as learning. */
function pick(pool: Question[], n: number, seed: string): string[] {
  const s = getState()
  const last: Record<string, string> = {}
  for (const a of s.attempts) last[a.qid] = a.at
  const shuffled = shuffle(pool, hashString(seed))
  shuffled.sort((a, b) => (last[a.id] ?? '').localeCompare(last[b.id] ?? ''))
  return [...new Set(shuffled.map((q) => q.id))].slice(0, n)
}

export interface SessionSpec {
  kind: Session['kind']
  mode: Session['mode']
  title: string
  objective?: string
  domain?: DomainId
  n?: number
  seed?: string
  minutes?: number
}

export function questionsForSpec(spec: SessionSpec): { ids: string[]; note?: string } {
  const seed = spec.seed ?? newId()
  const n = spec.n ?? 10
  if (spec.kind === 'exam') {
    const form = buildForm(ACTIVE_GUIDELINE, QUESTIONS, n, seed, seenSet())
    return { ids: form.ids, note: form.shortBy ? `The bank holds ${form.ids.length} questions for this blueprint, ${form.shortBy} short of ${n}.` : undefined }
  }
  if (spec.kind === 'review') {
    const today = localDate()
    const s = getState()
    const due = QUESTIONS.filter((q) => isDue(s.srs[`q:${q.id}`], today))
    // Also surface recent misses and low-confidence answers even if not yet due.
    const weak = QUESTIONS.filter((q) => {
      const last = [...s.attempts].reverse().find((a) => a.qid === q.id)
      return last && (!last.correct || last.confidence === 1) && !due.includes(q)
    })
    return { ids: [...due, ...weak].slice(0, n).map((q) => q.id) }
  }
  let pool = QUESTIONS
  if (spec.objective) pool = pool.filter((q) => q.objective === spec.objective)
  if (spec.domain) pool = pool.filter((q) => q.domain === spec.domain)
  if (spec.kind === 'case') pool = pool.filter((q) => q.kind === 'case')
  if (spec.kind === 'mixed' || spec.kind === 'quiz') {
    const form = buildForm(ACTIVE_GUIDELINE, pool, n, seed, seenSet())
    return { ids: form.ids }
  }
  return { ids: pick(pool, n, seed) }
}

export function createSession(spec: SessionSpec): Session | { error: string } {
  const seed = spec.seed ?? newId()
  const { ids } = questionsForSpec({ ...spec, seed })
  if (!ids.length) return { error: 'No questions match this set yet.' }
  const now = new Date()
  const session: Session = {
    id: newId(),
    kind: spec.kind,
    mode: spec.mode,
    title: spec.title,
    seed,
    questionIds: ids,
    answers: {},
    flags: [],
    index: 0,
    startedAt: now.toISOString(),
    deadline: spec.mode === 'exam' && spec.minutes ? new Date(now.getTime() + spec.minutes * 60_000).toISOString() : undefined,
    revealed: [],
  }
  upsertSession(session)
  return session
}
