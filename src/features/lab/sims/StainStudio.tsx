import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { IconDown, IconUp } from '../../../art/icons'
import { StainRack } from '../../../art/illustrations'
import { ATLAS } from '../../../content'
import { hashString, shuffle } from '../../../engine/random'
import { Segmented, SimNotice } from '../../../ui/components'
import { useReducedMotion } from '../../../ui/prefs'
import type { SimProps } from '../SimPage'

interface Step { id: string; label: string }

const HE: Step[] = [
  { id: 'dewax', label: 'Deparaffinize in xylene' },
  { id: 'hydrate', label: 'Hydrate through graded alcohols to water' },
  { id: 'hema', label: 'Hematoxylin (aluminium lake, regressive)' },
  { id: 'rinse', label: 'Rinse in water' },
  { id: 'diff', label: 'Differentiate in acid alcohol' },
  { id: 'blue', label: 'Bluing reagent' },
  { id: 'eosin', label: 'Eosin' },
  { id: 'dehyd', label: 'Dehydrate through alcohols' },
  { id: 'clear', label: 'Clear in xylene' },
  { id: 'mount', label: 'Coverslip with resinous mounting medium' },
]

/** Ordering constraints, each with the consequence of breaking it. */
const HE_RULES: { before: string; after: string; why: string }[] = [
  { before: 'dewax', after: 'hydrate', why: 'Paraffin must be removed first. Wax left behind blocks aqueous reagents and gives patchy, unstained areas.' },
  { before: 'hydrate', after: 'hema', why: 'Aluminium hematoxylin is aqueous. Sections must reach water before the dye can penetrate evenly.' },
  { before: 'hema', after: 'diff', why: 'Differentiation removes excess hematoxylin, so it has to follow the hematoxylin.' },
  { before: 'hema', after: 'rinse', why: 'The rinse removes unbound hematoxylin before differentiation.' },
  { before: 'rinse', after: 'diff', why: 'Rinse before the acid alcohol so excess dye does not dump into the differentiator.' },
  { before: 'diff', after: 'blue', why: 'Bluing converts the soluble red lake to an insoluble blue one. Acid after bluing reverses it and makes differentiation hard to control.' },
  { before: 'blue', after: 'eosin', why: 'Eosin before the acid and alkaline steps would be partly extracted, giving pale or uneven cytoplasm.' },
  { before: 'eosin', after: 'dehyd', why: 'Dehydrating alcohols also differentiate eosin, so they come after it.' },
  { before: 'dehyd', after: 'clear', why: 'Xylene is not miscible with water. Clearing before full dehydration leaves the slide hazy and milky.' },
  { before: 'clear', after: 'mount', why: 'Resinous media are xylene-miscible. Water or alcohol left on the slide causes cloudiness and fading.' },
]

const PAS_TARGETS = [
  { id: 'glycogen', label: 'Glycogen in hepatocytes', pas: true, pasd: false, why: 'Glycogen is PAS-positive and diastase removes it, so it is negative after digestion.' },
  { id: 'fungi', label: 'Fungal hyphae in a nail plate', pas: true, pasd: true, why: 'Fungal wall polysaccharides resist diastase. PAS-D shows fungi without glycogen in the way, which is why it suits nail clippings.' },
  { id: 'bm', label: 'Epidermal basement membrane', pas: true, pasd: true, why: 'Basement membrane glycoproteins are PAS-positive and diastase-resistant.' },
  { id: 'neutral', label: 'Neutral mucin in goblet cells', pas: true, pasd: true, why: 'Neutral mucins are PAS-positive and not digested by diastase.' },
  { id: 'lipid', label: 'Lipid droplets in processed paraffin tissue', pas: false, pasd: false, why: 'Lipid is dissolved during routine processing, and simple lipids are not PAS reactive anyway.' },
]

const PAS_STEPS: Step[] = [
  { id: 'dewax', label: 'Deparaffinize and hydrate to water' },
  { id: 'diastase', label: 'Diastase (slide B and its control only)' },
  { id: 'pa', label: 'Periodic acid: oxidize 1,2-glycols to aldehydes' },
  { id: 'rinse', label: 'Rinse' },
  { id: 'schiff', label: 'Schiff reagent: binds aldehydes, giving magenta' },
  { id: 'wash', label: 'Wash in warm running water to develop colour' },
  { id: 'counter', label: 'Hematoxylin counterstain' },
  { id: 'finish', label: 'Dehydrate, clear and coverslip' },
]

function Sequencer({ steps, seedKey, onSolved, explain }: { steps: Step[]; seedKey: string; onSolved: (tries: number) => void; explain: (order: Step[]) => string[] }) {
  const reduced = useReducedMotion()
  const [seed, setSeed] = useState(0)
  const initial = useMemo(() => shuffle(steps, hashString(`${seedKey}-${seed}`)), [steps, seedKey, seed])
  const [order, setOrder] = useState<Step[]>(initial)
  const [tries, setTries] = useState(0)
  const [problems, setProblems] = useState<string[] | null>(null)
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= order.length) return
    const n = order.slice()
    ;[n[i], n[j]] = [n[j], n[i]]
    setOrder(n)
    setProblems(null)
  }
  return (
    <div>
      <ol className="bench" aria-label="Staining sequence">
        {order.map((s, i) => (
          <motion.li layout={!reduced} key={s.id} className="bench-step" data-state={problems && problems.length === 0 ? 'right' : ''}>
            <span className="num">{i + 1}</span>
            <span>{s.label}</span>
            <span className="row" style={{ gap: 4 }}>
              <button className="icon-btn" aria-label={`Move step ${i + 1}, ${s.label}, up`} disabled={i === 0} onClick={() => move(i, -1)}><IconUp /></button>
              <button className="icon-btn" aria-label={`Move step ${i + 1}, ${s.label}, down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}><IconDown /></button>
            </span>
          </motion.li>
        ))}
      </ol>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={() => { const p = explain(order); setProblems(p); setTries(tries + 1); if (!p.length) onSolved(tries + 1) }}>Run the stain</button>
        <button className="btn btn-quiet" onClick={() => { setSeed(seed + 1); setOrder(shuffle(steps, hashString(`${seedKey}-${seed + 1}`))); setProblems(null); setTries(0) }}>Reshuffle</button>
      </div>
      {problems && (
        <div className={`feedback ${problems.length ? 'no' : 'ok'}`} role="status">
          {problems.length ? (
            <>
              <p style={{ fontWeight: 700 }}>The slide would show problems:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </>
          ) : (
            <p style={{ margin: 0 }}><strong>Sequence works.</strong> Each step prepares the section for the next.</p>
          )}
        </div>
      )}
    </div>
  )
}

const ruleCheck = (rules: typeof HE_RULES) => (order: Step[]) => {
  const pos = Object.fromEntries(order.map((s, i) => [s.id, i]))
  return rules.filter((r) => pos[r.before] > pos[r.after]).map((r) => r.why)
}

const PAS_RULES = [
  { before: 'dewax', after: 'diastase', why: 'The enzyme is aqueous and needs a hydrated section.' },
  { before: 'diastase', after: 'pa', why: 'Digestion must remove glycogen before oxidation and Schiff, or the glycogen is already coloured.' },
  { before: 'pa', after: 'schiff', why: 'Schiff reagent reacts with aldehydes, and the aldehydes only exist after periodic acid oxidation.' },
  { before: 'rinse', after: 'schiff', why: 'Rinse off periodic acid before Schiff so carried-over oxidant does not affect the reagent.' },
  { before: 'pa', after: 'rinse', why: 'The rinse removes periodic acid, so it follows that step.' },
  { before: 'schiff', after: 'wash', why: 'The warm water wash develops the magenta colour after Schiff.' },
  { before: 'wash', after: 'counter', why: 'Counterstain after the PAS colour is developed.' },
  { before: 'counter', after: 'finish', why: 'Dehydrate, clear and mount last.' },
]

export default function StainStudio({ finish }: SimProps) {
  const [tab, setTab] = useState<'he' | 'pas' | 'library'>('he')
  const [heTries, setHeTries] = useState<number>()
  const [pasTries, setPasTries] = useState<number>()
  const [pred, setPred] = useState<Record<string, { pas?: boolean; pasd?: boolean }>>({})
  const [predShown, setPredShown] = useState(false)
  const [control, setControl] = useState<string>()
  const [recorded, setRecorded] = useState(false)
  const [filter, setFilter] = useState('')

  const predScore = PAS_TARGETS.filter((t) => pred[t.id]?.pas === t.pas && pred[t.id]?.pasd === t.pasd).length
  const controlOk = control === 'liver'
  const canRecord = heTries !== undefined && pasTries !== undefined && predShown && control
  const stains = ATLAS.filter((a) => a.kind === 'stain' && (a.name + a.aka.join(' ') + a.summary).toLowerCase().includes(filter.toLowerCase()))

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <Segmented label="Stain studio section" value={tab} onChange={setTab} options={[{ value: 'he', label: 'H&E sequence' }, { value: 'pas', label: 'PAS vs PAS-D' }, { value: 'library', label: 'Stain library' }]} />
        <StainRack size={180} />
      </div>
      <SimNotice>Reasoning studio. Results are predicted from documented staining principles and shown as labelled schematics. HistoQuest never tints a picture and calls it a stained slide.</SimNotice>

      {tab === 'he' && (
        <section className="grid-2" style={{ alignItems: 'start' }} aria-label="H&E sequencing">
          <div>
            <h2 style={{ fontSize: 'var(--t-3)' }}>Order a regressive H&E</h2>
            <Sequencer steps={HE} seedKey="he" onSolved={(t) => setHeTries((x) => x ?? t)} explain={ruleCheck(HE_RULES)} />
          </div>
          <div className="panel">
            <h3>Reagent roles</h3>
            <ul className="small" style={{ paddingLeft: 18 }}>
              <li><strong>Hematoxylin</strong> is oxidized to hematein, which binds aluminium (the mordant) to form a positively charged lake that attaches to nuclear chromatin.</li>
              <li><strong>Acid alcohol</strong> removes excess dye (regressive method). Progressive methods stop at the endpoint instead, with no differentiation step.</li>
              <li><strong>Bluing</strong> raises the pH, turning the lake insoluble and blue.</li>
              <li><strong>Eosin</strong> is an anionic dye that stains cationic cytoplasmic proteins in shades of pink. Alcohols differentiate it.</li>
            </ul>
            {heTries !== undefined && <p className="celebrate">Solved in {heTries} {heTries === 1 ? 'run' : 'runs'}</p>}
          </div>
        </section>
      )}

      {tab === 'pas' && (
        <section aria-label="PAS versus PAS with diastase">
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 'var(--t-3)' }}>1. Sequence the method</h2>
              <Sequencer steps={PAS_STEPS} seedKey="pas" onSolved={(t) => setPasTries((x) => x ?? t)} explain={ruleCheck(PAS_RULES)} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--t-3)' }}>2. Predict each target</h2>
              <div className="table-scroll">
                <table className="simple">
                  <thead><tr><th>Target</th><th>PAS</th><th>PAS-D</th></tr></thead>
                  <tbody>
                    {PAS_TARGETS.map((t) => (
                      <tr key={t.id}>
                        <td>{t.label}{predShown && <div className="small" style={{ color: pred[t.id]?.pas === t.pas && pred[t.id]?.pasd === t.pasd ? 'var(--teal)' : 'var(--eosin)' }}>{t.why}</div>}</td>
                        {(['pas', 'pasd'] as const).map((k) => (
                          <td key={k}>
                            <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }} role="group" aria-label={`${t.label}, ${k === 'pas' ? 'PAS' : 'PAS with diastase'}`}>
                              {[true, false].map((v) => (
                                <button key={String(v)} className="chip-btn" style={{ minHeight: 36, padding: '4px 10px' }} disabled={predShown} aria-pressed={pred[t.id]?.[k] === v} onClick={() => setPred({ ...pred, [t.id]: { ...pred[t.id], [k]: v } })}>
                                  {v ? 'Magenta' : 'Negative'}
                                </button>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!predShown ? (
                <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={PAS_TARGETS.some((t) => pred[t.id]?.pas === undefined || pred[t.id]?.pasd === undefined)} onClick={() => setPredShown(true)}>Check predictions</button>
              ) : (
                <p className="celebrate" style={{ marginTop: 12 }}>{predScore} of {PAS_TARGETS.length} predicted correctly</p>
              )}
            </div>
          </div>
          <div className="panel" style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 'var(--t-3)' }}>3. Choose the control</h2>
            <p>Your PAS-D run on a nail clipping must show the diastase actually worked. Which control set do you run alongside it?</p>
            <ul className="options">
              {[
                { id: 'liver', text: 'A glycogen-rich control (such as liver), cut in two: one PAS, one diastase-digested' },
                { id: 'nail', text: 'A second section of the same nail clipping, PAS only' },
                { id: 'kidney', text: 'Kidney stained with PAS only, to show basement membranes' },
                { id: 'none', text: 'No control is needed, because fungi are diastase-resistant' },
              ].map((o) => (
                <li key={o.id}>
                  <button className={`option ${control ? (o.id === 'liver' ? 'is-correct' : control === o.id ? 'is-wrong' : '') : ''}`} disabled={!!control} aria-pressed={control === o.id} onClick={() => setControl(o.id)}>
                    <span>{o.text}</span>
                  </button>
                </li>
              ))}
            </ul>
            {control && (
              <p className={`feedback ${controlOk ? 'ok' : 'no'}`} role="status">
                Glycogen should be magenta on the undigested control and absent on the digested one. That proves the PAS chemistry worked and that the enzyme was active. Without it, a negative PAS-D slide cannot be interpreted. Kidney shows that PAS works, but not that diastase did.
              </p>
            )}
          </div>
          {canRecord && !recorded && (
            <button className="btn btn-primary btn-big" style={{ marginTop: 18 }} onClick={() => {
              setRecorded(true)
              const correct = (heTries === 1 ? 1 : 0) + (pasTries === 1 ? 1 : 0) + predScore + (controlOk ? 1 : 0)
              finish(correct, 3 + PAS_TARGETS.length, `H&E ${heTries} runs, PAS ${pasTries} runs, ${predScore}/${PAS_TARGETS.length} predictions, control ${controlOk ? 'right' : 'wrong'}`)
            }}>Record this studio run</button>
          )}
          {recorded && <p className="celebrate" style={{ marginTop: 14 }}>Run recorded</p>}
          {!canRecord && <p className="small muted" style={{ marginTop: 14 }}>Finish the H&E sequence, the PAS sequence, the predictions and the control choice to record a run.</p>}
        </section>
      )}

      {tab === 'library' && (
        <section aria-label="Stain library">
          <div className="field" style={{ maxWidth: 420, marginBottom: 16 }}>
            <label htmlFor="stain-filter">Filter stains</label>
            <input id="stain-filter" className="input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="e.g. fungi, iron, elastic" />
          </div>
          <ul className="list">
            {stains.map((s) => (
              <li key={s.id}>
                <Link className="list-row" to={`/atlas/${s.id}`}>
                  <span><strong>{s.name}</strong><br /><span className="small muted">{s.facts.find((f) => f.label === 'Target')?.value ?? s.summary}</span></span>
                  <span className="small">Target, principle, reagents, controls, failures</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ marginTop: 10 }}>Interactive sequencing is built for H&E and PAS/PAS-D so far. Other stains are taught through the atlas, lessons and questions.</p>
        </section>
      )}
    </div>
  )
}
