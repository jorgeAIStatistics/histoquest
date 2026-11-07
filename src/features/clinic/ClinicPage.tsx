import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CLINIC_CASES,
  CLINIC_VARIABLES,
  clinicCase,
  clinicSettings,
  createClinicRecord,
  gradeClinic,
  latestClinicComparison,
  recordClinicHypothesis,
  runClinicTrial,
  verifyClinic,
  type ClinicComparison,
  type ClinicVariable,
} from '../../sim/core/clinic'
import { replayRun } from '../../sim/core/replay'
import { slideAppearance } from '../../sim/specimen/appearance'
import { CLINIC as C } from '../../sim/params/clinic'
import { PROCESS as P } from '../../sim/params/process'
import type { LabRecord } from '../../store/labSchema'
import { archiveRun, useAllLabRuns } from '../../store/labArchive'
import { setState } from '../../store/store'
import './clinic.css'

const Microscope = lazy(() => import('../../render2d/Microscope'))

function persist(record: LabRecord) {
  // Clinic investigations have independent records; opening one does not replace
  // a bench/shift draft that the learner may still need to return to.
  setState((state) => ({
    ...state,
    lab: {
      ...state.lab,
      runs: [record, ...state.lab.runs.filter((run) => run.id !== record.id)],
      draft: state.lab.draft?.id === record.id ? record : state.lab.draft,
    },
  }))
}

export default function ClinicPage() {
  const archive = useAllLabRuns()
  const [search, setSearch] = useSearchParams()
  const [caseId, setCaseId] = useState<string>(CLINIC_CASES[0].id)
  const [seed, setSeed] = useState('CLINIC-01')
  const [notice, setNotice] = useState('')
  const records = archive.runs.filter((record) => record.mode === 'clinic')
  const record = records.find((record) => record.id === search.get('run'))
  const supported =
    record?.seed.startsWith('CLINIC:') &&
    CLINIC_CASES.some((entry) => entry.id === record.seed.split(':')[1])
  const start = (event: FormEvent) => {
    event.preventDefault()
    try {
      const next = createClinicRecord(caseId, seed.trim())
      persist(next)
      setSearch({ run: next.id })
      setNotice('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The case could not be opened.')
    }
  }
  return (
    <div className="page clinic-page">
      <header className="clinic-intro">
        <h1>Troubleshooting clinic</h1>
        <p className="lede">
          Start with an imperfect slide. Trace its preparation, predict a cause, change one setting
          and test the prediction on another section.
        </p>
        <p>
          These authored cases use the same specimen and microscopy models as the laboratory. Each
          controlled repeat consumes tissue and preserves the original slide and event history.
        </p>
        <div className="row">
          <Link to="/lab3d">Return to the full laboratory</Link>
          <Link to="/career">Learning ladder</Link>
        </div>
      </header>
      {archive.error && (
        <p className="notice" role="alert">
          Older investigations could not be read. {archive.error}
        </p>
      )}
      {archive.cacheWarning && (
        <p className="notice" role="alert">
          {archive.cacheWarning}
        </p>
      )}
      <details className="clinic-picker" open={!record}>
        <summary>{record ? 'Choose another investigation' : 'Choose an investigation'}</summary>
        <form onSubmit={start} className="clinic-case-form">
          <label>
            Observed problem
            <select
              className="input"
              value={caseId}
              onChange={(event) => setCaseId(event.target.value)}
            >
              {CLINIC_CASES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reproducible case seed
            <input
              className="input"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              pattern="(?:[A-Za-z0-9_]|-){1,40}"
              maxLength={40}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Open the flawed slide
          </button>
        </form>
        {records.length > 0 && (
          <nav className="clinic-history" aria-label="Saved clinic investigations">
            {records
              .toReversed()
              .slice(0, 12)
              .map((run) => (
                <Link key={run.id} to={`/clinic?run=${encodeURIComponent(run.id)}`}>
                  {run.title} · {run.completedAt ? 'verification recorded' : 'in progress'}
                </Link>
              ))}
          </nav>
        )}
      </details>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {archive.loading && <p role="status">Reading saved investigations…</p>}
      {!record && search.get('run') && !archive.loading && (
        <p className="notice">
          That investigation is not available here. Restore its complete progress backup in{' '}
          <Link to="/settings">Settings</Link>, or open another case.
        </p>
      )}
      {record && supported && <Investigation key={record.id} record={record} />}
      {record && !supported && (
        <p className="notice" role="alert">
          This clinic record is preserved, but its case definition is not supported by this version.
          Keep a complete backup from <Link to="/settings">Settings</Link>.
        </p>
      )}
    </div>
  )
}

function Investigation({ record }: { record: LabRecord }) {
  const entry = clinicCase(record)
  const twin = useMemo(() => replayRun(record), [record])
  const comparison = latestClinicComparison(record)
  const beforeSequence = comparison?.beforeSequence
  const previous = useMemo(
    () => (beforeSequence !== undefined ? replayRun(record, beforeSequence) : null),
    [record, beforeSequence],
  )
  const appearance = useMemo(() => slideAppearance(twin), [twin])
  const previousAppearance = useMemo(
    () => (previous ? slideAppearance(previous) : undefined),
    [previous],
  )
  const settings = clinicSettings(twin)
  const [variable, setVariable] = useState<ClinicVariable | ''>('')
  const [value, setValue] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const grade = useMemo(() => gradeClinic(record), [record])
  const pending = record.events.at(-1)?.params.checkId === 'clinic-hypothesis'
  const setting = CLINIC_VARIABLES.find((row) => row.id === variable)
  const change = (event: FormEvent) => {
    event.preventDefault()
    try {
      if (!variable || value === '')
        throw new Error('Choose one setting and enter its proposed value.')
      persist(recordClinicHypothesis(record, hypothesis, variable, Number(value)))
      setNotice('Hypothesis recorded. Review the fixed repeat recipe, then run the test.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The hypothesis could not be recorded.')
    }
  }
  const repeat = () => {
    try {
      persist(runClinicTrial(record))
      setVariable('')
      setValue('')
      setHypothesis('')
      setNotice(
        'A new section was cut, identified, stained and mounted. Compare the actual result before recording your conclusion.',
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The controlled repeat could not run.')
    }
  }
  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try {
      const completed = verifyClinic(
        record,
        String(data.get('observation')),
        data.get('outcome') as ClinicComparison['outcome'],
        data.get('disposition') as 'hold' | 'review',
      )
      persist(completed)
      const archived = await archiveRun(completed)
      setNotice(
        `Verification and complete event history saved. Free-text reasoning remains available for qualified review.${archived.cacheWarning ? ` ${archived.cacheWarning}` : ''}`,
      )
    } catch (error) {
      setNotice(
        `Investigation retained in recent progress. ${error instanceof Error ? error.message : 'Archiving could not complete.'}`,
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className="clinic-investigation">
      <h2>{entry.title}</h2>
      <p className="clinic-question">{entry.question}</p>
      <p className="small">
        {twin.scenario.accession} · {twin.scenario.family} · {twin.block.sections.length} recorded
        sections · {twin.block.remaining.toFixed(0)} model µm remaining.{' '}
        <Link to={entry.lesson}>Review the relevant principle</Link>.
      </p>
      <section aria-labelledby="clinic-inspect">
        <h3 id="clinic-inspect">Inspect the slide and pull the record</h3>
        {comparison && (
          <p>
            The current section is your latest repeat. The viewer’s reference pane shows the section
            immediately before that repeat.
          </p>
        )}
        <Suspense fallback={<p role="status">Preparing the simulated slide…</p>}>
          <Microscope
            key={`${record.id}:${comparison?.beforeSequence ?? 'baseline'}`}
            appearance={appearance}
            ideal={previousAppearance}
            initialCompare={!!previous}
          />
        </Suspense>
        <details className="clinic-record">
          <summary>Preparation and instrument record</summary>
          <div className="clinic-table-scroll">
            <table>
              <caption>Recorded conditions for this synthetic specimen</caption>
              <tbody>
                <tr>
                  <th scope="row">Fixation and delay</th>
                  <td>
                    {twin.fixation.hours} h exposure; {twin.fixation.ischemia} h recorded ischemia;{' '}
                    {twin.gross.thickness} mm piece thickness
                  </td>
                </tr>
                <tr>
                  <th scope="row">Solvent exchange</th>
                  <td>
                    {twin.processing.history
                      .map((step) => `${step.reagent}: ${step.minutes} min`)
                      .join(' → ')}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Current cutting conditions</th>
                  <td>
                    {settings.blockTemperature} °C; clamp {settings.clamp}; sharpness{' '}
                    {settings.sharpness}; pace {settings.speed}; thickness {settings.thickness}{' '}
                    model µm
                  </td>
                </tr>
                <tr>
                  <th scope="row">Section preparation</th>
                  <td>
                    Charged slide, {P['bath.temperature']} °C bath and {P['drying.temperature']} °C
                    drying at the disclosed model exposure.
                  </td>
                </tr>
                {entry.stain === 'ihc' && (
                  <>
                    <tr>
                      <th scope="row">IHC conditions</th>
                      <td>
                        Retrieval {settings.retrievalMinutes} min; detection{' '}
                        {settings.detectionCompatible ? 'compatible' : 'incompatible'}; blocking,
                        humidity and washing recorded.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Control readings</th>
                      <td>
                        Positive {twin.ihc.positive?.toFixed(2) ?? 'not run'}; low-positive{' '}
                        {twin.ihc.lowPositive?.toFixed(2) ?? 'not run'}; negative{' '}
                        {twin.ihc.negative?.toFixed(2) ?? 'not run'};{' '}
                        {twin.ihc.valid ? 'model controls valid' : 'interpretation unsupported'}.
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <p>
            Exposure times, temperatures and artifact fields are illustrative teaching parameters.
            They are not instrument settings or an approved clinical recipe.
          </p>
        </details>
        <details className="clinic-record">
          <summary>Complete ordered event history ({record.events.length} actions)</summary>
          <ol
            className="clinic-events"
            tabIndex={0}
            aria-label="Ordered specimen events; scroll to inspect the full history"
          >
            {record.events.map((event) => (
              <li key={event.sequence}>
                <strong>
                  {event.station} · {event.intent}
                </strong>
                <span>
                  {event.t.toFixed(1)} simulation min
                  {event.params.origin === 'scenario-setup' ? ' · supplied preparation' : ''}
                </span>
                <code>{JSON.stringify(event.params)}</code>
              </li>
            ))}
          </ol>
        </details>
      </section>
      <div className="clinic-method-grid">
        <section aria-labelledby="clinic-hypothesis">
          <h3 id="clinic-hypothesis">State a hypothesis and one change</h3>
          <p>
            Use the visible slide and records. An incorrect hypothesis is allowed; the repeated
            specimen determines the outcome.
          </p>
          <form className="stack" onSubmit={change}>
            <label>
              Observation, suspected cause and prediction
              <textarea
                className="input"
                value={hypothesis}
                onChange={(event) => setHypothesis(event.target.value)}
                required
                minLength={C['clinic.note-minimum']}
                maxLength={1800}
                rows={5}
              />
            </label>
            <label>
              One setting to test
              <select
                className="input"
                value={variable}
                onChange={(event) => {
                  setVariable(event.target.value as ClinicVariable)
                  setValue('')
                }}
                required
              >
                <option value="" disabled>
                  Select a setting
                </option>
                {CLINIC_VARIABLES.filter((row) => !row.stain || row.stain === entry.stain).map(
                  (row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ),
                )}
              </select>
            </label>
            {setting && (
              <label>
                Proposed value ({setting.unit})
                <input
                  className="input"
                  type="number"
                  min={setting.min}
                  max={setting.max}
                  step={variable === 'detectionCompatible' ? 1 : 'any'}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  required
                />
                <span className="small muted">
                  Current value: {settings[setting.id]}. Teaching input range: {setting.min}–
                  {setting.max}.
                </span>
              </label>
            )}
            <button className="btn" type="submit">
              Record hypothesis and change
            </button>
          </form>
        </section>
        <section aria-labelledby="clinic-test">
          <h3 id="clinic-test">Run the controlled repeat</h3>
          <p>
            The same block is locked, guarded and mounted. The selected variable changes; a new
            identified section is cut and put through the same flotation, drying, staining and
            mounting sequence.
          </p>
          <p>
            The repeat retains upstream injury, prior slides, blade wear and tissue consumption. It
            cannot restore lost preservation or supply missing infiltration.
          </p>
          {pending && (
            <p className="clinic-pending">
              <strong>Proposed:</strong>{' '}
              {
                CLINIC_VARIABLES.find((row) => row.id === record.events.at(-1)?.params.variable)
                  ?.label
              }{' '}
              → {String(record.events.at(-1)?.params.value)}.
            </p>
          )}
          <button className="btn btn-primary" disabled={!pending || busy} onClick={repeat}>
            Cut and run the controlled repeat
          </button>
          <details>
            <summary>Fixed repeat recipe and sources</summary>
            <p>
              Bath {P['bath.temperature']} °C / {P['bath.minutes']} min; charged slide; drying{' '}
              {P['drying.temperature']} °C / {P['drying.minutes']} min. All remaining stain steps
              retain their prior selected values and the same disclosed model settings. Positive,
              low-positive and negative controls accompany IHC.
            </p>
            <p>
              <Link to="/review">Inspect the scientific parameter register</Link>. The original
              slide is archived before the next cut.
            </p>
          </details>
        </section>
      </div>
      {comparison && (
        <section className="clinic-verification" aria-labelledby="clinic-verify">
          <h3 id="clinic-verify">Compare, verify and decide</h3>
          <p>
            Modeled defect changed from {comparison.before.toFixed(2)} to{' '}
            {comparison.after.toFixed(2)} on the same relative 0–1 scale. The measured condition{' '}
            <strong>{comparison.outcome}</strong>. This reports the selected defect or control
            validity, not the quality of the entire slide.
          </p>
          <form className="stack" onSubmit={verify}>
            <label>
              What changed, what persisted, and what would you investigate next?
              <textarea
                className="input"
                name="observation"
                required
                minLength={C['clinic.note-minimum']}
                maxLength={1800}
                rows={4}
              />
            </label>
            <div className="clinic-input-row">
              <label>
                Your observed outcome
                <select className="input" name="outcome" required defaultValue="">
                  <option value="" disabled>
                    Select after comparing
                  </option>
                  <option value="improved">Improved</option>
                  <option value="persisted">Persisted</option>
                  <option value="worsened">Worsened</option>
                </select>
              </label>
              <label>
                Technical disposition
                <select className="input" name="disposition" required defaultValue="">
                  <option value="" disabled>
                    Select a next step
                  </option>
                  <option value="hold">Hold and escalate the unresolved preparation</option>
                  <option value="review">Submit the improvement for technical review</option>
                </select>
              </label>
            </div>
            <button className="btn btn-primary" disabled={busy || pending}>
              Save investigation and verification
            </button>
          </form>
          {record.completedAt && (
            <p className="clinic-result" role="status">
              <strong>
                {grade.complete
                  ? 'Investigation method and outcome checks recorded.'
                  : 'Review the outcome or disposition against the remaining defect.'}
              </strong>{' '}
              {grade.note}
            </p>
          )}
        </section>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </article>
  )
}
