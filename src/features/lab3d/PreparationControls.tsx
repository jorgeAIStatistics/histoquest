import EmbeddingPrediction from './EmbeddingPrediction'
import { useState } from 'react'
import { ActionForm, Check, N, S, T, type ControlsProps, type Intent } from './fields'
import type { StationId } from '../../sim/core/events'
interface ProgramStep {
  id: number
  reagent: string
  minutes: number
  temperature: number
  concentration: number
  exhaustion: number
  agitation: boolean
  vacuum: boolean
}
function Processor({ act }: { act: Intent }) {
  const [rows, setRows] = useState<ProgramStep[]>([])
  return (
    <>
      <ActionForm
        title="Program editor"
        submit="Append program step"
        onAction={(p) =>
          setRows((old) => [
            ...old,
            { ...p, id: (old.at(-1)?.id ?? 0) + 1 } as unknown as ProgramStep,
          ])
        }
      >
        <S name="reagent" label="Reagent" options={['alcohol', 'clearant', 'paraffin']} />
        <N name="concentration" label="Reagent concentration" value={100} unit="%" />
        <N name="minutes" label="Exposure" parameter="processing.minutes" />
        <N name="temperature" label="Temperature" parameter="processing.wax-temperature" />
        <N name="exhaustion" label="Reagent exhaustion" value={0} unit="0–1" />
        <Check name="vacuum" label="Vacuum enabled in this scenario" />
        <Check name="agitation" label="Reagent circulation enabled" />
      </ActionForm>
      <ol className="program-rows">
        {rows.map((r, i) => (
          <li key={r.id}>
            <strong>
              {i + 1}. {r.reagent}
            </strong>
            <span>
              {r.minutes} min · {r.temperature} °C · {r.concentration}% · exhausted{' '}
              {Math.round(r.exhaustion * 100)}%
            </span>
            <div className="row">
              <button
                className="btn btn-small"
                disabled={i === 0}
                onClick={() =>
                  setRows((a) => {
                    const next = [...a]
                    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                    return next
                  })
                }
                aria-label={`Move step ${i + 1} earlier`}
              >
                ↑ Earlier
              </button>
              <button
                className="btn btn-small"
                onClick={() => setRows((a) => a.filter((x) => x.id !== r.id))}
              >
                Remove step {i + 1}
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        className="btn btn-primary"
        disabled={!rows.length}
        onClick={() => {
          for (const r of rows)
            act('processing.step', {
              reagent: r.reagent,
              minutes: r.minutes,
              temperature: r.temperature,
              concentration: r.concentration,
              exhaustion: r.exhaustion,
              vacuum: r.vacuum,
              agitation: r.agitation,
            })
        }}
      >
        Run programmed exchange
      </button>
      <p className="small muted">
        The submitted steps are recorded individually. Program order, reagent state and tissue
        geometry determine the resulting block. Reprocessing adds exposure to the same specimen.
      </p>
    </>
  )
}
export default function PreparationControls({
  twin: t,
  act,
  station,
}: ControlsProps & { station: StationId }) {
  if (station === 'accessioning')
    return (
      <>
        <div className="requisition">
          <span className="small muted">Fictional teaching request</span>
          <h3>{t.scenario.accession}</h3>
          <dl>
            <dt>Two identifiers</dt>
            <dd>{t.scenario.identifiers.join(' · ')}</dd>
            <dt>Source</dt>
            <dd>{t.scenario.title}, part A</dd>
            <dt>Requested work</dt>
            <dd>{t.scenario.request}</dd>
            {t.scenario.instruction && (
              <>
                <dt>Teaching work order</dt>
                <dd>{t.scenario.instruction}</dd>
              </>
            )}
            <dt>Container / requisition comparison</dt>
            <dd>
              {t.scenario.discrepancy === 'none'
                ? 'Identifiers and source agree.'
                : t.scenario.discrepancy.replaceAll('-', ' ')}
            </dd>
          </dl>
        </div>
        <div className="row">
          <button className="btn" onClick={() => act('identity.hold')}>
            Place discrepancy on hold
          </button>
          <button className="btn" onClick={() => act('identity.accept')}>
            Accept accession
          </button>
        </div>
        <ActionForm
          title="Authorized discrepancy resolution"
          submit="Record source-authorized correction"
          onAction={(p) => act('identity.resolve', p)}
        >
          <T name="documentation" label="Resolution record" multiline />
          <Check
            name="authorized"
            label="Submitting source supplied and authorized the correction"
          />
        </ActionForm>
        <details>
          <summary>Identity chain</summary>
          <ol>
            {t.identity.custody.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <button className="btn" onClick={() => act('identity.relabel')}>
            Practice an unauthorized relabeling error
          </button>
          <p className="small">
            This deliberately records a critical error for investigation. It does not repair the
            identity chain.
          </p>
        </details>
      </>
    )
  if (station === 'grossing')
    return (
      <>
        <ActionForm
          title="Gross measurement"
          submit="Record dimensions"
          onAction={(p) => act('gross.measure', p)}
        >
          <N name="length" label="Length" value={t.scenario.dimensions[0]} unit="mm" />
          <N name="width" label="Width" value={t.scenario.dimensions[1]} unit="mm" />
          <N name="depth" label="Depth" value={t.scenario.dimensions[2]} unit="mm" />
        </ActionForm>
        <ActionForm
          title="Sampling and cassette key"
          submit="Sample into cassette"
          onAction={(p) => act('gross.sample', p)}
        >
          <N name="thickness" label="Maximum piece thickness" value={t.gross.thickness} unit="mm" />
          <N
            name="fragments"
            label="Pieces accounted for"
            value={t.gross.fragments}
            unit="pieces"
          />
          <S
            name="cassette"
            label="Containment"
            options={['standard', 'biopsy', 'sponge', 'mesh bag', 'tissue paper wrap']}
          />
          <N name="crowding" label="Cassette crowding" value={0} unit="0–1" />
          <S
            name="ink"
            label="Ink convention (scenario-specific)"
            options={['none', 'blue', 'black', 'blue deep / black lateral']}
          />
          <S
            name="approach"
            label="Sampling approach"
            options={[
              'serial perpendicular',
              'en face',
              'ellipse tips and body',
              'bisected punch',
              'submit biopsies whole',
            ]}
          />
          <T name="key" label="Cassette key and orientation record" multiline />
          <Check name="extraction" label="Local fume extraction checked" />
        </ActionForm>
      </>
    )
  if (station === 'fixation')
    return (
      <ActionForm
        title="Fixative exposure"
        submit="Run fixation exposure"
        onAction={(p) => act('fixation.run', p)}
      >
        <S
          name="fixative"
          label="Preparation"
          options={[
            ['nbf', 'Neutral buffered formalin'],
            ['zinc-formalin', 'Zinc formalin'],
            ['alcohol', 'Alcohol-based'],
            ['glutaraldehyde', 'Glutaraldehyde — EM pathway'],
            ['michel', 'Michel transport — IF pathway'],
            ['carnoy', 'Carnoy — method-specific'],
            ['acetone', 'Acetone — method-specific'],
            ['acid-formalin', 'Acid formalin — artifact investigation'],
          ]}
        />
        <N name="hours" label="Exposure duration" parameter="fixation.hours" />
        <N name="temperature" label="Temperature" parameter="fixation.temperature" />
        <N name="ratio" label="Fixative to tissue" parameter="fixation.ratio" />
        <N name="ischemia" label="Cold ischemia" value={t.fixation.ischemia} unit="hour" />
      </ActionForm>
    )
  if (station === 'decalcification')
    return (
      <ActionForm
        title="Mineral removal"
        submit="Run decalcification exposure"
        onAction={(p) => act('decalcification.run', p)}
      >
        <S name="agent" label="Agent" options={['edta', 'weak-acid', 'strong-acid', 'none']} />
        <N name="hours" label="Exposure" parameter="fixation.hours" />
        <N name="temperature" label="Temperature" parameter="fixation.temperature" />
        <Check name="agitation" label="Controlled reagent agitation" />
        <S
          name="endpoint"
          label="Endpoint assessment"
          options={['none', 'radiographic', 'chemical', 'physical probing']}
        />
      </ActionForm>
    )
  if (station === 'processing')
    return (
      <>
        {t.processing.exhaustedAlcohol && (
          <p className="notice" role="status">
            Reagent check: the loaded alcohol is exhausted in this scenario. Record replacement and
            QC before continuing.
          </p>
        )}
        <ActionForm
          title="Reagent replacement and QC"
          submit="Register reagent replacement"
          onAction={(p) => act('processing.reagent-change', p)}
        >
          <S
            name="reagent"
            label="Reagent being replaced"
            options={['alcohol', 'clearant', 'paraffin']}
          />
          <T name="lot" label="Replacement reagent lot" />
          <T name="documentation" label="Replacement and QC record" multiline />
        </ActionForm>
        <Processor act={act} />
        <details>
          <summary>Executed processor record</summary>
          <ol>
            {t.processing.history.map((h, i) => (
              <li key={i}>
                {h.reagent} · {h.minutes} min · {h.temperature} °C · {h.concentration}% · exhaustion{' '}
                {h.exhaustion}
              </li>
            ))}
          </ol>
        </details>
      </>
    )
  if (station === 'embedding')
    return (
      <>
        <EmbeddingPrediction twin={t} />
        <ActionForm
          title="Piece placement — six degrees of freedom"
          submit="Place / update piece"
          onAction={(p) => act('embedding.place', p)}
        >
          <T
            name="piece"
            label="Piece identifier"
            value={`A1-${Math.min(t.embedding.pieces.length + 1, t.gross.fragments)}`}
          />
          {(['x', 'y', 'z'] as const).map((axis) => (
            <N
              key={axis}
              name={axis}
              label={`${axis.toUpperCase()} position`}
              value={0}
              unit="mm"
            />
          ))}
          {(['rx', 'ry', 'rz'] as const).map((axis) => (
            <N
              key={axis}
              name={axis}
              label={`Rotation about ${axis.slice(1).toUpperCase()}`}
              value={0}
              unit="degree"
            />
          ))}
          <N
            name="temperature"
            label="Paraffin temperature"
            parameter="embedding.wax-temperature"
          />
          <N name="bubbles" label="Entrapped air" value={0} unit="0–1" />
        </ActionForm>
        <ActionForm
          title="Cold plate"
          submit="Cool block"
          onAction={(p) => act('embedding.cool', p)}
        >
          <N
            name="temperature"
            label="Conditioned block temperature"
            parameter="microtomy.block-temperature"
          />
        </ActionForm>
        <p className="small">
          Placed {t.embedding.pieces.length} of {t.gross.fragments} pieces. Rotation is relative to
          the requested histologic face; the block preview shows its intersection with the cutting
          plane.
        </p>
      </>
    )
  return <p>Select a preparation station.</p>
}
