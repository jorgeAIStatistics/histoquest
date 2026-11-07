import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { findTaskForRoute } from './journey'
import { useJourney } from './useJourney'
import './journey.css'

export default function JourneyFrame({ children }: { children: ReactNode }) {
  const location = useLocation()
  const match = findTaskForRoute(location.pathname, location.search)
  return <CourseContext taskId={match?.task.id}>{children}</CourseContext>
}

function CourseContext({ taskId, children }: { taskId?: string; children: ReactNode }) {
  const { journey, archive } = useJourney()
  const stage = journey.stages.find((entry) => entry.tasks.some((task) => task.id === taskId))
  const index = stage?.tasks.findIndex((entry) => entry.id === taskId)
  const task = stage?.tasks[index ?? -1]
  const next = journey.nextTask
  return (
    <>
      {stage && task && (
        <aside className="journey-frame" aria-label="Your place in the course">
          <div>
            <p>
              <strong>
                Stage {stage.number} of {journey.stages.length} · {stage.title}
              </strong>
            </p>
            <p className="small">
              Activity {(index ?? 0) + 1} of {stage.totalTasks}
              {task.complete
                ? task.pendingReview
                  ? ' · Recorded; qualified review pending'
                  : ' · Complete'
                : ''}
            </p>
          </div>
          <Link to={`/?stage=${stage.id}`}>Back to learning path</Link>
        </aside>
      )}
      {children}
      {stage && task && !['chapter', 'lesson'].includes(task.kind) && (
        <section className="page journey-return" aria-labelledby="journey-return-heading">
          <h2 id="journey-return-heading">
            {task.complete
              ? journey.allComplete
                ? 'You have reached the end of the course'
                : 'Your next activity'
              : 'Keep your place in the course'}
          </h2>
          {task.complete && !archive.loading ? (
            <>
              {task.pendingReview && (
                <p>
                  This exercise is recorded. Its written reasoning still needs qualified review.
                </p>
              )}
              <p>
                {next
                  ? next.title
                  : 'Review your results and revisit topics you want to strengthen.'}
              </p>
              <Link className="btn btn-primary" to={next?.href ?? '/progress'}>
                {next ? 'Continue learning' : 'Review your learning record'}
              </Link>
            </>
          ) : (
            <>
              <p>
                Finish this activity to record it in your learning path. You can return to the
                course at any time without resetting your progress.
              </p>
              <Link to={`/?stage=${stage.id}`}>Return to this stage</Link>
            </>
          )}
        </section>
      )}
    </>
  )
}
