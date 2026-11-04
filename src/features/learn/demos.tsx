import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Swap from '../../ui/Swap'
import type { Lesson } from '../../content/schema'
import { useReducedMotion } from '../../ui/prefs'
import { Segmented, SimNotice } from '../../ui/components'

type Demo = Lesson['demo']

/** Penetration (diffusion front, ~√t) runs ahead of fixation (slower chemical cross-linking). Qualitative only. */
function PenetrationDemo() {
  const [hours, setHours] = useState(4)
  const [size, setSize] = useState<4 | 15>(15)
  const r = 120
  const radiusMm = size / 2
  // Illustrative d = K√t with K = 1 mm/√h (a commonly cited teaching approximation), capped at the radius.
  const pen = Math.min(radiusMm, Math.sqrt(hours))
  const fix = Math.min(radiusMm, Math.sqrt(hours) * 0.55) // fixation lags penetration; the ratio is not a measured value
  const toR = (mm: number) => r * (1 - mm / radiusMm)
  return (
    <div>
      <SimNotice>Conceptual illustration. The penetration front uses the teaching approximation d ≈ K√t. The fixation band is drawn lagging behind to show the idea. It is not a kinetic model of your fixative.</SimNotice>
      <div className="row" style={{ margin: '12px 0' }}>
        <Segmented label="Specimen thickness" value={size} onChange={setSize} options={[{ value: 4, label: '4 mm punch' }, { value: 15, label: '15 mm slice' }]} />
      </div>
      <svg viewBox="0 0 300 300" role="img" aria-label={`Cross-section of a ${size} millimetre specimen after ${hours} hours. Fixative has reached about ${pen.toFixed(1)} mm in from each surface; cross-linking is further behind.`}>
        <circle cx="150" cy="150" r={r} fill="var(--eosin-soft)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="150" cy="150" r={r} fill="var(--amber)" opacity="0.35" />
        <circle cx="150" cy="150" r={Math.max(0, toR(pen))} fill="var(--eosin-soft)" />
        <circle cx="150" cy="150" r={(r + toR(fix)) / 2} fill="none" stroke="var(--hema)" strokeWidth={Math.max(0.1, r - toR(fix))} opacity="0.5" />
        <text x="150" y="150" textAnchor="middle" fontSize="12" fill="var(--ink-2)">{pen >= radiusMm ? 'reached centre' : 'unpenetrated core'}</text>
      </svg>
      <div className="field">
        <label htmlFor="hours">Time in fixative: {hours} h</label>
        <input id="hours" type="range" min={0} max={48} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
      </div>
      <div className="row small" style={{ marginTop: 8 }}>
        <span><span className="tag tag-amber">amber</span> fixative has penetrated</span>
        <span><span className="tag tag-hema">violet</span> cross-linking well under way</span>
        <span><span className="tag tag-eosin">pink</span> not yet reached</span>
      </div>
    </div>
  )
}

function CrosslinkDemo() {
  const reduced = useReducedMotion()
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  const bridges = [60, 120, 180, 240]
  return (
    <div>
      <SimNotice>Schematic of two protein chains. Bridges represent methylene cross-links between reactive groups, such as lysine amino groups.</SimNotice>
      <svg viewBox="0 0 320 160" role="img" aria-label={['Two separate protein chains', 'Chains linked by methylene bridges after formaldehyde', 'Heat retrieval has broken some bridges'][stage]}>
        <path d="M20 50 Q80 30 140 50 T300 50" stroke="var(--hema)" strokeWidth="5" fill="none" />
        <path d="M20 110 Q80 130 140 110 T300 110" stroke="var(--eosin)" strokeWidth="5" fill="none" />
        {bridges.map((x, i) => {
          const visible = stage === 1 || (stage === 2 && i % 2 === 0)
          return (
            <motion.g key={x} initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : i * 0.1 }}>
              <line x1={x} y1={52} x2={x} y2={108} stroke="var(--ink)" strokeWidth="2.5" strokeDasharray="5 3" />
              <text x={x + 4} y={84} fontSize="10" fill="var(--ink-2)">–CH₂–</text>
            </motion.g>
          )
        })}
        {stage === 2 && <text x="20" y="150" fontSize="11" fill="var(--teal)">Epitope partly exposed again</text>}
      </svg>
      <div className="row">
        <button className="btn" onClick={() => setStage(0)} aria-pressed={stage === 0}>Fresh tissue</button>
        <button className="btn" onClick={() => setStage(1)} aria-pressed={stage === 1}>Add formaldehyde</button>
        <button className="btn" onClick={() => setStage(2)} aria-pressed={stage === 2}>Heat-induced retrieval</button>
      </div>
    </div>
  )
}

function SequenceDemo({ steps }: { steps: Demo['steps'] }) {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    if (i >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setI((x) => x + 1), reduced ? 900 : 1600)
    return () => clearTimeout(t)
  }, [playing, i, steps.length, reduced])
  if (!steps.length) return <p className="muted">No steps defined.</p>
  const w = 300
  const x = steps.length > 1 ? 20 + (i / (steps.length - 1)) * (w - 40) : w / 2
  return (
    <div>
      <svg viewBox={`0 0 ${w} 70`} role="img" aria-label={`Step ${i + 1} of ${steps.length}: ${steps[i].label}`}>
        <line x1="20" y1="35" x2={w - 20} y2="35" stroke="var(--rule)" strokeWidth="3" />
        {steps.map((s, k) => {
          const cx = steps.length > 1 ? 20 + (k / (steps.length - 1)) * (w - 40) : w / 2
          return <circle key={s.label} cx={cx} cy={35} r={8} fill={k <= i ? 'var(--hema)' : 'var(--paper)'} stroke="var(--hema)" strokeWidth="2" />
        })}
        <motion.rect y={18} width={26} height={10} rx={2} fill="var(--eosin)" opacity={0.75} initial={false} animate={{ x: x - 13 }} transition={{ duration: reduced ? 0 : 0.5, ease: [0.2, 0.7, 0.2, 1] }} />
      </svg>
      <Swap id={i} x={0} aria-live="polite">
        <h4 style={{ margin: '10px 0 4px' }}>{i + 1}. {steps[i].label}</h4>
        <p style={{ margin: 0 }}>{steps[i].detail}</p>
      </Swap>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>Previous step</button>
        <button className="btn" onClick={() => setI(Math.min(steps.length - 1, i + 1))} disabled={i === steps.length - 1}>Next step</button>
        <button className="btn btn-quiet" onClick={() => { if (i === steps.length - 1) setI(0); setPlaying(!playing) }}>{playing ? 'Pause' : i === steps.length - 1 ? 'Replay' : 'Play through'}</button>
      </div>
    </div>
  )
}

function EmbeddingPlaneDemo() {
  const [mode, setMode] = useState<'edge' | 'flat'>('edge')
  return (
    <div>
      <SimNotice>Schematic. Skin layers are drawn as simple bands to show which layers a section plane can include.</SimNotice>
      <Segmented label="Embedding orientation" value={mode} onChange={setMode} options={[{ value: 'edge', label: 'On edge' }, { value: 'flat', label: 'Flat' }]} />
      <svg viewBox="0 0 320 150" role="img" aria-label={mode === 'edge' ? 'On-edge embedding: the section shows epidermis, dermis and subcutis together' : 'Flat embedding: the first sections show only one layer'}>
        <g transform="translate(20 20)">
          <text y="-6" fontSize="10" fill="var(--ink-2)">Mold seen from above (the cut face)</text>
          <rect width="120" height="110" fill="var(--amber-soft)" stroke="var(--ink)" />
          {mode === 'edge' ? (
            <g transform="translate(30 10)">
              <rect width="10" height="90" fill="var(--hema)" opacity="0.85" />
              <rect x="10" width="30" height="90" fill="var(--eosin)" opacity="0.45" />
              <rect x="40" width="20" height="90" fill="var(--amber)" opacity="0.45" />
            </g>
          ) : (
            <ellipse cx="60" cy="55" rx="45" ry="30" fill="var(--hema)" opacity="0.6" />
          )}
        </g>
        <g transform="translate(180 30)">
          <text y="-6" fontSize="10" fill="var(--ink-2)">What the section shows</text>
          <rect width="120" height="70" rx="3" fill="var(--paper)" stroke="var(--ink)" />
          {mode === 'edge' ? (
            <g transform="translate(15 22)">
              <rect width="90" height="6" fill="var(--hema)" />
              <rect y="6" width="90" height="14" fill="var(--eosin)" opacity="0.5" />
              <rect y="20" width="90" height="10" fill="var(--amber)" opacity="0.5" />
            </g>
          ) : (
            <ellipse cx="60" cy="35" rx="40" ry="22" fill="var(--hema)" opacity="0.55" />
          )}
          <text y="90" fontSize="10" fill="var(--ink-2)">{mode === 'edge' ? 'All layers in one view' : 'Epidermis only, then dermis'}</text>
        </g>
      </svg>
    </div>
  )
}

function SectionRibbonDemo() {
  const reduced = useReducedMotion()
  const [turns, setTurns] = useState(3)
  const [fault, setFault] = useState<'none' | 'chatter' | 'compression'>('none')
  return (
    <div>
      <SimNotice>Schematic microtome ribbon. Turn the handwheel to cut sections, and add a fault to see how it shows on the ribbon. Real causes overlap; see the Microtomy challenge.</SimNotice>
      <Segmented label="Condition" value={fault} onChange={setFault} options={[{ value: 'none', label: 'Good setup' }, { value: 'chatter', label: 'Vibration / loose part' }, { value: 'compression', label: 'Warm block, dull edge' }]} />
      <svg viewBox="0 0 320 120" role="img" aria-label={`${turns} sections in the ribbon; ${fault === 'none' ? 'flat, even sections' : fault === 'chatter' ? 'sections show parallel thick-thin bands' : 'sections are shortened and wrinkled'}`}>
        <rect x="10" y="30" width="40" height="50" fill="var(--amber-soft)" stroke="var(--ink)" />
        <path d="M50 82l18-6v8z" fill="var(--ink-3)" />
        {Array.from({ length: turns }, (_, k) => {
          const h = fault === 'compression' ? 34 : 46
          return (
            <motion.g key={k} initial={reduced ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <rect x={70 + k * 40} y={80 - h} width={38} height={h} fill="var(--eosin)" opacity={0.35} stroke="var(--eosin)" strokeOpacity={0.4} />
              {fault === 'chatter' && Array.from({ length: 8 }, (_, j) => <rect key={j} x={70 + k * 40} y={80 - h + j * 6} width={38} height={2} fill="var(--eosin)" opacity={0.6} />)}
              {fault === 'compression' && <path d={`M${76 + k * 40} 50 q6 14 0 28 M${92 + k * 40} 50 q6 14 0 28`} stroke="var(--eosin)" fill="none" />}
            </motion.g>
          )
        })}
      </svg>
      <div className="row">
        <button className="btn" onClick={() => setTurns((t) => Math.min(6, t + 1))} disabled={turns >= 6}>Turn handwheel</button>
        <button className="btn btn-quiet" onClick={() => setTurns(1)}>Trim ribbon</button>
      </div>
    </div>
  )
}

const PAS_TARGETS = [
  { id: 'glycogen', label: 'Glycogen', pas: true, diastase: false },
  { id: 'mucin', label: 'Neutral mucin', pas: true, diastase: true },
  { id: 'fungus', label: 'Fungal wall', pas: true, diastase: true },
  { id: 'bm', label: 'Basement membrane', pas: true, diastase: true },
]

function PasDiastaseDemo() {
  const [step, setStep] = useState(0)
  const labels = ['Sections deparaffinized', 'Diastase on slide B only', 'Periodic acid: 1,2-glycols → aldehydes', 'Schiff reagent binds aldehydes', 'Counterstain and compare']
  const colored = step >= 3
  return (
    <div>
      <SimNotice>Target-matching schematic: each dot is a labelled target, not a microscope image. Colour appears only once the chemistry that produces it has run.</SimNotice>
      <div className="grid-2">
        {(['A: PAS', 'B: PAS with diastase'] as const).map((title, k) => (
          <figure key={title} style={{ margin: 0 }}>
            <figcaption style={{ fontWeight: 700, marginBottom: 6 }}>{title}</figcaption>
            <svg viewBox="0 0 220 120" role="img" aria-label={`${title}: ${PAS_TARGETS.map((t) => `${t.label} ${!colored ? 'unstained' : k === 1 && step >= 1 && !t.diastase ? 'removed by diastase, unstained' : 'magenta'}`).join('; ')}`}>
              <rect width="220" height="120" rx="8" fill="var(--paper)" stroke="var(--rule)" />
              {PAS_TARGETS.map((t, i) => {
                const removed = k === 1 && step >= 1 && !t.diastase
                return (
                  <g key={t.id} transform={`translate(${20 + i * 50} 30)`}>
                    <circle cx="14" cy="20" r="14" fill={removed ? 'none' : colored ? '#b8327a' : 'var(--vellum)'} stroke={removed ? 'var(--ink-3)' : 'none'} strokeDasharray="3 3" style={{ transition: 'fill 500ms' }} />
                    <text x="14" y="58" fontSize="8.5" textAnchor="middle" fill="var(--ink-2)">{t.label.split(' ')[0]}</text>
                    <text x="14" y="68" fontSize="8.5" textAnchor="middle" fill="var(--ink-2)">{t.label.split(' ')[1] ?? ''}</text>
                  </g>
                )
              })}
            </svg>
          </figure>
        ))}
      </div>
      <p aria-live="polite" style={{ marginTop: 12 }}><strong>Step {step + 1}:</strong> {labels[step]}</p>
      <div className="row">
        <button className="btn" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Previous step</button>
        <button className="btn btn-primary" onClick={() => setStep(Math.min(labels.length - 1, step + 1))} disabled={step === labels.length - 1}>Run next step</button>
        <button className="btn btn-quiet" onClick={() => setStep(0)}>Reset</button>
      </div>
    </div>
  )
}

const IHC_STEPS = [
  { id: 'retrieval', label: 'Antigen retrieval', miss: 'Without retrieval, many formalin-masked epitopes stay hidden: weak or absent staining.' },
  { id: 'block', label: 'Peroxidase block', miss: 'Without blocking, endogenous peroxidase (e.g. in red cells) gives false brown signal.' },
  { id: 'primary', label: 'Primary antibody', miss: 'No primary means no specific signal; this is how a negative reagent control is built.' },
  { id: 'polymer', label: 'Polymer–enzyme detection', miss: 'Without detection there is no enzyme to convert chromogen.' },
  { id: 'dab', label: 'DAB chromogen', miss: 'Without chromogen nothing visible forms, even if antibodies bound.' },
  { id: 'counter', label: 'Hematoxylin counterstain', miss: 'Without counterstain, positive cells cannot be placed in context.' },
]

function IhcLayersDemo() {
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(IHC_STEPS.map((s) => [s.id, true])))
  const all = IHC_STEPS.every((s) => on[s.id])
  const signal = on.primary && on.polymer && on.dab ? (on.retrieval ? 'strong' : 'weak') : 'none'
  const missing = IHC_STEPS.filter((s) => !on[s.id])
  return (
    <div>
      <SimNotice>Qualitative logic model of a polymer IHC protocol. Turn steps off to see the expected kind of failure. Real runs need controls to tell causes apart.</SimNotice>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <ul className="bench" aria-label="Protocol steps">
          {IHC_STEPS.map((s) => (
            <li key={s.id} className="bench-step" style={{ gridTemplateColumns: '1fr auto' }}>
              <label htmlFor={`ihc-${s.id}`}>{s.label}</label>
              <input id={`ihc-${s.id}`} type="checkbox" checked={on[s.id]} onChange={(e) => setOn({ ...on, [s.id]: e.target.checked })} style={{ width: 22, height: 22 }} />
            </li>
          ))}
        </ul>
        <div>
          <svg viewBox="0 0 220 140" role="img" aria-label={`Predicted slide: specific signal ${signal}; ${!on.block && signal !== 'none' ? 'plus false-positive background in red cells; ' : ''}${on.counter ? 'nuclei counterstained' : 'no counterstain'}`}>
            <rect width="220" height="140" rx="8" fill="var(--paper)" stroke="var(--rule)" />
            {Array.from({ length: 14 }, (_, i) => {
              const cx = 22 + (i % 7) * 30
              const cy = 40 + Math.floor(i / 7) * 50
              const positive = i % 3 === 0
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={11} fill={positive && signal !== 'none' ? '#7a4a1f' : 'var(--vellum)'} opacity={positive && signal === 'weak' ? 0.3 : 0.85} />
                  <circle cx={cx} cy={cy} r={4} fill={on.counter ? 'var(--hema)' : 'var(--rule)'} />
                </g>
              )
            })}
            {!on.block && on.dab && on.polymer && [[60, 118], [150, 118]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={6} fill="#7a4a1f" opacity="0.7" />)}
          </svg>
          <p aria-live="polite" className="small" style={{ marginTop: 8 }}>
            {all ? 'Complete protocol: brown signal only where the target is, blue nuclei for context.' : missing.map((m) => m.miss).join(' ')}
          </p>
        </div>
      </div>
    </div>
  )
}

function DilutionBench() {
  const [stock, setStock] = useState(100)
  const [target, setTarget] = useState(70)
  const [vol, setVol] = useState(500)
  const valid = target < stock && target > 0
  const v1 = valid ? (target * vol) / stock : 0
  return (
    <div>
      <p className="small muted">The arithmetic here is exact: C₁V₁ = C₂V₂.</p>
      <div className="grid-3">
        <div className="field"><label htmlFor="db-s">Stock concentration (%)</label><input id="db-s" className="input" type="number" min={1} max={100} value={stock} onChange={(e) => setStock(Number(e.target.value))} /></div>
        <div className="field"><label htmlFor="db-t">Wanted concentration (%)</label><input id="db-t" className="input" type="number" min={0} max={100} value={target} onChange={(e) => setTarget(Number(e.target.value))} /></div>
        <div className="field"><label htmlFor="db-v">Final volume (mL)</label><input id="db-v" className="input" type="number" min={1} value={vol} onChange={(e) => setVol(Number(e.target.value))} /></div>
      </div>
      <svg viewBox="0 0 320 140" role="img" aria-label={valid ? `Measure ${v1.toFixed(1)} mL of stock and bring to ${vol} mL` : 'Wanted concentration must be below the stock concentration'} style={{ marginTop: 12 }}>
        <rect x="120" y="10" width="60" height="120" rx="6" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        {valid && (
          <>
            <rect x="122" y={128 - (v1 / vol) * 116} width="56" height={(v1 / vol) * 116} fill="var(--hema)" opacity="0.55" />
            <rect x="122" y="12" width="56" height={116 - (v1 / vol) * 116} fill="var(--teal)" opacity="0.18" />
          </>
        )}
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="120" x2="132" y1={128 - f * 116} y2={128 - f * 116} stroke="var(--ink)" />)}
        <text x="190" y="60" fontSize="11" fill="var(--ink)">{valid ? `${Number(v1.toFixed(2))} mL stock` : '—'}</text>
        <text x="190" y="80" fontSize="11" fill="var(--ink-2)">{valid ? `+ ${Number((vol - v1).toFixed(2))} mL diluent` : ''}</text>
        <text x="10" y="70" fontSize="11" fill="var(--ink-2)">{`${target}% × ${vol} mL`}</text>
        <text x="10" y="86" fontSize="11" fill="var(--ink-2)">{`÷ ${stock}%`}</text>
      </svg>
      {!valid && <p className="small" style={{ color: 'var(--danger)' }}>The wanted concentration must be above zero and below the stock concentration.</p>}
    </div>
  )
}

export default function LessonDemo({ demo }: { demo: Demo }) {
  const body = (() => {
    switch (demo.key) {
      case 'penetration-vs-fixation': return <PenetrationDemo />
      case 'crosslink': return <CrosslinkDemo />
      case 'sequence': return <SequenceDemo steps={demo.steps} />
      case 'embedding-plane': return <EmbeddingPlaneDemo />
      case 'section-ribbon': return <SectionRibbonDemo />
      case 'pas-diastase': return <PasDiastaseDemo />
      case 'ihc-layers': return <IhcLayersDemo />
      case 'dilution-bench': return <DilutionBench />
    }
  })()
  return (
    <figure className="demo-frame" style={{ margin: 0 }}>
      {body}
      <figcaption className="small muted" style={{ marginTop: 12 }}>{demo.caption}</figcaption>
    </figure>
  )
}
