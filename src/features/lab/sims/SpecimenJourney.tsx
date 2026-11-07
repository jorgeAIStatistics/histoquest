import { useState } from 'react'
import Swap from '../../../ui/Swap'
import { Cassette, Microscope, Slide, TissueBlock } from '../../../art/illustrations'
import { SimNotice } from '../../../ui/components'
import type { SimProps } from '../SimPage'

/**
 * A fictional shave biopsy ("HQ-26-0417", no real patient data) moves through the lab.
 * Each choice sets flags; consequences surface later, at slide review, the way they do at the bench.
 */
type Flag = 'id-error' | 'id-hold' | 'underfixed' | 'overprocessed' | 'flat' | 'hot-bath' | 'label-mismatch' | 'no-control'

interface Choice { id: string; text: string; best: boolean; flag?: Flag; now: string }
interface Stage { id: string; station: string; art: 'cassette' | 'block' | 'slide' | 'scope'; situation: string; choices: Choice[] }

const STAGES: Stage[] = [
  {
    id: 'receipt', station: 'Accessioning', art: 'cassette',
    situation: 'A container arrives labelled with two identifiers: a name and a date of birth. The requisition has the same name but a different date of birth.',
    choices: [
      { id: 'a', text: 'Accession it; the name matches', best: false, flag: 'id-error', now: 'Accessioned. Nothing looks wrong yet.' },
      { id: 'b', text: 'Correct the container label to match the requisition', best: false, flag: 'id-error', now: 'Label changed at the bench. It looks tidy, but nobody can now prove which was right.' },
      { id: 'c', text: 'Hold the specimen, document the discrepancy, and resolve it with the submitting office per policy', best: true, flag: 'id-hold', now: 'On hold. The office confirms the requisition date of birth was mistyped and sends a corrected requisition. Accessioned with documentation.' },
    ],
  },
  {
    id: 'fix', station: 'Fixation', art: 'cassette',
    situation: 'The 4 mm shave biopsy is in a container with only a few millilitres of formalin. It arrived at 4:30 pm; the overnight processor run starts at 5:00 pm.',
    choices: [
      { id: 'a', text: 'Process it on tonight’s run as received', best: false, flag: 'underfixed', now: 'Loaded at 5:00 pm. Fixation time and volume were both marginal.' },
      { id: 'b', text: 'Make sure fixative volume is ample (well above the tissue volume) and process once fixation time meets your protocol', best: true, now: 'Topped up with fresh NBF and scheduled for the next run that allows adequate fixation.' },
      { id: 'c', text: 'Warm it in the microwave to speed up fixation, then process tonight', best: false, flag: 'underfixed', now: 'Heated without a validated microwave protocol. The edges may be fixed; the core is uncertain.' },
    ],
  },
  {
    id: 'proc', station: 'Processing', art: 'cassette',
    situation: 'Your processor has a short biopsy program and a long overnight program for large, fatty specimens.',
    choices: [
      { id: 'a', text: 'Long overnight program, to be safe', best: false, flag: 'overprocessed', now: 'Processed on the long program alongside large specimens.' },
      { id: 'b', text: 'Biopsy program, in a biopsy cassette or with sponges or wraps so it stays in the cassette', best: true, now: 'Processed on the biopsy schedule and kept secure in the cassette.' },
    ],
  },
  {
    id: 'embed', station: 'Embedding', art: 'block',
    situation: 'The pathologist needs the epidermis and the deep and peripheral margins of the shave.',
    choices: [
      { id: 'a', text: 'Lay it flat for the largest surface area', best: false, flag: 'flat', now: 'Embedded flat. The block face looks big and neat.' },
      { id: 'b', text: 'Embed on edge (cut into strips if needed) so each section shows epidermis to the deep edge', best: true, now: 'Embedded on edge with strips aligned.' },
    ],
  },
  {
    id: 'cut', station: 'Microtomy', art: 'slide',
    situation: 'You’re ready to pick up sections. Two decisions: the flotation bath temperature and the slide check.',
    choices: [
      { id: 'a', text: 'Bath a few degrees below the wax melting point; confirm the slide label matches the block number before pick-up', best: true, now: 'Sections flatten nicely. The slide and block numbers match.' },
      { id: 'b', text: 'Bath above the wax melting point so sections flatten faster; label slides in batches afterwards', best: false, flag: 'hot-bath', now: 'Sections spread quickly. Slides labelled later, in a batch.' },
    ],
  },
  {
    id: 'stain', station: 'Staining', art: 'slide',
    situation: 'The pathologist also ordered PAS-D to look for fungi in the stratum corneum.',
    choices: [
      { id: 'a', text: 'Run PAS-D with known fungal-positive tissue and a glycogen-containing control cut for PAS and PAS-D', best: true, now: 'Controls included. Fungal structures demonstrate the stain reaction; loss of glycogen in the paired digested control supports enzyme performance.' },
      { id: 'b', text: 'Run PAS-D on the patient slide only; fungi are diastase-resistant anyway', best: false, flag: 'no-control', now: 'Stained without a control.' },
    ],
  },
]

function outcomes(flags: Set<Flag>): { text: string; severity: 'critical' | 'quality' | 'ok' }[] {
  const out: { text: string; severity: 'critical' | 'quality' | 'ok' }[] = []
  if (flags.has('id-error')) out.push({ severity: 'critical', text: 'Identification: the report rests on an unresolved identifier mismatch. This is a patient-safety failure, whatever the slide quality. Discrepancies are resolved and documented at receipt, never corrected at the bench.' })
  if (flags.has('hot-bath')) out.push({ severity: 'critical', text: 'Labelling: slides labelled in a batch after cutting can be swapped. Match block to slide at pick-up, one case at a time.' })
  if (flags.has('underfixed')) out.push({ severity: 'quality', text: 'Under-fixation: the centre shows poor nuclear detail and processing artifact. The fixative never had enough time or volume to finish.' })
  if (flags.has('overprocessed')) out.push({ severity: 'quality', text: 'Over-processing: the small biopsy is hard and brittle, with cracks and chatter in sections.' })
  if (flags.has('flat')) out.push({ severity: 'quality', text: 'Orientation: early levels show only tangential epidermis, and the deep margin cannot be assessed without recutting deeper. Tissue is lost along the way.' })
  if (flags.has('hot-bath')) out.push({ severity: 'quality', text: 'Flotation: an overheated bath let sections over-expand and separate. Expect distortion and gaps.' })
  if (flags.has('no-control')) out.push({ severity: 'quality', text: 'Uninterpretable negative: with no control, a negative PAS-D cannot show that the stain and the enzyme worked. The run has to be repeated with controls.' })
  if (!out.length) out.push({ severity: 'ok', text: 'The slide is correctly identified, well fixed and processed, oriented to show all layers and margins, and its special stain is backed by a working control.' })
  return out
}

export default function SpecimenJourney({ finish }: SimProps) {
  const [i, setI] = useState(0)
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [recorded, setRecorded] = useState(false)
  const stage = STAGES[i]
  const done = i >= STAGES.length
  const flags = new Set(STAGES.map((s) => s.choices.find((c) => c.id === picks[s.id])?.flag).filter(Boolean) as Flag[])
  const best = STAGES.filter((s) => s.choices.find((c) => c.id === picks[s.id])?.best).length
  const pick = picks[stage?.id]
  const chosen = stage?.choices.find((c) => c.id === pick)

  return (
    <div>
      <SimNotice>Fictional specimen with no real patient information. Consequences are qualitative, drawn from standard practice, and simplified.</SimNotice>
      <ol className="row small" aria-label="Journey stations" style={{ listStyle: 'none', padding: 0, margin: '14px 0 22px', gap: 6 }}>
        {[...STAGES.map((s) => s.station), 'Slide review'].map((name, k) => (
          <li key={name} className={`tag ${k < i ? 'tag-teal' : k === i ? 'tag-hema' : ''}`} aria-current={k === i ? 'step' : undefined}>{k + 1}. {name}</li>
        ))}
      </ol>
      {!done ? (
          <Swap id={stage.id} x={20} className="grid-2" style={{ alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 'var(--t-3)' }}>{stage.station}</h2>
              <div style={{ margin: '8px 0 16px' }}>
                {stage.art === 'cassette' && <Cassette size={96} label="HQ-26-0417" />}
                {stage.art === 'block' && <TissueBlock size={96} />}
                {stage.art === 'slide' && <Slide width={220} label="HQ-26-0417" stained={stage.id === 'stain'} />}
              </div>
              <p>{stage.situation}</p>
            </div>
            <div>
              <ul className="options">
                {stage.choices.map((c) => (
                  <li key={c.id}>
                    <button className="option" aria-pressed={pick === c.id} disabled={!!pick} onClick={() => setPicks({ ...picks, [stage.id]: c.id })}>
                      <span>{c.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {chosen && (
                <div className="inset" role="status">
                  <p style={{ margin: 0 }}>{chosen.now}</p>
                  <p className="small muted" style={{ margin: '6px 0 0' }}>Full consequences show at slide review.</p>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setI(i + 1)}>Send to the next station</button>
                </div>
              )}
            </div>
          </Swap>
        ) : (
          <Swap id="review" x={0} className="grid-2" style={{ alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 'var(--t-3)' }}>Slide quality review</h2>
              <Microscope size={110} />
              <p>{best} of {STAGES.length} decisions matched best practice.</p>
              <div className="row">
                {!recorded && <button className="btn btn-primary" onClick={() => { setRecorded(true); finish(best, STAGES.length, `${best}/${STAGES.length} journey decisions${flags.has('id-error') ? '; identification error' : ''}`) }}>Record this run</button>}
                <button className="btn" onClick={() => { setPicks({}); setI(0); setRecorded(false) }}>Replay the journey</button>
              </div>
            </div>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {outcomes(flags).map((o, k) => (
                <li key={k} className={`feedback ${o.severity === 'ok' ? 'ok' : 'no'}`} style={{ marginTop: 0 }}>
                  <strong>{o.severity === 'critical' ? 'Critical: ' : o.severity === 'quality' ? 'Quality: ' : 'Release: '}</strong>{o.text}
                </li>
              ))}
              {STAGES.map((s) => {
                const c = s.choices.find((x) => x.id === picks[s.id])
                const b = s.choices.find((x) => x.best)!
                return !c?.best ? <li key={s.id} className="small"><strong>{s.station}:</strong> better choice was “{b.text}”.</li> : null
              })}
            </ul>
          </Swap>
        )}
    </div>
  )
}
