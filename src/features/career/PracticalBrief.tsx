import { lazy, Suspense, useId, useMemo, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CAREER_LEVELS } from '../../content/lab/curriculum'
import type { SimEvent, StationId } from '../../sim/core/events'
import { referenceTwin } from '../../sim/core/reference'
import { gradePractical, PRACTICAL_BY_ID } from '../../sim/scoring/practicals'
import { slideAppearance } from '../../sim/specimen/appearance'
import type { Twin } from '../../sim/specimen/types'
import { PROCESS as P } from '../../sim/params/process'
import { parameterValue } from '../../sim/params/registry'
import './career.css'
import PlanningTools from './PlanningTools'

const Microscope = lazy(() => import('../../render2d/Microscope'))
type Act = (intent: string, params?: SimEvent['params'], station?: StationId) => void

function EvidenceForm({
  title,
  checkId,
  act,
  minimum = P['practical.note-minimum'],
  kind = 'note',
}: {
  title: string
  checkId: string
  act: Act
  minimum?: number
  kind?: 'note' | 'safety' | 'microscope' | 'interruption'
}) {
  const id = useId()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const params: SimEvent['params'] = { checkId, text: String(data.get('text') ?? '') }
    for (const name of [
      'ppe',
      'sds',
      'escalation',
      'focusCompared',
      'illuminationCompared',
      'secured',
      'biohazard',
    ])
      if (data.has(name)) params[name] = true
    if (kind === 'microscope') {
      params.overview = Number(data.get('overview'))
      params.detail = Number(data.get('detail'))
    }
    if (kind === 'interruption') params.otherAccession = String(data.get('otherAccession') ?? '')
    act('practice.evidence', params, 'quality')
  }
  return (
    <form className="practical-evidence-form" onSubmit={submit}>
      <fieldset>
        <legend>{title}</legend>
        {kind === 'safety' && (
          <div className="practical-acknowledgements">
            <label>
              <input type="checkbox" name="ppe" /> I identified the task-specific PPE.
            </label>
            <label>
              <input type="checkbox" name="sds" /> I identified the relevant SDS and exposure
              controls.
            </label>
            <label>
              <input type="checkbox" name="escalation" /> I identified the stop-and-escalate route.
            </label>
          </div>
        )}
        {kind === 'microscope' && (
          <>
            <div className="practical-input-row">
              <label>
                Overview setting
                <select name="overview" className="input" required defaultValue="">
                  <option value="" disabled>
                    Select observed setting
                  </option>
                  <option value="2">2× teaching view</option>
                  <option value="4">4× teaching view</option>
                </select>
              </label>
              <label>
                Detail setting
                <select name="detail" className="input" required defaultValue="">
                  <option value="" disabled>
                    Select observed setting
                  </option>
                  <option value="4">4×</option>
                  <option value="10">10×</option>
                  <option value="20">20×</option>
                  <option value="40">40×</option>
                </select>
              </label>
            </div>
            <div className="practical-acknowledgements">
              <label>
                <input type="checkbox" name="focusCompared" /> I compared focus with the in-focus
                view.
              </label>
              <label>
                <input type="checkbox" name="illuminationCompared" /> I compared illumination with
                the reference view.
              </label>
            </div>
          </>
        )}
        {kind === 'interruption' && (
          <>
            <label className="practical-text-label">
              Separate synthetic frozen accession
              <input
                className="input"
                name="otherAccession"
                required
                maxLength={80}
                placeholder="TRAIN-FROZEN-02"
              />
            </label>
            <div className="practical-acknowledgements">
              <label>
                <input type="checkbox" name="secured" /> I secured and identified the main case
                before interruption.
              </label>
              <label>
                <input type="checkbox" name="biohazard" /> I included unfixed-tissue, sharps and
                contamination precautions.
              </label>
            </div>
          </>
        )}
        <label className="practical-text-label" htmlFor={id}>
          {kind === 'microscope'
            ? 'Describe the location, structure and optical changes'
            : 'Record observations, reasoning and limitations'}
          <textarea
            id={id}
            name="text"
            className="input"
            required
            minLength={minimum}
            maxLength={1800}
            rows={4}
            aria-describedby={`${id}-help`}
          />
        </label>
        <p className="small muted" id={`${id}-help`}>
          Use at least {minimum} characters. The software checks completeness, not the scientific
          correctness of free text. Use fictional identifiers only.
        </p>
        <button className="btn" type="submit">
          Record this evidence
        </button>
      </fieldset>
    </form>
  )
}

export default function PracticalBrief({
  practicalId,
  twin,
  act,
}: {
  practicalId: string
  twin: Twin
  act: Act
}) {
  const level = CAREER_LEVELS.find((entry) => entry.practical.id === practicalId)
  const spec = PRACTICAL_BY_ID[practicalId]
  const grade = useMemo(
    () => (spec ? gradePractical(twin, practicalId) : null),
    [twin, practicalId, spec],
  )
  const orientationSlide = useMemo(
    () => (spec?.level === 'L0' ? slideAppearance(referenceTwin(twin.scenario)) : null),
    [spec, twin.scenario],
  )
  if (!level || !spec || !grade) return null
  return (
    <section className="practical-brief" aria-labelledby="practical-brief-heading">
      <header>
        <h2 id="practical-brief-heading">
          {spec.level}: {level.practical.title}
        </h2>
        <p>{level.practical.scenario}</p>
      </header>
      <details open>
        <summary>Published rubric and exercise requirements</summary>
        <ol>
          {level.practical.rubric.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ol>
        <h3>What this exercise records</h3>
        <ul>
          {spec.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ul>
        <p>
          Every required check must be met, the score must reach{' '}
          {parameterValue('quality.pass-threshold')}%, and any critical error prevents a practical
          pass.{' '}
          {spec.reviewRequired
            ? 'Planning completeness never grants an automatic pass.'
            : 'Your assessment combines model outcomes with recorded evidence.'}
        </p>
        <p className="small muted">
          Settings and tolerances are educational assumptions.{' '}
          <Link to="/career">Review the full learning ladder</Link>.
        </p>
      </details>
      {spec.level === 'L0' && (
        <>
          <EvidenceForm title="Safety observation" checkId="safe-start" kind="safety" act={act} />
          <button
            type="button"
            className="btn"
            onClick={() => act('instrument.set', { locked: true, guarded: true }, 'microtomy')}
          >
            Apply handwheel lock and blade guard
          </button>
          {orientationSlide && (
            <Suspense fallback={<p>Loading the reference teaching slide…</p>}>
              <Microscope appearance={orientationSlide} />
            </Suspense>
          )}
          <EvidenceForm
            title="Microscope observation"
            checkId="microscope-basics"
            kind="microscope"
            act={act}
          />
        </>
      )}
      {spec.level === 'L2' && (
        <EvidenceForm title="H&E reference comparison" checkId="reference-comparison" act={act} />
      )}
      {spec.level === 'L3' && (
        <>
          <EvidenceForm
            title="Separate-case interruption plan"
            checkId="frozen-interruption"
            kind="interruption"
            act={act}
          />
          <EvidenceForm
            title="Cause, correction and technical disposition"
            checkId="corrective-action"
            act={act}
          />
        </>
      )}
      {spec.level === 'L4' && (
        <>
          <EvidenceForm
            title="RNA preservation and negative-result limitations"
            checkId="ish-rna-integrity"
            act={act}
          />
          <EvidenceForm
            title="Single-marker and multiplex control plan"
            checkId="multiplex-planning"
            act={act}
          />
        </>
      )}
      {spec.reviewRequired && <PlanningTools act={act} />}
      {spec.reviewRequired &&
        level.practical.rubric.map((criterion, index) => (
          <EvidenceForm
            key={criterion}
            title={criterion}
            checkId={`planning-${index + 1}`}
            minimum={P['practical.plan-minimum']}
            act={act}
          />
        ))}
      <details className="practical-current-checks">
        <summary>
          Current recorded checks: {grade.checks.filter((check) => check.passed).length} /{' '}
          {grade.checks.length}
        </summary>
        <ul>
          {grade.checks.map((check) => (
            <li key={check.id}>
              <strong>
                {check.passed ? 'Recorded' : 'Still needed'}: {check.label}
              </strong>
              <p>{check.evidence}</p>
            </li>
          ))}
        </ul>
        <p>{grade.reviewNote}</p>
      </details>
    </section>
  )
}
