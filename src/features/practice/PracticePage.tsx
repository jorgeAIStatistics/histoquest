import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ACTIVE_GUIDELINE } from '../../content/curriculum'
import { CARDS, QUESTIONS } from '../../content'
import { localDate } from '../../engine/dates'
import { isDue } from '../../engine/srs'
import { useAppState } from '../../store/store'
import { createSession } from './sessions'

export default function PracticePage() {
  const nav = useNavigate()
  const [search] = useSearchParams()
  const course = search.get('course')
  const guided = course === 'mixed' || course === 'exam'
  const [err, setErr] = useState<string>()
  const srs = useAppState((s) => s.srs)
  const sessions = useAppState((s) => s.sessions)
  const today = localDate()
  const dueQ = QUESTIONS.filter((q) => isDue(srs[`q:${q.id}`], today)).length
  const dueC = CARDS.filter((c) => isDue(srs[`c:${c.id}`], today)).length
  const unfinished = sessions
    .filter((s) => !s.submittedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const g = ACTIVE_GUIDELINE

  const start = (spec: Parameters<typeof createSession>[0]) => {
    const r = createSession(spec)
    if ('error' in r) setErr(r.error)
    else nav(`/practice/session/${r.id}${guided ? `?course=${course}` : ''}`)
  }

  if (guided) {
    const exam = course === 'exam'
    const count = exam ? g.examModel.questions : 25
    const resume = unfinished.find(
      (session) =>
        session.kind === course &&
        session.mode === (exam ? 'exam' : 'study') &&
        session.questionIds.length >= count,
    )
    return (
      <div className="page-narrow" style={{ color: 'var(--ink)' }}>
        <h1>{exam ? 'Your full-length practice exam' : 'Your mixed review session'}</h1>
        <p className="lede">
          {exam
            ? `Bring the course together with ${count} questions in ${g.examModel.minutes} minutes.`
            : 'Review 25 questions across the content areas. Read each explanation before moving on.'}
        </p>
        <p>
          {exam
            ? 'This is a fixed practice form, not an adaptive ASCP exam or a prediction of passing. Explanations become available after submission.'
            : 'Use this session to recognize the topics you understand and the ones to revisit.'}
        </p>
        <p>
          Answer every question and submit the session to record this course activity. Your score
          stays in Progress for review.
        </p>
        {exam && (
          <p className="notice">
            The timer starts when you begin and keeps running if you close the tab.
          </p>
        )}
        {err && (
          <p className="notice" role="alert">
            {err}
          </p>
        )}
        {resume ? (
          <Link className="btn btn-primary" to={`/practice/session/${resume.id}?course=${course}`}>
            Resume this session
          </Link>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() =>
              start(
                exam
                  ? {
                      kind: 'exam',
                      mode: 'exam',
                      title: 'Full-length practice exam',
                      n: count,
                      minutes: g.examModel.minutes,
                    }
                  : { kind: 'mixed', mode: 'study', title: 'Mixed practice', n: count },
              )
            }
          >
            {exam ? `Start full exam (${count} questions)` : 'Start mixed review (25 questions)'}
          </button>
        )}
        <p style={{ marginTop: 24 }}>
          <Link to="/practice">Browse all practice options</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Practice</h1>
          <p className="lede">
            Study mode explains each answer as you go. Exam mode saves explanations until you
            submit.
          </p>
        </div>
      </div>
      {err && (
        <p className="notice" role="alert">
          {err}
        </p>
      )}

      {unfinished.length > 0 && (
        <section className="panel" style={{ marginBottom: 28 }} aria-labelledby="resume-h">
          <h2 id="resume-h" style={{ fontSize: 'var(--t-3)' }}>
            Pick up where you left off
          </h2>
          <ul className="list">
            {unfinished.slice(0, 4).map((s) => (
              <li key={s.id}>
                <Link className="list-row" to={`/practice/session/${s.id}`}>
                  <span>
                    <strong>{s.title}</strong>
                    <br />
                    <span className="small muted">
                      {Object.keys(s.answers).length} of {s.questionIds.length} answered · started{' '}
                      {new Date(s.startedAt).toLocaleString()}
                    </span>
                  </span>
                  <span className={`tag ${s.mode === 'exam' ? 'tag-eosin' : 'tag-hema'}`}>
                    {s.mode === 'exam' ? 'Timed exam' : 'Study'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2">
        <section className="panel" aria-labelledby="review-h">
          <h2 id="review-h" style={{ fontSize: 'var(--t-3)' }}>
            Review queue
          </h2>
          <p>
            {dueQ + dueC
              ? `${dueQ} questions and ${dueC} retrieval cards are due, plus recent misses and guesses.`
              : 'Nothing is due. Missed and low-confidence answers will appear here.'}
          </p>
          <Link className="btn btn-primary" to="/practice/review?limit=12">
            Start review
          </Link>
        </section>
        <section className="panel" aria-labelledby="quick-h">
          <h2 id="quick-h" style={{ fontSize: 'var(--t-3)' }}>
            Quick quiz
          </h2>
          <p>Ten blueprint-weighted questions, unseen ones first. Takes about 10 minutes.</p>
          <div className="row">
            <button
              className="btn btn-primary"
              onClick={() => start({ kind: 'quiz', mode: 'study', title: 'Quick quiz', n: 10 })}
            >
              Start quick quiz
            </button>
            <button
              className="btn"
              onClick={() =>
                start({ kind: 'mixed', mode: 'study', title: 'Mixed practice', n: 25 })
              }
            >
              25 mixed
            </button>
          </div>
        </section>
      </div>

      <section style={{ marginTop: 32 }} aria-labelledby="domain-h">
        <h2 id="domain-h" style={{ fontSize: 'var(--t-3)' }}>
          By content area
        </h2>
        <ul className="list">
          {g.domains.map((d) => {
            const n = QUESTIONS.filter((q) => q.domain === d.id).length
            return (
              <li key={d.id}>
                <div className="list-row">
                  <span>
                    <strong>{d.name}</strong>{' '}
                    <span className="small muted">
                      · {d.min}–{d.max}% of the exam · {n} questions in the bank
                    </span>
                  </span>
                  <button
                    className="btn"
                    onClick={() =>
                      start({
                        kind: 'domain',
                        mode: 'study',
                        title: `${d.name} practice`,
                        domain: d.id,
                        n: 10,
                      })
                    }
                  >
                    Practise 10
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid-2" style={{ marginTop: 32 }}>
        <section className="panel" aria-labelledby="case-h">
          <h2 id="case-h" style={{ fontSize: 'var(--t-3)' }}>
            Troubleshooting cases
          </h2>
          <p>
            Failed runs and bench problems where you reason from evidence to cause.{' '}
            {QUESTIONS.filter((q) => q.kind === 'case').length} cases in the bank. For image
            questions, see the schematic artifact items in Embedding/Microtomy.
          </p>
          <button
            className="btn"
            onClick={() =>
              start({ kind: 'case', mode: 'study', title: 'Troubleshooting cases', n: 8 })
            }
          >
            Solve 8 cases
          </button>
        </section>
        <section className="panel" aria-labelledby="exam-h">
          <h2 id="exam-h" style={{ fontSize: 'var(--t-3)' }}>
            Timed practice exam
          </h2>
          <p>
            The real exam is {g.examModel.questions} questions in{' '}
            {g.examModel.minutes / 60 >= 1
              ? `${Math.floor(g.examModel.minutes / 60)} h ${g.examModel.minutes % 60} min`
              : `${g.examModel.minutes} min`}
            , delivered adaptively by ASCP. This is a fixed, blueprint-weighted form at the same
            pace. It is not adaptive and does not produce a scaled score.
          </p>
          <div className="row">
            <button
              className="btn btn-primary"
              onClick={() =>
                start({
                  kind: 'exam',
                  mode: 'exam',
                  title: 'Full-length practice exam',
                  n: g.examModel.questions,
                  minutes: g.examModel.minutes,
                })
              }
            >
              Start full exam ({g.examModel.questions} questions)
            </button>
            <button
              className="btn"
              onClick={() =>
                start({
                  kind: 'exam',
                  mode: 'exam',
                  title: 'Short timed exam',
                  n: 25,
                  minutes: Math.round((25 * g.examModel.minutes) / g.examModel.questions),
                })
              }
            >
              25 questions, {Math.round((25 * g.examModel.minutes) / g.examModel.questions)} min
            </button>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            The timer keeps running if you close the tab. It is set by a saved deadline, so a
            refresh resumes the same clock.
          </p>
        </section>
      </div>
    </div>
  )
}
