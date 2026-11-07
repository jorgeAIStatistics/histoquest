import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { CARDS, DOMAIN_NAMES } from '../../content'
import { OBJECTIVE_BY_ID, type DomainId } from '../../content/curriculum'
import { localDate } from '../../engine/dates'
import { isDue, type Confidence } from '../../engine/srs'
import { markPlanItem } from '../../store/planActions'
import { getState, recordCard } from '../../store/store'
import { Empty } from '../../ui/components'
import { useReducedMotion } from '../../ui/prefs'
import { createSession } from './sessions'

/** Flip-card retrieval: recall first, then reveal and rate yourself honestly. */
function CardReview({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const reduced = useReducedMotion()
  const card = CARDS.find((c) => c.id === ids[i])
  if (!card) return null
  const rate = (correct: boolean, confidence: Confidence) => {
    recordCard(card.id, correct, confidence)
    setShown(false)
    if (i + 1 >= ids.length) onDone()
    else setI(i + 1)
  }
  return (
    <section className="page-narrow" aria-labelledby="cards-h">
      <p className="muted small">Retrieval card {i + 1} of {ids.length} · {OBJECTIVE_BY_ID[card.objective]?.title}</p>
      <h1 id="cards-h" style={{ fontSize: 'var(--t-4)' }}>{card.front}</h1>
      {!shown ? (
        <>
          <p className="muted">Answer in your head (or out loud) before revealing.</p>
          <button className="btn btn-primary" onClick={() => setShown(true)} autoFocus>Reveal answer</button>
        </>
      ) : (
        <motion.div initial={reduced ? false : { rotateX: -20, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="panel" style={{ margin: '12px 0 18px' }}><p style={{ margin: 0 }}>{card.back}</p></div>
          <p className="small" style={{ fontWeight: 600 }}>How did your recall compare?</p>
          <div className="row">
            <button className="btn" onClick={() => rate(false, 2)}>Missed it</button>
            <button className="btn" onClick={() => rate(true, 1)}>Partly</button>
            <button className="btn btn-primary" onClick={() => rate(true, 3)}>Had it</button>
          </div>
        </motion.div>
      )}
    </section>
  )
}

export default function RunPage({ review = false }: { review?: boolean }) {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const plan = params.get('plan')
  const [error, setError] = useState<string>()
  const limit = Number(params.get('limit') ?? params.get('n') ?? 10)

  const dueCards = useMemo(() => {
    if (!review) return []
    const s = getState()
    const today = localDate()
    return CARDS.filter((c) => isDue(s.srs[`c:${c.id}`], today)).slice(0, Math.ceil(limit / 2)).map((c) => c.id)
  }, [review, limit])
  const [cardsDone, setCardsDone] = useState(dueCards.length === 0)
  const created = useRef(false) // StrictMode runs effects twice in development; create one session only

  useEffect(() => {
    if (!cardsDone || created.current) return
    created.current = true
    const objective = params.get('objective') ?? undefined
    const domain = (params.get('domain') as DomainId | null) ?? undefined
    const kind = review ? 'review' : params.get('kind') === 'case' ? 'case' : objective ? 'domain' : domain ? 'domain' : 'mixed'
    const title = review
      ? 'Review queue'
      : kind === 'case'
        ? 'Solve a failed run'
        : objective
          ? `Focus: ${OBJECTIVE_BY_ID[objective]?.title ?? objective}`
          : domain
            ? `${DOMAIN_NAMES[domain]} practice`
            : 'Mixed practice'
    const r = createSession({ kind, mode: 'study', title, objective, domain, n: limit, seed: params.get('seed') ?? undefined })
    if ('error' in r) {
      if (review && dueCards.length) markPlanItem(plan, { done: true })
      setError(review ? (dueCards.length ? 'Cards reviewed. No questions are due right now.' : 'Nothing is due for review right now.') : r.error)
      return
    }
    nav(`/practice/session/${r.id}${plan ? `?plan=${encodeURIComponent(plan)}` : ''}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsDone])

  if (!cardsDone) return <CardReview ids={dueCards} onDone={() => setCardsDone(true)} />
  if (error)
    return (
      <div className="page-narrow">
        <Empty title={error} action={<div className="row"><Link className="btn btn-primary" to="/today">Back to Today</Link><Link className="btn" to="/practice">Other practice</Link></div>}>
          Reviews appear here as items come due. Answering new questions or finishing a lesson adds items to the schedule.
        </Empty>
      </div>
    )
  return <p className="muted" role="status">Assembling questions…</p>
}
