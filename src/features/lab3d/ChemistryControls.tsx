import { lazy, Suspense, useState } from 'react'
import { ActionForm, Check, N, S, type ControlsProps } from './fields'
import type { StationId } from '../../sim/core/events'
import { PROTOCOLS, PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { PROTOCOL_PARAMETERS } from '../../sim/params/protocols'
import { MARKERS } from '../../content/lab/markers'
import { PROCESS as P } from '../../sim/params/process'
import { releaseProblems } from '../../sim/scoring/assess'

const IhcAcademy = lazy(() => import('./IhcAcademy'))
const SpecialBench = lazy(() => import('./SpecialBench'))
const HeProgram = lazy(() => import('./HeProgram'))

export default function ChemistryControls({
  twin: t,
  act,
  station,
}: ControlsProps & { station: StationId }) {
  const [protocol, setProtocol] = useState(t.staining.protocol || 'pas')
  const selected = PROTOCOL_BY_ID[protocol]
  if (station === 'he')
    return (
      <>
        <ActionForm
          title="Manual staining rack"
          submit="Apply reagent step"
          onAction={(p) => act('stain.step', p)}
        >
          <S
            name="reagent"
            label="Reagent"
            options={[
              'dewax',
              'hydrate',
              'hematoxylin',
              'differentiate',
              'blue',
              'eosin',
              'dehydrate',
              'clear',
            ]}
          />
          <N name="minutes" label="Exposure" parameter="he.hematoxylin-time" />
          <N name="freshness" label="Reagent activity" value={1} unit="0–1" />
          <S name="lot" label="Reagent lot" options={['TRAIN-LOT-A', 'TRAIN-LOT-B']} />
        </ActionForm>
        <details>
          <summary>Scenario response scales</summary>
          <dl>
            {[
              'dewax',
              'hydrate',
              'hematoxylin',
              'differentiate',
              'blue',
              'eosin',
              'dehydrate',
              'clear',
            ].map((step) => (
              <div key={step}>
                <dt>{step}</dt>
                <dd>{P[`he.${step}-time`]} simulation min</dd>
              </div>
            ))}
          </dl>
          <p className="small">
            These are synthetic response scales, not a clinical staining recipe. Review appearance
            and controls; actual methods vary by formulation.
          </p>
        </details>
        <StainHistory twin={t} />
        <Suspense fallback={<p>Loading H&E program editor…</p>}>
          <HeProgram twin={t} act={act} />
        </Suspense>
      </>
    )
  if (station === 'special')
    return (
      <>
        <label className="lab-field">
          Protocol graph
          <select className="input" value={protocol} onChange={(e) => setProtocol(e.target.value)}>
            {PROTOCOLS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <p>{selected.principle}</p>
        <button
          className="btn"
          disabled={!t.instrument.locked || !t.instrument.guarded || !t.embedding.cooled}
          onClick={() => act('special.prepare')}
        >
          Prepare an adjacent unstained section
        </button>
        <p className="small">
          <strong>Target:</strong> {selected.target} · {selected.pathway} pathway ·{' '}
          {selected.mounting} mounting
        </p>
        <ol className="protocol-graph">
          {selected.steps.map((step, i) => (
            <li
              key={`${protocol}-${step.id}`}
              className={
                t.staining.protocol === protocol && t.staining.completedSteps.includes(step.id)
                  ? 'performed'
                  : ''
              }
            >
              <ActionForm
                title={`${i + 1}. ${step.label}`}
                submit={`Run ${step.label.toLowerCase()}`}
                onAction={(p) => act('special.step', { ...p, protocol, step: step.id })}
              >
                <p className="span-all small">
                  {step.reagent} · {step.note}
                </p>
                <N
                  name="minutes"
                  label="Exposure"
                  value={
                    PROTOCOL_PARAMETERS.find((p) => p.id === step.durationParam)?.value as number
                  }
                  unit="simulation minute"
                />
                {protocol.includes('alcian') && (
                  <N
                    name="ph"
                    label="Reagent pH"
                    value={
                      protocol === 'alcian-blue-1'
                        ? P['special.alcian-low-ph']
                        : P['special.alcian-standard-ph']
                    }
                    unit="pH"
                  />
                )}
              </ActionForm>
            </li>
          ))}
        </ol>
        <ActionForm
          title="Control review"
          submit="Evaluate special-stain controls"
          onAction={(p) => act('special.controls', p)}
        >
          <p className="span-all small">{selected.controls.join(' ')}</p>
          <Check name="positive" label="Known target-positive control included" />
          <Check name="negative" label="Appropriate negative / comparison control included" />
          {protocol === 'pas-d' && (
            <Check
              name="digestionVerified"
              label="Paired digestion control shows glycogen loss with retained non-glycogen PAS reaction"
            />
          )}
        </ActionForm>
        <p role="status">
          {t.staining.controls.valid
            ? 'Control results support the modeled reaction.'
            : 'Control adequacy has not been established.'}
        </p>
        <Suspense fallback={<p>Loading reaction comparisons…</p>}>
          <SpecialBench key={protocol} twin={t} act={act} protocol={protocol} />
        </Suspense>
        <details>
          <summary>Investigate this method</summary>
          {selected.failures.map((f) => (
            <p key={f.cause}>
              <strong>{f.cause}:</strong> {f.effect} {f.investigation}
            </p>
          ))}
        </details>
      </>
    )
  if (station === 'ihc')
    return (
      <>
        {t.ihc.primary > 0 || t.ihc.dab > 0 || t.ihc.detectionApplied || t.ihc.ish ? (
          <div className="notice">
            <p>
              Current assay: <strong>{t.ihc.marker}</strong>. Its bound reagents and deposits remain
              on this section. Prepare a new section before changing the target or repeating
              retrieval, primary or detection after development. The marker library below remains
              available for reference.
            </p>
            <button
              className="btn"
              disabled={!t.instrument.locked || !t.instrument.guarded || !t.embedding.cooled}
              onClick={() => act('ihc.prepare')}
            >
              Prepare an adjacent unstained IHC section
            </button>
          </div>
        ) : (
          <ActionForm
            title="Target and expected compartment"
            submit="Select target"
            onAction={(p) => act('ihc.marker', p)}
          >
            <S
              name="marker"
              label="Marker"
              value={t.ihc.marker}
              options={MARKERS.filter((m) => m.modality === 'IHC').map((m) => [m.id, m.label])}
            />
          </ActionForm>
        )}
        <ActionForm
          title="Antigen retrieval"
          submit="Apply retrieval"
          onAction={(p) => act('ihc.retrieve', p)}
        >
          <S
            name="method"
            label="Method"
            options={[
              ['hier', 'Heat induced (HIER)'],
              ['pier', 'Proteolytic (PIER)'],
            ]}
          />
          <N name="minutes" label="Exposure" parameter="ihc.retrieval-time" />
          <N name="temperature" label="Temperature" parameter="ihc.retrieval-temperature" />
          <N name="ph" label="Buffer pH" parameter="ihc.retrieval-ph" />
        </ActionForm>
        <ActionForm
          title="Primary binding"
          submit="Apply primary antibody"
          onAction={(p) => act('ihc.primary', p)}
        >
          <N name="dilution" label="Dilution denominator (1:X)" parameter="ihc.primary-dilution" />
          <N name="minutes" label="Incubation" parameter="ihc.primary-minutes" />
          <N name="sectionAge" label="Age since sectioning" value={0} unit="day" />
          <Check name="blocked" label="Appropriate endogenous / nonspecific blocking" />
          <Check name="humid" label="Humid chamber maintained" />
          <Check name="washed" label="Method-specified washes completed" />
        </ActionForm>
        <ActionForm
          title="Detection and chromogen"
          submit="Develop chromogen"
          onAction={(p) => act('ihc.detect', p)}
        >
          <N name="minutes" label="Detection incubation" parameter="ihc.detect-minutes" />
          <N name="chromogenMinutes" label="Chromogen exposure" parameter="ihc.chromogen-minutes" />
          <Check name="compatible" label="Detection system matches the primary and chromogen" />
        </ActionForm>
        <ActionForm
          title="Evaluate the analytical controls"
          submit="Read IHC controls"
          onAction={(p) => act('ihc.controls', p)}
        >
          <Check name="positive" label="External positive control" />
          <Check name="lowPositive" label="Low-expression positive control" />
          <Check name="negative" label="Negative reagent control" />
          <Check
            name="faultCorrected"
            label="Documented reagent fault corrected before this repeat"
          />
        </ActionForm>
        <dl className="control-results">
          <dt>External positive</dt>
          <dd>{t.ihc.positive?.toFixed(2) ?? 'Not run'}</dd>
          <dt>Low-expression control</dt>
          <dd>{t.ihc.lowPositive?.toFixed(2) ?? 'Not run'}</dd>
          <dt>Negative reagent</dt>
          <dd>{t.ihc.negative?.toFixed(2) ?? 'Not run'}</dd>
          <dt>Internal elements</dt>
          <dd>{t.ihc.internal?.toFixed(2) ?? 'Not evaluated'}</dd>
        </dl>
        <p role="status">
          <strong>
            {t.ihc.valid ? 'Controls support technical interpretation' : 'Run not interpretable'}
          </strong>
        </p>
        <Suspense fallback={<p>Loading IHC mastery academy…</p>}>
          <IhcAcademy twin={t} act={act} />
        </Suspense>
      </>
    )
  if (station === 'ish')
    return (
      <>
        <ActionForm
          title="Probe access and hybridization"
          submit="Hybridize probe"
          onAction={(p) => act('ish.hybridize', p)}
        >
          <S
            name="probe"
            label="Teaching target"
            options={['EBER', 'kappa', 'lambda', 'housekeeping RNA', 'generic DNA']}
          />
          <S name="modality" label="Detection" options={['CISH', 'FISH']} />
          <Check
            name="denatured"
            label="For DNA target: method-specified DNA denaturation completed before hybridization"
          />
          <N name="minutes" label="Exposure" value={30} unit="simulation minute" />
          <N name="temperature" label="Hybridization temperature" value={40} unit="°C" />
          <N name="protease" label="Protease exposure" value={1} unit="relative exposure" />
        </ActionForm>
        <ActionForm
          title="Stringency wash"
          submit="Apply stringency wash"
          onAction={(p) => act('ish.wash', p)}
        >
          <N name="stringency" label="Stringency" value={1} unit="relative exposure" />
        </ActionForm>
        <ActionForm
          title="Assay controls"
          submit="Evaluate ISH controls"
          onAction={(p) => act('ish.controls', p)}
        >
          <Check name="positive" label="Known target-positive assay control" />
          <Check name="negative" label="Negative probe control" />
          <Check name="integrity" label="Independent specimen nucleic-acid integrity control" />
        </ActionForm>
      </>
    )
  if (station === 'coverslip')
    return (
      <ActionForm
        title="Mounting and optics"
        submit="Apply coverslip"
        onAction={(p) => act('coverslip.apply', p)}
      >
        <S name="medium" label="Medium" options={['resinous', 'aqueous']} />
        <N name="volume" label="Medium amount" parameter="mount.volume" />
        <N name="angle" label="Placement angle" value={30} unit="degree" />
        <N name="delay" label="Uncovered delay" value={0} unit="simulation minute" />
      </ActionForm>
    )
  if (station === 'frozen')
    return (
      <>
        <ActionForm
          title="OCT chuck and rapid freezing"
          submit="Prepare frozen block"
          onAction={(p) => act('frozen.freeze', p)}
        >
          <N name="temperature" label="Chamber / head temperature" parameter="frozen.temperature" />
          <N name="rate" label="Freezing rate" parameter="frozen.rate" />
          <Check
            name="biohazard"
            label="Unfixed tissue precautions and decontamination plan checked"
          />
        </ActionForm>
        <p className="small">
          Continue at Microtomy to cut, pick up directly onto a labeled slide, then use rapid stain
          exposures. Time advances through recorded operations. Frozen wax support is a mechanical
          proxy, not paraffin infiltration.
        </p>
      </>
    )
  if (station === 'quality') {
    const problems = releaseProblems(t)
    return (
      <>
        <h3>Technical release review</h3>
        {t.scenario.request === 'molecular' && (
          <ActionForm
            title="Unstained-section preparation handoff"
            submit="Record molecular preparation review"
            onAction={(p) =>
              act('practice.evidence', {
                ...p,
                checkId: 'molecular-preparation',
                sectionId: t.block.sections.at(-1)?.id ?? '',
                text: 'Structured unstained-section preparation review; clinical assay suitability requires receiving-laboratory assessment.',
              })
            }
          >
            <p className="span-all small">
              This is an assay-specific preparation exercise, not a molecular result or a
              demonstration of clinical assay suitability. Keep the section unstained and uncovered;
              follow the receiving laboratory’s requirements.
            </p>
            <S name="targetClass" label="Declared molecular target" options={['rna', 'dna']} />
            <Check
              name="protocolReviewed"
              label="Receiving laboratory’s assay-specific preparation instructions reviewed"
            />
            <Check
              name="contaminationPlan"
              label="Clean collection and contamination precautions documented"
            />
            <Check
              name="receivingReview"
              label="Section identity and morphology information prepared for qualified receiving review"
            />
            <Check
              name="limitationsCommunicated"
              label="Fixation, decal, delay and processing limitations communicated"
            />
          </ActionForm>
        )}
        {problems.length ? (
          <ul>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p>
            Current modeled technical criteria are satisfied. Review the record and communicate
            limitations.
          </p>
        )}
        <div className="row">
          <button className="btn" onClick={() => act('quality.hold')}>
            Hold for corrective action
          </button>
          <button className="btn btn-primary" onClick={() => act('quality.release')}>
            Release for pathologist review
          </button>
        </div>
        <p className="small">
          Disposition: {t.disposition}. Critical errors remain in the practical record even after an
          improved section.
        </p>
      </>
    )
  }
  return null
}
function StainHistory({ twin }: Pick<ControlsProps, 'twin'>) {
  return (
    <details>
      <summary>Stain history</summary>
      <ol>
        {twin.staining.history.map((s, i) => (
          <li key={i}>
            {s.reagent}: {s.minutes} simulation min · {s.lot}
          </li>
        ))}
      </ol>
    </details>
  )
}
