import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJourney } from './useJourney'
import './journey.css'

const KIND_LABEL: Record<string, string> = {
  workbench: 'Guided specimen',
  chapter: 'Read & check',
  lesson: 'Lesson',
  practical: 'Lab practical',
  clinic: 'Investigation',
  shift: 'Simulated shift',
  mixed: 'Question practice',
  exam: 'Practice exam',
}

export default function JourneyPage() {
  const { journey, archive } = useJourney()
  const [search] = useSearchParams()
  const requested = search.get('stage')
  const [expanded, setExpanded] = useState<string | null | undefined>(
    journey.stages.some((s) => s.id === requested) ? requested : undefined,
  )
  const current = journey.nextStage
  const next = journey.nextTask
  const activeStage = expanded === undefined ? current?.id : expanded
  const started = journey.completedTasks > 0 || next?.status === 'in-progress'
  const first = journey.stages[0].tasks[0]
  return (
    <div className="page journey-page">
      <header className="journey-heading">
        <h1>Your histology learning path</h1>
        <p className="lede">
          Start with the basics. Follow a specimen from bottle to slide. Build toward advanced
          practice and exam review.
        </p>
      </header>
      {archive.error && (
        <p className="notice" role="alert">
          Some older practical records could not be loaded. Recent progress is shown.{' '}
          <button className="btn btn-quiet" onClick={archive.refresh}>
            Retry saved records
          </button>
        </p>
      )}
      <section className="journey-next" aria-labelledby="journey-next-title">
        <div>
          <h2 id="journey-next-title">
            {journey.allComplete
              ? 'You have reached the end of the course'
              : started
                ? 'Pick up where you left off'
                : 'Start here. One activity at a time.'}
          </h2>
          {next && current ? (
            <>
              <p className="journey-position">
                Stage {current.number} of {journey.stages.length} · {current.title}
              </p>
              <h3>{next.title}</h3>
              <p>{next.description}</p>
              <Link
                className="btn btn-primary"
                to={next.href}
                aria-disabled={archive.loading || undefined}
                onClick={(event) => {
                  if (archive.loading) event.preventDefault()
                }}
              >
                {archive.loading
                  ? 'Finding your next activity…'
                  : started
                    ? 'Continue learning'
                    : 'Start from the beginning'}
                <Arrow />
              </Link>
            </>
          ) : (
            <>
              <p>
                Your course activities are recorded. Keep revisiting difficult topics and practicing
                recall.
              </p>
              <Link className="btn btn-primary" to="/progress">
                Review your learning record <Arrow />
              </Link>
            </>
          )}
          {journey.pendingReview && (
            <p className="small">
              Written responses are recorded; qualified review is still pending.
            </p>
          )}
        </div>
        <div className="journey-guide">
          <h3>How to follow the course</h3>
          <ol>
            <li>Open the next activity.</li>
            <li>Read, answer the checks, or practice the task.</li>
            <li>Finish it to save progress and see what comes next.</li>
          </ol>
          <p>Work at your own pace. Your place is saved in this browser.</p>
          {started && <Link to={first.href}>Review from the beginning</Link>}
        </div>
      </section>
      <section className="journey-map" aria-labelledby="journey-map-title">
        <div className="journey-map-heading">
          <h2 id="journey-map-title">The whole course, in order</h2>
          <p>
            {journey.completedTasks} of {journey.totalTasks} activities recorded ·{' '}
            {journey.completedStages} of {journey.stages.length} stages complete
          </p>
          <progress
            aria-label="Course activities recorded"
            value={journey.completedTasks}
            max={journey.totalTasks}
          />
          <p className="small muted">
            Follow the numbered stages. Open any stage to preview it or revisit earlier work.
          </p>
        </div>
        <ol className="journey-stages">
          {journey.stages.map((stage) => {
            const isCurrent = stage.id === current?.id
            return (
              <li key={stage.id} id={`stage-${stage.id}`}>
                <details
                  className={`journey-stage ${isCurrent ? 'is-current' : ''}`}
                  open={activeStage === stage.id}
                >
                  <summary
                    onClick={(event) => {
                      event.preventDefault()
                      setExpanded(activeStage === stage.id ? null : stage.id)
                    }}
                    aria-controls={`stage-content-${stage.id}`}
                  >
                    <span className={`journey-stage-number ${stage.complete ? 'is-complete' : ''}`}>
                      {stage.complete ? <Check /> : stage.number}
                      <span className="sr-only">
                        {stage.complete ? `Stage ${stage.number} complete` : ''}
                      </span>
                    </span>
                    <span className="journey-stage-label">
                      <strong>{stage.title}</strong>
                      <span>{stage.description}</span>
                    </span>
                    <span className="journey-stage-status">
                      {stage.complete
                        ? stage.pendingReview
                          ? 'Recorded · review pending'
                          : 'Complete'
                        : isCurrent
                          ? 'You are here'
                          : 'Ahead'}
                      <small>
                        {stage.completedTasks} / {stage.totalTasks} activities
                      </small>
                    </span>
                    <span className="journey-expand" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <path
                          d="m5 8 5 5 5-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="journey-stage-body" id={`stage-content-${stage.id}`}>
                    <p className="journey-outcome">
                      <strong>By the end:</strong> {stage.outcome}
                    </p>
                    <ol className="journey-tasks">
                      {stage.tasks.map((task, index) => (
                        <li key={task.id} className={task.id === next?.id ? 'is-next' : undefined}>
                          <span className="journey-task-number">
                            {task.complete ? <Check /> : `${stage.number}.${index + 1}`}
                          </span>
                          <div>
                            <Link to={task.href}>{task.title}</Link>
                            <p>
                              {KIND_LABEL[task.kind] ?? 'Activity'} ·{' '}
                              {task.pendingReview
                                ? 'Recorded; review pending'
                                : task.complete
                                  ? 'Complete'
                                  : task.id === next?.id
                                    ? 'Your next activity'
                                    : task.status === 'in-progress'
                                      ? 'In progress'
                                      : 'Not started'}
                            </p>
                          </div>
                          <Arrow />
                        </li>
                      ))}
                    </ol>
                    {stage.resources.length > 0 && (
                      <details className="journey-extras">
                        <summary>Optional references for this stage</summary>
                        <ul>
                          {stage.resources.map((resource) => (
                            <li key={resource.href}>
                              <Link to={resource.href}>{resource.title}</Link>
                              <p>{resource.description}</p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </details>
              </li>
            )
          })}
        </ol>
      </section>
      <section className="journey-finish" aria-labelledby="journey-finish-title">
        <h2 id="journey-finish-title">A clear finish, and a way to keep improving</h2>
        <p>
          Finish the eight stages to record your chapter checks, lessons, simulated practicals, and
          exam practice. The last stage brings everything together in a mixed review and a
          full-length practice exam.
        </p>
        <p className="small muted">
          Course completion records study. It does not establish bench competency, exam eligibility,
          certification, or licensure. Planning exercises need qualified review; simulation
          supplements supervised training.
        </p>
        <Link to="/library">
          Looking for a particular tool? Open the Library <Arrow />
        </Link>
      </section>
    </div>
  )
}

export function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m4 10 4 4 8-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M3 10h13m-5-5 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
