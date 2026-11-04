import { useState } from 'react'
import { Segmented } from '../../../ui/components'
import QuestionView, { isCorrect, type Answer } from '../../practice/QuestionView'
import type { SimProps } from '../SimPage'
import { generate, MATH_KINDS, type MathKind } from './mathProblems'

const ROUND = 5

/** Generated problems, graded on number and unit. Bank calculation questions live in Practice. */
export default function LabMath({ finish }: SimProps) {
  const [kind, setKind] = useState<MathKind>('dilution')
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000))
  const [n, setN] = useState(0)
  const [answer, setAnswer] = useState<Answer>()
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [stepsShown, setStepsShown] = useState(0)
  const q = generate(kind, seed + n)

  const next = () => {
    setN(n + 1)
    setAnswer(undefined)
    setRevealed(false)
    setStepsShown(0)
  }
  const restart = (k: MathKind) => {
    setKind(k)
    setSeed(Math.floor(Math.random() * 100000))
    setN(0)
    setScore(0)
    setAnswer(undefined)
    setRevealed(false)
    setStepsShown(0)
  }
  const roundDone = n >= ROUND

  return (
    <div className="page-narrow" style={{ marginLeft: 0 }}>
      <div className="field" style={{ marginBottom: 16 }}>
        <span className="label">Problem type</span>
        <div style={{ overflowX: 'auto' }}>
          <Segmented label="Problem type" value={kind} onChange={restart} options={MATH_KINDS.map((m) => ({ value: m.kind, label: m.label }))} />
        </div>
      </div>
      {roundDone ? (
        <div className="panel">
          <p className="celebrate">Round complete: {score} of {ROUND}</p>
          <p className="small">Values and units both had to be right.</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => { finish(score, ROUND, `${MATH_KINDS.find((m) => m.kind === kind)?.label}: ${score}/${ROUND}`); restart(kind) }}>Record and start a new round</button>
            <button className="btn" onClick={() => restart(kind)}>New round without recording</button>
          </div>
        </div>
      ) : (
        <div className="panel">
          <p className="small muted">Problem {n + 1} of {ROUND} · generated with fresh numbers each time</p>
          <QuestionView
            key={`${kind}-${seed}-${n}`}
            q={q}
            seed="math"
            mode="study"
            answer={answer}
            revealed={revealed}
            onAnswer={setAnswer}
            onCheck={(a) => {
              setRevealed(true)
              if (isCorrect(q, a)) setScore(score + 1)
            }}
          />
          {!revealed && (
            <div style={{ marginTop: 14 }}>
              {stepsShown > 0 && <ol className="small">{q.steps.slice(0, stepsShown).map((s, i) => <li key={i}>{s}</li>)}</ol>}
              {stepsShown < q.steps.length - 1 && <button className="btn btn-quiet" onClick={() => setStepsShown(stepsShown + 1)}>Show the next step</button>}
            </div>
          )}
          {revealed && <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={next}>{n + 1 >= ROUND ? 'See round result' : 'Next problem'}</button>}
        </div>
      )}
      <p className="small muted" style={{ marginTop: 14 }}>Generated problems aren’t stored as bank questions. Their results count only toward this simulation’s record.</p>
    </div>
  )
}
