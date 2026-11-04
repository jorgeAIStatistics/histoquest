import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { IconDown, IconUp } from '../../../art/icons'
import { hashString, shuffle } from '../../../engine/random'
import { SimNotice } from '../../../ui/components'
import { useReducedMotion } from '../../../ui/prefs'
import type { SimProps } from '../SimPage'
import { evaluateSequence, STATIONS, type Station } from './processingRules'

const CASES = [
  {
    id: 'mushy',
    title: 'Soft, mushy centre',
    evidence: 'A 5 mm thick slice of fatty tissue comes off a routine overnight run. The block face is soft and the centre crumbles when you section. Edges cut well.',
    options: [
      { id: 'a', text: 'Incomplete fixation or dehydration in the centre, so wax never infiltrated it', correct: true, why: 'The edges are fine and the centre fails. That points to reagents not reaching the core: thick or fatty tissue, too short a schedule, or exhausted alcohols. The usual remedy is to reprocess back through absolute alcohol and clearing.' },
      { id: 'b', text: 'The water bath was too hot', correct: false, why: 'The water bath affects floating sections. It cannot make the block itself soft at the centre.' },
      { id: 'c', text: 'Over-processing made the tissue brittle', correct: false, why: 'Over-processing gives hard, brittle, crumbly tissue throughout, often in small biopsies. It does not give a soft core with good edges.' },
      { id: 'd', text: 'The paraffin melting point was too high', correct: false, why: 'Paraffin choice changes how the whole block sections. It does not explain a centre-only failure.' },
    ],
  },
  {
    id: 'milky',
    title: 'Milky clearing agent',
    evidence: 'The first xylene station looks cloudy after the run. The rotation log shows the absolute alcohols were last changed well past their scheduled interval.',
    options: [
      { id: 'a', text: 'Paraffin contaminated the xylene', correct: false, why: 'Wax carryover goes the other way (xylene into wax) and does not turn xylene milky.' },
      { id: 'b', text: 'Water carried over because the "absolute" alcohols are diluted', correct: true, why: 'Water and xylene do not mix, so water forms a cloudy emulsion. Exhausted absolute alcohols pass water forward. Rotate or replace the alcohols, then reprocess the affected tissue.' },
      { id: 'c', text: 'The fixative was unbuffered', correct: false, why: 'Unbuffered formalin causes acid formaldehyde hematin pigment. It does not cloud xylene.' },
      { id: 'd', text: 'The tissue was too small', correct: false, why: 'Small tissue is more at risk of over-processing. It does not cause turbid clearing agent.' },
    ],
  },
  {
    id: 'brittle',
    title: 'Brittle small biopsies',
    evidence: 'Several 2 mm skin punch biopsies were placed on the long overnight program meant for large specimens. Sections shatter and show cracks.',
    options: [
      { id: 'a', text: 'Under-dehydration', correct: false, why: 'Under-dehydration gives soft, mushy blocks, the opposite of what you see.' },
      { id: 'b', text: 'Dull knife only', correct: false, why: 'A dull knife can add problems, but the processing history already explains the brittleness. Change one variable and recut to confirm.' },
      { id: 'c', text: 'Over-processing: too long in dehydrants, clearing agent and hot wax for small tissue', correct: true, why: 'Small biopsies reach equilibrium quickly. Long exposure over-hardens and dries them. Labs use shorter biopsy schedules. Soaking the block face can help sectioning, but the damage is not fully reversible.' },
      { id: 'd', text: 'Wrong embedding orientation', correct: false, why: 'Orientation decides which structures are shown. It does not cause brittleness.' },
    ],
  },
]

export default function ProcessingBench({ finish }: SimProps) {
  const reduced = useReducedMotion()
  const [seed, setSeed] = useState(1)
  const initial = useMemo(() => shuffle(STATIONS, hashString(`proc-${seed}`)), [seed])
  const [order, setOrder] = useState<Station[]>(initial)
  const [checked, setChecked] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hint, setHint] = useState(false)
  const [caseIdx, setCaseIdx] = useState(0)
  const [caseAns, setCaseAns] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const findings = evaluateSequence(order)
  const errors = findings.filter((f) => f.severity === 'error')
  const solved = checked && errors.length === 0

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= order.length) return
    const next = order.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrder(next)
    setChecked(false)
  }
  const reset = () => {
    setSeed((s) => s + 1)
    setOrder(shuffle(STATIONS, hashString(`proc-${seed + 1}`)))
    setChecked(false)
    setAttempts(0)
    setHint(false)
    setCaseIdx(0)
    setCaseAns({})
    setDone(false)
  }

  const c = CASES[caseIdx]
  const caseScore = CASES.filter((x) => x.options.find((o) => o.id === caseAns[x.id])?.correct).length

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <section aria-labelledby="seq-h">
        <h2 id="seq-h" style={{ fontSize: 'var(--t-3)' }}>1. Build the schedule</h2>
        <SimNotice>Rule-based model. It checks the order against documented principles of miscibility and graded dehydration. It does not simulate times or temperatures.</SimNotice>
        <p className="small muted">Use the arrow buttons to move a station up or down. With a keyboard, Tab to a button and press Enter.</p>
        <ol className="bench" aria-label="Processing schedule">
          {order.map((s, i) => {
            const f = checked ? findings.find((x) => x.index === i) : undefined
            return (
              <motion.li key={s.id} layout={!reduced} className="bench-step" data-state={f ? (f.severity === 'error' ? 'wrong' : '') : solved ? 'right' : ''}>
                <span className="num">{i + 1}</span>
                <span>{s.label}{f && <span className="small" style={{ display: 'block', color: 'var(--eosin)' }}>{f.problem}</span>}</span>
                <span className="row" style={{ gap: 4 }}>
                  <button className="icon-btn" aria-label={`Move step ${i + 1}, ${s.label}, up`} disabled={i === 0} onClick={() => move(i, -1)}><IconUp /></button>
                  <button className="icon-btn" aria-label={`Move step ${i + 1}, ${s.label}, down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}><IconDown /></button>
                </span>
              </motion.li>
            )
          })}
        </ol>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => { setChecked(true); setAttempts((a) => a + 1) }}>Run the processor</button>
          <button className="btn btn-quiet" onClick={() => setHint(true)}>Hint</button>
          <button className="btn btn-quiet" onClick={reset}>Reset and reshuffle</button>
        </div>
        {hint && <p className="inset small" style={{ marginTop: 12 }}>Ask one question at each step: is the next reagent miscible with the one before it? Water must be fully gone before xylene. Xylene is the bridge to wax.</p>}
        {checked && (
          <div className={`feedback ${solved ? 'ok' : 'no'}`} role="status">
            {solved ? (
              <p style={{ margin: 0 }}><strong>Blocks are well infiltrated.</strong> Each reagent is miscible with the one before it: fixative, graded alcohols to absolute, xylene, then wax. {attempts > 1 ? `Solved in ${attempts} runs.` : 'First try.'}</p>
            ) : (
              <>
                <p style={{ fontWeight: 700 }}>What comes off this processor:</p>
                {findings.map((f, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <p style={{ margin: 0 }}><strong>{f.severity === 'warning' ? 'Watch out: ' : ''}{f.consequence}</strong></p>
                    <p className="small" style={{ margin: 0 }}>Principle: {f.principle}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="ts-h">
        <h2 id="ts-h" style={{ fontSize: 'var(--t-3)' }}>2. Troubleshoot real-world runs</h2>
        {!solved ? (
          <p className="muted">Unlocks after the schedule runs cleanly. Troubleshooting depends on knowing the correct sequence first.</p>
        ) : done ? (
          <div className="panel">
            <p className="celebrate">Run recorded</p>
            <p>You diagnosed {caseScore} of {CASES.length} failed runs. Your sequence took {attempts} {attempts === 1 ? 'run' : 'runs'}.</p>
            <button className="btn" onClick={reset}>Replay with a new shuffle</button>
          </div>
        ) : (
          <div className="panel">
            <p className="small muted">Case {caseIdx + 1} of {CASES.length}</p>
            <h3>{c.title}</h3>
            <p>{c.evidence}</p>
            <ul className="options">
              {c.options.map((o) => {
                const answered = !!caseAns[c.id]
                return (
                  <li key={o.id}>
                    <button className={`option ${answered ? (o.correct ? 'is-correct' : caseAns[c.id] === o.id ? 'is-wrong' : '') : ''}`} disabled={answered} aria-pressed={caseAns[c.id] === o.id} onClick={() => setCaseAns({ ...caseAns, [c.id]: o.id })}>
                      <span>{o.text}{answered && <span className="rationale" style={{ display: 'block' }}>{o.why}</span>}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {caseAns[c.id] && (
              caseIdx < CASES.length - 1 ? (
                <button className="btn btn-primary" onClick={() => setCaseIdx(caseIdx + 1)}>Next case</button>
              ) : (
                <button className="btn btn-primary" onClick={() => {
                  setDone(true)
                  const correct = (attempts === 1 ? 1 : 0) + caseScore
                  finish(correct, CASES.length + 1, `Sequence in ${attempts} runs; ${caseScore}/${CASES.length} cases`)
                }}>Finish and record</button>
              )
            )}
          </div>
        )}
      </section>
    </div>
  )
}
