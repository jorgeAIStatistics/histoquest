import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ATLAS, ATLAS_BY_ID, LESSON_BY_ID, LESSONS, QUESTIONS } from '../../content'
import { OBJECTIVE_BY_ID } from '../../content/curriculum'
import type { AtlasEntry } from '../../content/schema'
import { References, ReviewBadge, Segmented } from '../../ui/components'

const KINDS = [
  { value: 'all', label: 'All' },
  { value: 'stain', label: 'Stains' },
  { value: 'fixative', label: 'Fixatives' },
  { value: 'artifact', label: 'Artifacts' },
  { value: 'concept', label: 'Concepts' },
  { value: 'calculation', label: 'Calculations' },
  { value: 'glossary', label: 'Glossary' },
] as const

function score(e: AtlasEntry, q: string) {
  if (!q) return 1
  const t = q.toLowerCase()
  if (e.name.toLowerCase().includes(t)) return 3
  if (e.aka.some((a) => a.toLowerCase().includes(t))) return 2
  if ((e.summary + ' ' + e.facts.map((f) => f.value).join(' ')).toLowerCase().includes(t)) return 1
  return 0
}

function Entry({ e }: { e: AtlasEntry }) {
  const [compare, setCompare] = useState<string>()
  const lessons = [...new Set([...e.lessons, ...LESSONS.filter((l) => l.objectives.some((o) => e.objectives.includes(o))).map((l) => l.id)])].filter((id) => LESSON_BY_ID[id]).slice(0, 4)
  const qCount = QUESTIONS.filter((q) => e.objectives.includes(q.objective)).length
  const other = compare ? ATLAS_BY_ID[compare] : undefined
  const labels = other ? [...new Set([...e.facts.map((f) => f.label), ...other.facts.map((f) => f.label)])] : []
  return (
    <article aria-labelledby="entry-h">
      <p className="small"><Link to="/atlas">Atlas</Link> / {e.kind}</p>
      <h1 id="entry-h">{e.name}</h1>
      {e.aka.length > 0 && <p className="muted">Also: {e.aka.join(', ')}</p>}
      <p className="lede">{e.summary}</p>
      {!other ? (
        <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 200px) 1fr', gap: '10px 20px', margin: '20px 0' }}>
          {e.facts.map((f) => (
            <div key={f.label} style={{ display: 'contents' }}>
              <dt style={{ fontWeight: 700, color: 'var(--ink-2)' }}>{f.label}</dt>
              <dd style={{ margin: 0 }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="table-scroll" style={{ margin: '20px 0' }}>
          <table className="simple">
            <thead><tr><th></th><th>{e.name}</th><th>{other.name}</th></tr></thead>
            <tbody>
              {labels.map((l) => (
                <tr key={l}><th>{l}</th><td>{e.facts.find((f) => f.label === l)?.value ?? '—'}</td><td>{other.facts.find((f) => f.label === l)?.value ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {e.compareWith.length > 0 && (
        <div className="row" style={{ marginBottom: 20 }}>
          <span className="small" style={{ fontWeight: 600 }}>Compare side by side with:</span>
          {e.compareWith.filter((id) => ATLAS_BY_ID[id]).map((id) => (
            <button key={id} className="chip-btn" style={{ minHeight: 36, padding: '4px 12px' }} aria-pressed={compare === id} onClick={() => setCompare(compare === id ? undefined : id)}>{ATLAS_BY_ID[id].name}</button>
          ))}
        </div>
      )}
      <div className="grid-2">
        <div className="inset">
          <h3>Learn it</h3>
          {lessons.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{lessons.map((id) => <li key={id}><Link to={`/learn/${id}`}>{LESSON_BY_ID[id].title}</Link></li>)}</ul> : <p className="small muted">No dedicated lesson yet.</p>}
        </div>
        <div className="inset">
          <h3>Practise it</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {e.objectives.map((o) => (
              <li key={o}><Link to={`/practice/run?objective=${o}&n=5`}>{OBJECTIVE_BY_ID[o]?.title ?? o}</Link></li>
            ))}
          </ul>
          <p className="small muted" style={{ margin: '6px 0 0' }}>{qCount} related questions in the bank.</p>
        </div>
      </div>
      <h3 style={{ marginTop: 24 }}>Sources</h3>
      <References refs={e.references} />
      <p style={{ marginTop: 8 }}><ReviewBadge status={e.review.status} /></p>
      <p className="small muted"><Link to="/slides">Explore the slide library</Link> for attributed real micrographs and schematic artifact exercises.</p>
    </article>
  )
}

export default function AtlasPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('all')
  const results = useMemo(
    () => ATLAS.map((e) => ({ e, s: score(e, q.trim()) })).filter((x) => x.s > 0 && (kind === 'all' || x.e.kind === kind)).sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name)),
    [q, kind],
  )
  const entry = id ? ATLAS_BY_ID[id] : undefined
  if (id && entry) return <div className="page-narrow"><Entry key={entry.id} e={entry} /></div>

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Reference atlas</h1>
          <p className="lede">{ATLAS.length} cross-linked entries: stains, fixatives, artifacts, concepts, calculations and glossary terms.</p>
        </div>
      </div>
      {id && !entry && <p className="notice">No atlas entry called “{id}”.</p>}
      <div className="workbench-invitation"><div><h2>Connect the reference to the image</h2><p>Explore real H&E and IHC micrographs and compare preparation artifacts.</p></div><Link className="btn btn-primary" to="/slides">Open the slide library</Link></div>
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (results[0]) nav(`/atlas/${results[0].e.id}`) }} className="stack" style={{ marginBottom: 20 }}>
        <div className="field" style={{ maxWidth: 520 }}>
          <label htmlFor="atlas-q">Search</label>
          <input id="atlas-q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. glycogen, chatter, Zenker, molarity" />
        </div>
        <div style={{ overflowX: 'auto' }}><Segmented label="Entry type" value={kind} onChange={setKind} options={[...KINDS]} /></div>
      </form>
      <p className="small muted" aria-live="polite">{results.length} {results.length === 1 ? 'entry' : 'entries'}</p>
      {results.length === 0 ? (
        <p>No entries match. Try a broader word, or switch the type filter to All.</p>
      ) : (
        <ul className="list">
          {results.map(({ e }) => (
            <li key={e.id}>
              <Link className="list-row" to={`/atlas/${e.id}`}>
                <span><strong>{e.name}</strong><br /><span className="small muted">{e.summary.length > 140 ? `${e.summary.slice(0, 140)}…` : e.summary}</span></span>
                <span className="tag">{e.kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
