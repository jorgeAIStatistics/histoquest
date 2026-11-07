import { lazy, Suspense, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { setState, useAppState } from '../../store/store'
import { archiveRun, mergeLabRuns, useAllLabRuns } from '../../store/labArchive'
import { applyLabLearning } from '../../store/labLearning'
import type { LabRecord } from '../../store/labSchema'
import { useReducedMotion } from '../../ui/prefs'
import {
  EventLogSchema,
  MAX_RUN_EVENTS,
  type SimEvent,
  type StationId,
} from '../../sim/core/events'
import { createScenario } from '../../sim/core/scenarios'
import { replayRun } from '../../sim/core/replay'
import { referenceTwin } from '../../sim/core/reference'
import { slideAppearance } from '../../sim/specimen/appearance'
import {
  createPracticalRecord,
  gradePractical,
  practicalAvailability,
  PRACTICAL_BY_ID,
} from '../../sim/scoring/practicals'
import {
  createShiftCase,
  assessShift,
  latestShiftCase,
  shiftRecordIdentity,
} from '../../sim/core/shifts'
import { CAREER_LEVELS } from '../../content/lab/curriculum'
import PracticalBrief from '../career/PracticalBrief'
import Debrief from './Debrief'
import { ARCHETYPES } from '../../content/lab/archetypes'
import { STATIONS, STATION_BY_ID } from './stations'
import { ActionForm, T, type Intent } from './fields'
import MicrotomyControls from './MicrotomyControls'
import PreparationControls from './PreparationControls'
import ChemistryControls from './ChemistryControls'
import TwoDStation from './TwoDStation'
import StationTutorial from '../../render3d/StationTutorial'
import { appendShiftTransition, prepareLabLaunch } from './shiftTransitions'
import './lab.css'
const LabScene = lazy(() => import('../../render3d/LabScene'))
const Microscope = lazy(() => import('../../render2d/Microscope'))
const PREPARATION: StationId[] = [
  'accessioning',
  'grossing',
  'fixation',
  'decalcification',
  'processing',
  'embedding',
]
const SECTIONING: StationId[] = ['microtomy', 'bath', 'drying']

export default function LabWorkspace() {
  const lab = useAppState((s) => s.lab)
  const archive = useAllLabRuns()
  const [search] = useSearchParams()
  const requestedPractical = search.get('practical') ?? ''
  const requestedReplay = search.get('replay') ?? ''
  const requestedShift = search.get('shift') ?? ''
  const requestedCase = search.get('case') ?? ''
  const requestedLevel = CAREER_LEVELS.find((level) => level.practical.id === requestedPractical)
  const focusedEntry = !!(requestedPractical || requestedReplay || requestedShift || requestedCase)
  const replayRecord = archive.runs.find((r) => r.id === requestedReplay)
  const availability = practicalAvailability(requestedPractical, lab.passedPracticals, archive.runs)
  const reducedMotion = useReducedMotion()
  const draft = lab.draft
  const [station, setStation] = useState<StationId | 'overview'>(
    () => draft?.events.at(-1)?.station ?? 'overview',
  )
  const requestKey = [requestedPractical, requestedReplay, requestedShift, requestedCase].join('|')
  const [openedRequest, setOpenedRequest] = useState('')
  const [manualChoosing, setChoosing] = useState(!draft)
  const choosing = manualChoosing || (requestKey !== '|||' && requestKey !== openedRequest)
  const [archetype, setArchetype] = useState('skin-ellipse')
  const [seed, setSeed] = useState('TRAIN-SKIN-01')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [paused, setPaused] = useState(false)
  const [instructor, setInstructor] = useState(true)
  const [cursor, setCursor] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [finished, setFinished] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const current = useMemo(() => (draft ? replayRun(draft) : null), [draft])
  const twin = useMemo(
    () => (draft && cursor !== null ? replayRun(draft, cursor) : current),
    [draft, cursor, current],
  )
  const scenario = twin?.scenario
  const ideal = useMemo(() => (scenario ? referenceTwin(scenario) : null), [scenario])
  useEffect(() => {
    if (!choosing) heading.current?.focus()
  }, [station, choosing])
  const chooseStation = (id: StationId | 'overview') => {
    setStation(id)
    setNotice('')
    setFinished(false)
  }
  const act: Intent = useCallback(
    (intent, params = {}, eventStation) => {
      if (paused || cursor !== null) return
      let recorded = false
      setState((s) => {
        if (!s.lab.draft) return s
        const prior = replayRun(s.lab.draft)
        const event: SimEvent = {
          t: prior.time,
          sequence: s.lab.draft.events.length,
          station: eventStation ?? (station === 'overview' ? 'accessioning' : station),
          intent,
          params,
        }
        const result = EventLogSchema.safeParse([...s.lab.draft.events, event])
        if (!result.success) return s
        recorded = true
        return {
          ...s,
          lab: { ...s.lab, draft: { ...s.lab.draft, completedAt: undefined, events: result.data } },
        }
      })
      if (!recorded) {
        setNotice(
          `This action was not recorded. Check the field values; a run can hold up to ${MAX_RUN_EVENTS} actions. Your existing history is unchanged. Save it and start a new run if the limit has been reached.`,
        )
        return
      }
      setFinished(false)
      setNotice(`Recorded: ${intent.replaceAll('.', ' · ')}.`)
    },
    [station, paused, cursor],
  )
  const fallback = useCallback((reason: string) => {
    setNotice(reason)
    setState((s) => ({ ...s, lab: { ...s.lab, view: '2d' } }))
  }, [])
  function launchRecord(record: LabRecord) {
    let failure: string | undefined
    setState((s) => {
      const prepared = prepareLabLaunch(s.lab, record, archive.runs)
      if (!prepared.ok) {
        failure = prepared.reason
        return s
      }
      return { ...s, lab: prepared.lab }
    })
    if (failure) {
      setNotice(failure)
      return false
    }
    setChoosing(false)
    setOpenedRequest(requestKey)
    setCursor(null)
    setPaused(false)
    setFinished(!!record.completedAt)
    setNotice('')
    setStation(record.events.at(-1)?.station ?? 'accessioning')
    return true
  }
  function launchRequestedShift() {
    if (archive.loading || archive.error) return
    try {
      const all = mergeLabRuns(archive.runs, lab.runs, lab.draft)
      const queue = assessShift(requestedShift, all).currentQueueMinute
      const previous = latestShiftCase(requestedShift, requestedCase, all)
      if (previous) {
        const resumed = appendShiftTransition(previous, 'shift.resume', queue)
        if (!resumed.ok) {
          setNotice(resumed.reason)
          return
        }
        launchRecord(resumed.record)
      } else launchRecord(createShiftCase(requestedShift, requestedCase, queue))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'That shift request is not available.')
    }
  }
  function start(preset: 'bottle' | 'block') {
    const scenario = createScenario(seed.trim() || 'TRAIN-DEMO', archetype, difficulty, 2)
    const reference = preset === 'block' ? referenceTwin(scenario) : null
    const cutAt = reference?.events.findIndex((e) => e.intent === 'microtomy.cut') ?? -1
    const record: LabRecord = {
      id: crypto.randomUUID(),
      version: 1,
      scenarioVersion: 2,
      seed: scenario.seed,
      archetype,
      difficulty,
      mode: 'free',
      startedAt: new Date().toISOString(),
      title: scenario.title,
      events: reference ? reference.events.slice(0, cutAt) : [],
    }
    if (launchRecord(record)) setStation(preset === 'block' ? 'microtomy' : 'accessioning')
  }
  function replayAt(index: number) {
    setCursor(index)
    setStation(draft?.events[Math.max(0, index - 1)]?.station ?? 'accessioning')
  }
  function finish() {
    if (!draft || !current) return
    const completed = { ...draft, completedAt: new Date().toISOString() }
    const practicalGrade =
      current && draft.practicalId ? gradePractical(current, draft.practicalId) : null
    setState((s) =>
      applyLabLearning(
        {
          ...s,
          lab: {
            ...s.lab,
            draft: completed,
            passedPracticals:
              practicalGrade?.passed && draft.practicalId
                ? [...new Set([...s.lab.passedPracticals, draft.practicalId])]
                : s.lab.passedPracticals,
            runs: [completed, ...s.lab.runs.filter((r) => r.id !== completed.id)],
          },
        },
        completed,
        current,
      ),
    )
    setFinished(true)
    setNotice('Run saved. These are practice results inside HistoQuest.')
    void archiveRun(completed).catch((error) =>
      setNotice(
        `Run retained in recent progress; archiving did not complete. ${error instanceof Error ? error.message : 'Archive unavailable.'}`,
      ),
    )
  }
  if (choosing || !draft || !twin || !ideal)
    return (
      <div className="page lab-page">
        {archive.cacheWarning && (
          <p className="notice" role="alert">
            {archive.cacheWarning}
          </p>
        )}
        <div className="lab-entry-header">
          {!focusedEntry && <p className="eyebrow">HistoQuest Lab · specimen to slide</p>}
          <h1>
            {requestedReplay
              ? 'Resume your laboratory case'
              : requestedLevel
                ? 'Your guided practical'
                : requestedShift && requestedCase
                  ? 'Your assigned shift case'
                  : 'A laboratory for deliberate practice.'}
          </h1>
          <p className="lede">
            {requestedReplay
              ? 'Continue from the saved specimen and its recorded decisions.'
              : requestedLevel
                ? 'Your specimen and starting conditions are prepared. Review the task, then begin.'
                : requestedShift && requestedCase
                  ? 'Open the assigned specimen and continue its technical workflow.'
                  : 'Make the preparation. See the consequences. Follow one fictional specimen through an entire technical workflow.'}
          </p>
        </div>
        {archive.loading && <p role="status">Reading saved laboratory history…</p>}
        {archive.error && (
          <p className="notice" role="alert">
            {archive.error}{' '}
            <button className="btn" onClick={archive.refresh}>
              Retry archive
            </button>
          </p>
        )}
        {requestedPractical && !requestedLevel && (
          <p className="notice" role="alert">
            That practical is not in the published learning ladder.{' '}
            <Link to="/career">Choose a practical</Link>.
          </p>
        )}
        {!requestedReplay && requestedLevel && PRACTICAL_BY_ID[requestedPractical] && (
          <section className="practical-launch panel">
            <h2>{requestedLevel.practical.title}</h2>
            <p>{requestedLevel.practical.scenario}</p>
            <ul>
              {requestedLevel.practical.rubric.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="small">
              Critical identity, contamination or safety errors fail this practice assessment. The
              rubric is visible throughout.
            </p>
            <p className="small">{availability.reason}</p>
            <button
              className="btn btn-primary"
              disabled={archive.loading || !availability.allowed}
              onClick={() => {
                if (availability.allowed) launchRecord(createPracticalRecord(requestedPractical))
              }}
            >
              Start assessed practical
            </button>{' '}
            <Link to="/">Return to learning path</Link>
          </section>
        )}
        {!requestedReplay && !requestedLevel && requestedShift && requestedCase && (
          <section className="panel">
            <h2>Dispatch {requestedCase} case</h2>
            <p>
              Switching retains the current case and records a pause. Secure the handwheel and blade
              before leaving an active cutting station; the event log retains any unsafe
              interruption.
            </p>
            <button
              className="btn btn-primary"
              disabled={archive.loading || !!archive.error}
              onClick={launchRequestedShift}
            >
              Open shift case
            </button>{' '}
            <Link to={`/shift?seed=${encodeURIComponent(requestedShift)}`}>Return to queue</Link>
            <p role="status">{notice}</p>
          </section>
        )}
        {replayRecord && (
          <section className="panel">
            <h2>{replayRecord.title}</h2>
            <button className="btn btn-primary" onClick={() => launchRecord(replayRecord)}>
              Open saved run
            </button>
          </section>
        )}
        {requestedReplay && !replayRecord && !archive.loading && !archive.error && (
          <p className="notice" role="status">
            This saved run is not available in this browser. Import its complete progress backup in{' '}
            <Link to="/settings">Settings</Link> to replay it.
          </p>
        )}
        {focusedEntry && (
          <p className="small">
            <Link to="/lab3d" onClick={() => setChoosing(true)}>
              Explore the free laboratory
            </Link>
          </p>
        )}
        {notice && !requestedShift && <p role="status">{notice}</p>}
        {!focusedEntry && (
          <>
            <div className="row">
              <Link className="btn" to="/career">
                Learning ladder & practicals
              </Link>
              <Link className="btn" to="/shift">
                Start a simulated shift
              </Link>
            </div>
            <div className="lab-entry-grid">
              <section className="lab-entry-setup">
                <h2>Set up your bench</h2>
                <label className="lab-field">
                  Specimen
                  <select
                    className="input"
                    value={archetype}
                    onChange={(e) => setArchetype(e.target.value)}
                  >
                    {ARCHETYPES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lab-field">
                  Replay seed
                  <input
                    className="input"
                    value={seed}
                    maxLength={100}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </label>
                <label className="lab-field">
                  Scenario complexity
                  <select
                    className="input"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                  >
                    <option value={1}>One decision at a time</option>
                    <option value={2}>Interacting preparation variables</option>
                    <option value={3}>Three interacting faults</option>
                  </select>
                </label>
                <div className="lab-start-actions">
                  <button className="btn btn-primary" onClick={() => start('bottle')}>
                    Begin at specimen receipt
                  </button>
                  <button className="btn" onClick={() => start('block')}>
                    Practice on a prepared block
                  </button>
                  {draft && (
                    <button className="btn" onClick={() => setChoosing(false)}>
                      Resume current specimen
                    </button>
                  )}
                </div>
                <p className="small muted">
                  Starting another case keeps the existing event log in your run history. All cases
                  are fictional; never enter patient information.
                </p>
              </section>
              <aside className="lab-entry-note">
                <span className="entry-orbit" aria-hidden="true">
                  A1
                </span>
                <h2>Understanding comes from the whole chain.</h2>
                <ol>
                  <li>
                    <strong>Prepare</strong>
                    <span>Control geometry, preservation and reagent access.</span>
                  </li>
                  <li>
                    <strong>Make</strong>
                    <span>Orient, face, section, float, stain and mount.</span>
                  </li>
                  <li>
                    <strong>Investigate</strong>
                    <span>Compare your slide, trace its artifacts and replay the decisions.</span>
                  </li>
                </ol>
                <p className="small">
                  Educational models use illustrative settings. They rehearse technical reasoning
                  and handling sequences; they do not establish professional competency or replace
                  supervised practice.
                </p>
                <Link to="/pathway">Open the reference pathway</Link>
              </aside>
            </div>
            {archive.runs.length > 0 && (
              <section className="lab-history">
                <h2>Recent practice</h2>
                <ul className="list">
                  {archive.runs
                    .toReversed()
                    .slice(0, 12)
                    .map((r) => (
                      <li key={r.id}>
                        <button className="list-row" onClick={() => launchRecord(r)}>
                          <span>
                            <strong>{r.title}</strong>
                            <br />
                            {r.seed} · {r.events.length} recorded actions
                          </span>
                          <span>Resume / replay →</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    )
  const meta = station === 'overview' ? null : STATION_BY_ID[station]
  const last = twin.block.sections.at(-1)
  return (
    <div className="page lab-page lab-active">
      {archive.cacheWarning && (
        <p className="notice" role="alert">
          {archive.cacheWarning}
        </p>
      )}
      <header className="lab-workspace-header">
        <div>
          <p className="eyebrow">HistoQuest Lab</p>
          <h1>{twin.scenario.title}</h1>
          <p>
            {twin.scenario.accession} · {twin.scenario.request} · seed <code>{draft.seed}</code>
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setChoosing(true)}>
            {focusedEntry
              ? requestedLevel
                ? 'Practical overview'
                : 'Case overview'
              : 'Cases & history'}
          </button>
          <button className="btn" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? 'Resume actions' : 'Pause and think'}
          </button>
          <button className="btn" onClick={finish}>
            Save & debrief
          </button>
        </div>
      </header>
      <nav className="lab-station-nav" aria-label="Lab stations">
        <button
          className={station === 'overview' ? 'active' : ''}
          aria-current={station === 'overview' ? 'page' : undefined}
          onClick={() => chooseStation('overview')}
        >
          Lab overview
        </button>
        {STATIONS.map((s, i) => (
          <button
            key={s.id}
            className={station === s.id ? 'active' : ''}
            aria-current={station === s.id ? 'page' : undefined}
            onClick={() => chooseStation(s.id)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {s.label}
          </button>
        ))}
      </nav>
      {draft.practicalId && (
        <PracticalBrief practicalId={draft.practicalId} twin={current!} act={act} />
      )}
      {draft.mode === 'shift' && (
        <p className="notice">
          Separate shift case ·{' '}
          <Link to={`/shift?seed=${encodeURIComponent(shiftRecordIdentity(draft)?.seed ?? '')}`}>
            Open the live queue and prioritize the next case
          </Link>
        </p>
      )}
      <div className="lab-hud">
        <span>
          <strong>{twin.time.toFixed(1)}</strong> simulation min
        </span>
        <span>{twin.block.remaining.toFixed(0)} µm tissue remaining</span>
        <span>{twin.block.sections.length} sections</span>
        <span>
          {twin.identity.broken
            ? 'Identity unresolved'
            : twin.identity.accepted
              ? 'Accession established'
              : 'Receipt pending'}
        </span>
        <label>
          <input
            type="checkbox"
            checked={instructor}
            onChange={(e) => setInstructor(e.target.checked)}
          />{' '}
          Instructor notes
        </label>
      </div>
      <div className="lab-scene-toolbar">
        <div className="row">
          <button
            className="btn"
            aria-pressed={lab.view === '3d'}
            onClick={() => setState((s) => ({ ...s, lab: { ...s.lab, view: '3d' } }))}
          >
            3D work surface
          </button>
          <button
            className="btn"
            aria-pressed={lab.view === '2d'}
            onClick={() => setState((s) => ({ ...s, lab: { ...s.lab, view: '2d' } }))}
          >
            2D work surface
          </button>
        </div>
        <label>
          Scene quality{' '}
          <select
            className="input"
            value={lab.quality}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                lab: { ...s.lab, quality: e.target.value as typeof lab.quality },
              }))
            }
          >
            {['auto', 'low', 'medium', 'high'].map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>
      {cursor !== null && (
        <p className="notice">
          Replaying after action {cursor} of {draft.events.length}.{' '}
          <button className="btn" onClick={() => setCursor(null)}>
            Return to live specimen
          </button>
        </p>
      )}
      {paused && (
        <p className="notice">
          Paused for inspection. Resume actions when you are ready; no simulation time advances
          while you think.
        </p>
      )}
      <StationTutorial
        key={station}
        station={station}
        seen={lab.tutorials.includes(station)}
        onSeen={() =>
          setState((state) => ({
            ...state,
            lab: { ...state.lab, tutorials: [...new Set([...state.lab.tutorials, station])] },
          }))
        }
      />
      <div className="lab-work-grid">
        <section className="lab-work-surface" aria-label="Instrument view">
          {lab.view === '3d' ? (
            <Suspense
              fallback={
                <div className="lab-scene-loading" role="status">
                  Preparing the 3D work surface…
                  <progress aria-label="Loading instrument" />
                </div>
              }
            >
              <LabScene
                twin={twin}
                station={station}
                quality={lab.quality}
                reducedMotion={reducedMotion}
                onIntent={act}
                onFallback={fallback}
                onStationSelect={chooseStation}
              />
            </Suspense>
          ) : (
            <TwoDStation twin={twin} station={station} />
          )}
          {instructor && meta && (
            <div className="lab-instructor">
              <p className="eyebrow">What is happening & why</p>
              <p>{meta.why}</p>
              <p className="small">{meta.safety}</p>
              <Link to={meta.lesson}>Review this process →</Link>
            </div>
          )}
          <details className="lab-passport">
            <summary>Specimen passport & causal history</summary>
            <dl>
              <dt>Preparation</dt>
              <dd>
                {twin.fixation.fixative} · {twin.fixation.hours} h · {twin.gross.thickness} mm
                pieces
              </dd>
              <dt>Preservation / masking</dt>
              <dd>
                {Math.round(twin.ihc.preservation * 100)}% / {Math.round(twin.ihc.masking * 100)}%
              </dd>
              <dt>Plane represented</dt>
              <dd>{Math.round(twin.embedding.representation * 100)}%</dd>
              <dt>Current section</dt>
              <dd>
                {last
                  ? `${last.thickness} µm, depth ${last.depth} µm, ${last.purpose}`
                  : 'None taken'}
              </dd>
            </dl>
            <p className="small">
              Percentages describe this synthetic model; they are not measured specimen results.
            </p>
          </details>
        </section>
        <section className="lab-control-panel" aria-label="Station controls">
          <h2 ref={heading} tabIndex={-1}>
            {meta?.label ?? 'Choose a station'}
          </h2>
          <p>
            {meta?.task ??
              'Select a room in the scene or use the station list. All work surfaces share the same specimen history.'}
          </p>
          {station === 'overview' ? (
            <div className="lab-room-list">
              {STATIONS.map((s) => (
                <button key={s.id} className="btn" onClick={() => chooseStation(s.id)}>
                  {s.label} →
                </button>
              ))}
            </div>
          ) : (
            <fieldset className="lab-control-boundary" disabled={paused || cursor !== null}>
              {PREPARATION.includes(station) ? (
                <PreparationControls key={station} twin={twin} act={act} station={station} />
              ) : SECTIONING.includes(station) ? (
                <MicrotomyControls key={station} twin={twin} act={act} station={station} />
              ) : (
                <ChemistryControls key={station} twin={twin} act={act} station={station} />
              )}
              <ActionForm
                title="Station record"
                submit="Save station note"
                onAction={(p) => act('document', p)}
              >
                <p className="span-all small">{meta?.document}</p>
                <T name="text" label="Technical record — fictional exercise only" multiline />
              </ActionForm>
            </fieldset>
          )}
          <p className="lab-live-message small" role="status" aria-live="polite">
            {notice}
          </p>
          {twin.notes.at(-1) && <p className="notice small">{twin.notes.at(-1)}</p>}
        </section>
      </div>
      {last && (
        <section className="lab-produced-slide">
          <div className="lab-section-heading">
            <div>
              <p className="eyebrow">The result of your preparation</p>
              <h2>Inspect the slide</h2>
            </div>
            <p>{last.slideId || 'Section not yet labeled'}</p>
          </div>
          <p className="small muted">
            A reference H&E preparation is available for routine morphology. Special-stain and IHC
            controls are compared in their dedicated benches.
          </p>
          <Suspense fallback={<p role="status">Preparing simulated microscopy…</p>}>
            <Microscope
              appearance={slideAppearance(twin)}
              ideal={
                !twin.staining.special &&
                !twin.ihc.ish &&
                !twin.ihc.detectionApplied &&
                twin.ihc.primary === 0 &&
                twin.ihc.dab === 0
                  ? slideAppearance(ideal)
                  : undefined
              }
              force2D={lab.view === '2d'}
            />
          </Suspense>
        </section>
      )}
      <section className="lab-replay">
        <h2>Follow the causal record</h2>
        <label>
          Replay actions{' '}
          <input
            type="range"
            min={0}
            max={draft.events.length}
            value={cursor ?? draft.events.length}
            onChange={(e) => replayAt(Number(e.target.value))}
          />
        </label>
        <div className="row">
          <button className="btn" onClick={() => setCursor(null)}>
            Latest state
          </button>
          <button className="btn" onClick={() => replayAt(0)}>
            Return to receipt
          </button>
        </div>
        <details>
          <summary>{draft.events.length} recorded actions</summary>
          <ol>
            {draft.events.map((e, i) => (
              <li key={i}>
                <button
                  className="event-link"
                  onClick={() => {
                    setCursor(i + 1)
                    setStation(e.station)
                  }}
                >
                  {e.t.toFixed(1)} min · {STATION_BY_ID[e.station].label} · {e.intent}
                </button>
              </li>
            ))}
          </ol>
        </details>
      </section>
      {finished && current && <Debrief record={draft} twin={twin} onReplay={replayAt} />}
      <p className="lab-boundary small">
        All specimens and slides are simulated. Coefficients are educational assumptions. Content is
        author-checked, not expert-reviewed. Export complete progress from{' '}
        <Link to="/settings">Settings</Link>.
      </p>
    </div>
  )
}
