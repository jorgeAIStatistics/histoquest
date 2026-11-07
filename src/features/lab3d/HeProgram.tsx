import { lazy, Suspense, useMemo, useState } from 'react'
import { HE_REAGENTS, heControl } from '../../sim/models/heExperiments'
import { slideAppearance } from '../../sim/specimen/appearance'
import { PROCESS as P } from '../../sim/params/process'
import { ActionForm, Check, T, type ControlsProps } from './fields'
const Microscope = lazy(() => import('../../render2d/Microscope'))
type Row = { id: number; reagent: string; minutes: number; freshness: number; lot: string }
export default function HeProgram({ twin, act }: ControlsProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [formulation, setFormulation] = useState('regressive')
  const [showControl, setShowControl] = useState(false)
  const [qcMessage, setQcMessage] = useState('')
  const control = useMemo(() => (showControl ? heControl(twin) : null), [showControl, twin])
  const update = (id: number, patch: Partial<Row>) =>
    setRows((old) => old.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  function loadExample() {
    setRows(
      HE_REAGENTS.filter((r) => formulation === 'regressive' || r !== 'differentiate').map(
        (reagent, id) => ({
          id,
          reagent,
          minutes: P[`he.${reagent}-time`],
          freshness: 1,
          lot: 'TRAIN-HE-A',
        }),
      ),
    )
  }
  return (
    <section className="he-program">
      <h3>Linear stainer program</h3>
      <p>
        Arrange the rack movements, exposures, activity and reagent lots. The automated run
        dispatches the same steps as the manual rack above. Changing a program does not undo an
        exposure already recorded on the section.
      </p>
      <label className="lab-field">
        Teaching sequence
        <select
          className="input"
          value={formulation}
          onChange={(e) => setFormulation(e.target.value)}
        >
          <option value="regressive">Regressive concept — includes differentiation</option>
          <option value="progressive">Progressive concept — no separate differentiation</option>
        </select>
      </label>
      <div className="row">
        <button className="btn" onClick={loadExample}>
          Load editable teaching sequence
        </button>
        <button
          className="btn"
          onClick={() =>
            setRows((old) => [
              ...old,
              {
                id: Math.max(-1, ...old.map((r) => r.id)) + 1,
                reagent: 'dewax',
                minutes: P['he.dewax-time'],
                freshness: 1,
                lot: '',
              },
            ])
          }
        >
          Add reagent station
        </button>
      </div>
      <p className="small muted">
        These times are the model’s illustrative response scales, not a clinical staining recipe.
        Formulation-specific kinetics and phloxine variants are not calibrated.
      </p>
      <ol className="he-program-list">
        {rows.map((row, index) => (
          <li key={row.id}>
            <div className="he-program-grid">
              <label>
                Station {index + 1} reagent
                <select
                  className="input"
                  value={row.reagent}
                  onChange={(e) => update(row.id, { reagent: e.target.value })}
                >
                  {HE_REAGENTS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Station {index + 1} exposure (simulation min)
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="any"
                  value={row.minutes}
                  onChange={(e) => update(row.id, { minutes: Number(e.target.value) })}
                />
              </label>
              <label>
                Station {index + 1} reagent activity (0–1)
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={row.freshness}
                  onChange={(e) => update(row.id, { freshness: Number(e.target.value) })}
                />
              </label>
              <label>
                Station {index + 1} lot
                <input
                  className="input"
                  value={row.lot}
                  maxLength={80}
                  onChange={(e) => update(row.id, { lot: e.target.value })}
                />
              </label>
            </div>
            <div className="row">
              <button
                className="btn btn-small"
                disabled={index === 0}
                onClick={() =>
                  setRows((old) => {
                    const next = [...old]
                    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                    return next
                  })
                }
              >
                Move station {index + 1} earlier
              </button>
              <button
                className="btn btn-small"
                onClick={() => setRows((old) => old.filter((r) => r.id !== row.id))}
              >
                Remove station {index + 1}
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        className="btn btn-primary"
        disabled={
          !rows.length ||
          !twin.block.sections.at(-1)?.pickedUp ||
          rows.some(
            (r) =>
              !r.lot.trim() ||
              !Number.isFinite(r.minutes) ||
              r.minutes < 0 ||
              !Number.isFinite(r.freshness) ||
              r.freshness < 0 ||
              r.freshness > 1,
          )
        }
        onClick={() =>
          rows.forEach((row) =>
            act('stain.step', {
              reagent: row.reagent,
              minutes: row.minutes,
              freshness: row.freshness,
              lot: row.lot,
              mode: 'linear-stainer',
            }),
          )
        }
      >
        Run linear stainer program
      </button>
      {!twin.block.sections.at(-1)?.pickedUp && (
        <p className="small">Pick up an identified section before loading this stainer.</p>
      )}
      <h3>Control comparison and daily QC record</h3>
      <p>
        A separate known-prepared synthetic control receives your recorded reagent sequence and
        activity. Compare it with your case: a shared staining defect suggests a run problem; a
        case-specific defect may originate upstream. Neither image establishes clinical adequacy.
      </p>
      <button
        className="btn"
        aria-expanded={showControl}
        onClick={() => setShowControl(!showControl)}
      >
        {showControl ? 'Close H&E control comparison' : 'Inspect H&E control comparison'}
      </button>
      {control && (
        <div className="he-control-comparison">
          <Suspense fallback={<p role="status">Preparing control microscopy…</p>}>
            <Microscope
              appearance={slideAppearance(twin)}
              ideal={slideAppearance(control)}
              initialCompare
              force2D
            />
          </Suspense>
          <p className="small">
            The panels identify your case and the separate synthetic control, using the same reagent
            history. The control may also fail; “reference” identifies its comparison role.
          </p>
        </div>
      )}
      <ActionForm
        title="Record H&E QC"
        submit="Save H&E control review"
        onAction={(p) => {
          if (p.compared && String(p.text).trim().length >= 10) {
            act('document', { text: `H&E QC / lots: ${String(p.text)}` })
            setQcMessage('H&E control comparison recorded.')
          } else
            setQcMessage(
              'Record your observed comparison and confirm the control inspection before saving.',
            )
        }}
      >
        <Check
          name="compared"
          label="Compared nuclear/cytoplasmic detail, background and control appearance"
        />
        <T
          name="text"
          label="Observed differences, reagent lot, disposition and corrective action"
          multiline
        />
      </ActionForm>
      <p role="status">{qcMessage}</p>
    </section>
  )
}
