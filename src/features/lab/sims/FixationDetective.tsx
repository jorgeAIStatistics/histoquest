import { useState } from 'react'
import { Cassette } from '../../../art/illustrations'
import { SimNotice } from '../../../ui/components'
import { PenetrationDemo } from '../../learn/demos'
import type { SimProps } from '../SimPage'
import { FIXATION_CASES, scoreCase, type CaseAnswer, type Choice } from './fixationCases'

type Stage = 'variables' | 'approach' | 'artifacts' | 'debrief'
const STAGES: { id: Stage; label: string }[] = [
  { id: 'variables', label: 'Relevant variables' },
  { id: 'approach', label: 'Approach' },
  { id: 'artifacts', label: 'Likely artifacts' },
  { id: 'debrief', label: 'Debrief' },
]

function MultiPick({ options, picked, locked, onToggle }: { options: Choice[]; picked: string[]; locked: boolean; onToggle: (id: string) => void }) {
  return (
    <ul className="options">
      {options.map((o) => {
        const sel = picked.includes(o.id)
        const cls = locked ? (o.correct ? 'is-correct' : sel ? 'is-wrong' : '') : ''
        return (
          <li key={o.id}>
            <button className={`option ${cls}`} aria-pressed={sel} disabled={locked} onClick={() => onToggle(o.id)}>
              <span>
                {o.text}
                {locked && <span className="rationale" style={{ display: 'block' }}>{o.correct ? (sel ? 'Relevant, and you caught it. ' : 'Relevant, but missed. ') : sel ? 'Not a driver here. ' : ''}{o.why}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function FixationDetective({ finish }: SimProps) {
  const [ci, setCi] = useState(0)
  const [answers, setAnswers] = useState<Record<string, CaseAnswer>>({})
  const [stage, setStage] = useState<Record<string, Stage>>({})
  const [locked, setLocked] = useState<Record<string, Partial<Record<Stage, boolean>>>>({})
  const [recorded, setRecorded] = useState(false)

  const c = FIXATION_CASES[ci]
  const a = answers[c.id] ?? { variables: [], artifacts: [] }
  const st = stage[c.id] ?? 'variables'
  const lk = locked[c.id] ?? {}
  const setA = (patch: Partial<CaseAnswer>) => setAnswers({ ...answers, [c.id]: { ...a, ...patch } })
  const lock = (s: Stage) => setLocked({ ...locked, [c.id]: { ...lk, [s]: true } })
  const go = (s: Stage) => setStage({ ...stage, [c.id]: s })
  const toggle = (key: 'variables' | 'artifacts') => (id: string) => setA({ [key]: a[key].includes(id) ? a[key].filter((x) => x !== id) : [...a[key], id] })

  const finished = FIXATION_CASES.filter((x) => stage[x.id] === 'debrief')
  const total = finished.reduce((s, x) => s + scoreCase(x, answers[x.id]).total, 0)
  const sc = scoreCase(c, a)

  return (
    <div>
      <SimNotice>Fictional specimens with qualitative reasoning from standard fixation principles. The penetration animation is conceptual, not a kinetic model.</SimNotice>
      <div className="row" style={{ margin: '12px 0 18px' }} role="tablist" aria-label="Cases">
        {FIXATION_CASES.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === ci} className="chip-btn" aria-pressed={i === ci} title={x.title} onClick={() => setCi(i)}>
            {i + 1}. {x.short}{stage[x.id] === 'debrief' ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section aria-labelledby="case-h">
          <div className="row" style={{ alignItems: 'start', flexWrap: 'nowrap' }}>
            <Cassette size={64} label="HQ-FD" />
            <h2 id="case-h" style={{ fontSize: 'var(--t-3)', margin: 0 }}>{c.title}</h2>
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', margin: '16px 0' }}>
            <dt style={{ fontWeight: 700 }}>Tissue</dt><dd style={{ margin: 0 }}>{c.tissue}</dd>
            <dt style={{ fontWeight: 700 }}>Test needed</dt><dd style={{ margin: 0 }}>{c.test}</dd>
            <dt style={{ fontWeight: 700 }}>Problem</dt><dd style={{ margin: 0 }}>{c.problem}</dd>
          </dl>
          {c.penetration && (
            <details className="basics" open={st !== 'variables'}>
              <summary>See penetration versus fixation</summary>
              <div style={{ marginTop: 10 }}><PenetrationDemo /></div>
            </details>
          )}
        </section>

        <section className="panel" aria-labelledby="step-h">
          <ol className="lesson-steps" aria-label="Case steps">
            {STAGES.map((s) => (
              <li key={s.id}><button aria-current={s.id === st ? 'step' : undefined} className={lk[s.id] ? 'visited' : ''} disabled={!lk[s.id] && s.id !== st} onClick={() => go(s.id)}>{s.label}</button></li>
            ))}
          </ol>

          {st === 'variables' && (
            <>
              <h3 id="step-h">Which variables explain this problem?</h3>
              <p className="small muted">Select every variable that matters here.</p>
              <MultiPick options={c.variables} picked={a.variables} locked={!!lk.variables} onToggle={toggle('variables')} />
              {!lk.variables ? <button className="btn btn-primary" disabled={!a.variables.length} onClick={() => lock('variables')}>Check variables</button> : <button className="btn btn-primary" onClick={() => go('approach')}>Choose an approach</button>}
            </>
          )}

          {st === 'approach' && (
            <>
              <h3 id="step-h">What should the lab do?</h3>
              <ul className="options">
                {c.approaches.map((o) => {
                  const sel = a.approach === o.id
                  return (
                    <li key={o.id}>
                      <button className={`option ${lk.approach ? (o.correct ? 'is-correct' : sel ? 'is-wrong' : '') : ''}`} aria-pressed={sel} disabled={!!lk.approach} onClick={() => setA({ approach: o.id })}>
                        <span>{o.text}{lk.approach && (o.correct || sel) && <span className="rationale" style={{ display: 'block' }}>{o.why}</span>}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {!lk.approach ? <button className="btn btn-primary" disabled={!a.approach} onClick={() => lock('approach')}>Commit to this approach</button> : <button className="btn btn-primary" onClick={() => go('artifacts')}>Predict the artifacts</button>}
            </>
          )}

          {st === 'artifacts' && (
            <>
              <h3 id="step-h">What will the slides likely show?</h3>
              <p className="small muted">Select every finding you would expect from the problem as it happened.</p>
              <MultiPick options={c.artifacts} picked={a.artifacts} locked={!!lk.artifacts} onToggle={toggle('artifacts')} />
              {!lk.artifacts ? <button className="btn btn-primary" disabled={!a.artifacts.length} onClick={() => lock('artifacts')}>Check predictions</button> : <button className="btn btn-primary" onClick={() => go('debrief')}>See the debrief</button>}
            </>
          )}

          {st === 'debrief' && (
            <>
              <h3 id="step-h">Debrief</h3>
              <table className="simple" style={{ marginBottom: 14 }}>
                <tbody>
                  <tr><th>Variables</th><td>{Math.round(sc.variables * 100)}%</td></tr>
                  <tr><th>Approach</th><td>{sc.approach ? 'Best practice' : 'Not the best option'}</td></tr>
                  <tr><th>Artifacts</th><td>{Math.round(sc.artifacts * 100)}%</td></tr>
                </tbody>
              </table>
              <p className="inset" style={{ margin: 0 }}><strong>Principle.</strong> {c.principle}</p>
              <p className="small muted" style={{ marginTop: 10 }}>Sets are scored +1 for each relevant pick and −1 for each irrelevant one, so guessing everything doesn’t pay.</p>
              {ci < FIXATION_CASES.length - 1 && <button className="btn" onClick={() => setCi(ci + 1)}>Next case</button>}
            </>
          )}
        </section>
      </div>

      {finished.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <p style={{ margin: 0 }}><strong>{finished.length} of {FIXATION_CASES.length} cases solved</strong> · reasoning score {total.toFixed(1)} of {finished.length * 3}</p>
          <div className="row" style={{ marginTop: 10 }}>
            {!recorded && (
              <button className="btn btn-primary" onClick={() => { setRecorded(true); finish(Math.round(total * 10) / 10, finished.length * 3, `Fixation detective: ${finished.length} ${finished.length === 1 ? 'case' : 'cases'}, ${total.toFixed(1)}/${finished.length * 3}`) }}>
                Record this run{finished.length < FIXATION_CASES.length ? ' so far' : ''}
              </button>
            )}
            {recorded && <span className="celebrate">Run recorded</span>}
            <button className="btn" onClick={() => { setAnswers({}); setStage({}); setLocked({}); setRecorded(false); setCi(0) }}>Reset all cases</button>
          </div>
        </div>
      )}
    </div>
  )
}
