import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Swap from '../../ui/Swap'
import { CARDS, LESSON_BY_ID, QUESTION_BY_ID, SIM_TITLES } from '../../content'
import { OBJECTIVE_BY_ID } from '../../content/curriculum'
import type { Lesson } from '../../content/schema'
import { addDays, localDate } from '../../engine/dates'
import { markPlanItem } from '../../store/planActions'
import { completeLesson, lessonStep, recordAttempt, setState, useAppState } from '../../store/store'
import { Empty, References, ReviewBadge } from '../../ui/components'
import { chime } from '../../ui/prefs'
import QuestionView from '../practice/QuestionView'
import { isCorrect, type Answer } from '../practice/answers'
import type { Confidence } from '../../engine/srs'
import LessonDemo from './demos'

const STEPS = [
  'Bench question',
  'Explanation',
  'Demonstration',
  'Predict',
  'Worked example',
  'Retrieval',
  'Troubleshoot',
  'Takeaway',
] as const

function ChoiceBlock({
  block,
  onAnswered,
}: {
  block: Lesson['prediction']
  onAnswered?: (correct: boolean) => void
}) {
  const [sel, setSel] = useState<string>()
  const [shown, setShown] = useState(false)
  return (
    <div>
      <p style={{ fontWeight: 600 }}>{block.prompt}</p>
      <ul className="options">
        {block.options.map((o) => (
          <li key={o.id}>
            <button
              className={`option ${shown ? (o.id === block.answer ? 'is-correct' : sel === o.id ? 'is-wrong' : '') : ''}`}
              aria-pressed={sel === o.id}
              disabled={shown}
              onClick={() => setSel(o.id)}
            >
              <span>{o.text}</span>
            </button>
          </li>
        ))}
      </ul>
      {!shown ? (
        <button
          className="btn btn-primary"
          disabled={!sel}
          onClick={() => {
            setShown(true)
            onAnswered?.(sel === block.answer)
          }}
        >
          Commit and reveal
        </button>
      ) : (
        <div className={`feedback ${sel === block.answer ? 'ok' : 'no'}`} role="status">
          <p style={{ fontWeight: 700, marginBottom: 6 }}>
            {sel === block.answer ? 'Your prediction holds.' : 'Not what happens. Here is why.'}
          </p>
          <p style={{ margin: 0 }}>{block.reveal}</p>
        </div>
      )}
    </div>
  )
}

function Retrieval({ lesson }: { lesson: Lesson }) {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [revealed, setRevealed] = useState<string[]>([])
  const ids = lesson.retrieval.filter((id) => QUESTION_BY_ID[id])
  const q = QUESTION_BY_ID[ids[i]]
  if (!q) return <p className="muted">Retrieval questions are missing for this lesson.</p>
  return (
    <div>
      <p className="small muted">
        Question {i + 1} of {ids.length}. These count toward your schedule like any other answer.
      </p>
      <QuestionView
        key={q.id}
        q={q}
        seed={`lesson-${lesson.id}`}
        mode="study"
        answer={answers[q.id]}
        revealed={revealed.includes(q.id)}
        onAnswer={(a) => setAnswers({ ...answers, [q.id]: a })}
        onCheck={(a) => {
          recordAttempt(
            q.id,
            q.version,
            isCorrect(q, a),
            (a.confidence || 1) as Confidence,
            'lesson',
          )
          setRevealed([...revealed, q.id])
        }}
      />
      {revealed.includes(q.id) && i < ids.length - 1 && (
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setI(i + 1)}>
          Next retrieval question
        </button>
      )}
    </div>
  )
}

/** Put this lesson's retrieval cards on the schedule for tomorrow so delayed recall gets tested. */
function scheduleCards(lesson: Lesson) {
  const tomorrow = addDays(localDate(), 1)
  setState((s) => {
    const srs = { ...s.srs }
    for (const c of CARDS.filter((c) => lesson.objectives.includes(c.objective)))
      srs[`c:${c.id}`] ??= { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: tomorrow }
    return { ...s, srs }
  })
}

export default function LessonPage() {
  const { id } = useParams()
  return <LessonContent key={id} />
}

function LessonContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plan = params.get('plan')
  const sound = useAppState((s) => s.settings.sound)
  const lesson = id ? LESSON_BY_ID[id] : undefined
  const progress = useAppState((s) => (id ? s.lessons[id] : undefined))
  const completedIds = useAppState((s) =>
    Object.keys(s.lessons)
      .filter((k) => s.lessons[k].completedAt)
      .join(','),
  )
  const [step, setStepLocal] = useState(() => Math.min(progress?.step ?? 0, STEPS.length - 1))

  if (!lesson)
    return (
      <Empty
        title="Lesson not found"
        action={
          <Link className="btn" to="/learn">
            All lessons
          </Link>
        }
      />
    )

  const setStep = (n: number) => {
    setStepLocal(n)
    lessonStep(lesson.id, n)
  }
  const missingPrereqs = lesson.prerequisites.filter((p) => !completedIds.split(',').includes(p))
  const done = !!progress?.completedAt

  const finish = () => {
    completeLesson(lesson.id)
    scheduleCards(lesson)
    markPlanItem(plan, { done: true })
    chime(sound)
    navigate('/')
  }

  const body = (() => {
    switch (step) {
      case 0:
        return (
          <>
            <p
              className="lede"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--t-3)',
                color: 'var(--ink)',
              }}
            >
              {lesson.labQuestion}
            </p>
            {lesson.dermConnection && (
              <div className="inset">
                <p style={{ margin: 0 }}>
                  <strong>From the dermatopathology bench.</strong> {lesson.dermConnection}
                </p>
              </div>
            )}
            <p className="small muted" style={{ marginTop: 16 }}>
              Objectives: {lesson.objectives.map((o) => OBJECTIVE_BY_ID[o]?.title).join('; ')}
            </p>
          </>
        )
      case 1:
        return (
          <>
            {lesson.basics.length > 0 && (
              <details className="basics" style={{ marginBottom: 18 }}>
                <summary>Explain the basics first</summary>
                {lesson.basics.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </details>
            )}
            {lesson.explanation.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {lesson.keyPoints.length > 0 && (
              <ul>
                {lesson.keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            )}
          </>
        )
      case 2:
        return <LessonDemo demo={lesson.demo} />
      case 3:
        return (
          <ChoiceBlock
            block={lesson.prediction}
            onAnswered={(c) => lessonStep(lesson.id, 3, { predictionCorrect: c })}
          />
        )
      case 4:
        return (
          <>
            <p style={{ fontWeight: 600 }}>{lesson.workedExample.problem}</p>
            <ol>
              {lesson.workedExample.steps.map((s, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {s}
                </li>
              ))}
            </ol>
            <div className="inset">
              <strong>Result.</strong> {lesson.workedExample.result}
            </div>
          </>
        )
      case 5:
        return <Retrieval lesson={lesson} />
      case 6:
        return <ChoiceBlock block={lesson.troubleshooting} />
      default:
        return (
          <>
            <p className="lede" style={{ color: 'var(--ink)' }}>
              {lesson.takeaway}
            </p>
            <h3 style={{ marginTop: 24 }}>Sources</h3>
            <References refs={lesson.references} />
            <p style={{ marginTop: 10 }}>
              <ReviewBadge status={lesson.review.status} />{' '}
              <span className="small muted">{lesson.review.verification}</span>
            </p>
            {!done ? (
              <button
                className="btn btn-primary btn-big"
                style={{ marginTop: 18 }}
                onClick={finish}
              >
                Finish lesson and continue
              </button>
            ) : (
              <div className="stack" style={{ marginTop: 18 }}>
                <p className="celebrate" role="status">
                  Lesson finished. Continue along your learning path, or revisit any part above.
                </p>
                <Link className="btn btn-primary" to="/">
                  Continue learning path
                </Link>
              </div>
            )}
            {(lesson.simulation || plan) && (
              <details className="deeper" style={{ marginTop: 24 }}>
                <summary>Optional practice and study tools</summary>
                <div className="row" style={{ marginTop: 12 }}>
                  {lesson.simulation && (
                    <Link
                      className="btn"
                      to={`/lab/${lesson.simulation}${plan ? `?plan=sim:${lesson.simulation}` : ''}`}
                    >
                      Try it in the Virtual Lab: {SIM_TITLES[lesson.simulation]}
                    </Link>
                  )}
                  {plan && (
                    <Link className="btn" to="/today">
                      Back to Today
                    </Link>
                  )}
                </div>
              </details>
            )}
          </>
        )
    }
  })()

  return (
    <div className="page-narrow">
      <p className="small">
        <Link to="/">Learning path</Link> / Topic lesson
      </p>
      <h1>{lesson.title}</h1>
      {missingPrereqs.length > 0 && (
        <p className="notice small">
          Suggested first:{' '}
          {missingPrereqs.map((p) => (
            <Link key={p} to={`/learn/${p}`} style={{ marginRight: 8 }}>
              {LESSON_BY_ID[p]?.title ?? p}
            </Link>
          ))}
          . You can continue anyway.
        </p>
      )}
      <nav aria-label="Lesson steps">
        <ol className="lesson-steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                aria-current={i === step ? 'step' : undefined}
                className={i <= (progress?.step ?? 0) ? 'visited' : ''}
                onClick={() => setStep(i)}
              >
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <Swap id={step} as="section" aria-labelledby="step-h">
        <h2 id="step-h" style={{ fontSize: 'var(--t-3)' }}>
          {STEPS[step]}
        </h2>
        {body}
      </Swap>
      <div className="row" style={{ marginTop: 32, justifyContent: 'space-between' }}>
        <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </button>
        {step < STEPS.length - 1 && (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
            Continue to {STEPS[step + 1].toLowerCase()}
          </button>
        )}
      </div>
    </div>
  )
}
