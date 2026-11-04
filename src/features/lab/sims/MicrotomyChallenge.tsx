import { useState } from 'react'
import { Schematic } from '../../../art/schematics'
import type { SCHEMATIC_KEYS } from '../../../content/schema'
import { SimNotice } from '../../../ui/components'
import type { SimProps } from '../SimPage'

interface Case {
  id: string
  title: string
  art: (typeof SCHEMATIC_KEYS)[number]
  presentation: string
  checks: { id: string; label: string; finding: string; relevant: boolean }[]
  causes: { id: string; label: string; plausible: boolean; note: string }[]
  fixes: { id: string; label: string; works: boolean; result: string }[]
}

/**
 * Qualitative troubleshooting cases. Each artifact has more than one plausible cause; the
 * investigation findings decide which is most likely in THIS case.
 */
const CASES: Case[] = [
  {
    id: 'chatter', title: 'Thick-and-thin bands', art: 'artifact-chatter',
    presentation: 'Sections from a firm uterine wall block show evenly spaced bands parallel to the knife edge.',
    checks: [
      { id: 'clamp', label: 'Check block and blade clamps', finding: 'The blade holder lever is not fully tightened. The blade moves slightly when touched.', relevant: true },
      { id: 'angle', label: 'Check clearance angle', finding: 'Clearance angle is at the lab’s usual setting.', relevant: true },
      { id: 'proc', label: 'Review processing record', finding: 'Routine schedule, no deviations logged.', relevant: true },
      { id: 'bath', label: 'Check water bath temperature', finding: 'Normal. The bands are present before the sections touch the water.', relevant: false },
    ],
    causes: [
      { id: 'loose', label: 'Loose blade or block (vibration)', plausible: true, note: 'Most likely here: the clamp check found movement.' },
      { id: 'hard', label: 'Tissue too hard or over-processed', plausible: true, note: 'A real cause of chatter in general, but the processing record argues against it here.' },
      { id: 'angle', label: 'Clearance angle too large or too small', plausible: true, note: 'Plausible in general; the angle was normal in this case.' },
      { id: 'bath', label: 'Water bath too hot', plausible: false, note: 'The bath affects spreading after cutting, not bands formed at the knife.' },
    ],
    fixes: [
      { id: 'tighten', label: 'Tighten all clamps and recut', works: true, result: 'Sections are now even. One variable changed, and the artifact resolved.' },
      { id: 'thicker', label: 'Cut thicker sections', works: false, result: 'Banding persists at the new thickness. The vibration source is unchanged.' },
      { id: 'bath', label: 'Lower the water bath temperature', works: false, result: 'No change. The bands were already present on the ribbon.' },
    ],
  },
  {
    id: 'compression', title: 'Shortened, wrinkled sections', art: 'artifact-compression',
    presentation: 'Sections are noticeably shorter than the block face in the cutting direction, with crowded nuclei. The room is warm today.',
    checks: [
      { id: 'temp', label: 'Feel the block temperature', finding: 'The block has been sitting out and is at room temperature. The paraffin feels soft.', relevant: true },
      { id: 'blade', label: 'Inspect the blade', finding: 'The blade has been used for many blocks. Light glints along part of the edge.', relevant: true },
      { id: 'angle', label: 'Check clearance angle', finding: 'Within the usual setting.', relevant: true },
      { id: 'label', label: 'Re-check slide labels', finding: 'Labels match. Important, but unrelated to this artifact.', relevant: false },
    ],
    causes: [
      { id: 'warm', label: 'Block too warm', plausible: true, note: 'Supported: soft paraffin compresses.' },
      { id: 'dull', label: 'Dull blade', plausible: true, note: 'Supported: a worn edge pushes instead of cutting.' },
      { id: 'angle', label: 'Incorrect clearance or bevel angle', plausible: true, note: 'Possible in general; normal here.' },
      { id: 'fix', label: 'Under-fixation', plausible: false, note: 'Can cause poor morphology but is not the usual cause of compression at the knife.' },
    ],
    fixes: [
      { id: 'both', label: 'Chill the block face and move to a new blade area', works: true, result: 'Section length now matches the block face. Two likely causes were addressed. To learn which mattered most, change them one at a time next time.' },
      { id: 'faster', label: 'Cut faster', works: false, result: 'Compression is worse. Fast cutting on a warm block adds stress.' },
      { id: 'bath', label: 'Raise the water bath temperature', works: false, result: 'Sections spread a little more but crowding and wrinkles remain, and overheating risks distortion.' },
    ],
  },
  {
    id: 'lines', title: 'Lines in the cutting direction', art: 'artifact-knife-lines',
    presentation: 'Straight tears run through the section perpendicular to the knife edge, at the same positions in every section.',
    checks: [
      { id: 'edge', label: 'Inspect the blade edge under light', finding: 'Two small nicks are visible on the part of the blade in use.', relevant: true },
      { id: 'block', label: 'Inspect the block face', finding: 'A gritty particle is visible in one area of the tissue.', relevant: true },
      { id: 'bath', label: 'Check the water bath', finding: 'Clean, normal temperature.', relevant: false },
      { id: 'humid', label: 'Check room humidity', finding: 'Normal. Static is not the issue today.', relevant: false },
    ],
    causes: [
      { id: 'nick', label: 'Nicked blade', plausible: true, note: 'Strongly supported: fixed-position lines match nicks.' },
      { id: 'calc', label: 'Hard deposit (calcium, suture, debris) in the tissue', plausible: true, note: 'Also present here. It can nick the blade and must be addressed or decalcified.' },
      { id: 'chatter', label: 'Vibration', plausible: false, note: 'Vibration gives bands parallel to the edge, not lines in the cutting direction.' },
      { id: 'thick', label: 'Section thickness setting', plausible: false, note: 'Thickness changes don’t produce fixed-position tears.' },
    ],
    fixes: [
      { id: 'move', label: 'Move to an unused part of the blade, and deal with the hard particle', works: true, result: 'Lines are gone. If they return in the same tissue area, consider surface decalcification of the block face per protocol.' },
      { id: 'slow', label: 'Only cut more slowly', works: false, result: 'Lines persist at the same positions. The nicks are still there.' },
      { id: 'cold', label: 'Only chill the block', works: false, result: 'Sections are firmer, but the lines remain.' },
    ],
  },
  {
    id: 'folds', title: 'Folds after floating', art: 'artifact-folds',
    presentation: 'The ribbon looked smooth on the knife, but sections picked up from the water bath have folds.',
    checks: [
      { id: 'bath', label: 'Check water bath temperature', finding: 'The bath is cooler than usual. Sections are not fully flattening.', relevant: true },
      { id: 'pickup', label: 'Watch the pick-up technique', finding: 'Sections are lifted quickly at a steep angle.', relevant: true },
      { id: 'clamp', label: 'Check clamps', finding: 'Tight.', relevant: false },
      { id: 'proc', label: 'Check processing record', finding: 'Normal.', relevant: false },
    ],
    causes: [
      { id: 'cool', label: 'Water bath too cool to flatten the section', plausible: true, note: 'Supported by the temperature check.' },
      { id: 'pickup', label: 'Pick-up technique', plausible: true, note: 'Also supported: steep, fast lifting traps folds.' },
      { id: 'vib', label: 'Vibration', plausible: false, note: 'The ribbon was smooth on the knife, which rules out cutting-stage causes.' },
      { id: 'dull', label: 'Dull blade', plausible: false, note: 'A dull blade compresses at the knife. Here the problem appears only after floating.' },
    ],
    fixes: [
      { id: 'adjust', label: 'Set the bath to the lab’s range below the wax melting point, let sections relax, and lift at a shallow angle', works: true, result: 'Sections flatten and pick up without folds.' },
      { id: 'hot', label: 'Turn the bath well above the wax melting point', works: false, result: 'Wax melts and sections spread and distort or break apart. Too hot is a different failure.' },
      { id: 'thin', label: 'Cut thinner', works: false, result: 'Thinner sections fold even more readily on a cool bath.' },
    ],
  },
]

export default function MicrotomyChallenge({ finish }: SimProps) {
  const [ci, setCi] = useState(0)
  const [checked, setChecked] = useState<Record<string, string[]>>({})
  const [causes, setCauses] = useState<Record<string, string[]>>({})
  const [causeSubmitted, setCauseSubmitted] = useState<Record<string, boolean>>({})
  const [fix, setFix] = useState<Record<string, string>>({})
  const [firstFix, setFirstFix] = useState<Record<string, string>>({})
  const c = CASES[ci]
  const myChecks = checked[c.id] ?? []
  const myCauses = causes[c.id] ?? []
  const fixed = fix[c.id] ? c.fixes.find((f) => f.id === fix[c.id]) : undefined
  const doneAll = CASES.every((x) => x.fixes.find((f) => f.id === fix[x.id])?.works)

  // Scoring: for each case, 1 point for identifying the supported causes without the implausible ones, 1 for a working fix.
  const causeScore = (x: Case) => {
    const picked = causes[x.id] ?? []
    return picked.length > 0 && picked.every((p) => x.causes.find((k) => k.id === p)?.plausible) ? 1 : 0
  }
  const score = CASES.reduce((a, x) => a + causeScore(x) + (x.fixes.find((f) => f.id === firstFix[x.id])?.works ? 1 : 0), 0)

  return (
    <div>
      <SimNotice>Schematic artifacts and rule-based cases. Each artifact can have several causes; your investigation narrows which one applies here. Confirm in practice by changing one variable at a time.</SimNotice>
      <div className="row" style={{ margin: '12px 0 18px' }}>
        {CASES.map((x, i) => (
          <button key={x.id} className="chip-btn" aria-pressed={i === ci} onClick={() => setCi(i)}>
            {x.title} {fix[x.id] && (x.fixes.find((f) => f.id === fix[x.id])?.works ? '✓' : '·')}
          </button>
        ))}
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: 'var(--t-3)' }}>{c.title}</h2>
          <p>{c.presentation}</p>
          {fixed?.works ? (
            <div className="demo-frame"><svg viewBox="0 0 320 180" role="img" aria-label="Recut section: flat and even. Schematic."><rect width="320" height="180" rx="10" fill="var(--paper)" /><rect x="40" y="40" width="240" height="100" fill="var(--eosin)" opacity="0.3" />{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={52 + ((i * 53) % 220)} cy={52 + ((i * 37) % 78)} r={2.6} fill="var(--hema)" opacity={0.75} />)}<text x="12" y="170" fontSize="10" fill="var(--ink-3)">Recut · schematic</text></svg></div>
          ) : (
            <Schematic name={c.art} />
          )}
          <h3 style={{ marginTop: 20 }}>Investigate</h3>
          <ul className="options">
            {c.checks.map((ch) => {
              const open = myChecks.includes(ch.id)
              return (
                <li key={ch.id}>
                  <button className="option" aria-expanded={open} onClick={() => !open && setChecked({ ...checked, [c.id]: [...myChecks, ch.id] })}>
                    <span><strong>{ch.label}</strong>{open && <span className="rationale" style={{ display: 'block' }}>{ch.finding}</span>}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <div className="panel">
            <h3>Which causes fit this evidence?</h3>
            <p className="small muted">Select every cause the evidence supports. More than one can apply.</p>
            <div className="stack" style={{ marginTop: 10 }}>
              {c.causes.map((k) => {
                const sel = myCauses.includes(k.id)
                const sub = causeSubmitted[c.id]
                return (
                  <div key={k.id}>
                    <button className="chip-btn" style={{ width: '100%' }} disabled={sub} aria-pressed={sel} onClick={() => setCauses({ ...causes, [c.id]: sel ? myCauses.filter((x) => x !== k.id) : [...myCauses, k.id] })}>
                      {k.label}
                    </button>
                    {sub && <p className="small" style={{ margin: '4px 0 0', color: k.plausible ? 'var(--teal)' : 'var(--eosin)' }}>{k.plausible ? 'Plausible. ' : 'Unlikely. '}{k.note}</p>}
                  </div>
                )
              })}
            </div>
            {!causeSubmitted[c.id] ? (
              <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={!myCauses.length || myChecks.length < 2} onClick={() => setCauseSubmitted({ ...causeSubmitted, [c.id]: true })}>
                Compare with the evidence
              </button>
            ) : null}
            {myChecks.length < 2 && !causeSubmitted[c.id] && <p className="small muted">Run at least two investigations first.</p>}
          </div>
          {causeSubmitted[c.id] && (
            <div className="panel" style={{ marginTop: 16 }}>
              <h3>Adjust one condition and recut</h3>
              <div className="stack">
                {c.fixes.map((f) => (
                  <button key={f.id} className={`option ${fix[c.id] === f.id ? (f.works ? 'is-correct' : 'is-wrong') : ''}`} onClick={() => { setFix({ ...fix, [c.id]: f.id }); if (!firstFix[c.id]) setFirstFix({ ...firstFix, [c.id]: f.id }) }} aria-pressed={fix[c.id] === f.id}>
                    <span>{f.label}{fix[c.id] === f.id && <span className="rationale" style={{ display: 'block' }}>{f.result}</span>}</span>
                  </button>
                ))}
              </div>
              {fixed && !fixed.works && <p className="small muted" style={{ marginTop: 8 }}>Try another adjustment. Recutting is cheap here.</p>}
              {fixed?.works && ci < CASES.length - 1 && <button className="btn" style={{ marginTop: 12 }} onClick={() => setCi(ci + 1)}>Next artifact</button>}
            </div>
          )}
          {doneAll && (
            <div className="panel" style={{ marginTop: 16 }}>
              <p className="celebrate">All artifacts resolved</p>
              <p className="small">Reasoning score {score} of {CASES.length * 2}. It counts cause sets with no implausible picks and the first working fix you chose.</p>
              <div className="row">
                <button className="btn btn-primary" onClick={() => finish(score, CASES.length * 2, `${score}/${CASES.length * 2} microtomy reasoning`)}>Record this run</button>
                <button className="btn" onClick={() => { setChecked({}); setCauses({}); setCauseSubmitted({}); setFix({}); setFirstFix({}); setCi(0) }}>Reset</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
