import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SIMULATIONS } from '../../content'
import { useAppState } from '../../store/store'
import { Segmented } from '../../ui/components'

/** Station positions on the lab floor plan (SVG units). The specimen path follows the real workflow order. */
const LAYOUT: Record<string, { x: number; y: number; w: number; h: number; art: string }> = {
  accessioning: { x: 30, y: 40, w: 150, h: 90, art: 'labels' },
  fixation: { x: 210, y: 40, w: 150, h: 90, art: 'jars' },
  processor: { x: 390, y: 40, w: 150, h: 90, art: 'processor' },
  embedding: { x: 570, y: 40, w: 150, h: 90, art: 'mold' },
  microtome: { x: 570, y: 220, w: 150, h: 90, art: 'wheel' },
  stainer: { x: 390, y: 220, w: 150, h: 90, art: 'dishes' },
  ihc: { x: 210, y: 220, w: 150, h: 90, art: 'ihc' },
  bench: { x: 30, y: 220, w: 150, h: 90, art: 'flask' },
}

function StationArt({ art }: { art: string }) {
  switch (art) {
    case 'labels': return <g><rect x="16" y="20" width="40" height="28" rx="3" fill="var(--paper)" stroke="var(--ink)" /><rect x="20" y="26" width="20" height="3" fill="var(--ink-3)" /><rect x="20" y="33" width="28" height="3" fill="var(--ink-3)" /></g>
    case 'jars': return <g>{[0, 22, 44].map((d) => <g key={d}><rect x={14 + d} y="20" width="16" height="28" rx="3" fill="var(--amber-soft)" stroke="var(--ink)" /><rect x={14 + d} y="16" width="16" height="6" fill="var(--hema-soft)" stroke="var(--ink)" /></g>)}</g>
    case 'processor': return <g><rect x="14" y="16" width="56" height="34" rx="4" fill="var(--vellum)" stroke="var(--ink)" />{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={22 + i * 10} cy="33" r="4" fill="var(--paper)" stroke="var(--ink)" />)}</g>
    case 'mold': return <g><rect x="16" y="22" width="44" height="26" fill="var(--amber-soft)" stroke="var(--ink)" /><ellipse cx="38" cy="35" rx="12" ry="6" fill="var(--eosin)" opacity="0.6" /></g>
    case 'wheel': return <g><rect x="14" y="22" width="26" height="28" fill="var(--paper)" stroke="var(--ink)" /><circle cx="58" cy="34" r="14" fill="none" stroke="var(--ink)" /><circle cx="58" cy="34" r="3" fill="var(--ink)" /></g>
    case 'dishes': return <g>{[0, 18, 36].map((d, i) => <rect key={d} x={12 + d} y="22" width="14" height="26" rx="2" fill={['var(--hema)', 'var(--paper)', 'var(--eosin)'][i]} opacity="0.5" stroke="var(--ink)" />)}</g>
    case 'ihc': return <g><rect x="14" y="26" width="54" height="16" rx="2" fill="var(--paper)" stroke="var(--ink)" /><circle cx="40" cy="34" r="5" fill="#7a4a1f" opacity="0.7" /></g>
    default: return <g><path d="M30 18h12M33 18v10l-10 18a3 3 0 0 0 3 4h20a3 3 0 0 0 3-4L39 28V18" fill="var(--teal-soft)" stroke="var(--ink)" /></g>
  }
}

export default function LabPage() {
  const nav = useNavigate()
  const sims = useAppState((s) => s.sims)
  const [view, setView] = useState<'map' | 'list'>(() => (typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches ? 'list' : 'map'))
  const runsOf = (id: string) => sims.filter((r) => r.sim === id)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Virtual Lab</h1>
          <p className="lede">Each station is a simulation with decisions, consequences and a reset. They are simplified, rule-based models of real lab reasoning, not instrument emulators.</p>
        </div>
        <Segmented label="View" value={view} onChange={setView} options={[{ value: 'map', label: 'Lab map' }, { value: 'list', label: 'List' }]} />
      </div>

      <section className="workbench-invitation"><div><h2>Work at the bench. Inspect what you make.</h2><p>Prepare a fictional specimen, manipulate generic instruments and follow the resulting slide under a procedural microscope. The 2D work surface uses the same specimen model.</p></div><Link className="btn btn-primary" to="/lab3d">Enter HistoQuest Lab</Link></section>
      <section className="workbench-invitation"><div><h2>Follow one specimen all the way through.</h2><p>Three cases. Ten connected stations. Reconcile labels, plan sampling, prepare tissue, inspect a ribbon, build stains, and make a technical handoff.</p></div><Link className="btn btn-primary" to="/workbench">Enter the specimen workbench</Link></section>
      {view === 'map' && (
        <svg className="labmap" viewBox="0 0 750 340" role="group" aria-label="Lab floor plan. Each station opens a simulation; the same stations are in the list view.">
          <path d="M180 85H210M360 85H390M540 85H570M645 130V220M570 265H540M390 265H360M210 265H180" stroke="var(--teal)" strokeWidth="3" strokeDasharray="6 6" fill="none" />
          <text x="375" y="180" textAnchor="middle" fontSize="12" fill="var(--ink-3)">The specimen path runs clockwise from accessioning</text>
          {SIMULATIONS.map((s) => {
            const p = LAYOUT[s.station]
            const ready = s.status === 'ready'
            const runs = runsOf(s.id).length
            return (
              <g
                key={s.id}
                className={`station ${ready ? '' : 'dev'}`}
                transform={`translate(${p.x} ${p.y})`}
                role={ready ? 'link' : 'img'}
                tabIndex={ready ? 0 : -1}
                aria-label={`${s.title}${ready ? '' : ', in development, not available yet'}${runs ? `, ${runs} runs` : ''}`}
                onClick={() => ready && nav(`/lab/${s.id}`)}
                onKeyDown={(e) => { if (ready && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nav(`/lab/${s.id}`) } }}
              >
                <rect className="bench" width={p.w} height={p.h} rx="10" fill={ready ? 'var(--paper)' : 'var(--vellum)'} stroke="var(--rule)" strokeWidth="1.5" strokeDasharray={ready ? undefined : '5 4'} />
                <g transform="translate(70 0)" opacity={ready ? 1 : 0.45}><StationArt art={p.art} /></g>
                <text x="12" y={p.h - 26} fontSize="13" fontWeight="700" fill="var(--ink)">{s.title.length > 20 ? s.title.split(' ').slice(0, 2).join(' ') : s.title}</text>
                <text x="12" y={p.h - 10} fontSize="11" fill={ready ? (runs ? 'var(--teal)' : 'var(--hema)') : 'var(--ink-3)'}>{ready ? (runs ? `${runs} run${runs > 1 ? 's' : ''}` : 'Open') : 'In development'}</text>
              </g>
            )
          })}
        </svg>
      )}

      <section style={{ marginTop: view === 'map' ? 28 : 0 }} aria-labelledby="stations-h">
        <h2 id="stations-h" className={view === 'map' ? 'sr-only' : ''}>Stations</h2>
        <ul className="list">
          {SIMULATIONS.map((s) => {
            const runs = runsOf(s.id)
            const best = runs.reduce((a, r) => Math.max(a, r.total ? r.correct / r.total : 0), 0)
            return (
              <li key={s.id}>
                {s.status === 'ready' ? (
                  <Link className="list-row" to={`/lab/${s.id}`}>
                    <span><strong>{s.title}</strong><br /><span className="small muted">{s.blurb}</span></span>
                    <span className="meta">{runs.length ? <span className="tag tag-teal">Best reasoning {Math.round(best * 100)}%</span> : <span className="tag tag-hema">Not tried</span>}</span>
                  </Link>
                ) : (
                  <div className="list-row" aria-disabled="true">
                    <span><strong>{s.title}</strong><br /><span className="small muted">{s.blurb} Planned. The topic is taught in Learn and Practice until then.</span></span>
                    <span className="tag">In development</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      <p className="small muted" style={{ marginTop: 18 }}>Simulation runs show reasoning practice. They never count as clinical experience for ASCP eligibility.</p>
    </div>
  )
}
