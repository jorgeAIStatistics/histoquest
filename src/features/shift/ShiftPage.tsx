import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { assessShift, createShift, shiftRecordIdentity } from '../../sim/core/shifts'
import { useAppState } from '../../store/store'
import { useAllLabRuns } from '../../store/labArchive'
import './shift.css'

export default function ShiftPage() {
  const [search, setSearch] = useSearchParams()
  const archive = useAllLabRuns()
  const runs = archive.runs
  const draft = useAppState((state) => state.lab.draft)
  const querySeed = search.get('seed')
  const seed = querySeed && /^[A-Za-z0-9_-]{1,40}$/.test(querySeed) ? querySeed : 'HQ-SHIFT-01'
  const [seedInput, setSeedInput] = useState({ seed, value: seed })
  const input = seedInput.seed === seed ? seedInput.value : seed
  const shift = useMemo(() => createShift(seed), [seed])
  const records = useMemo(
    () => (draft ? [...runs.filter((record) => record.id !== draft.id), draft] : runs),
    [runs, draft],
  )
  const assessment = useMemo(() => assessShift(seed, records), [seed, records])
  const available = assessment.cases
    .filter((entry) => !entry.passed && entry.case.arrival <= assessment.currentQueueMinute)
    .toSorted((a, b) => a.case.priority - b.case.priority)
  const next = available[0] ?? assessment.cases.find((entry) => !entry.passed)
  const previousSeeds = [
    ...new Set(
      records
        .map((record) => shiftRecordIdentity(record)?.seed)
        .filter((value): value is string => !!value),
    ),
  ]
  const choose = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch({ seed: input.trim() })
  }
  return (
    <div className="page shift-page">
      {archive.loading && <p role="status">Reading saved shift history…</p>}
      {archive.error && (
        <p className="notice" role="alert">
          Archived queue records could not be read. Recent records remain available. {archive.error}
        </p>
      )}
      <header className="shift-intro">
        <h1>A shift at the laboratory</h1>
        <p className="lede">
          Keep five separate cases moving through routine work, an urgent frozen consultation, a
          processor alarm, a control failure and an added levels request.
        </p>
        <p>{shift.boundary}</p>
        <div className="row">
          <Link className="btn btn-quiet" to="/career">
            Review learning milestones
          </Link>
          <Link className="btn btn-quiet" to="/lab3d">
            Open the laboratory
          </Link>
        </div>
      </header>
      <form className="shift-seed-form" onSubmit={choose}>
        <label htmlFor="shift-seed">
          Reproducible shift seed
          <input
            id="shift-seed"
            className="input"
            value={input}
            onChange={(event) => setSeedInput({ seed, value: event.target.value })}
            pattern="(?:[A-Za-z0-9_]|-){1,40}"
            maxLength={40}
            required
            aria-describedby="shift-seed-help"
          />
        </label>
        <button className="btn" type="submit">
          Open this queue
        </button>
        <p id="shift-seed-help">
          Use letters, numbers, underscores or hyphens. The same seed recreates the same cases;
          saved actions determine the outcomes.
        </p>
      </form>
      {previousSeeds.length > 0 && (
        <nav className="shift-history" aria-label="Saved shift seeds">
          <span>Saved queues:</span>
          {previousSeeds.map((value) => (
            <Link
              key={value}
              to={`/shift?seed=${encodeURIComponent(value)}`}
              aria-current={value === seed ? 'page' : undefined}
            >
              {value}
            </Link>
          ))}
        </nav>
      )}
      <section className="shift-clock" aria-labelledby="shift-queue-heading">
        <div>
          <h2 id="shift-queue-heading">Queue: {seed}</h2>
          <p>
            Recorded queue clock:{' '}
            <strong>{assessment.currentQueueMinute.toFixed(1)} model minutes</strong>.{' '}
            {assessment.cases.filter((entry) => entry.passed).length} of {assessment.cases.length}{' '}
            cases meet the technical exercise criteria.
          </p>
        </div>
        {next && (
          <p className="shift-next">
            Next available priority: <strong>{next.case.title}</strong>
            {next.case.arrival > assessment.currentQueueMinute
              ? `, arriving at ${next.case.arrival} model minutes.`
              : '.'}
          </p>
        )}
      </section>
      <ol className="shift-queue">
        {assessment.cases
          .toSorted((a, b) => a.case.arrival - b.case.arrival)
          .map((entry) => {
            const at = Math.max(entry.case.arrival, assessment.currentQueueMinute)
            const href = `/lab3d?shift=${encodeURIComponent(seed)}&case=${entry.case.id}&at=${at}`
            return (
              <li
                key={entry.case.id}
                className={entry.case.id === next?.case.id ? 'shift-case is-next' : 'shift-case'}
              >
                <div className="shift-case-heading">
                  <div>
                    <h3>{entry.case.title}</h3>
                    <p>
                      {entry.case.preparation === 'processed-block'
                        ? 'Prepared block with a supplied history'
                        : entry.case.preparation === 'fixed-cassettes'
                          ? 'Fixed cassettes with an alarm record'
                          : 'Separate unfixed specimen'}{' '}
                      · priority {entry.case.priority}
                    </p>
                  </div>
                  <strong className="shift-status">
                    {entry.status === 'waiting'
                      ? entry.case.arrival > assessment.currentQueueMinute
                        ? 'Awaiting arrival'
                        : 'Ready to start'
                      : entry.status === 'in-progress'
                        ? 'In progress'
                        : entry.status === 'needs-correction'
                          ? 'Review and repeat'
                          : entry.status === 'paused'
                            ? 'Paused'
                            : 'Technical criteria met'}
                  </strong>
                </div>
                <p>{entry.case.brief}</p>
                <dl className="shift-times">
                  <div>
                    <dt>Arrival</dt>
                    <dd>{entry.case.arrival} min</dd>
                  </div>
                  <div>
                    <dt>Scenario target</dt>
                    <dd>{entry.case.targetMinutes} min after arrival</dd>
                  </div>
                  <div>
                    <dt>Recorded turnaround</dt>
                    <dd>
                      {entry.turnaround === null
                        ? 'Not started'
                        : `${entry.turnaround.toFixed(1)} min${entry.record?.completedAt ? (entry.withinTarget ? ' · within scenario target' : ' · target exceeded') : ' · unfinished'}`}
                    </dd>
                  </div>
                </dl>
                <details>
                  <summary>Required actions and current evidence</summary>
                  <ul>
                    {entry.case.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                  {entry.checks.length > 0 && (
                    <ul className="shift-checks">
                      {entry.checks.map((check) => (
                        <li key={check.label}>
                          <strong>{check.passed ? 'Recorded' : 'Still needed'}:</strong>{' '}
                          {check.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p>
                    Supplied upstream events are marked as scenario setup. They do not count as
                    learner actions. Completing a case requires real specimen actions and a valid
                    technical release; there is no completion checkbox.
                  </p>
                </details>
                <div className="row">
                  {!entry.passed && (
                    <Link className="btn btn-primary" to={href}>
                      {entry.status === 'paused' || entry.status === 'in-progress'
                        ? 'Resume this case'
                        : entry.status === 'needs-correction'
                          ? 'Open for corrective practice'
                          : entry.case.arrival > assessment.currentQueueMinute
                            ? `Advance to arrival and open case`
                            : 'Start this case'}
                    </Link>
                  )}
                  {entry.record && (
                    <Link
                      className="btn btn-quiet"
                      to={`/lab3d?replay=${encodeURIComponent(entry.record.id)}`}
                    >
                      Replay case history
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
      </ol>
      <section className="shift-debrief" aria-labelledby="shift-review-heading">
        <h2 id="shift-review-heading">Shift review</h2>
        {assessment.complete ? (
          <p>
            <strong>
              {assessment.passed
                ? 'Technical exercise criteria met'
                : 'Review the remaining technical criteria'}
              .
            </strong>{' '}
            Composite exercise score: {assessment.score}%. Timing and priority contribute to the
            score; critical history always prevents a pass.
          </p>
        ) : (
          <p>
            The shift assessment remains in progress until each case has a saved run. Review the
            evidence while you work; speed never overrides identity, safe handling or valid
            controls.
          </p>
        )}
        {assessment.critical.length > 0 && (
          <ul>
            {assessment.critical.map((issue, index) => (
              <li key={`${issue.id}-${index}`}>
                <strong>
                  {issue.severity}: {issue.title}.
                </strong>{' '}
                {issue.effect} <Link to={issue.lesson}>Review the relevant principle</Link>.
              </li>
            ))}
          </ul>
        )}
        <h3>Priority and interruption decisions</h3>
        {assessment.priorityFindings.length ? (
          <ul>
            {assessment.priorityFindings.map((finding, index) => (
              <li key={`${finding.caseId}-${finding.event}-${index}`}>
                At {finding.minute.toFixed(1)} model minutes,{' '}
                {shift.cases.find((entry) => entry.id === finding.caseId)?.title} was dispatched
                while the higher-priority{' '}
                {shift.cases.find((entry) => entry.id === finding.urgentCaseId)?.title} remained
                pending. Review whether a documented pause or escalation was needed.
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No higher-priority pending case was skipped at a recorded dispatch or resume. This
            assesses the authored queue, not real laboratory staffing or workload.
          </p>
        )}
        <p className="small muted">
          Case clocks are replayed from recorded dispatch, pause and resume events. The model does
          not infer staff availability or parallel instrument capacity from real elapsed time.
        </p>
      </section>
    </div>
  )
}
