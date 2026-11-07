import { lazy, Suspense, useMemo, useState } from 'react'
import type { ControlsProps } from './fields'
import { PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { referenceTwin } from '../../sim/core/reference'
import {
  createSpecialControl,
  SPECIAL_CONTROL_SPECS,
  runSpecialExperiment,
  type SpecialChallenge,
} from '../../sim/models/specialExperiments'
const Microscope = lazy(() => import('../../render2d/Microscope'))

/** Experimental comparisons are clones; the main section changes only through station actions. */
export default function SpecialBench({
  twin,
  act,
  protocol,
}: ControlsProps & { protocol: string }) {
  const [challenge, setChallenge] = useState<SpecialChallenge>('matched')
  const [run, setRun] = useState<ReturnType<typeof compare> | null>(null)
  const [panel, setPanel] = useState<'patient' | 'companion'>('patient')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const isPas = /^pas/.test(protocol)
  const controlSpec = SPECIAL_CONTROL_SPECS[protocol]
  const base = useMemo(
    () =>
      twin.embedding.cooled && twin.embedding.pieces.length
        ? twin
        : referenceTwin({ ...twin.scenario, discrepancy: 'none', faults: [] }),
    [twin],
  )
  function compare() {
    const control = createSpecialControl(twin.scenario.seed, protocol)
    const patient = runSpecialExperiment(base, protocol, challenge)
    const positive = runSpecialExperiment(control, protocol, challenge)
    const companionId = protocol === 'pas-d' ? 'pas' : 'pas-d'
    return {
      patient,
      positive,
      controlArchetype: control.scenario.archetype,
      companion: isPas ? runSpecialExperiment(base, companionId, challenge) : null,
      companionControl: isPas ? runSpecialExperiment(control, companionId, challenge) : null,
      challenge,
    }
  }
  const show = panel === 'companion' && run?.companion ? run.companion : run?.patient
  const positive =
    panel === 'companion' && run?.companionControl ? run.companionControl : run?.positive
  return (
    <section className="special-comparison" aria-label="Special stain comparison bench">
      <h3>Compare the reaction and its control</h3>
      <p>
        Execute this graph on adjacent teaching sections and inspect the available synthetic
        control. Comparisons do not alter your main slide.{' '}
        {isPas
          ? 'The PAS/PAS-D pair separates a glycogen digestion effect from loss of all PAS reactivity. Mucin and basement-membrane cues remain after digestion.'
          : 'A target-bearing reference is required to assess the reaction; absence in the specimen alone cannot validate a negative result.'}
      </p>
      {controlSpec?.unsupportedReason && (
        <p role="status">
          <strong>Synthetic positive-control microscopy unavailable.</strong>{' '}
          {controlSpec.unsupportedReason} The conceptual reaction graph remains available; this
          exercise cannot award a positive-control pass.
        </p>
      )}
      <label className="lab-field">
        Comparison condition
        <select
          className="input"
          value={challenge}
          onChange={(e) => {
            setChallenge(e.target.value as SpecialChallenge)
            setRun(null)
            setFeedback('')
          }}
        >
          <option value="matched">Matched active reagents</option>
          {isPas && (
            <>
              <option value="inactive-diastase">Diastase inactive in the paired digestion</option>
              <option value="omit-oxidation">Periodic oxidation omitted</option>
            </>
          )}
          {protocol.includes('alcian') && (
            <option value="wrong-ph">Wrong Alcian reaction pH</option>
          )}
          <option value="overdevelop">Excess target-staining exposure</option>
        </select>
      </label>
      <button
        className="btn btn-primary"
        onClick={() => {
          const result = compare()
          setRun(result)
          setAnswer('')
          setFeedback('')
          act(
            'practice.evidence',
            {
              checkId: 'special-comparison-run',
              text: result.positive.targetEvidence.supported
                ? 'Executed specimen and target-bearing synthetic control comparison.'
                : 'Executed conceptual graph; target-specific microscopy is unavailable.',
              protocol,
              challenge,
              comparatorSupported: result.positive.targetEvidence.supported,
              positive: result.positive.twin.staining.controls.valid,
            },
            'special',
          )
        }}
      >
        Run matched specimen and controls
      </button>
      {run && (
        <>
          {isPas && (
            <div className="row">
              <button
                className="btn"
                aria-pressed={panel === 'patient'}
                onClick={() => setPanel('patient')}
              >
                {PROTOCOL_BY_ID[protocol].label}
              </button>
              <button
                className="btn"
                aria-pressed={panel === 'companion'}
                onClick={() => setPanel('companion')}
              >
                {protocol === 'pas-d' ? 'PAS undigested companion' : 'PAS-D digested companion'}
              </button>
            </div>
          )}
          <p className="small">
            {positive?.targetEvidence.supported
              ? `Synthetic control architecture: ${run.controlArchetype}. ${positive.targetEvidence.reason}`
              : positive?.targetEvidence.reason}{' '}
            Targets are authored compartment cues, not a photographed diseased specimen.
          </p>
          <p role="status">
            Known-positive reaction:{' '}
            {!positive?.targetEvidence.supported
              ? 'not assessable — the required target-specific comparator is not modeled'
              : positive.twin.staining.controls.valid
                ? 'exercise controls support this reaction'
                : 'control criteria failed — investigate before interpreting the specimen'}
            .{' '}
            {isPas
              ? `Glycogen component retained: ${(show!.twin.staining.specialGlycogen ?? 1).toFixed(2)} (authored relative field, not a tissue measurement).`
              : ''}
          </p>
          {protocol === 'congo-red' && (
            <p>
              Inspect both fields under crossed polarization. Collagen and other materials can also
              be birefringent; polarization alone is not a diagnosis. Section thickness influences
              the synthetic optical response.
            </p>
          )}
          {positive?.targetEvidence.supported && (
            <Suspense fallback={<p>Loading paired microscopy…</p>}>
              <Microscope
                appearance={show!.appearance}
                ideal={positive.appearance}
                initialCompare
              />
            </Suspense>
          )}
          <label className="lab-field">
            Interpret this technical comparison
            <select className="input" value={answer} onChange={(e) => setAnswer(e.target.value)}>
              <option value="">Select an interpretation</option>
              <option value="reaction-supported">
                Matched controls support the modeled reaction; specimen findings still require
                qualified interpretation
              </option>
              <option value="digestion-failed">
                Retained glycogen in the digestion control prevents a valid digestion inference
              </option>
              <option value="reaction-failed">
                Reaction control fails; do not call the specimen negative
              </option>
              <option value="not-modeled">
                Required target-specific comparator is unavailable; this graph cannot validate the
                reaction
              </option>
              <option value="diagnose">
                Use this synthetic field alone to establish a diagnosis
              </option>
            </select>
          </label>
          <button
            className="btn"
            onClick={() => {
              const expected = !run.positive.targetEvidence.supported
                ? 'not-modeled'
                : run.challenge === 'inactive-diastase'
                  ? 'digestion-failed'
                  : run.positive.twin.staining.controls.valid
                    ? 'reaction-supported'
                    : 'reaction-failed'
              const passed = answer === expected
              setFeedback(
                passed
                  ? 'Technical reasoning recorded.'
                  : 'Review both reaction and comparison controls before interpreting the specimen.',
              )
              act(
                'practice.evidence',
                {
                  checkId: 'special-comparison',
                  passed,
                  text: 'Interpreted the observed specimen/control comparison.',
                  protocol,
                  challenge: run.challenge,
                  interpretation: answer,
                  comparatorSupported: run.positive.targetEvidence.supported,
                  positive: run.positive.twin.staining.controls.valid,
                },
                'special',
              )
            }}
          >
            Record control interpretation
          </button>
          {feedback && <p role="status">{feedback}</p>}
        </>
      )}
      <p className="small">
        Authored procedural tissue and uncalibrated optics. These diagrams show selected
        compartments, not a complete representation of every histochemical target or a patient
        result. Protocol-specific control tissue and qualified review remain necessary.
      </p>
    </section>
  )
}
