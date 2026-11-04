import { useState, type KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { IconRotate } from '../../../art/icons'
import { SimNotice } from '../../../ui/components'
import { useReducedMotion } from '../../../ui/prefs'
import type { SimProps } from '../SimPage'

type Orientation = 'flat' | 'edge' | 'end'
const ORIENTS: Orientation[] = ['flat', 'edge', 'end']
const ORIENT_LABEL: Record<Orientation, string> = { flat: 'Lying flat', edge: 'On edge', end: 'Standing on end' }

interface Tissue {
  id: string
  name: string
  context: string
  best: Orientation
  /** What a section through the cutting face shows, by orientation. */
  shows: Record<Orientation, string>
  why: string
  layers: string[] // colours from surface to depth, for the preview
}

const TISSUES: Tissue[] = [
  {
    id: 'skin', name: 'Skin excision (ellipse)', context: 'An ellipse of skin, bisected along its long axis. The pathologist needs epidermis, dermis and margins.', best: 'edge',
    shows: { flat: 'Only one layer at a time: first epidermis tangentially, then dermis. Depth and margins are not visible in one section.', edge: 'A full-thickness strip: epidermis, dermis and subcutis in every section, with true depth.', end: 'A tiny cross-section of the narrow tip only. Most of the lesion is not represented until deep levels.' },
    why: 'Skin goes on edge (perpendicular to the cutting face), so each section shows every layer and the depth of a process.', layers: ['var(--hema)', 'var(--eosin)', 'var(--amber)'],
  },
  {
    id: 'vessel', name: 'Tubular structure (vas deferens segment)', context: 'A short segment of a tube. The request is to show the full wall and lumen.', best: 'end',
    shows: { flat: 'A longitudinal strip. The lumen looks like a slit and wall layers are seen obliquely.', edge: 'Still longitudinal: one side of the wall, with an elongated lumen.', end: 'A ring: the complete circumference of the wall with all its layers and a round lumen.' },
    why: 'Tubes are embedded on end so the section is a true cross-section showing the whole wall.', layers: ['var(--eosin)', 'var(--hema)', 'var(--eosin)'],
  },
  {
    id: 'cyst', name: 'Cyst wall', context: 'A strip of thin cyst wall. The lining and the full wall must be visible.', best: 'edge',
    shows: { flat: 'An en face view of the lining. Thickness and wall layers are not shown.', edge: 'The lining and every layer of the wall in profile.', end: 'A short profile of only the strip’s tip.' },
    why: 'Thin walls and membranes go on edge to show the lining in profile.', layers: ['var(--hema)', 'var(--eosin)'],
  },
  {
    id: 'shave', name: 'Shave biopsy (derm)', context: 'A thin, broad shave biopsy. Peripheral and deep margins matter.', best: 'edge',
    shows: { flat: 'Mostly a tangential cut through epidermis. The deep edge may only appear after many levels, or not at all.', edge: 'A cross-sectional profile from epidermis to deep margin.', end: 'Only a small portion of one end of the specimen.' },
    why: 'Like other skin, shaves go on edge. Many labs serially section them into strips that are all placed on edge.', layers: ['var(--hema)', 'var(--eosin)'],
  },
]

function Preview({ t, o, turn }: { t: Tissue; o: Orientation; turn: number }) {
  const reduced = useReducedMotion()
  return (
    <svg viewBox="0 0 340 170" role="img" aria-label={`${t.name}, ${ORIENT_LABEL[o]}. Section shows: ${t.shows[o]}`}>
      <g transform="translate(20 20)">
        <text y="-6" fontSize="11" fill="var(--ink-2)">Mold seen from above (this face is cut)</text>
        <rect width="140" height="120" fill="var(--amber-soft)" stroke="var(--ink)" />
        <motion.g initial={false} animate={{ rotate: turn }} transition={{ duration: reduced ? 0 : 0.35 }} style={{ originX: '70px', originY: '60px' }}>
          {o === 'flat' && <ellipse cx="70" cy="60" rx="50" ry="26" fill={t.layers[0]} opacity="0.55" />}
          {o === 'edge' && t.layers.map((c, i) => <rect key={i} x={40 + i * 16} y="20" width="16" height="84" fill={c} opacity="0.55" />)}
          {o === 'end' && <circle cx="70" cy="60" r="26" fill="none" stroke={t.layers[1] ?? t.layers[0]} strokeWidth="10" opacity="0.65" />}
        </motion.g>
      </g>
      <g transform="translate(190 30)">
        <text y="-6" fontSize="11" fill="var(--ink-2)">Section preview (schematic)</text>
        <rect width="130" height="90" rx="4" fill="var(--paper)" stroke="var(--ink)" />
        {o === 'edge' && t.layers.map((c, i) => <rect key={i} x="15" y={20 + i * 18} width="100" height="18" fill={c} opacity="0.5" />)}
        {o === 'flat' && <ellipse cx="65" cy="45" rx="45" ry="24" fill={t.layers[0]} opacity="0.5" />}
        {o === 'end' && (t.id === 'vessel' ? <circle cx="65" cy="45" r="26" fill="none" stroke={t.layers[1]} strokeWidth="12" opacity="0.6" /> : <rect x="55" y="30" width="20" height="30" fill={t.layers[0]} opacity="0.5" />)}
      </g>
    </svg>
  )
}

export default function EmbeddingStudio({ finish }: SimProps) {
  const [idx, setIdx] = useState(0)
  const [orient, setOrient] = useState<Orientation>('flat')
  const [turn, setTurn] = useState(0)
  const [results, setResults] = useState<Record<string, Orientation>>({})
  const [locked, setLocked] = useState(false)
  const t = TISSUES[idx]
  const allDone = Object.keys(results).length === TISSUES.length
  const correctCount = TISSUES.filter((x) => results[x.id] === x.best).length

  const tip = (d: number) => setOrient(ORIENTS[(ORIENTS.indexOf(orient) + d + 3) % 3])
  const onKey = (e: KeyboardEvent) => {
    if (locked) return
    if (e.key === 'ArrowUp') { e.preventDefault(); tip(1) }
    if (e.key === 'ArrowDown') { e.preventDefault(); tip(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); setTurn((r) => r + 90) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setTurn((r) => r - 90) }
  }

  return (
    <div>
      <SimNotice>Schematic geometry. Orientation decides which structures fall in the plane of section; the drawings show that relationship, not real tissue.</SimNotice>
      <div className="row" style={{ margin: '12px 0 18px' }} role="tablist" aria-label="Tissues">
        {TISSUES.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === idx} className="chip-btn" aria-pressed={i === idx} onClick={() => { setIdx(i); setOrient('flat'); setTurn(0); setLocked(!!results[x.id]) }}>
            {x.name} {results[x.id] && (results[x.id] === x.best ? '✓' : '·')}
          </button>
        ))}
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: 'var(--t-3)' }}>{t.name}</h2>
          <p>{t.context}</p>
          <div className="demo-frame" tabIndex={0} onKeyDown={onKey} aria-label="Orientation stage. Up and Down arrows tip the tissue; Left and Right arrows turn it in the mold." aria-describedby="orient-now">
            <Preview t={t} o={orient} turn={turn} />
          </div>
          <p id="orient-now" className="small" aria-live="polite" style={{ marginTop: 8 }}>Now: <strong>{ORIENT_LABEL[orient]}</strong>, turned {((turn % 360) + 360) % 360}°.</p>
          <div className="row">
            <button className="btn" disabled={locked} onClick={() => tip(1)}>Tip the tissue</button>
            <button className="btn" disabled={locked} onClick={() => setTurn((r) => r + 90)}><IconRotate /> Turn 90°</button>
          </div>
          <p className="small muted">Keyboard: focus the stage, then use <span className="kbd">↑</span> <span className="kbd">↓</span> to tip and <span className="kbd">←</span> <span className="kbd">→</span> to turn.</p>
        </div>
        <div>
          <div className="panel">
            <h3>What this plane shows</h3>
            <p aria-live="polite">{t.shows[orient]}</p>
            {!locked ? (
              <button className="btn btn-primary" onClick={() => { setResults({ ...results, [t.id]: orient }); setLocked(true) }}>Embed in this orientation</button>
            ) : (
              <div className={`feedback ${results[t.id] === t.best ? 'ok' : 'no'}`} role="status">
                <p style={{ fontWeight: 700, marginBottom: 6 }}>{results[t.id] === t.best ? 'Good orientation.' : `Better: ${ORIENT_LABEL[t.best].toLowerCase()}.`}</p>
                <p style={{ margin: 0 }}>{t.why}</p>
                <p className="small" style={{ margin: '8px 0 0' }}>Turning in the mold changes which edge meets the knife first. Labs set a consistent convention, for example for tough or layered tissue, per local procedure.</p>
              </div>
            )}
            {locked && idx < TISSUES.length - 1 && <button className="btn" style={{ marginTop: 12 }} onClick={() => { setIdx(idx + 1); setOrient('flat'); setTurn(0); setLocked(!!results[TISSUES[idx + 1].id]) }}>Next tissue</button>}
          </div>
          {allDone && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="celebrate">{correctCount} of {TISSUES.length} oriented for diagnosis</p>
              <div className="row">
                <button className="btn btn-primary" onClick={() => finish(correctCount, TISSUES.length, `${correctCount}/${TISSUES.length} orientations`)}>Record this run</button>
                <button className="btn" onClick={() => { setResults({}); setIdx(0); setOrient('flat'); setTurn(0); setLocked(false) }}>Reset</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
