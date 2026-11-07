import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LabRecord } from '../../store/labSchema'
import { replayRun, reduceEvent } from '../../sim/core/replay'
import { referenceTwin } from '../../sim/core/reference'
import { createTwin } from '../../sim/specimen/initial'
import { slideAppearance } from '../../sim/specimen/appearance'
import type { SlideAppearance, Twin } from '../../sim/specimen/types'
import { assessTwin } from '../../sim/scoring/assess'
import { gradePractical, PRACTICAL_BY_ID } from '../../sim/scoring/practicals'
import { PROCESS as P } from '../../sim/params/process'
import { STATION_BY_ID } from './stations'
import './debrief.css'

const Microscope = lazy(() => import('../../render2d/Microscope'))
type ArtifactKey =
  | 'compression'
  | 'chatter'
  | 'holes'
  | 'folds'
  | 'wrinkles'
  | 'bubbles'
  | 'ice'
  | 'haze'
  | 'edge'
  | 'lifting'
  | 'pigment'
  | 'retraction'
const causalLabels: Record<ArtifactKey, string> = {
  compression: 'Compressed tissue',
  chatter: 'Chatter bands',
  holes: 'Missing tissue',
  folds: 'Folded section',
  wrinkles: 'Wrinkled section',
  bubbles: 'Bubbles',
  ice: 'Ice spaces',
  haze: 'Cloudy mounting',
  edge: 'Edge deposition',
  lifting: 'Section lifting',
  pigment: 'Pigment deposition',
  retraction: 'Retraction',
}
const timeLabel = (minutes: number) =>
  `${Math.floor(minutes)}:${String(Math.round((minutes % 1) * 60)).padStart(2, '0')}`

function causalFindings(record: LabRecord) {
  const final = replayRun(record)
  const finalAppearance = slideAppearance(final)
  let previous = createTwin(final.scenario)
  const changes = new Map<
    ArtifactKey,
    { key: ArtifactKey; event: number; before: number; after: number; detail: string }
  >()
  for (const event of record.events) {
    const before = slideAppearance(previous)
    const next = reduceEvent(previous, event)
    const after = slideAppearance(next)
    for (const key of Object.keys(causalLabels) as ArtifactKey[]) {
      if (after[key] > P['quality.artifact-threshold'] && after[key] > before[key])
        changes.set(key, {
          key,
          event: event.sequence,
          before: before[key],
          after: after[key],
          detail:
            key === 'chatter'
              ? `Clamp stability ${Math.round(next.instrument.clamp * 100)}%; clearance ${next.instrument.angle}°; cutting speed ${next.instrument.speed}.`
              : key === 'compression'
                ? `Block temperature ${next.block.temperature}°C; edge sharpness ${Math.round(next.instrument.sharpness * 100)}%; cutting speed ${next.instrument.speed}.`
                : `The model field changed after ${event.intent.replaceAll('.', ' → ')}.`,
        })
    }
    previous = next
  }
  return [...changes.values()].filter(
    (change) => finalAppearance[change.key] > P['quality.artifact-threshold'],
  )
}

/** onReplay(n) means n events applied: zero is the initial state, length is final. */
export default function Debrief({
  record,
  twin,
  onReplay,
}: {
  record: LabRecord
  twin: Twin
  onReplay: (sequence: number) => void
}) {
  const [cursor, setCursor] = useState(record.events.length)
  const finalTwin = useMemo(() => replayRun(record), [record])
  const practical = useMemo(
    () =>
      record.practicalId && PRACTICAL_BY_ID[record.practicalId]
        ? gradePractical(finalTwin, record.practicalId)
        : null,
    [finalTwin, record.practicalId],
  )
  const assessment = practical?.assessment ?? assessTwin(finalTwin)
  const causal = useMemo(() => causalFindings(record), [record])
  const appearance = useMemo(() => slideAppearance(twin), [twin])
  const ideal = useMemo(() => {
    const current = slideAppearance(finalTwin)
    return current.special || current.dab > 0
      ? undefined
      : slideAppearance(referenceTwin(finalTwin.scenario))
  }, [finalTwin])
  const selected = cursor > 0 ? record.events[cursor - 1] : undefined
  const inspect = (next: number) => {
    setCursor(next)
    onReplay(next)
  }
  const archived = twin.archivedSlides
  const [archivedIndex, setArchivedIndex] = useState(-1)
  const shown: SlideAppearance =
    archivedIndex >= 0 && archived[archivedIndex] ? archived[archivedIndex].appearance : appearance
  return (
    <section className="lab-debrief" aria-labelledby="debrief-title">
      <header>
        <h2 id="debrief-title">Review this run</h2>
        <p>
          {record.title}. Every replay uses the stored seed and actions; it does not reroll the
          case.
        </p>
        <p className="debrief-outcome">
          <strong>
            {practical?.requiresQualifiedReview
              ? 'Requires qualified review'
              : (practical?.passed ?? assessment.passed)
                ? 'Exercise criteria met'
                : 'More practice needed'}
          </strong>{' '}
          · {practical?.total ?? assessment.total}%{' '}
          {practical?.requiresQualifiedReview ? 'documentation completeness' : 'exercise score'}
          {assessment.critical.length > 0 &&
            ` · ${assessment.critical.length} critical event${assessment.critical.length === 1 ? '' : 's'}`}
        </p>
        <p className="small muted">
          {practical?.reviewNote ??
            'This score describes the stations recorded in this free practice run; it does not establish that an entire specimen workflow was completed. It is separate from workplace competency and fresh exam-question evidence.'}
        </p>
      </header>
      <section className="debrief-timeline" aria-labelledby="debrief-timeline-title">
        <h3 id="debrief-timeline-title">Replay the decisions</h3>
        <label htmlFor="debrief-timeline-slider">
          State after {cursor} of {record.events.length} recorded actions
          <input
            id="debrief-timeline-slider"
            type="range"
            min={0}
            max={record.events.length}
            value={cursor}
            onChange={(event) => inspect(Number(event.target.value))}
          />
        </label>
        <div className="row">
          <button
            className="btn"
            disabled={cursor === 0}
            type="button"
            onClick={() => inspect(Math.max(0, cursor - 1))}
          >
            Previous action
          </button>
          <button
            className="btn"
            disabled={cursor === record.events.length}
            type="button"
            onClick={() => inspect(Math.min(record.events.length, cursor + 1))}
          >
            Next action
          </button>
          <button
            className="btn btn-quiet"
            type="button"
            onClick={() => inspect(record.events.length)}
          >
            Final preparation
          </button>
        </div>
        <p className="debrief-selected-action" role="status">
          {selected
            ? `${timeLabel(selected.t)} model minutes · ${STATION_BY_ID[selected.station]?.label ?? selected.station} · ${selected.intent.replaceAll('.', ' → ')}`
            : 'Initial specimen, before the first recorded action.'}
        </p>
        {selected && (
          <details>
            <summary>Recorded action values</summary>
            <dl>
              {Object.entries(selected.params).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replaceAll(/([A-Z])/g, ' $1')}</dt>
                  <dd>
                    {typeof value === 'boolean'
                      ? value
                        ? 'Yes'
                        : 'No'
                      : value === null
                        ? 'Unset'
                        : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </section>
      {archived.length > 0 && (
        <label className="debrief-slide-choice">
          Section to inspect
          <select
            className="input"
            value={archivedIndex}
            onChange={(event) => setArchivedIndex(Number(event.target.value))}
          >
            <option value={-1}>Current section at this replay point</option>
            {archived.map((slide, index) => (
              <option key={`${slide.id}-${index}`} value={index}>
                Archived {slide.id}
              </option>
            ))}
          </select>
        </label>
      )}
      <Suspense fallback={<p>Loading the simulated slide…</p>}>
        <Microscope appearance={shown} ideal={archivedIndex < 0 ? ideal : undefined} />
      </Suspense>
      {!ideal && (
        <p className="small muted">
          Special-stain and IHC sections retain their own chemistry. Their control comparisons are
          reviewed within the corresponding station.
        </p>
      )}
      <section className="debrief-causes" aria-labelledby="debrief-causes-title">
        <h3 id="debrief-causes-title">From action to outcome</h3>
        {assessment.critical.length > 0 && (
          <p>
            Critical history remains in the record after corrective action. An acceptable later
            image cannot erase that history.
          </p>
        )}
        {finalTwin.issues.length === 0 && causal.length === 0 ? (
          <p>
            No modeled critical issue or artifact above the teaching threshold was detected. This
            does not independently validate a real preparation.
          </p>
        ) : (
          <ol>
            {finalTwin.issues.map((issue) => (
              <li key={`${issue.id}-${issue.event}`}>
                <div className="debrief-cause-heading">
                  <strong>{issue.title}</strong>
                  <span>
                    {issue.severity}
                    {issue.resolved ? ' · corrective action recorded' : ''}
                  </span>
                </div>
                <p>{issue.cause}</p>
                <p>
                  <strong>Effect:</strong> {issue.effect}
                </p>
                <p>
                  <strong>Next practice:</strong> {issue.remedy}
                </p>
                <div className="row">
                  <button className="btn btn-quiet" onClick={() => inspect(issue.event + 1)}>
                    Replay this action
                  </button>
                  <Link to={issue.lesson}>Review the related lesson</Link>
                </div>
              </li>
            ))}
            {causal.map((change) => {
              const event = record.events[change.event]
              return (
                <li key={change.key}>
                  <div className="debrief-cause-heading">
                    <strong>{causalLabels[change.key]}</strong>
                    <span>{timeLabel(event.t)} model minutes</span>
                  </div>
                  <p>
                    {change.detail} The {change.key} field rose from{' '}
                    {Math.round(change.before * 100)}% to {Math.round(change.after * 100)}% at this
                    step.
                  </p>
                  <p>
                    This is a causal attribution within the teaching model, not a diagnosis of a
                    real slide.
                  </p>
                  <div className="row">
                    <button className="btn btn-quiet" onClick={() => inspect(change.event + 1)}>
                      Replay this change
                    </button>
                    <Link to={STATION_BY_ID[event.station]?.lesson ?? '/pathway'}>
                      Review the station
                    </Link>
                    <Link to="/atlas">Compare artifact references</Link>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
      {practical && (
        <section className="debrief-rubric">
          <h3>Published practical checks</h3>
          <ul>
            {practical.checks.map((check) => (
              <li key={check.id}>
                <strong>
                  {check.passed ? 'Met' : 'Not yet met'}: {check.label}
                </strong>
                <p>{check.evidence}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="debrief-dimensions">
        <h3>How the score was built</h3>
        <div className="debrief-table-scroll">
          <table>
            <caption>Station dimensions, in percent of this exercise rubric</caption>
            <thead>
              <tr>
                <th scope="col">Station</th>
                <th scope="col">Quality</th>
                <th scope="col">Process</th>
                <th scope="col">Safety</th>
                <th scope="col">Records</th>
                <th scope="col">Efficiency</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {assessment.stations.map((station) => (
                <tr key={station.station}>
                  <th scope="row">{STATION_BY_ID[station.station]?.label ?? station.station}</th>
                  <td>{station.quality}</td>
                  <td>{station.process}</td>
                  <td>{station.safety}</td>
                  <td>{station.documentation}</td>
                  <td>{station.efficiency}</td>
                  <td>{station.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Weights: quality {P['quality.weight-quality'] * 100}%, process{' '}
          {P['quality.weight-process'] * 100}%, safety {P['quality.weight-safety'] * 100}%, records{' '}
          {P['quality.weight-documentation'] * 100}%, efficiency{' '}
          {P['quality.weight-efficiency'] * 100}%. All are illustrative educational criteria.
          Critical errors override a passing numerical score.
        </p>
      </section>
      <div className="row">
        <Link
          className="btn"
          to={
            record.practicalId
              ? `/lab3d?practical=${encodeURIComponent(record.practicalId)}`
              : '/lab3d'
          }
        >
          Repeat targeted practice
        </Link>
        <Link className="btn btn-quiet" to="/career">
          View practice evidence
        </Link>
      </div>
    </section>
  )
}
