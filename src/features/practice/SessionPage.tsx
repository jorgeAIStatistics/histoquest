import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DOMAIN_NAMES, QUESTION_BY_ID } from '../../content'
import type { Confidence } from '../../engine/srs'
import { markPlanItem } from '../../store/planActions'
import { recordAttempt, updateSession, useAppState } from '../../store/store'
import type { Session } from '../../store/state'
import { IconFlag } from '../../art/icons'
import { Empty } from '../../ui/components'
import QuestionView, { isCorrect, type Answer } from './QuestionView'

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Exam submission: grade once and lock the session. Unanswered items score as wrong on this
 * exam but are not recorded as attempts, so they stay "unseen" and don't distort fresh accuracy.
 */
export function submitExam(session: Session) {
  if (session.submittedAt) return
  for (const id of session.questionIds) {
    const q = QUESTION_BY_ID[id]
    const a = session.answers[id]
    if (!q || !a?.value) continue
    recordAttempt(id, q.version, isCorrect(q, a), ((a.confidence || 2) as Confidence), 'exam') // no rating given: treat as unsure
  }
  updateSession(session.id, (x) => ({ ...x, submittedAt: new Date().toISOString() }))
}

function Results({ session, plan }: { session: Session; plan: string | null }) {
  const qs = session.questionIds.map((id) => QUESTION_BY_ID[id]).filter(Boolean)
  const correct = qs.filter((q) => isCorrect(q, session.answers[q.id])).length
  const byDomain = Object.entries(DOMAIN_NAMES).map(([d, name]) => {
    const items = qs.filter((q) => q.domain === d)
    return { name, n: items.length, c: items.filter((q) => isCorrect(q, session.answers[q.id])).length }
  }).filter((r) => r.n)
  const [show, setShow] = useState<'missed' | 'all' | 'flagged'>('missed')
  useEffect(() => markPlanItem(plan, { done: true }), [plan])
  const list = qs.filter((q) => (show === 'all' ? true : show === 'flagged' ? session.flags.includes(q.id) : !isCorrect(q, session.answers[q.id])))
  return (
    <div className="page-narrow">
      <h1>{session.title}: results</h1>
      <p className="lede">
        {correct} of {qs.length} correct ({Math.round((100 * correct) / Math.max(1, qs.length))}%). This is raw accuracy on this set, not an ASCP scaled score or a pass prediction.
      </p>
      <div className="table-scroll">
        <table className="simple" style={{ margin: '16px 0 28px' }}>
          <thead><tr><th>Content area</th><th>Correct</th><th>Questions</th></tr></thead>
          <tbody>{byDomain.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.c}</td><td>{r.n}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="row" style={{ marginBottom: 18 }}>
        <Link className="btn btn-primary" to={plan ? '/today' : '/practice'}>{plan ? 'Back to Today' : 'Back to Practice'}</Link>
        <Link className="btn" to="/practice/review">Go to review queue</Link>
      </div>
      <h2>Explanations</h2>
      <div className="segmented" role="group" aria-label="Which explanations">
        {(['missed', 'flagged', 'all'] as const).map((k) => <button key={k} aria-pressed={show === k} onClick={() => setShow(k)}>{k === 'missed' ? 'Missed' : k === 'flagged' ? 'Flagged' : 'All'}</button>)}
      </div>
      <div className="stack" style={{ marginTop: 20 }}>
        {list.length === 0 && <p className="muted">Nothing in this filter.</p>}
        {list.map((q) => (
          <div key={q.id} className="panel">
            <QuestionView q={q} seed={session.seed} mode="review-results" answer={session.answers[q.id] as Answer | undefined} revealed onAnswer={() => {}} number={`Question ${session.questionIds.indexOf(q.id) + 1}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SessionPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const plan = params.get('plan')
  const nav = useNavigate()
  const session = useAppState((s) => s.sessions.find((x) => x.id === id))
  const exam = session?.mode === 'exam'
  const now = useNow(!!exam && !session?.submittedAt)
  const [confirm, setConfirm] = useState(false)

  const remaining = session?.deadline ? Date.parse(session.deadline) - now : undefined
  // Time is derived from the stored deadline, so a refresh resumes the true clock. At zero we auto-submit.
  useEffect(() => {
    if (session && exam && !session.submittedAt && remaining !== undefined && remaining <= 0) submitExam(session)
  }, [session, exam, remaining])

  if (!session) return <Empty title="This practice set was not found" action={<Link className="btn" to="/practice">Back to Practice</Link>}>It may have been cleared, or the link is from another device.</Empty>
  if (session.submittedAt && exam) return <Results session={session} plan={plan} />

  const qid = session.questionIds[session.index]
  const q = QUESTION_BY_ID[qid]
  const answer = session.answers[qid] as Answer | undefined
  const revealed = session.revealed.includes(qid)
  const total = session.questionIds.length
  const answeredCount = Object.values(session.answers).filter((a) => a.value).length
  const go = (i: number) => updateSession(session.id, (x) => ({ ...x, index: Math.max(0, Math.min(total - 1, i)) }))
  const setAnswer = (a: Answer) => updateSession(session.id, (x) => ({ ...x, answers: { ...x.answers, [qid]: a } }))
  const flagged = session.flags.includes(qid)

  const finishStudy = () => {
    updateSession(session.id, (x) => ({ ...x, submittedAt: new Date().toISOString() }))
    markPlanItem(plan, { done: true })
  }

  if (session.submittedAt && !exam) {
    const correct = session.questionIds.filter((x) => isCorrect(QUESTION_BY_ID[x], session.answers[x] as Answer)).length
    return (
      <div className="page-narrow">
        <h1>Set complete</h1>
        <p className="lede">{correct} of {session.revealed.length} answered correctly. Missed and low-confidence answers are now in your review schedule.</p>
        <div className="row">
          <Link className="btn btn-primary" to={plan ? '/today' : '/practice'}>{plan ? 'Back to Today' : 'More practice'}</Link>
          <button className="btn" onClick={() => nav('/progress')}>See progress</button>
        </div>
      </div>
    )
  }

  if (!q) return <Empty title="A question in this set is no longer available">It may have been retired after a content correction. <button className="btn btn-quiet" onClick={() => go(session.index + 1)}>Skip it</button></Empty>

  return (
    <div className="page-narrow">
      <div className="exam-bar">
        <div>
          <strong>{session.title}</strong>
          <div className="small muted">Question {session.index + 1} of {total} · {answeredCount} answered{exam ? ' · explanations after you submit' : ''}</div>
        </div>
        {exam && remaining !== undefined && (
          <div className="timer" aria-live={remaining < 300_000 ? 'polite' : 'off'} style={{ color: remaining < 300_000 ? 'var(--eosin)' : undefined }}>
            <span className="sr-only">Time remaining </span>{fmt(remaining)}
          </div>
        )}
      </div>

      <QuestionView
        key={qid}
        q={q}
        seed={session.seed}
        mode={exam ? 'exam' : 'study'}
        answer={answer}
        revealed={revealed}
        number={`Question ${session.index + 1}`}
        onAnswer={setAnswer}
        onCheck={(a) => {
          recordAttempt(qid, q.version, isCorrect(q, a), (a.confidence || 1) as Confidence, session.kind === 'review' ? 'review' : 'study')
          updateSession(session.id, (x) => ({ ...x, revealed: [...x.revealed, qid] }))
        }}
      />

      <div className="row" style={{ marginTop: 22, justifyContent: 'space-between' }}>
        <div className="row">
          <button className="btn" onClick={() => go(session.index - 1)} disabled={session.index === 0}>Previous</button>
          {(exam || revealed) && session.index < total - 1 && <button className="btn btn-primary" onClick={() => go(session.index + 1)}>Next question</button>}
          {!exam && revealed && session.index === total - 1 && <button className="btn btn-primary" onClick={finishStudy}>Finish set</button>}
        </div>
        <button className="btn btn-quiet" aria-pressed={flagged} onClick={() => updateSession(session.id, (x) => ({ ...x, flags: flagged ? x.flags.filter((f) => f !== qid) : [...x.flags, qid] }))}>
          <IconFlag width={18} height={18} style={{ color: flagged ? 'var(--eosin)' : undefined }} /> {flagged ? 'Flagged' : 'Flag for review'}
        </button>
      </div>

      {exam && (
        <section className="panel" style={{ marginTop: 28 }} aria-labelledby="nav-h">
          <h3 id="nav-h">Question navigator</h3>
          <div className="qgrid">
            {session.questionIds.map((x, i) => (
              <button
                key={x}
                className={`${session.answers[x]?.value ? 'answered' : ''} ${session.flags.includes(x) ? 'flagged' : ''}`}
                aria-current={i === session.index}
                aria-label={`Question ${i + 1}${session.answers[x]?.value ? ', answered' : ', unanswered'}${session.flags.includes(x) ? ', flagged' : ''}`}
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="small muted">Shaded = answered. Pink underline = flagged.</p>
          {!confirm ? (
            <button className="btn btn-primary" onClick={() => setConfirm(true)}>Submit exam</button>
          ) : (
            <div className="inset" role="alertdialog" aria-labelledby="confirm-h">
              <p id="confirm-h" style={{ fontWeight: 700 }}>
                Submit now? {total - answeredCount} unanswered{session.flags.length ? ` and ${session.flags.length} flagged` : ''}. Unanswered questions count as incorrect. You can't change answers after submitting.
              </p>
              <div className="row">
                <button className="btn btn-primary" onClick={() => submitExam(session)}>Submit and see results</button>
                <button className="btn" onClick={() => setConfirm(false)}>Keep working</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
