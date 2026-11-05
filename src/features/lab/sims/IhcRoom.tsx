import { useState } from 'react'
import { rng } from '../../../engine/random'
import { Segmented, SimNotice } from '../../../ui/components'
import { IhcLayersDemo } from '../../learn/demos'
import type { SimProps } from '../SimPage'
import { IHC_RUNS, scoreRun, type Option, type Pattern, type RunAnswer, type Slide } from './ihcRuns'

const DAB = '#7a4a1f'

/** Schematic slide: blue nuclei; brown signal drawn by pattern. Labelled as a schematic, never a micrograph. */
function SlideTile({ slide, seed }: { slide: Slide; seed: number }) {
  const r = rng(seed)
  const cells = Array.from({ length: 22 }, () => ({ x: 14 + r() * 132, y: 14 + r() * 62, pos: r() < 0.4, rbc: r() < 0.15 }))
  const fill = (p: Pattern, c: (typeof cells)[number]) => {
    switch (p) {
      case 'strong': return c.pos ? { f: DAB, o: 0.85 } : null
      case 'weak': return c.pos ? { f: DAB, o: 0.25 } : null
      case 'edge': return c.pos && slide.id !== 'negative' ? { f: DAB, o: 0.85 } : null
      case 'overstain': return { f: DAB, o: c.pos ? 0.95 : 0.55 }
      case 'background': return c.rbc || c.pos ? { f: DAB, o: c.rbc ? 0.8 : slide.id === 'negative' ? 0 : 0.8 } : null
      default: return null
    }
  }
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox="0 0 160 90" role="img" aria-label={`${slide.label}: ${slide.note} Schematic.`}>
        {/* Glass slides are light in reality, so tiles stay light in both themes for honest contrast. */}
        <rect width="160" height="90" rx="6" fill="#f8f5ef" stroke="var(--rule)" />
        <rect x="6" y="6" width="148" height="78" rx="18" fill="#e9c9d4" opacity="0.45" />
        {slide.pattern === 'edge' && <rect x="6" y="6" width="148" height="78" rx="18" fill="none" stroke={DAB} strokeWidth="7" opacity="0.7" />}
        {cells.map((c, i) => {
          const s = fill(slide.pattern, c)
          return (
            <g key={i}>
              {s && s.o > 0 && <circle cx={c.x} cy={c.y} r={7} fill={s.f} opacity={s.o} />}
              <circle cx={c.x} cy={c.y} r={2.6} fill={c.rbc ? 'none' : '#3f3a8c'} stroke={c.rbc ? '#c0466f' : 'none'} />
            </g>
          )
        })}
      </svg>
      <figcaption className="small" style={{ marginTop: 4 }}><strong>{slide.label}</strong><br /><span className="muted">{slide.note}</span></figcaption>
    </figure>
  )
}

function Decision({ title, options, value, onPick }: { title: string; options: Option[]; value?: string; onPick: (id: string) => void }) {
  const locked = !!value
  return (
    <fieldset style={{ border: 0, padding: 0, margin: '0 0 18px' }}>
      <legend style={{ fontWeight: 700, marginBottom: 8 }}>{title}</legend>
      <ul className="options" style={{ margin: 0 }}>
        {options.map((o) => (
          <li key={o.id}>
            <button className={`option ${locked ? (o.correct ? 'is-correct' : value === o.id ? 'is-wrong' : '') : ''}`} aria-pressed={value === o.id} disabled={locked} onClick={() => onPick(o.id)}>
              <span>{o.text}{locked && (o.correct || value === o.id) && <span className="rationale" style={{ display: 'block' }}>{o.why}</span>}</span>
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

export default function IhcRoom({ finish }: SimProps) {
  const [tab, setTab] = useState<'runs' | 'explore'>('runs')
  const [ri, setRi] = useState(0)
  const [answers, setAnswers] = useState<Record<string, RunAnswer>>({})
  const [recorded, setRecorded] = useState(false)
  const run = IHC_RUNS[ri]
  const a = answers[run.id] ?? {}
  const set = (k: keyof RunAnswer) => (id: string) => setAnswers({ ...answers, [run.id]: { ...a, [k]: id } })
  const done = (id: string) => { const x = answers[id]; return !!(x?.interpretable && x.control && x.investigate) }
  const finished = IHC_RUNS.filter((r) => done(r.id))
  const total = finished.reduce((s, r) => s + scoreRun(r, answers[r.id]).total, 0)

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <Segmented label="Room section" value={tab} onChange={setTab} options={[{ value: 'runs', label: 'Failed runs' }, { value: 'explore', label: 'Protocol explorer' }]} />
      </div>
      <SimNotice>Fictional runs drawn as labelled schematics: blue nuclei and brown DAB signal. The focus is technique and quality control, not patient diagnosis.</SimNotice>

      {tab === 'explore' ? (
        <section className="demo-frame" style={{ marginTop: 14 }} aria-label="Protocol explorer">
          <IhcLayersDemo />
        </section>
      ) : (
        <>
          <div className="row" style={{ margin: '12px 0 18px' }} role="tablist" aria-label="Runs">
            {IHC_RUNS.map((r, i) => (
              <button key={r.id} role="tab" aria-selected={i === ri} className="chip-btn" aria-pressed={i === ri} onClick={() => setRi(i)}>
                {i + 1}. {r.short}{done(r.id) ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <section aria-labelledby="run-h">
              <h2 id="run-h" style={{ fontSize: 'var(--t-3)' }}>{run.title}</h2>
              <p>{run.context}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {run.slides.map((s, i) => <SlideTile key={s.id} slide={s} seed={ri * 10 + i + 1} />)}
              </div>
            </section>
            <section className="panel" aria-label="Decisions">
              <Decision title="1. Is this run interpretable?" options={run.interpretable} value={a.interpretable} onPick={set('interpretable')} />
              {a.interpretable && <Decision title="2. Which control tells you the most here?" options={run.control} value={a.control} onPick={set('control')} />}
              {a.control && <Decision title="3. What do you investigate first?" options={run.investigate} value={a.investigate} onPick={set('investigate')} />}
              {done(run.id) && (
                <>
                  <p className="inset" style={{ margin: 0 }}><strong>Takeaway.</strong> {run.lesson}</p>
                  <p className="small muted" style={{ marginTop: 8 }}>{scoreRun(run, a).total} of 3 decisions matched standard QC practice.</p>
                  {ri < IHC_RUNS.length - 1 && <button className="btn" onClick={() => setRi(ri + 1)}>Next run</button>}
                </>
              )}
            </section>
          </div>
          {finished.length > 0 && (
            <div className="panel" style={{ marginTop: 20 }}>
              <p style={{ margin: 0 }}><strong>{finished.length} of {IHC_RUNS.length} runs reviewed</strong> · {total} of {finished.length * 3} decisions correct</p>
              <div className="row" style={{ marginTop: 10 }}>
                {!recorded ? (
                  <button className="btn btn-primary" onClick={() => { setRecorded(true); finish(total, finished.length * 3, `IHC room: ${finished.length} ${finished.length === 1 ? 'run' : 'runs'}, ${total}/${finished.length * 3}`) }}>
                    Record this run{finished.length < IHC_RUNS.length ? ' so far' : ''}
                  </button>
                ) : <span className="celebrate">Run recorded</span>}
                <button className="btn" onClick={() => { setAnswers({}); setRecorded(false); setRi(0) }}>Reset all runs</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
