import { lazy, Suspense, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { setState, useAppState } from '../../store/store'
import type { LabRecord } from '../../store/labSchema'
import { useReducedMotion } from '../../ui/prefs'
import { EventLogSchema, type SimEvent, type StationId } from '../../sim/core/events'
import { createScenario } from '../../sim/core/scenarios'
import { replayRun } from '../../sim/core/replay'
import { referenceTwin } from '../../sim/core/reference'
import { slideAppearance } from '../../sim/specimen/appearance'
import { assessTwin } from '../../sim/scoring/assess'
import { ARCHETYPES } from '../../content/lab/archetypes'
import { STATIONS, STATION_BY_ID } from './stations'
import { ActionForm, T, type Intent } from './fields'
import MicrotomyControls from './MicrotomyControls'
import PreparationControls from './PreparationControls'
import ChemistryControls from './ChemistryControls'
import TwoDStation from './TwoDStation'
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
  const reducedMotion = useReducedMotion()
  const draft = lab.draft
  const [station, setStation] = useState<StationId | 'overview'>(
    () => draft?.events.at(-1)?.station ?? 'overview',
  )
  const [choosing, setChoosing] = useState(!draft)
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
  const assessment = useMemo(() => (current ? assessTwin(current) : null), [current])
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
        return { ...s, lab: { ...s.lab, draft: { ...s.lab.draft, events: result.data } } }
      })
      setNotice(`Recorded: ${intent.replaceAll('.', ' · ')}.`)
    },
    [station, paused, cursor],
  )
  const fallback = useCallback((reason: string) => {
    setNotice(reason)
    setState((s) => ({ ...s, lab: { ...s.lab, view: '2d' } }))
  }, [])
  function start(preset: 'bottle' | 'block') {
    const scenario = createScenario(seed.trim() || 'TRAIN-DEMO', archetype, difficulty)
    const reference = preset === 'block' ? referenceTwin(scenario) : null
    const cutAt = reference?.events.findIndex((e) => e.intent === 'microtomy.cut') ?? -1
    const record: LabRecord = {
      id: crypto.randomUUID(),
      version: 1,
      seed: scenario.seed,
      archetype,
      difficulty,
      mode: 'free',
      startedAt: new Date().toISOString(),
      title: scenario.title,
      events: reference ? reference.events.slice(0, cutAt) : [],
    }
    setState((s) => ({
      ...s,
      lab: {
        ...s.lab,
        draft: record,
        runs: s.lab.draft?.events.length
          ? [s.lab.draft, ...s.lab.runs.filter((r) => r.id !== s.lab.draft!.id)]
          : s.lab.runs,
      },
    }))
    setChoosing(false)
    setStation(preset === 'block' ? 'microtomy' : 'accessioning')
    setCursor(null)
    setPaused(false)
    setFinished(false)
  }
  function finish() {
    if (!draft) return
    const completed = { ...draft, completedAt: new Date().toISOString() }
    setState((s) => ({
      ...s,
      lab: {
        ...s.lab,
        draft: completed,
        runs: [completed, ...s.lab.runs.filter((r) => r.id !== completed.id)],
      },
    }))
    setFinished(true)
    setNotice('Run saved. These are practice results inside HistoQuest.')
  }
  if (choosing || !draft || !twin || !ideal)
    return (
      <div className="page lab-page">
        <div className="lab-entry-header">
          <p className="eyebrow">HistoQuest Lab · specimen to slide</p>
          <h1>A laboratory for deliberate practice.</h1>
          <p className="lede">
            Make the preparation. See the consequences. Follow one fictional specimen through an
            entire technical workflow.
          </p>
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
              Starting another case keeps the existing event log in your run history. All cases are
              fictional; never enter patient information.
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
              Educational models use illustrative settings. They rehearse technical reasoning and
              handling sequences; they do not establish professional competency or replace
              supervised practice.
            </p>
            <Link to="/pathway">Open the reference pathway</Link>
          </aside>
        </div>
        {lab.runs.length > 0 && (
          <section className="lab-history">
            <h2>Recent practice</h2>
            <ul className="list">
              {lab.runs.slice(0, 12).map((r) => (
                <li key={r.id}>
                  <button
                    className="list-row"
                    onClick={() => {
                      setState((s) => ({ ...s, lab: { ...s.lab, draft: r } }))
                      setChoosing(false)
                      setStation(r.events.at(-1)?.station ?? 'overview')
                      setCursor(null)
                    }}
                  >
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
      </div>
    )
  const meta = station === 'overview' ? null : STATION_BY_ID[station]
  const last = twin.block.sections.at(-1)
  return (
    <div className="page lab-page lab-active">
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
            Cases & history
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
          <Suspense fallback={<p role="status">Preparing simulated microscopy…</p>}>
            <Microscope
              appearance={slideAppearance(twin)}
              ideal={slideAppearance(ideal)}
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
            onChange={(e) => setCursor(Number(e.target.value))}
          />
        </label>
        <div className="row">
          <button className="btn" onClick={() => setCursor(null)}>
            Latest state
          </button>
          <button className="btn" onClick={() => setCursor(0)}>
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
      {finished && assessment && (
        <section className="lab-debrief" aria-label="Run debrief">
          <h2>Your practice, reviewed</h2>
          <p className="lede">
            {assessment.critical.length
              ? 'A critical error needs investigation.'
              : `Practice rubric: ${assessment.total}/100.`}
          </p>
          <p>
            Quality, process, safety, documentation and efficiency are separate measures. This is
            practice evidence inside HistoQuest, not professional competency.
          </p>
          <table className="lab-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Quality</th>
                <th>Process</th>
                <th>Safety</th>
                <th>Record</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {assessment.stations.map((s) => (
                <tr key={s.station}>
                  <th>{STATION_BY_ID[s.station].label}</th>
                  <td>{s.quality}</td>
                  <td>{s.process}</td>
                  <td>{s.safety}</td>
                  <td>{s.documentation}</td>
                  <td>{s.efficiency}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {assessment.issues.map((i) => (
            <article className="lab-issue" key={i.id}>
              <span className="tag">{i.severity}</span>
              <h3>{i.title}</h3>
              <p>
                {i.cause} {i.effect}
              </p>
              <p>{i.remedy}</p>
              <button
                className="btn"
                onClick={() => {
                  setCursor(i.event + 1)
                  setStation(i.station)
                }}
              >
                Replay this decision
              </button>{' '}
              <Link to={i.lesson}>Targeted review</Link>
            </article>
          ))}
        </section>
      )}
      <p className="lab-boundary small">
        All specimens and slides are simulated. Coefficients are educational assumptions. Content is
        author-checked, not expert-reviewed. Export complete progress from{' '}
        <Link to="/settings">Settings</Link>.
      </p>
    </div>
  )
}
