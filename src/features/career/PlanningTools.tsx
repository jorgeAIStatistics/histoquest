import { useId, useState, type FormEvent } from 'react'
import { PLANNING, PLANNING_PARAMETERS } from '../../sim/params/planning'
import type { SimEvent, StationId } from '../../sim/core/events'
import { calculateCapacity, completeValidationPlan, validationPlanSummary } from './planning'
import type { CapacityInputs, ValidationPlan } from './planning'

type Act = (intent: string, params?: SimEvent['params'], station?: StationId) => void
const fields: { key: keyof CapacityInputs; label: string; parameter: string }[] = [
  { key: 'cases', label: 'Cases per day', parameter: 'planning.cases' },
  { key: 'blocksPerCase', label: 'Blocks per case', parameter: 'planning.blocks' },
  { key: 'workPerBlock', label: 'Active work minutes per block', parameter: 'planning.work' },
  { key: 'qualityMinutes', label: 'Protected QC staff minutes', parameter: 'planning.quality' },
  {
    key: 'maintenanceMinutes',
    label: 'Maintenance staff minutes',
    parameter: 'planning.maintenance',
  },
  { key: 'trainingMinutes', label: 'Training staff minutes', parameter: 'planning.training' },
  { key: 'qualifiedStaff', label: 'Role-qualified staff equivalents', parameter: 'planning.staff' },
  { key: 'shiftMinutes', label: 'Shift minutes per person', parameter: 'planning.shift' },
  { key: 'breakMinutes', label: 'Unavailable minutes per person', parameter: 'planning.breaks' },
  {
    key: 'otherUnavailableMinutes',
    label: 'Other unavailable staff minutes',
    parameter: 'planning.other',
  },
  {
    key: 'reagentCostPerBlock',
    label: 'Reagent cost per block, fictional CU',
    parameter: 'planning.reagents',
  },
  {
    key: 'controlCostPerDay',
    label: 'Control material per day, fictional CU',
    parameter: 'planning.controls',
  },
  {
    key: 'laborCostPerHour',
    label: 'Loaded labor per hour, fictional CU',
    parameter: 'planning.labor',
  },
]
const validationFields: { key: keyof ValidationPlan; label: string; prompt: string }[] = [
  {
    key: 'intendedUse',
    label: 'Intended use',
    prompt: 'Define the technical question and intended specimen type.',
  },
  {
    key: 'scope',
    label: 'Scope and change',
    prompt: 'Identify the method, reagent lot, specimen preparation or instrument change.',
  },
  {
    key: 'comparator',
    label: 'Comparator and control material',
    prompt: 'State what comparison is proposed and why it is suitable.',
  },
  {
    key: 'expressionRange',
    label: 'Expression and challenge range',
    prompt: 'Include the relevant weak, strong, negative and difficult preparations.',
  },
  {
    key: 'acceptance',
    label: 'Prospective acceptance rules',
    prompt: 'State the rules before examining results; mark any unresolved limits.',
  },
  {
    key: 'variation',
    label: 'Precision and reproducibility design',
    prompt: 'Identify relevant days, operators, lots and instruments to compare.',
  },
  {
    key: 'limitations',
    label: 'Limits and escalation',
    prompt: 'Name uncertainty, excluded use and the response to an unacceptable result.',
  },
  {
    key: 'reviewer',
    label: 'Approval and document control',
    prompt: 'Identify the responsible review role and proposed document/version ownership.',
  },
]

/** Structured drafts only: neither calculator approves staffing or validates an assay. */
export default function PlanningTools({ act }: { act: Act }) {
  const id = useId()
  const [inputs, setInputs] = useState<CapacityInputs>(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.key, PLANNING[field.parameter]]),
      ) as unknown as CapacityInputs,
  )
  const [plan, setPlan] = useState<ValidationPlan>({
    intendedUse: '',
    scope: '',
    comparator: '',
    expressionRange: '',
    acceptance: '',
    variation: '',
    limitations: '',
    reviewer: '',
  })
  const [notice, setNotice] = useState('')
  const result = calculateCapacity(inputs)
  const capacityText = `Fictional capacity and included-cost plan: ${inputs.cases} cases/day × ${inputs.blocksPerCase} blocks/case = ${result.blocks} blocks. Active work ${result.activeWork} staff min; protected QC/maintenance/training ${result.protectedWork} min; total demand ${result.demand} min. Entered role-qualified staffing ${inputs.qualifiedStaff}, shift ${inputs.shiftMinutes} min/person, unavailable ${inputs.breakMinutes} min/person and ${inputs.otherUnavailableMinutes} other staff min yield ${result.capacity} available min and ${result.balance} min balance. Included reagent/control cost ${result.reagentCost.toFixed(2)} fictional CU plus labor ${result.laborCost.toFixed(2)} CU = ${result.includedCost.toFixed(2)} CU. This excludes capital, facilities, waste, validation, instrument concurrency and other overhead. Qualification, supervision and clinical capacity require qualified review.`
  const savePlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!completeValidationPlan(plan)) return
    act(
      'practice.evidence',
      {
        checkId: 'structured-validation-plan',
        text: `Draft for qualified review; no clinical approval implied.\n${validationPlanSummary(plan)}`,
      },
      'quality',
    )
    setNotice('The structured validation draft was added to the event log for qualified review.')
  }
  return (
    <section className="planning-tools" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>Structured planning worksheets</h3>
      <p>
        Use these worksheets to make assumptions visible before writing the practical responses.
        Both produce draft records for qualified review.
      </p>
      <details>
        <summary>Capacity, protected work and included costs</summary>
        <p>
          All starting values are fictitious. CU means fictional currency units. This arithmetic
          does not determine safe staffing, authorized task scope or an approved budget.
        </p>
        <div className="planning-input-grid">
          {fields.map((field) => (
            <label key={field.key} htmlFor={`${id}-${field.key}`}>
              {field.label}
              <input
                className="input"
                id={`${id}-${field.key}`}
                type="number"
                min="0"
                step="any"
                value={Number.isFinite(inputs[field.key]) ? inputs[field.key] : ''}
                onChange={(event) =>
                  setInputs((previous) => ({
                    ...previous,
                    [field.key]: event.target.valueAsNumber,
                  }))
                }
              />
            </label>
          ))}
        </div>
        {result.valid ? (
          <>
            <dl className="planning-results">
              <div>
                <dt>Active work + protected QC, maintenance and training</dt>
                <dd>
                  {result.activeWork.toFixed(1)} + {result.protectedWork.toFixed(1)} ={' '}
                  {result.demand.toFixed(1)} staff min
                </dd>
              </div>
              <div>
                <dt>Available role-qualified staff time as entered</dt>
                <dd>{result.capacity.toFixed(1)} staff min</dd>
              </div>
              <div>
                <dt>Capacity less demand</dt>
                <dd>
                  {result.balance.toFixed(1)} staff min{' '}
                  {result.balance < 0 ? 'shortfall' : 'remaining under these assumptions'}
                </dd>
              </div>
              <div>
                <dt>Demand / available time</dt>
                <dd>
                  {result.utilization === null
                    ? 'Undefined: no available staff time'
                    : `${(result.utilization * 100).toFixed(1)}%`}
                </dd>
              </div>
              <div>
                <dt>Included reagent/control + loaded labor costs</dt>
                <dd>
                  {result.reagentCost.toFixed(2)} + {result.laborCost.toFixed(2)} ={' '}
                  {result.includedCost.toFixed(2)} fictional CU
                </dd>
              </div>
            </dl>
            <p>
              A positive balance is not a safety or coverage approval. The model omits instrument
              concurrency, case complexity, supervision load and capital/facility/waste overhead.
              The available-time assumption must be checked against actual qualifications and local
              constraints.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                act(
                  'practice.evidence',
                  { checkId: 'capacity-assumptions', text: capacityText },
                  'quality',
                )
                setNotice(
                  'The capacity assumptions and included-cost calculation were added to the event log.',
                )
              }}
            >
              Record these planning assumptions
            </button>
          </>
        ) : (
          <p role="status">
            Enter finite, nonnegative values; unavailable minutes per person must not exceed shift
            minutes.
          </p>
        )}
        <details>
          <summary>Where the starting numbers come from</summary>
          <ul>
            {PLANNING_PARAMETERS.map((parameter) => (
              <li key={parameter.id}>
                <strong>{parameter.id}:</strong> {parameter.value} {parameter.unit}.{' '}
                {parameter.note} Status: illustrative.
              </li>
            ))}
          </ul>
        </details>
      </details>
      <details>
        <summary>Validation and change-control draft</summary>
        <p>
          Define acceptance rules before looking at results. This worksheet does not supply a
          universal sample count, clinical cutoff or regulatory approval.
        </p>
        <form onSubmit={savePlan}>
          <div className="planning-validation-grid">
            {validationFields.map((field) => (
              <label key={field.key} htmlFor={`${id}-${field.key}`}>
                {field.label}
                <span>{field.prompt}</span>
                <textarea
                  className="input"
                  id={`${id}-${field.key}`}
                  rows={3}
                  maxLength={180}
                  required
                  value={plan[field.key]}
                  onChange={(event) =>
                    setPlan((previous) => ({ ...previous, [field.key]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <button type="submit" className="btn">
            Record draft for qualified review
          </button>
        </form>
      </details>
      <p className="small muted" role="status">
        {notice ||
          'Worksheet records are preserved with this run. They do not replace the published practical responses or reviewer approval.'}
      </p>
    </section>
  )
}
