import { useMemo, useState } from 'react'
import { JourneyOverview } from '../pathway/Figures'
import { Link } from 'react-router-dom'
import { CAREER_LEVELS, COMPETENCY_BY_ID, LEARNING_BOUNDARY } from '../../content/lab/curriculum'
import { competencyEvidence, gradePractical, PRACTICAL_BY_ID } from '../../sim/scoring/practicals'
import { replayRun } from '../../sim/core/replay'
import { useAppState } from '../../store/store'
import { useAllLabRuns } from '../../store/labArchive'
import './career.css'

export default function CareerPage() {
  const archive = useAllLabRuns()
  const runs = archive.runs
  const passedPracticals = useAppState((state) => state.lab.passedPracticals)
  const draft = useAppState((state) => state.lab.draft)
  const [selectedLevel, setSelected] = useState<number | null>(null)
  const graded = useMemo(
    () =>
      runs
        .filter(
          (record) =>
            record.completedAt && record.practicalId && PRACTICAL_BY_ID[record.practicalId],
        )
        .map((record) => ({
          record,
          grade: gradePractical(replayRun(record), record.practicalId!),
        })),
    [runs],
  )
  const matrix = useMemo(() => competencyEvidence(runs), [runs])
  const passed = new Set([
    ...passedPracticals,
    ...graded.filter(({ grade }) => grade.passed).map(({ record }) => record.practicalId!),
  ])
  const recordedPlans = new Set(
    graded
      .filter(
        ({ grade }) =>
          grade.requiresQualifiedReview &&
          grade.checks.every((check) => check.passed) &&
          !grade.critical.length,
      )
      .map(({ record }) => record.practicalId!),
  )
  const nextIndex = CAREER_LEVELS.findIndex(
    (entry, index) =>
      !passed.has(entry.practical.id) &&
      !recordedPlans.has(entry.practical.id) &&
      (index === 0 ||
        passed.has(CAREER_LEVELS[index - 1].practical.id) ||
        recordedPlans.has(CAREER_LEVELS[index - 1].practical.id)),
  )
  const recommended = Math.max(0, nextIndex === -1 ? CAREER_LEVELS.length - 1 : nextIndex)
  const selected = selectedLevel ?? recommended
  const nextLevel = CAREER_LEVELS[recommended]
  const level = CAREER_LEVELS[selected]
  const spec = PRACTICAL_BY_ID[level.practical.id]
  const prerequisite = selected > 0 ? CAREER_LEVELS[selected - 1] : null
  const unlocked =
    !prerequisite ||
    passed.has(prerequisite.practical.id) ||
    recordedPlans.has(prerequisite.practical.id)
  const completed = passed.has(level.practical.id)
  return (
    <div className="page career-page">
      {archive.error && (
        <p className="notice" role="alert">
          Archived evidence could not be read. Recent records are shown. {archive.error}
        </p>
      )}
      <header className="career-intro">
        <div className="career-intro-content">
          <h1>Practice through the laboratory</h1>
          <p className="lede">
            Build your specimen-to-slide skills, one laboratory station at a time.
          </p>
          <p className="small muted">{LEARNING_BOUNDARY}</p>
          {archive.loading ? (
            <p role="status">Finding your next learning milestone…</p>
          ) : (
            <p>
              <Link
                className="btn btn-primary"
                to={
                  draft && !draft.completedAt && draft.events.length
                    ? `/lab3d?replay=${encodeURIComponent(draft.id)}`
                    : `/lab3d?practical=${encodeURIComponent(nextLevel.practical.id)}`
                }
              >
                {draft && !draft.completedAt && draft.events.length
                  ? 'Continue your saved laboratory case'
                  : `Continue with ${nextLevel.id}: ${nextLevel.title}`}
              </Link>
            </p>
          )}
          <div className="career-quicklinks">
            <Link className="btn btn-quiet" to="/pathway">
              Reference pathway
            </Link>
            <Link className="btn btn-quiet" to="/lab3d">
              Free laboratory
            </Link>
            <Link className="btn btn-quiet" to="/shift">
              Simulated shift
            </Link>
            <Link className="btn btn-quiet" to="/clinic">
              Troubleshooting clinic
            </Link>
          </div>
        </div>
        <figure className="career-journey">
          <JourneyOverview />
          <figcaption>Preserve identity. Understand each transformation.</figcaption>
        </figure>
      </header>
      <div className="career-layout">
        <nav className="career-ladder" aria-label="Learning levels">
          <ol>
            {CAREER_LEVELS.map((entry, index) => (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-current={selected === index ? 'step' : undefined}
                  onClick={() => setSelected(index)}
                >
                  <strong>{entry.id}</strong>
                  <span>
                    {entry.title}
                    <small>
                      {passed.has(entry.practical.id)
                        ? 'Practical passed in HistoQuest'
                        : recordedPlans.has(entry.practical.id)
                          ? 'Plan recorded · qualified review pending'
                          : index === 0 ||
                              passed.has(CAREER_LEVELS[index - 1].practical.id) ||
                              recordedPlans.has(CAREER_LEVELS[index - 1].practical.id)
                            ? 'Available for practice'
                            : 'Previous practical required'}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <section className="career-level" aria-labelledby="career-level-heading">
          <h2 id="career-level-heading">
            {level.id}: {level.title}
          </h2>
          <p>{level.description}</p>
          <h3>What you will practice</h3>
          <ul>
            {level.competencies.map((id) => (
              <li key={id}>{COMPETENCY_BY_ID[id]?.label}</li>
            ))}
          </ul>
          <h3>{level.practical.title}</h3>
          <p>{level.practical.scenario}</p>
          <h4>Published rubric</h4>
          <ol>
            {level.practical.rubric.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ol>
          <details>
            <summary>Observable checks and required stations</summary>
            <ul>
              {spec.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
            <p>Required station records: {spec.stations.join(', ')}.</p>
            <p>
              Critical identity, contamination, sharps or invalid-release history prevents a pass
              even after later corrections. Planning text is checked for completeness and held for
              qualified review.
            </p>
          </details>
          {completed && (
            <p className="career-result">
              You have a recorded pass for this practical inside HistoQuest. Repeats add practice
              evidence.
            </p>
          )}
          {spec.reviewRequired && (
            <p className="career-result">
              This is a planning exercise. Recorded responses require qualified review and cannot be
              automatically certified by a score.
            </p>
          )}
          {unlocked ? (
            <Link
              className="btn btn-primary"
              to={`/lab3d?practical=${encodeURIComponent(level.practical.id)}`}
            >
              {completed
                ? 'Repeat this practical'
                : spec.reviewRequired
                  ? 'Start the planning exercise'
                  : 'Start this practical'}
            </Link>
          ) : (
            <p className="career-lock">
              Complete {prerequisite?.id}: {prerequisite?.practical.title} before recording this
              milestone. All theory and free practice remain available.
            </p>
          )}
          <h3>Prepare before the attempt</h3>
          <ul>
            {level.theory.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
          <Link to="/learn">Browse lessons</Link>
        </section>
      </div>
      <section className="career-evidence" aria-labelledby="career-evidence-heading">
        <h2 id="career-evidence-heading">Practice evidence inside HistoQuest</h2>
        <p>
          These observations come from saved practicals. They are separate from question-bank
          readiness, workplace experience and licensing requirements. A recorded action does not
          prove independent bench performance.
        </p>
        <div
          className="career-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Practice evidence table; scroll horizontally to read all columns"
        >
          <table>
            <caption>Per-skill evidence from recorded practicals</caption>
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Level</th>
                <th scope="col">Recorded evidence</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  <td>{row.level}</td>
                  <td>
                    {row.reviewRequired
                      ? row.attempts
                        ? 'Responses recorded · requires qualified review'
                        : 'No plan recorded'
                      : row.demonstrated
                        ? `${row.demonstrated} attempt${row.demonstrated === 1 ? '' : 's'} met observable checks`
                        : row.attempts
                          ? `${row.attempts} attempt${row.attempts === 1 ? '' : 's'} · more practice needed`
                          : 'No practical evidence yet'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="career-history" aria-labelledby="career-history-heading">
        <h2 id="career-history-heading">Saved practicals</h2>
        {graded.length ? (
          <ol>
            {graded
              .toReversed()
              .slice(0, 12)
              .map(({ record, grade }) => (
                <li key={record.id}>
                  <div>
                    <Link to={`/lab3d?replay=${encodeURIComponent(record.id)}`}>
                      {record.title}
                    </Link>
                    <p>
                      {grade.requiresQualifiedReview
                        ? 'Requires qualified review'
                        : grade.passed
                          ? 'Practical passed'
                          : 'More practice needed'}{' '}
                      · {grade.total}%{' '}
                      {grade.requiresQualifiedReview
                        ? 'documentation completeness'
                        : 'exercise score'}
                      {grade.critical.length
                        ? ` · ${grade.critical.length} critical event${grade.critical.length === 1 ? '' : 's'}`
                        : ''}
                    </p>
                  </div>
                  <time dateTime={record.completedAt}>{record.completedAt?.slice(0, 10)}</time>
                </li>
              ))}
          </ol>
        ) : (
          <p>
            No completed practicals have been saved. Start with L0 or explore free practice before
            your first attempt.
          </p>
        )}
      </section>
    </div>
  )
}
