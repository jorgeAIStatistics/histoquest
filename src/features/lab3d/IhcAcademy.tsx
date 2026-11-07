import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MARKERS, MARKER_BY_ID } from '../../content/lab/markers'
import { SOURCE_BY_ID } from '../../content/sources'
import { referenceTwin } from '../../sim/core/reference'
import { PROCESS as P, PROCESS_PARAMETERS } from '../../sim/params/process'
import { MOLECULAR as M, MOLECULAR_PARAMETERS } from '../../sim/params/molecular'
import { IHC_EXPERIMENT as E, IHC_EXPERIMENT_PARAMETERS } from '../../sim/params/ihcExperiments'
import {
  bestCondition,
  checkerboardConditions,
  defaultCondition,
  evaluateMultiplex,
  evaluateRun,
  evaluateValidation,
  preanalyticExperiment,
  retrievalConditions,
  RUN_LABELS,
  RUN_STEPS,
  runIhcExperiment,
  runIshExperiment,
  multiplexAppearance,
  type IhcCondition,
  type IhcExperimentResult,
  type Loading,
  type MultiplexPlan,
  type RunStep,
  type ValidationPlan,
} from '../../sim/models/ihcExperiments'
import type { SlideAppearance, Twin } from '../../sim/specimen/types'
import { createSlideField, DEFAULT_OPTICAL_VIEW } from '../../render2d/field'
import { paintTiles, TileCache, viewportAt } from '../../render2d/tiles'
import { FIELD_HEIGHT_UM, FIELD_WIDTH_UM } from '../../sim/specimen/phenotype'
import type { ControlsProps, Intent } from './fields'
import './ihcAcademy.css'
const Microscope = lazy(() => import('../../render2d/Microscope'))
const MoleculeScene = lazy(() => import('./IhcMoleculeScene'))
type Evidence = (
  checkId: string,
  passed: boolean,
  text: string,
  details?: Record<string, string | number | boolean>,
) => void
const sections = [
  ['theory', 'Molecular foundations'],
  ['manual', 'Manual run'],
  ['automated', 'Automated run'],
  ['retrieval', 'Retrieval optimization'],
  ['checkerboard', 'Checkerboard titration'],
  ['controls', 'Controls strategy'],
  ['preanalytic', 'Preanalytic sensitivity'],
  ['multiplex', 'Double & multiplex'],
  ['ish', 'ISH workflows'],
  ['investigation', 'Troubleshooting'],
  ['validation', 'Validation planning'],
  ['markers', 'Marker library'],
] as const
type Tab = (typeof sections)[number][0]
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly (string | readonly [string, string])[]
  onChange: (value: string) => void
}) {
  return (
    <label className="lab-field">
      <span>{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const [v, l] = typeof o === 'string' ? [o, o] : o
          return (
            <option key={v} value={v}>
              {l}
            </option>
          )
        })}
      </select>
    </label>
  )
}
function NumberField({
  label,
  value,
  onChange,
  parameter,
  min = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  parameter: string
  min?: number
}) {
  const p = [...IHC_EXPERIMENT_PARAMETERS, ...PROCESS_PARAMETERS, ...MOLECULAR_PARAMETERS].find(
    (p) => p.id === parameter,
  )
  return (
    <label className="lab-field">
      <span>
        {label} <small>{p?.unit}</small>
      </span>
      <input
        className="input"
        type="number"
        min={min}
        step="any"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(Math.max(min, n))
        }}
      />
      <details className="number-source">
        <summary>Setting provenance</summary>
        <p>{p?.note} All academy thresholds and timings are illustrative.</p>
        <small>{parameter}</small>
      </details>
    </label>
  )
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="lab-check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
function Feedback({ passed, issues }: { passed: boolean; issues: string[] }) {
  return (
    <div className={`feedback ${passed ? 'ok' : 'no'}`} role="status">
      <strong>{passed ? 'Exercise evidence recorded.' : 'Investigate before completing.'}</strong>
      {issues.map((issue) => (
        <p key={issue}>{issue}</p>
      ))}
    </div>
  )
}
function Preview({ result, ideal }: { result: IhcExperimentResult; ideal?: IhcExperimentResult }) {
  return (
    <>
      <Metrics result={result} />
      <Suspense fallback={<p>Loading simulated microscopy…</p>}>
        <Microscope appearance={result.appearance} ideal={ideal?.appearance} />
      </Suspense>
    </>
  )
}
function Metrics({ result }: { result: IhcExperimentResult }) {
  const m = result.metrics
  return (
    <dl className="ihc-metrics">
      <div>
        <dt>Positive-control signal</dt>
        <dd>{m.signal.toFixed(2)}</dd>
      </div>
      <div>
        <dt>Background</dt>
        <dd>{m.background.toFixed(2)}</dd>
      </div>
      <div>
        <dt>Tissue retained</dt>
        <dd>{(m.tissue * 100).toFixed(0)}%</dd>
      </div>
      <div>
        <dt>Teaching utility</dt>
        <dd>{m.utility.toFixed(2)}</dd>
      </div>
      <div>
        <dt>Exercise controls</dt>
        <dd>{m.acceptable ? 'Within rubric' : 'Needs investigation'}</dd>
      </div>
    </dl>
  )
}
function MiniSlide({ appearance }: { appearance: SlideAppearance }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const key = JSON.stringify(appearance)
  useEffect(() => {
    if (!canvas.current) return
    const abort = new AbortController()
    const cache = new TileCache()
    const field = createSlideField(JSON.parse(key))
    void paintTiles(
      canvas.current,
      field,
      DEFAULT_OPTICAL_VIEW,
      viewportAt({ x: FIELD_WIDTH_UM / 2, y: FIELD_HEIGHT_UM / 2 }, 2, 1.6),
      cache,
      abort.signal,
    )
    return () => {
      abort.abort()
      cache.clear()
    }
  }, [key])
  return (
    <canvas
      ref={canvas}
      width={160}
      height={100}
      aria-label={`Simulated ${appearance.localization} localization thumbnail`}
      role="img"
    />
  )
}
function ConditionEditor({
  c,
  set,
  details = false,
}: {
  c: IhcCondition
  set: (next: IhcCondition) => void
  details?: boolean
}) {
  const field = (key: keyof IhcCondition, label: string, parameter: string) => (
    <NumberField
      label={label}
      value={c[key] as number}
      onChange={(v) => set({ ...c, [key]: v })}
      parameter={parameter}
    />
  )
  return (
    <div className="lab-form-grid">
      <Select
        label="Retrieval method"
        value={c.method}
        options={['hier', 'pier']}
        onChange={(v) =>
          set({
            ...c,
            method: v as 'hier' | 'pier',
            device: v === 'pier' ? 'proteinase K' : 'water bath',
            temperature:
              v === 'pier' ? E['academy.pier-temperature'] : P['ihc.retrieval-temperature'],
          })
        }
      />
      <Select
        label={c.method === 'hier' ? 'Heating device (recorded)' : 'Protease variant (recorded)'}
        value={c.device}
        options={
          c.method === 'hier'
            ? ['water bath', 'pressure device', 'automated module']
            : ['proteinase K', 'trypsin', 'pepsin']
        }
        onChange={(v) => set({ ...c, device: v })}
      />
      {field('ph', 'Buffer pH', 'academy.buffer-acid')}
      {field('retrievalMinutes', 'Retrieval exposure', 'ihc.retrieval-time')}
      {field('temperature', 'Achieved tissue temperature', 'ihc.retrieval-temperature')}
      {details && (
        <>
          {field('dilution', 'Primary 1:X', 'ihc.primary-dilution')}
          {field('primaryMinutes', 'Primary incubation', 'ihc.primary-minutes')}
          {field('detectionMinutes', 'Detection incubation', 'ihc.detect-minutes')}
          {field('chromogenMinutes', 'Chromogen development', 'ihc.chromogen-minutes')}
        </>
      )}
      <p className="span-all small">
        Device and enzyme names document the experiment. The current shared core responds to method,
        achieved temperature, pH and exposure; it has no device- or enzyme-specific calibration.
      </p>
    </div>
  )
}
function Apply({ condition, twin, act }: { condition: IhcCondition; twin: Twin; act: Intent }) {
  const available =
    twin.embedding.cooled &&
    twin.embedding.pieces.length > 0 &&
    twin.instrument.locked &&
    twin.instrument.guarded &&
    twin.block.remaining > twin.instrument.thickness
  return (
    <div className="ihc-apply">
      <p>
        This consumes tissue from the main block and creates a new charged, correctly labeled slide.
        Prior slides, identity failures and preanalytic losses remain recorded.
      </p>
      <button
        className="btn btn-primary"
        disabled={!available}
        onClick={() => act('ihc.experiment.apply', { ...condition }, 'ihc')}
      >
        Prepare an adjacent section and apply condition
      </button>
      {!available && (
        <p className="small">
          Prepare and cool the main block, retain enough tissue, and lock and guard the microtome
          before starting this controlled sequence.
        </p>
      )}
    </div>
  )
}
const theoryStages = [
  [
    'Masked epitope',
    'Formalin fixation can create cross-links, including methylene bridges, and alter access to an epitope, the part of an antigen recognized by the antibody. Masking and irreversible target loss are different.',
  ],
  [
    'Retrieval',
    'HIER changes accessibility through controlled heat and chemistry; PIER uses proteolysis. More exposure can damage morphology or detach tissue. Retrieval does not restore every lost target.',
  ],
  [
    'Primary binding',
    'The antibody binds accessible target. Monoclonal reagents recognize a selected epitope; polyclonal preparations contain multiple antibody populations. A linear epitope depends mainly on amino-acid sequence; a conformational epitope depends on spatial folding. They can respond differently to preparation.',
  ],
  [
    'Detection',
    'An enzyme-associated detection system connects bound primary to a visible reporter. Direct labeling, indirect secondary detection, polymer systems, biotin-based systems and tyramide amplification are different designs.',
  ],
  [
    'Visible product',
    'An enzyme develops a chromogen near the binding site. HRP/DAB, HRP/AEC and AP/Fast Red systems have different chemistry and finishing requirements. Darker product is not a direct count of antigen molecules.',
  ],
] as const
function Theory({ evidence }: { evidence: Evidence }) {
  const [stage, setStage] = useState(0),
    [visited, setVisited] = useState<number[]>([0]),
    [answers, setAnswers] = useState({ retrieval: '', biotin: '', mount: '' }),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const move = (i: number) => {
    setStage(i)
    setVisited((v) => [...new Set([...v, i])])
    evidence('ihc-theory-stage', false, `Viewed ${theoryStages[i][0]}`, { stage: i })
  }
  return (
    <>
      <div className="ihc-stage-nav">
        {theoryStages.map(([title], i) => (
          <button
            className="chip-btn"
            aria-pressed={stage === i}
            onClick={() => move(i)}
            key={title}
          >
            {i + 1}. {title}
          </button>
        ))}
      </div>
      <Suspense fallback={<p>Loading molecular scene…</p>}>
        <MoleculeScene stage={stage} />
      </Suspense>
      <h3>{theoryStages[stage][0]}</h3>
      <p>{theoryStages[stage][1]}</p>
      <details>
        <summary>Antibody and blocking vocabulary</summary>
        <p>
          Clone identifies a particular antibody lineage; host species and isotype determine
          detection compatibility. Affinity describes one binding interaction; avidity includes
          multiple interactions. Dilution alone does not specify the starting antibody
          concentration. Storage, diluent and stability require the product-specific method.
        </p>
        <p>
          Endogenous peroxidase or alkaline phosphatase can develop reporter without specific
          primary binding. Protein/serum blocking and Fc interactions concern nonspecific antibody
          binding. ABC/LSAB systems also need attention to endogenous biotin; a biotin-free polymer
          avoids that particular detection mechanism. Blocking is selected for the system, not a
          universal interchangeable reagent.
        </p>
      </details>
      <div className="lab-form-grid">
        <Select
          label="Can retrieval repair an irreversibly lost target?"
          value={answers.retrieval}
          options={[
            '',
            ['no', 'No; access and preservation are different'],
            ['yes', 'Yes, if the image becomes darker'],
          ]}
          onChange={(v) => setAnswers({ ...answers, retrieval: v })}
        />
        <Select
          label="What does a biotin-free polymer avoid?"
          value={answers.biotin}
          options={[
            '',
            ['biotin', 'Avidin/biotin-mediated endogenous signal'],
            ['all', 'All possible background mechanisms'],
          ]}
          onChange={(v) => setAnswers({ ...answers, biotin: v })}
        />
        <Select
          label="AEC finishing decision"
          value={answers.mount}
          options={[
            '',
            ['aqueous', 'Use the compatible aqueous method'],
            ['routine', 'Assume routine alcohol/resin finishing is interchangeable'],
          ]}
          onChange={(v) => setAnswers({ ...answers, mount: v })}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          const issues = [
            ...(visited.length < theoryStages.length ? ['Explore every molecular stage.'] : []),
            ...(answers.retrieval !== 'no' ? ['Distinguish epitope access from target loss.'] : []),
            ...(answers.biotin !== 'biotin'
              ? ['Identify the specific biotin-related interference.']
              : []),
            ...(answers.mount !== 'aqueous'
              ? ['Match the chromogen to its finishing chemistry.']
              : []),
          ]
          const passed = !issues.length
          setFeedback({ passed, issues })
          evidence(
            'ihc-theory',
            passed,
            'Molecular stages and three mechanism decisions reviewed.',
            answers,
          )
        }}
      >
        Check molecular reasoning
      </button>
      {feedback && <Feedback {...feedback} />}
      <Sources ids={['leica-ihc', 'thermo-biotin', 'merck-crystal-mount']} />
    </>
  )
}
function Sources({ ids }: { ids: string[] }) {
  return (
    <details className="ihc-sources">
      <summary>Sources and review status</summary>
      <p>
        Author-checked teaching summary. Verify with a qualified histotechnology reviewer; no
        clinical validation or workplace competency is conferred.
      </p>
      {ids.map((id) => {
        const s = SOURCE_BY_ID[id]
        return s?.url ? (
          <p key={id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
            </a>{' '}
            · {s.access}
          </p>
        ) : (
          <p key={id}>{s?.title ?? id}</p>
        )
      })}
    </details>
  )
}
function RunExercise({
  base,
  c,
  set,
  evidence,
  automated,
}: {
  base: Twin
  c: IhcCondition
  set: (c: IhcCondition) => void
  evidence: Evidence
  automated: boolean
}) {
  const [program, setProgram] = useState<RunStep[]>(
      automated
        ? [...RUN_STEPS.slice(0, 3), 'primary', 'block', 'retrieve', ...RUN_STEPS.slice(6)]
        : [],
    ),
    [step, setStep] = useState<RunStep>('select-block'),
    [confirmed, setConfirmed] = useState(false),
    [loading, setLoading] = useState<Loading>({
      registered: false,
      expired: false,
      loaded: E['academy.loaded-volume'],
      dead: E['academy.dead-volume'],
      slides: E['academy.slide-count'],
      dispense: E['academy.dispense'],
    }),
    [result, setResult] = useState<IhcExperimentResult | null>(null),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const fixedCondition = useRef<IhcCondition | null>(null)
  const patch = (key: keyof Loading, value: number | boolean) =>
    setLoading({ ...loading, [key]: value })
  const run = (steps: RunStep[]) => {
    if (!automated && !fixedCondition.current) fixedCondition.current = { ...c }
    const frozen = automated ? c : fixedCondition.current!
    const effective = {
      ...frozen,
      humid: frozen.humid && loading.dispense >= E['academy.dispense'],
      compatible:
        frozen.compatible &&
        (!automated ||
          (loading.registered &&
            !loading.expired &&
            loading.loaded - loading.dead >= loading.slides * loading.dispense)),
    }
    const r = runIhcExperiment(base, effective, steps)
    setResult(r)
    return r
  }
  const finish = () => {
    const r = run(program)
    const check = evaluateRun(r, program, loading, automated, confirmed)
    setFeedback(check)
    evidence(
      automated ? 'ihc-automated' : 'ihc-manual',
      check.passed,
      'Observed program, coverage, controls and loading reviewed.',
      {
        program: program.join(' > '),
        registered: loading.registered,
        expired: loading.expired,
        usableVolume: loading.loaded - loading.dead,
        requiredVolume: loading.slides * loading.dispense,
        blockConfirmed: confirmed,
        signal: r.metrics.signal,
        background: r.metrics.background,
      },
    )
  }
  return (
    <>
      <p>
        {automated
          ? 'Edit the deliberately disordered program, register the reagents and check usable volume before executing.'
          : 'Select each action in sequence. Every action updates an adjacent-section preview using the shared chemistry model.'}{' '}
        The exercise requires the published sequence, adequate coverage, humid conditions and all
        three designated control types.
      </p>
      <details>
        <summary>Published exercise sequence</summary>
        <ol>
          {RUN_STEPS.map((s) => (
            <li key={s}>{RUN_LABELS[s]}</li>
          ))}
        </ol>
      </details>
      <Toggle
        label="Block identity, requested marker and tissue selection reconciled"
        value={confirmed}
        onChange={setConfirmed}
      />
      <fieldset className="ihc-settings" disabled={!automated && program.length > 0}>
        <legend>Define this run before starting</legend>
        <ConditionEditor c={c} set={set} details />
        <div className="lab-form-grid">
          <NumberField
            label="Dispense per slide"
            value={loading.dispense}
            onChange={(v) => patch('dispense', v)}
            parameter="academy.dispense"
          />
          <Toggle
            label="Maintain humid coverage throughout staining"
            value={c.humid}
            onChange={(v) => set({ ...c, humid: v })}
          />
          <Toggle
            label="Perform selected blocking strategy"
            value={c.blocked}
            onChange={(v) => set({ ...c, blocked: v })}
          />
          <Toggle
            label="Perform post-primary washes"
            value={c.washed}
            onChange={(v) => set({ ...c, washed: v })}
          />
          {automated && (
            <>
              <NumberField
                label="Loaded reagent"
                value={loading.loaded}
                onChange={(v) => patch('loaded', v)}
                parameter="academy.loaded-volume"
              />
              <NumberField
                label="Container dead volume"
                value={loading.dead}
                onChange={(v) => patch('dead', v)}
                parameter="academy.dead-volume"
              />
              <NumberField
                label="Programmed slides"
                value={loading.slides}
                onChange={(v) => patch('slides', Math.round(v))}
                parameter="academy.slide-count"
                min={1}
              />
              <Toggle
                label="Reagent identity and lot registered against the program"
                value={loading.registered}
                onChange={(v) => patch('registered', v)}
              />
              <Toggle
                label="Reagent is expired (inject failure)"
                value={loading.expired}
                onChange={(v) => patch('expired', v)}
              />
              <p>
                Usable: {(loading.loaded - loading.dead).toFixed(0)} µL. Required:{' '}
                {(loading.slides * loading.dispense).toFixed(0)} µL.
              </p>
            </>
          )}
        </div>
      </fieldset>
      {automated ? (
        <ol className="ihc-program">
          {program.map((s, i) => (
            <li key={i}>
              <Select
                label={`Step ${i + 1}`}
                value={s}
                options={RUN_STEPS.map((s) => [s, RUN_LABELS[s]])}
                onChange={(v) =>
                  setProgram(program.map((old, j) => (j === i ? (v as RunStep) : old)))
                }
              />
            </li>
          ))}
        </ol>
      ) : (
        <>
          <div className="row">
            <Select
              label="Next manual action"
              value={step}
              options={RUN_STEPS.map((s) => [s, RUN_LABELS[s]])}
              onChange={(v) => setStep(v as RunStep)}
            />
            <button
              className="btn"
              onClick={() => {
                if (!confirmed && step === 'select-block') {
                  setFeedback({
                    passed: false,
                    issues: [
                      'Reconcile the block and requested target before preparing the section.',
                    ],
                  })
                  return
                }
                const next = [...program, step]
                setProgram(next)
                run(next)
                evidence('ihc-manual-action', false, RUN_LABELS[step], {
                  step,
                  sequence: next.length,
                  dispense: loading.dispense,
                  humid: c.humid,
                })
              }}
            >
              Perform action
            </button>
            <button
              className="btn btn-quiet"
              onClick={() => {
                fixedCondition.current = null
                setProgram([])
                setResult(null)
                setFeedback(null)
              }}
            >
              Start a fresh practice run
            </button>
          </div>
          <p>Recorded: {program.map((s) => RUN_LABELS[s]).join(' → ') || 'No actions yet.'}</p>
        </>
      )}
      <button className="btn btn-primary" onClick={finish}>
        {automated ? 'Execute and evaluate automated run' : 'Evaluate completed manual run'}
      </button>
      {feedback && <Feedback {...feedback} />} {result && <Preview result={result} />}
    </>
  )
}
function GridExercise({
  base,
  c,
  set,
  twin,
  act,
  evidence,
  checkerboard,
}: {
  base: Twin
  c: IhcCondition
  set: (c: IhcCondition) => void
  twin: Twin
  act: Intent
  evidence: Evidence
  checkerboard: boolean
}) {
  const [results, setResults] = useState<IhcExperimentResult[]>([]),
    [selected, setSelected] = useState(0),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const best = bestCondition(results)
  return (
    <>
      <p>
        {checkerboard
          ? 'Hold retrieval fixed, then compare primary dilution against detection incubation. Change the retrieval condition and repeat the grid to explore the third dimension.'
          : 'Compare two buffer environments across three exposures. Switch HIER/PIER and repeat under the same selected device or enzyme metadata.'}{' '}
        Choose acceptable low-control sensitivity, background and retained tissue before considering
        intensity.
      </p>
      <ConditionEditor
        c={c}
        set={(next) => {
          set(next)
          setResults([])
          setFeedback(null)
        }}
      />
      <button
        className="btn btn-primary"
        onClick={() => {
          const conditions = checkerboard ? checkerboardConditions(c) : retrievalConditions(c)
          setResults(conditions.map((value) => runIhcExperiment(base, value)))
          setSelected(0)
          setFeedback(null)
          evidence(
            'ihc-grid-run',
            false,
            checkerboard ? 'Checkerboard experiment generated.' : 'Retrieval experiment generated.',
            {
              grid: checkerboard ? 'checkerboard' : 'retrieval',
              method: c.method,
              device: c.device,
              ph: c.ph,
              retrievalMinutes: c.retrievalMinutes,
            },
          )
        }}
      >
        Run comparison grid
      </button>
      {results.length > 0 && (
        <>
          <div className="ihc-grid">
            {results.map((r, i) => (
              <button
                className={`ihc-grid-cell ${selected === i ? 'selected' : ''}`}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
                key={i}
              >
                <MiniSlide appearance={r.appearance} />
                <strong>
                  {checkerboard
                    ? `1:${r.condition.dilution} · detect ${r.condition.detectionMinutes} min`
                    : `pH ${r.condition.ph} · ${r.condition.retrievalMinutes} min`}
                </strong>
                <span>
                  Signal {r.metrics.signal.toFixed(2)} · BG {r.metrics.background.toFixed(2)}
                </span>
                <span>
                  Tissue {(r.metrics.tissue * 100).toFixed(0)}% · utility{' '}
                  {r.metrics.utility.toFixed(2)}
                </span>
                <small>
                  Simulated ·{' '}
                  {r.metrics.acceptable ? 'within exercise rubric' : 'control/tissue concern'}
                </small>
              </button>
            ))}
          </div>
          <button
            className="btn"
            onClick={() => {
              const passed = best >= 0 && selected === best
              const issues = passed
                ? []
                : [
                    best < 0
                      ? 'No condition meets this exercise rubric; investigate specimen preservation and the experimental range.'
                      : 'Compare acceptable controls and retained tissue first, then choose the highest displayed teaching utility.',
                  ]
              setFeedback({ passed, issues })
              evidence(
                checkerboard ? 'ihc-checkerboard' : 'ihc-retrieval',
                passed,
                'Selected a measured grid condition.',
                {
                  selected,
                  best,
                  signal: results[selected].metrics.signal,
                  background: results[selected].metrics.background,
                  tissue: results[selected].metrics.tissue,
                },
              )
            }}
          >
            Defend selected condition
          </button>
          {feedback && <Feedback {...feedback} />}
          <Preview result={results[selected]} ideal={best >= 0 ? results[best] : undefined} />
          <Apply condition={results[selected].condition} twin={twin} act={act} />
        </>
      )}
      <details>
        <summary>What the utility means</summary>
        <p>
          Utility = positive-control signal ÷ (background + {E['academy.noise-floor']}) × retained
          tissue. This illustrative ranking is not a measured signal-to-noise ratio or a clinical
          acceptance rule. The same core controls also require the exercise-specific low-positive
          threshold.
        </p>
      </details>
    </>
  )
}
const controlRoles = [
  [
    'low',
    'Low-expression external tissue',
    'sensitivity',
    'Challenges sensitivity beyond a strong positive.',
  ],
  [
    'internal',
    'Represented internal positive element',
    'preanalytic',
    'Shares the specimen preparation history, when the element is present and reactive.',
  ],
  [
    'negative',
    'Negative reagent comparison',
    'background',
    'Investigates detection/background contribution; does not by itself prove primary specificity.',
  ],
  [
    'onslide',
    'Clearly marked on-slide control',
    'delivery',
    'Shares slide-level delivery; must remain distinguishable from the specimen.',
  ],
  [
    'tma',
    'Characterized tissue microarray',
    'range',
    'Samples an expression range economically, with limits of core representation.',
  ],
] as const
function ControlsExercise({
  base,
  c,
  evidence,
}: {
  base: Twin
  c: IhcCondition
  evidence: Evidence
}) {
  const [included, setIncluded] = useState({
      positive: false,
      lowPositive: false,
      negative: false,
    }),
    [roles, setRoles] = useState<Record<string, string>>({}),
    [result, setResult] = useState<IhcExperimentResult | null>(null),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  return (
    <>
      <p>
        This synthetic assay requires a strong positive, low-expression positive and negative
        reagent comparison. That is this exercise policy, not a claim that every clinical polymer
        assay needs a separate negative reagent slide. Internal control utility depends on the
        element actually being present, preserved and reactive.
      </p>
      <div className="lab-form-grid">
        {(Object.keys(included) as (keyof typeof included)[]).map((key) => (
          <Toggle
            key={key}
            label={
              key === 'positive'
                ? 'Include strong positive'
                : key === 'lowPositive'
                  ? 'Include low-expression positive'
                  : 'Include negative reagent comparison'
            }
            value={included[key]}
            onChange={(value) => setIncluded({ ...included, [key]: value })}
          />
        ))}
      </div>
      <div className="ihc-role-grid">
        {controlRoles.map(([id, label]) => (
          <Select
            key={id}
            label={label}
            value={roles[id] ?? ''}
            options={[
              '',
              ['sensitivity', 'Challenge weak target sensitivity'],
              ['preanalytic', 'Share specimen preparation history'],
              ['background', 'Investigate reagent/detection background'],
              ['delivery', 'Share slide-level reagent delivery'],
              ['range', 'Sample several expression patterns'],
            ]}
            onChange={(value) => setRoles({ ...roles, [id]: value })}
          />
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          const r = runIhcExperiment(base, { ...c, ...included })
          setResult(r)
          const issues = controlRoles
            .filter(([id, , answer]) => roles[id] !== answer)
            .map(([, label, , explanation]) => `${label}: ${explanation}`)
          if (!r.metrics.acceptable)
            issues.push(
              'The chosen control set and observed model response do not meet this exercise rubric.',
            )
          const passed = !issues.length
          setFeedback({ passed, issues })
          evidence(
            'ihc-controls',
            passed,
            'Control selection and control-purpose mapping checked.',
            {
              ...included,
              roles: JSON.stringify(roles),
              lowSignal: r.twin.ihc.lowPositive ?? -1,
              negative: r.twin.ihc.negative ?? -1,
            },
          )
        }}
      >
        Run and assess control strategy
      </button>
      {feedback && <Feedback {...feedback} />}{' '}
      {result && (
        <>
          <div className="ihc-grid">
            {(['positive', 'lowPositive', 'negative'] as const).map((kind) => {
              const value = result.twin.ihc[kind]
              const appearance = {
                ...result.appearance,
                targetPresent: kind !== 'negative',
                dab: kind === 'negative' ? 0 : (value ?? 0),
                background: kind === 'negative' ? (value ?? 0) : result.metrics.background,
              }
              return (
                <div className="ihc-grid-cell" key={kind}>
                  <strong>
                    {kind === 'positive'
                      ? 'Strong positive'
                      : kind === 'lowPositive'
                        ? 'Low-expression positive'
                        : 'Negative reagent'}
                  </strong>
                  {value === null ? <p>Not included</p> : <MiniSlide appearance={appearance} />}
                  <small>Simulated control · shared teaching archetype</small>
                </div>
              )
            })}
          </div>
          <dl className="control-results">
            <dt>Strong positive</dt>
            <dd>{result.twin.ihc.positive?.toFixed(2) ?? 'not included'}</dd>
            <dt>Low positive</dt>
            <dd>{result.twin.ihc.lowPositive?.toFixed(2) ?? 'not included'}</dd>
            <dt>Negative reagent</dt>
            <dd>{result.twin.ihc.negative?.toFixed(2) ?? 'not included'}</dd>
          </dl>
          <Preview result={result} />
        </>
      )}
      <Sources ids={['nordiqc-1', 'leica-ihc', 'cap-ihc-summary-2024']} />
    </>
  )
}
function Preanalytics({ base, c, evidence }: { base: Twin; c: IhcCondition; evidence: Evidence }) {
  const baseline = {
    ischemia: 0,
    fixationHours: E['academy.fixation-middle'],
    decal: 'none' as const,
    sectionAge: 0,
  }
  const [p, setP] = useState<{
      ischemia: number
      fixationHours: number
      decal: 'none' | 'edta' | 'strong-acid'
      sectionAge: number
    }>(baseline),
    [results, setResults] = useState<IhcExperimentResult[]>([]),
    [interpretation, setInterpretation] = useState(''),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const updateP = (next: typeof p) => {
    setP(next)
    setResults([])
    setFeedback(null)
  }
  return (
    <>
      <p>
        Compare matched virtual preparations with the same marker and staining condition. The
        changed history is a counterfactual branch, never a repair to the main specimen. The core
        separates access/masking from irreversible preservation loss. It does not implement
        marker-specific ER, PR or HER2 guideline limits.
      </p>
      <div className="lab-form-grid">
        <NumberField
          label="Delay before fixation"
          value={p.ischemia}
          onChange={(ischemia) => updateP({ ...p, ischemia })}
          parameter="academy.ischemia-delayed"
        />
        <NumberField
          label="Fixation exposure"
          value={p.fixationHours}
          onChange={(fixationHours) => updateP({ ...p, fixationHours })}
          parameter="academy.fixation-middle"
        />
        <Select
          label="Decalcification comparison"
          value={p.decal}
          options={['none', 'edta', 'strong-acid']}
          onChange={(decal) => updateP({ ...p, decal: decal as typeof p.decal })}
        />
        <NumberField
          label="Section age"
          value={p.sectionAge}
          onChange={(sectionAge) => updateP({ ...p, sectionAge })}
          parameter="academy.section-old"
        />
      </div>
      <div className="row">
        <button
          className="btn"
          onClick={() => updateP({ ...baseline, ischemia: E['academy.ischemia-delayed'] })}
        >
          Load delay comparison
        </button>
        <button
          className="btn"
          onClick={() => updateP({ ...baseline, fixationHours: E['academy.fixation-long'] })}
        >
          Load prolonged fixation
        </button>
        <button className="btn" onClick={() => updateP({ ...baseline, decal: 'strong-acid' })}>
          Load acid exposure
        </button>
        <button
          className="btn"
          onClick={() => updateP({ ...baseline, sectionAge: E['academy.section-old'] })}
        >
          Load aged section
        </button>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          setResults([preanalyticExperiment(base, c, baseline), preanalyticExperiment(base, c, p)])
          setFeedback(null)
          evidence('ihc-preanalytic-run', false, 'Matched preanalytic comparison executed.', {
            ...p,
          })
        }}
      >
        Run matched comparison
      </button>
      {results.length > 0 && (
        <>
          <div className="ihc-comparison">
            <div>
              <h4>Reference history</h4>
              <MiniSlide appearance={results[0].appearance} />
              <Metrics result={results[0]} />
            </div>
            <div>
              <h4>Changed history</h4>
              <MiniSlide appearance={results[1].appearance} />
              <Metrics result={results[1]} />
            </div>
          </div>
          <Select
            label="What does this comparison establish?"
            value={interpretation}
            options={[
              '',
              [
                'bounded',
                'A teaching prediction; retrieval cannot guarantee repair of target loss',
              ],
              ['eligibility', 'The specimen meets all predictive-marker clinical requirements'],
              ['repair', 'Any loss can be repaired by increasing chromogen time'],
            ]}
            onChange={setInterpretation}
          />
          <button
            className="btn"
            onClick={() => {
              const changed = JSON.stringify(p) !== JSON.stringify(baseline)
              const passed = changed && interpretation === 'bounded'
              const issues = passed
                ? []
                : [
                    'Run a changed history and distinguish this illustrative prediction from clinical assay requirements.',
                  ]
              setFeedback({ passed, issues })
              evidence('ihc-preanalytic', passed, 'Interpreted a matched preparation experiment.', {
                ...p,
                interpretation,
                referenceSignal: results[0].metrics.signal,
                changedSignal: results[1].metrics.signal,
              })
            }}
          >
            Record interpretation
          </button>
          {feedback && <Feedback {...feedback} />}
          <Preview result={results[1]} ideal={results[0]} />
        </>
      )}
      <Sources ids={['leica-fixation', 'leica-decalcification', 'cap-ihc-summary-2024']} />
    </>
  )
}
function Multiplex({ base, c, evidence }: { base: Twin; c: IhcCondition; evidence: Evidence }) {
  const [plan, setPlan] = useState<MultiplexPlan>({
      mode: 'simultaneous',
      hostA: 'mouse',
      hostB: 'mouse',
      separatedDetection: false,
      cycleControl: false,
      strippingValidated: false,
      singleStains: false,
      channelsDistinct: false,
    }),
    [targetB, setTargetB] = useState('cd3'),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null),
    [result, setResult] = useState<IhcExperimentResult | null>(null)
  const patch = (key: keyof MultiplexPlan, value: string | boolean) => {
    setPlan({ ...plan, [key]: value })
    setFeedback(null)
    setResult(null)
  }
  return (
    <>
      <p>
        Design two channels and establish their independence. Host species here are deliberately
        assigned fictional reagent attributes, not claims about commercial clones. After the control
        design passes, combine the two shared-core predictions as DAB/Fast Red absorption or
        additive fluorescence. This is a compartment-overlap illustration, not validated
        colocalization or spectral unmixing.
      </p>
      <div className="lab-form-grid">
        <Select
          label="Strategy"
          value={plan.mode}
          options={['simultaneous', 'sequential', 'fluorescence']}
          onChange={(v) => patch('mode', v)}
        />
        <Select
          label="Primary A host"
          value={plan.hostA}
          options={['mouse', 'rabbit', 'goat']}
          onChange={(v) => patch('hostA', v)}
        />
        <Select
          label="Primary B host"
          value={plan.hostB}
          options={['mouse', 'rabbit', 'goat']}
          onChange={(v) => patch('hostB', v)}
        />
        <Select
          label="Target B"
          value={targetB}
          options={MARKERS.filter((m) => m.modality === 'IHC').map((m) => [m.id, m.label])}
          onChange={(v) => {
            setTargetB(v)
            setFeedback(null)
            setResult(null)
          }}
        />
        <Toggle
          label="Independent target-specific detection established"
          value={plan.separatedDetection}
          onChange={(v) => patch('separatedDetection', v)}
        />
        <Toggle
          label="Cycle inactivation / removal validated"
          value={plan.strippingValidated}
          onChange={(v) => patch('strippingValidated', v)}
        />
        <Toggle
          label="Cycle carryover challenge included"
          value={plan.cycleControl}
          onChange={(v) => patch('cycleControl', v)}
        />
        <Toggle
          label="Single-target controls included"
          value={plan.singleStains}
          onChange={(v) => patch('singleStains', v)}
        />
        <Toggle
          label="Distinct chromogens or validated fluorescence channel separation"
          value={plan.channelsDistinct}
          onChange={(v) => patch('channelsDistinct', v)}
        />
      </div>
      <p className="small">
        Sequential heating can alter later epitopes and earlier deposits. Multiplex IF additionally
        needs spectral overlap, autofluorescence and acquisition controls. A successful design
        checklist is not experimental validation.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => {
          const check = evaluateMultiplex(plan)
          setFeedback(check)
          setResult(runIhcExperiment(base, { ...c, marker: targetB }))
          evidence('ihc-multiplex', check.passed, 'Reviewed structured two-channel design.', {
            ...plan,
            targetA: c.marker,
            targetB,
          })
        }}
      >
        Challenge the channel design
      </button>
      {feedback && <Feedback {...feedback} />}{' '}
      {result && feedback?.passed && (
        <Suspense fallback={<p>Loading combined microscopy…</p>}>
          <Microscope
            appearance={multiplexAppearance(
              runIhcExperiment(base, c),
              result,
              plan.mode === 'fluorescence',
            )}
          />
        </Suspense>
      )}
      {result && <Preview result={result} ideal={runIhcExperiment(base, c)} />}
      <p className="small">
        The separate target fields are predicted with the same chemistry core. Fast Red uses an
        authored color vector and shared development response; enzyme-specific kinetics are not
        calibrated. The combined field becomes available only after the stated channel-control
        design passes.
      </p>
      <Sources ids={['leica-ihc', 'thermo-biotin']} />
    </>
  )
}
function IshExercise({ base, evidence }: { base: Twin; evidence: Evidence }) {
  const [probe, setProbe] = useState('EBER'),
    [modality, setModality] = useState<'CISH' | 'FISH'>('CISH'),
    [stringency, setStringency] = useState(M['ish.stringency']),
    [controls, setControls] = useState({ positive: false, negative: false, integrity: false }),
    [steps, setSteps] = useState<string[]>([]),
    [next, setNext] = useState('prepare'),
    [result, setResult] = useState<ReturnType<typeof runIshExperiment> | null>(null),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const required = [
    'prepare',
    'pretreat',
    ...(/DNA/i.test(probe) ? ['denature'] : []),
    'hybridize',
    'stringency',
    'detect',
    'controls',
  ]
  return (
    <>
      <p>
        Sequence the workflow and include target-positive, background and specimen-integrity
        evidence. EBER is a nuclear RNA target; light-chain RNA signals are cytoplasmic. FISH uses
        additive green probe emission with a blue nuclear counterstain. These authored puncta are
        not copy counts, gene amplification, rearrangements, or a clinical assay score.
      </p>
      <div className="lab-form-grid">
        <Select
          label="Target"
          value={probe}
          options={['EBER', 'kappa', 'lambda', 'generic DNA']}
          onChange={(v) => {
            setProbe(v)
            setSteps([])
            setResult(null)
            setFeedback(null)
          }}
        />
        <Select
          label="Detection readout"
          value={modality}
          options={['CISH', 'FISH']}
          onChange={(v) => {
            setModality(v as 'CISH' | 'FISH')
            setResult(null)
            setFeedback(null)
          }}
        />
        <NumberField
          label="Wash stringency"
          value={stringency}
          onChange={setStringency}
          parameter="ish.stringency"
        />
        {(Object.keys(controls) as (keyof typeof controls)[]).map((key) => (
          <Toggle
            key={key}
            label={
              key === 'positive'
                ? 'Known target-positive control'
                : key === 'negative'
                  ? 'Negative probe / background control'
                  : /DNA/i.test(probe)
                    ? 'Specimen DNA hybridizability control'
                    : 'Specimen RNA integrity control'
            }
            value={controls[key]}
            onChange={(v) => {
              setControls({ ...controls, [key]: v })
              setResult(null)
              setFeedback(null)
            }}
          />
        ))}
      </div>
      <div className="row">
        <Select label="Next workflow action" value={next} options={required} onChange={setNext} />
        <button
          className="btn"
          onClick={() => {
            setSteps([...steps, next])
            evidence('ihc-ish-action', false, 'ISH workflow action selected.', {
              step: next,
              modality,
            })
          }}
        >
          Perform action
        </button>
        <button
          className="btn btn-quiet"
          onClick={() => {
            setSteps([])
            setFeedback(null)
          }}
        >
          Reset sequence
        </button>
      </div>
      <p>
        Observed sequence: {steps.join(' → ') || 'none'}. Exercise order: preparation → pretreatment
        → denaturation for DNA targets → hybridization → stringency → detection/counterstain →
        controls.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => {
          const r = runIshExperiment(
            base,
            probe,
            stringency,
            controls.integrity,
            controls.negative,
            controls.positive,
            modality,
            steps.includes('denature') && steps.indexOf('denature') < steps.indexOf('hybridize'),
          )
          setResult(r)
          const issues = [
            ...r.issues,
            ...(steps.join('|') !== required.join('|')
              ? ['Workflow order is incomplete or incorrect.']
              : []),
          ]
          const passed = !issues.length
          setFeedback({ passed, issues })
          evidence('ihc-ish', passed, 'ISH sequence and control results reviewed.', {
            probe,
            modality,
            stringency,
            ...controls,
            sequence: steps.join(' > '),
            integritySignal: r.integritySignal ?? -1,
          })
        }}
      >
        Evaluate ISH workflow
      </button>
      {feedback && <Feedback {...feedback} />}{' '}
      {result && (
        <>
          <p>
            Integrity-control signal: {result.integritySignal?.toFixed(2) ?? 'not run'}.{' '}
            {modality === 'FISH'
              ? 'Simulated fluorescence: inspect composite, probe-only and nuclear-only channels. No copy-number scoring.'
              : ''}
          </p>
          <Suspense fallback={<p>Loading microscopy…</p>}>
            <Microscope appearance={result.appearance} />
          </Suspense>
        </>
      )}
      <Sources
        ids={[
          'biotechne-rna-controls',
          'agilent-eber',
          'agilent-light-chain-ish',
          'ogt-fish-workflow',
        ]}
      />
    </>
  )
}
const investigations = [
  {
    id: 'no-signal',
    label: 'No staining',
    finding:
      'Positive and low-positive controls lack target product; primary/detection compatibility is undocumented.',
    test: 'compatibility',
    change: 'compatible',
    patch: { compatible: false },
    detail:
      'Audit primary-host and detection compatibility; a fresh chromogen alone does not repair incompatible recognition.',
  },
  {
    id: 'weak',
    label: 'Weak staining',
    finding:
      'Low positive is faint with an overly dilute primary; strong material remains easier to see.',
    test: 'titration',
    change: 'dilution',
    patch: { dilution: E['academy.dilution-weak'] },
    detail: 'Compare a primary titration with retrieval and detection held constant.',
  },
  {
    id: 'uneven',
    label: 'Uneven staining / wax',
    finding: 'Patchy access follows an omitted dewax step in the run log.',
    test: 'preparation',
    change: 'dewax',
    patch: {},
    detail:
      'Inspect access/preparation records and repeat from a new section with complete dewaxing.',
  },
  {
    id: 'background',
    label: 'High background',
    finding: 'The negative reagent comparison has broad signal after blocking was omitted.',
    test: 'background',
    change: 'blocked',
    patch: { blocked: false },
    detail:
      'Use the control pattern and blocking history to distinguish target signal from background.',
  },
  {
    id: 'edge',
    label: 'Edge artifact',
    finding: 'Edges are darker; humid coverage was lost during primary incubation.',
    test: 'coverage',
    change: 'humid',
    patch: { humid: false },
    detail: 'Check coverage/humidity records and repeat with maintained coverage.',
  },
  {
    id: 'necrosis',
    label: 'Necrosis or crush',
    finding:
      'A supplied case observation reports staining in necrotic/crushed regions. This renderer does not model necrosis or crush-specific binding.',
    test: 'morphology',
    change: 'representative',
    patch: { blocked: false },
    detail:
      'Review morphology and viable representative tissue. The displayed background is a generic core illustration, not a necrosis model.',
  },
  {
    id: 'pigment',
    label: 'Pigment mimicking DAB',
    finding:
      'Brown deposits are reported before chromogen development. The field is a generic background illustration.',
    test: 'unstained',
    change: 'comparison',
    patch: { blocked: false },
    detail:
      'Inspect an unstained companion; choose a suitable red chromogen, melanin bleach comparison or Perls comparison according to the suspected pigment and approved method.',
  },
  {
    id: 'biotin',
    label: 'Endogenous biotin',
    finding:
      'A biotin-based detection method has unexplained background; retrieval may expose endogenous biotin.',
    test: 'detection-control',
    change: 'biotin-free',
    patch: { blocked: false },
    detail:
      'Investigate the detection chemistry; compare an established biotin-free approach. The core shows generic background, not biotin-specific kinetics.',
  },
  {
    id: 'cross-reactivity',
    label: 'Cross-reactivity',
    finding:
      'Signal is present in an unexpected cell population or compartment; stronger stain does not resolve specificity.',
    test: 'specificity',
    change: 'orthogonal',
    patch: { blocked: false },
    detail:
      'Compare expected positive/negative populations and an independently characterized reagent or method under qualified review.',
  },
  {
    id: 'detach',
    label: 'Section detachment',
    finding: 'Long retrieval produces poor tissue retention despite strong development.',
    test: 'adhesion',
    change: 'retrievalMinutes',
    patch: { retrievalMinutes: E['academy.retrieval-long'] },
    detail:
      'Review charged-slide preparation, drying and retrieval exposure; change one supported variable and inspect retained tissue.',
  },
  {
    id: 'dryspot',
    label: 'Bubble / dry spot',
    finding:
      'A trapped bubble or interrupted coverage is reported. The core models drying-related edge/background, not a calibrated bubble-volume field.',
    test: 'coverage',
    change: 'humid',
    patch: { humid: false },
    detail:
      'Inspect delivery and coverage, then repeat with the obstruction removed and humidity controlled.',
  },
] as const
const testChoices = [
  ['', 'Choose an investigation'],
  ['compatibility', 'Trace host/detection compatibility'],
  ['titration', 'Controlled primary titration'],
  ['preparation', 'Inspect dewax/access history'],
  ['background', 'Compare negative reagent and blocking history'],
  ['coverage', 'Inspect reagent coverage and humidity'],
  ['morphology', 'Review preserved viable morphology'],
  ['unstained', 'Inspect an unstained companion'],
  ['detection-control', 'Challenge the detection-system background'],
  ['specificity', 'Compare expected cell populations and an independent reagent'],
  ['adhesion', 'Inspect adhesion and retrieval history'],
] as const
const changeChoices = [
  ['', 'Choose one change'],
  ['compatible', 'Restore compatible detection'],
  ['dilution', 'Change primary dilution only'],
  ['dewax', 'Restore complete dewaxing on an adjacent section'],
  ['blocked', 'Restore appropriate blocking'],
  ['humid', 'Restore controlled coverage'],
  ['representative', 'Select representative viable tissue under review'],
  ['comparison', 'Add an appropriate pigment comparison'],
  ['biotin-free', 'Compare an established biotin-free system'],
  ['orthogonal', 'Add an independent specificity comparison'],
  ['retrievalMinutes', 'Reduce retrieval exposure only'],
] as const
function Investigation({ base, c, evidence }: { base: Twin; c: IhcCondition; evidence: Evidence }) {
  const [caseId, setCaseId] = useState('no-signal'),
    [test, setTest] = useState(''),
    [change, setChange] = useState(''),
    [tested, setTested] = useState(false),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null),
    [repeated, setRepeated] = useState(false)
  const current = investigations.find((i) => i.id === caseId)!
  const modeled = [
    'no-signal',
    'weak',
    'uneven',
    'background',
    'edge',
    'detach',
    'dryspot',
  ].includes(caseId)
  const before = useMemo(
    () =>
      runIhcExperiment(
        base,
        { ...c, ...current.patch },
        caseId === 'uneven' ? RUN_STEPS.filter((s) => s !== 'dewax') : RUN_STEPS,
      ),
    [base, c, current, caseId],
  )
  const after = useMemo(() => runIhcExperiment(base, c), [base, c])
  return (
    <>
      <Select
        label="Investigation case"
        value={caseId}
        options={investigations.map((i) => [i.id, i.label])}
        onChange={(v) => {
          setCaseId(v)
          setTest('')
          setChange('')
          setTested(false)
          setFeedback(null)
          setRepeated(false)
        }}
      />
      <p className="ihc-case-finding">{current.finding}</p>
      <Select
        label="First discriminating investigation"
        value={test}
        options={testChoices}
        onChange={(v) => {
          setTest(v)
          setTested(false)
        }}
      />
      <button
        className="btn"
        onClick={() => {
          setTested(true)
          evidence('ihc-investigation-test', false, 'Selected and reviewed an investigation.', {
            caseId,
            test,
          })
        }}
      >
        Inspect investigation result
      </button>
      {tested && (
        <p role="status">
          {test === current.test
            ? current.detail
            : 'This comparison does not isolate the reported fault. Revisit the pattern and run history before changing the assay.'}
        </p>
      )}
      <Select
        label="One supported change or comparison"
        value={change}
        options={changeChoices}
        onChange={setChange}
      />
      <button
        className="btn btn-primary"
        onClick={() => {
          const logic = tested && test === current.test && change === current.change
          const demonstrated = modeled
          const passed = logic && (!demonstrated || after.metrics.acceptable)
          const issues = [
            ...(!logic
              ? ['Inspect a discriminating result before selecting the matching single change.']
              : []),
            ...(logic && demonstrated && !after.metrics.acceptable
              ? [
                  'The repeat still fails the exercise controls; investigate additional preparation effects.',
                ]
              : []),
          ]
          setRepeated(logic)
          setFeedback({ passed, issues })
          evidence(
            'ihc-investigation',
            passed,
            'Investigation → one change → verification recorded.',
            {
              caseId,
              test,
              change,
              observed: tested,
              repeatControls: demonstrated && after.metrics.acceptable,
              modelScope: demonstrated
                ? 'shared-core response'
                : 'structured comparison design; mechanism not quantitatively rendered',
            },
          )
        }}
      >
        Repeat and verify
      </button>
      {feedback && <Feedback {...feedback} />}
      {modeled ? (
        <Preview result={repeated ? after : before} ideal={before} />
      ) : (
        <p className="ihc-boundary">
          This case assesses a documented investigation plan. This engine does not simulate this
          mechanism well enough to show or validate a corrective image. Qualified review of the
          proposed comparison is still required.
        </p>
      )}
      <p className="small">
        A successful technical comparison is evidence for a cause, not a diagnosis. Cases outside
        the shared core explicitly grade investigation design, not invented mechanistic image
        validation.
      </p>
      <Sources ids={['leica-ihc', 'thermo-biotin', 'webpath-melanin-bleach', 'webpath-iron']} />
    </>
  )
}
function Validation({ evidence }: { evidence: Evidence }) {
  const [plan, setPlan] = useState<ValidationPlan>({
      change: 'new-clone',
      scope: '',
      cases: '',
      comparison: '',
      criteria: '',
      discrepancies: '',
      approval: '',
    }),
    [notes, setNotes] = useState(''),
    [feedback, setFeedback] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const questions: [keyof ValidationPlan, string, (readonly [string, string])[]][] = [
    [
      'scope',
      'Intended use and preparation',
      [
        ['defined', 'Define target, readout, specimen type, fixation and processing'],
        ['generic', 'Use one generic scope for all preparations'],
      ],
    ],
    [
      'cases',
      'Case-set design',
      [
        ['range', 'Represent expected positive/negative patterns and expression range'],
        ['strong', 'Use only strong positives'],
      ],
    ],
    [
      'comparison',
      'Comparison method',
      [
        ['validated', 'Use an appropriate characterized comparator and matched material'],
        ['new', 'Treat the new assay as its own reference'],
      ],
    ],
    [
      'criteria',
      'Acceptance criteria',
      [
        [
          'prespecified',
          'Specify concordance, localization/background and reproducibility criteria before testing',
        ],
        ['after', 'Choose criteria after looking at results'],
      ],
    ],
    [
      'discrepancies',
      'Unexpected results',
      [
        ['investigate', 'Preserve discordances, investigate and document disposition'],
        ['remove', 'Remove discordant cases from the report'],
      ],
    ],
    [
      'approval',
      'Clinical introduction',
      [
        ['review', 'Qualified laboratory approval, documentation and ongoing QC'],
        ['sim', 'Use this exercise score as authorization'],
      ],
    ],
  ]
  return (
    <>
      <p>
        Build a reviewable plan for a changed assay. New clone, lot, platform, fixative and
        decalcified material create different verification questions. CAP distinguishes the scope of
        these changes; the final design must match the intended use and current requirements.
      </p>
      <Select
        label="Proposed change"
        value={plan.change}
        options={['new-clone', 'new-lot', 'new-platform', 'new-fixative', 'decalcified']}
        onChange={(change) => setPlan({ ...plan, change })}
      />
      <div className="ihc-role-grid">
        {questions.map(([key, label, options]) => (
          <Select
            key={key}
            label={label}
            value={plan[key]}
            options={['', ...options]}
            onChange={(value) => setPlan({ ...plan, [key]: value })}
          />
        ))}
      </div>
      <label className="lab-field">
        <span>Plan notes for future qualified review (not automatically graded)</span>
        <textarea
          className="input"
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </label>
      <p className="ihc-boundary">
        No numeric case requirement is asserted here. Verify the current CAP guidance, applicable
        checklist and local approval process. Completing this structured plan is practice evidence
        only.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => {
          const check = evaluateValidation(plan)
          setFeedback(check)
          evidence(
            'ihc-validation',
            check.passed,
            'Structured assay-change validation plan prepared.',
            { ...plan, notes },
          )
        }}
      >
        Save and review plan
      </button>
      {feedback && <Feedback {...feedback} />}
      <Sources ids={['cap-ihc-summary-2024']} />
    </>
  )
}
function MarkerBrowser({
  c,
  set,
  base,
  evidence,
}: {
  c: IhcCondition
  set: (c: IhcCondition) => void
  base: Twin
  evidence: Evidence
}) {
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState(c.marker)
  const visible = MARKERS.filter((m) =>
    `${m.label} ${m.localization.join(' ')} ${m.normalExpression}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  const marker = MARKER_BY_ID[selected] ?? MARKERS[0]
  const result = useMemo(
    () =>
      runIhcExperiment(base, { ...c, marker: marker.modality === 'IHC' ? marker.id : c.marker }),
    [base, c, marker],
  )
  return (
    <>
      <label className="lab-field">
        <span>
          Search {MARKERS.length} marker concepts by name, compartment or normal expression
        </span>
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="ihc-marker-layout">
        <div className="ihc-marker-list" aria-label="Matching markers">
          {visible.map((m) => (
            <button
              className="chip-btn"
              aria-pressed={selected === m.id}
              key={m.id}
              onClick={() => {
                setSelected(m.id)
                evidence('ihc-marker-view', false, 'Marker technical profile reviewed.', {
                  marker: m.id,
                })
              }}
            >
              {m.label}
              <small>
                {m.modality} · {m.localization.join(' / ')}
              </small>
            </button>
          ))}
        </div>
        <div>
          <h3>{marker.label}</h3>
          <dl className="ihc-marker-details">
            <dt>Expected compartment</dt>
            <dd>{marker.localization.join(' / ')}</dd>
            <dt>Normal expression</dt>
            <dd>{marker.normalExpression}</dd>
            <dt>External control</dt>
            <dd>{marker.externalControl}</dd>
            <dt>Potential internal control</dt>
            <dd>{marker.internalControl}</dd>
            <dt>Pitfall</dt>
            <dd>{marker.pitfalls}</dd>
            <dt>Technical practice</dt>
            <dd>{marker.technicalUse}</dd>
          </dl>
          {marker.modality === 'IHC' && (
            <>
              <button className="btn" onClick={() => set({ ...c, marker: marker.id })}>
                Use this marker in experiments
              </button>
              <Preview result={result} />
            </>
          )}
          <Sources ids={marker.sourceIds} />
        </div>
      </div>
    </>
  )
}
export default function IhcAcademy({ twin, act }: ControlsProps) {
  const [tab, setTab] = useState<Tab>('theory'),
    [c, setC] = useState(() =>
      defaultCondition(
        MARKERS.find((m) => m.label === twin.ihc.marker && m.modality === 'IHC')?.id ?? 'sox10',
      ),
    )
  const ready = twin.embedding.cooled && twin.embedding.pieces.length > 0
  const base = useMemo(
    () => (ready ? twin : referenceTwin({ ...twin.scenario, faults: [], discrepancy: 'none' })),
    [ready, twin],
  )
  const evidence: Evidence = (checkId, passed, text, details = {}) =>
    act('practice.evidence', { checkId, passed, text, ...details }, 'ihc')
  const completed = new Set(
    twin.events
      .filter((e) => e.intent === 'practice.evidence' && e.params.passed === true)
      .map((e) => e.params.checkId),
  )
  const props = { base, c, evidence }
  let content: ReactNode
  if (tab === 'theory') content = <Theory evidence={evidence} />
  else if (tab === 'manual' || tab === 'automated')
    content = <RunExercise key={tab} {...props} set={setC} automated={tab === 'automated'} />
  else if (tab === 'retrieval' || tab === 'checkerboard')
    content = (
      <GridExercise
        key={tab}
        {...props}
        set={setC}
        twin={twin}
        act={act}
        checkerboard={tab === 'checkerboard'}
      />
    )
  else if (tab === 'controls') content = <ControlsExercise {...props} />
  else if (tab === 'preanalytic') content = <Preanalytics {...props} />
  else if (tab === 'multiplex') content = <Multiplex {...props} />
  else if (tab === 'ish') content = <IshExercise base={base} evidence={evidence} />
  else if (tab === 'investigation') content = <Investigation {...props} />
  else if (tab === 'validation') content = <Validation evidence={evidence} />
  else content = <MarkerBrowser {...props} set={setC} />
  return (
    <section className="ihc-academy" aria-label="IHC mastery academy">
      <header>
        <p className="eyebrow">From molecular access to a defensible control result</p>
        <h2>IHC mastery academy</h2>
        <p>
          Perform experiments, inspect simulated fields, and explain the controls. Every result is a
          teaching prediction, not an assay validation or a diagnosis.
        </p>
      </header>
      <nav className="ihc-academy-nav" aria-label="IHC exercises">
        {sections.map(([id, label]) => (
          <button
            key={id}
            className="chip-btn"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
            {completed.has(`ihc-${id}`) && <span aria-label="practice completed"> ✓</span>}
          </button>
        ))}
      </nav>
      <div className="ihc-context">
        <strong>{MARKER_BY_ID[c.marker]?.label ?? c.marker}</strong>
        <span>
          {ready
            ? 'Comparisons use adjacent sections of your current block.'
            : 'A disclosed reference teaching block supplies previews until your main block is prepared.'}
        </span>
        <p className="small">
          Current specimen seed: {twin.scenario.seed}. No preview changes the main specimen. Only
          the explicit adjacent-section application does so. The marker library describes normal
          cell types; these synthetic fields illustrate compartments, not verified marker-specific
          expression maps.
        </p>
        <Toggle
          label="Simulate a repeat with a replacement reagent (a controlled comparison, not proof the real fault is corrected)"
          value={c.faultCorrected}
          onChange={(value) => setC({ ...c, faultCorrected: value })}
        />
      </div>
      <div className="ihc-academy-content" key={`${twin.scenario.seed}:${tab}`}>
        <h3>{sections.find(([id]) => id === tab)?.[1]}</h3>
        {content}
      </div>
    </section>
  )
}
