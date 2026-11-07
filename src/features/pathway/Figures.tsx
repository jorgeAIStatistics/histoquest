import { useId, useState } from 'react'
import { motion } from 'motion/react'
import type { FigureKind } from '../../content/pathway'
import { useReducedMotion } from '../../ui/prefs'

const hema = '#594189', eosin = '#df8eaa', teal = '#3b978d'

/** Deliberately geometric teaching model, never presented as a micrograph. */
export function TissueSection({ nuclear = true, pink = true, orientation = 'profile', damage = false }: { nuclear?: boolean; pink?: boolean; orientation?: string; damage?: boolean }) {
  return <g>
    <rect x="70" y="65" width="460" height="180" rx="3" fill={pink ? '#f0c4d1' : '#ddd8cc'} />
    {orientation === 'flat' ? <>
      {Array.from({ length: 40 }, (_, i) => <g key={i} transform={`translate(${95 + i % 10 * 45} ${92 + Math.floor(i / 10) * 40})`}><rect x="-17" y="-15" width="34" height="30" rx="10" fill={pink ? '#e8a8bf' : '#c9c5be'} stroke="#fff" /><ellipse rx="5" ry="7" fill={nuclear ? hema : '#b4b0ac'} /></g>)}
    </> : <>
      <rect x="70" y="65" width="460" height="58" fill={pink ? '#d99aba' : '#cbc6bf'} />
      {Array.from({ length: 23 }, (_, i) => <g key={i}><rect x={75 + i * 20} y="75" width="16" height="42" rx="7" fill={pink ? '#e8b1c9' : '#d5d0ca'} /><ellipse cx={83 + i * 20} cy="102" rx="4" ry="7" fill={nuclear ? hema : '#aaa59f'} /></g>)}
      <path d="M70 126H530" stroke={hema} strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => <g key={i}><path d={`M${80 + i % 6 * 75} ${155 + Math.floor(i / 6) * 45}q25 -18 54 1`} fill="none" stroke={pink ? eosin : '#bdb8b0'} strokeWidth="6" /><ellipse cx={110 + i % 6 * 72} cy={160 + Math.floor(i / 6) * 44} rx="7" ry="3" transform={`rotate(-20 ${110 + i % 6 * 72} ${160 + Math.floor(i / 6) * 44})`} fill={nuclear ? hema : '#aaa59f'} /></g>)}
    </>}
    {damage && <><path d="M198 60v190M355 60v190" stroke="#fff" strokeWidth="7" />{[150, 177, 205].map(y => <rect key={y} x="70" y={y} width="460" height="6" fill={hema} opacity=".25" />)}</>}
  </g>
}

const DETAILS: Record<FigureKind, { title: string; labels: string[]; captions: string[] }> = {
  tissue: { title: 'A tissue is more than a collection of cells', labels: ['Architecture', 'Nuclei', 'Matrix'], captions: ['Read the epithelial surface and its relationship to supporting tissue.', 'Nuclear staining makes chromatin detail visible. These simplified shapes are not diagnostic tissue.', 'Eosin adds contrast to cytoplasm and extracellular proteins; spatial relationships give color meaning.'] },
  identity: { title: 'Follow the identity, not just the container', labels: ['Bottle', 'Cassette', 'Block', 'Slide'], captions: ['Patient identifiers and specimen information begin the traceable record.', 'The accession, part and block key connect this cassette to the specimen.', 'The embedded block retains that identity after its container changes.', 'Match slide identity to block identity at pickup and review.'] },
  gross: { title: 'Thickness changes the distance reagents must travel', labels: ['2 mm', '4 mm', '8 mm'], captions: ['A thin gross slice provides a shorter path to its center.', 'A thicker piece increases the distance from surface to center.', 'An excessively thick piece cannot be rescued simply by forcing it into a cassette.'] },
  fixation: { title: 'Reaching the center is only the first part', labels: ['Fresh tissue', 'Penetration', 'Chemical reaction'], captions: ['The model starts with tissue that has not been exposed to fixative.', 'The colored front represents relative reagent access, not elapsed clinical time.', 'Cross-links represent chemical stabilization after access. They are a conceptual model, not a fixation endpoint test.'] },
  processing: { title: 'Three exchanges, one purpose: support', labels: ['Water', 'Dehydration', 'Clearing', 'Infiltration'], captions: ['Fixed tissue still contains water, which is incompatible with paraffin.', 'Alcohol exchanges remove water through the validated sequence.', 'A clearing reagent replaces dehydrant and provides compatibility with wax.', 'Paraffin replaces the clearing medium and supports the tissue for sectioning.'] },
  embedding: { title: 'Change the face. Change what the section shows.', labels: ['Tangential face', 'Profile face'], captions: ['A tangential plane emphasizes a surface. It may omit the required depth relationship.', 'A profile plane brings the surface and deeper tissue into the same section.'] },
  microtomy: { title: 'A ribbon is a series of adjacent planes', labels: ['Face the block', 'Cut the ribbon', 'Collect a section'], captions: ['Facing exposes the relevant tissue while conserving material.', 'Successive thin sections enter the ribbon. The animation does not emulate blade handling.', 'A selected intact section is floated and picked up onto the correctly identified slide.'] },
  he: { title: 'Build readable contrast in stages', labels: ['Unstained', 'Nuclear contrast', 'H&E'], captions: ['An unstained tissue section has little intrinsic contrast.', 'The nuclear stain makes selected basophilic structures conspicuous.', 'Counterstaining separates cellular and extracellular components. Balanced detail matters more than saturation.'] },
  special: { title: 'Match the target to the question', labels: ['Carbohydrates', 'Connective tissue', 'Microorganisms'], captions: ['PAS and related methods demonstrate chemical targets; use digestion controls when the claim involves glycogen.', 'Connective-tissue methods distinguish supporting structures. The exact colors depend on the method.', 'A target-positive control supports technical performance; morphology and context remain essential.'] },
  ihc: { title: 'An antigen becomes a localized signal', labels: ['Target', 'Primary antibody', 'Detection', 'Chromogen'], captions: ['A preserved and accessible epitope is required.', 'The primary antibody recognizes a target in the expected tissue compartment.', 'The detection system connects antibody binding to an enzyme or another visible label.', 'The chromogen makes a local signal visible. Controls are needed before interpreting the result.'] },
  advanced: { title: 'Preserve the target before choosing the method', labels: ['Paraffin', 'Frozen', 'Special allocation'], captions: ['Routine morphology and many ancillary tests use formalin-fixed paraffin tissue.', 'Selected lipid, enzyme, rapid-assessment, or other studies may need a frozen pathway.', 'IF, EM and molecular studies require early communication about allocation and preservation.'] },
  quality: { title: 'Every step contributes to a defensible handoff', labels: ['Identity', 'Representation', 'Technical quality', 'Controls'], captions: ['Can this slide be traced to the right specimen?', 'Does the section contain the tissue and plane needed for the question?', 'Are detail, integrity, staining and optical clarity adequate?', 'Do the relevant controls support the requested interpretation?'] },
}

export function FigureCanvas({ kind, step = 0, thickness = 4, orientation = 'profile', nuclear = true, pink = true, damage = false }: { kind: FigureKind; step?: number; thickness?: number; orientation?: string; nuclear?: boolean; pink?: boolean; damage?: boolean }) {
  const reduced = useReducedMotion()
  const id = useId()
  const spec = DETAILS[kind]
  return <svg className="teaching-svg" viewBox="0 0 600 310" role="img" aria-labelledby={id}>
    <title id={id}>{spec.title}. {spec.captions[Math.min(step, spec.captions.length - 1)]} Schematic, not a photomicrograph.</title>
    {(kind === 'tissue' || kind === 'embedding' || kind === 'he') && <>
      <TissueSection nuclear={kind === 'he' ? step > 0 : kind === 'tissue' ? step > 0 : nuclear} pink={kind === 'he' ? step > 1 : kind === 'tissue' ? step > 1 : pink} orientation={kind === 'embedding' ? step === 0 ? 'flat' : 'profile' : orientation} damage={damage} />
      <text x="70" y="280" className="fig-label">{kind === 'embedding' ? step ? 'Surface + underlying tissue in one plane' : 'Surface viewed tangentially' : 'Simplified epithelial surface and supporting matrix'}</text>
    </>}
    {kind === 'identity' && <>
      <path d="M80 150H520" stroke="var(--rule)" strokeWidth="3" />
      {['Bottle', 'Cassette', 'Block', 'Slide'].map((v, i) => <g key={v} transform={`translate(${40 + i * 145} 75)`}><rect width="105" height="130" rx={i === 0 ? 24 : 6} fill={i === step ? 'var(--hema-soft)' : 'var(--paper)'} stroke={i === step ? 'var(--hema)' : 'var(--rule)'} strokeWidth="2" /><text x="52" y="40" textAnchor="middle" className="fig-label">{v}</text><rect x="12" y="62" width="81" height="40" rx="3" fill="var(--vellum)" /><text x="52" y="86" textAnchor="middle" className="fig-label" fontSize="11">HQ · A1</text></g>)}
      <text x="300" y="270" textAnchor="middle" className="fig-label">One identity chain · four physical forms</text>
    </>}
    {(kind === 'gross' || kind === 'fixation') && <>
      <rect x="55" y="45" width="490" height="210" rx="18" fill="var(--teal-soft)" stroke="var(--teal)" />
      <rect x={300 - (kind === 'gross' ? thickness * 19 : 170)} y="90" width={kind === 'gross' ? thickness * 38 : 340} height="120" fill={eosin} opacity=".55" />
      {kind === 'fixation' && <motion.rect initial={false} animate={{ x: step ? 145 : 130, width: step === 2 ? 310 : step === 1 ? 180 : 0 }} transition={{ duration: reduced ? 0 : .55 }} y="100" height="100" fill={teal} opacity=".45" />}
      {kind === 'fixation' && step === 2 && Array.from({ length: 15 }, (_, i) => <path key={i} d={`M${160 + i % 5 * 60} ${125 + Math.floor(i / 5) * 28}h30m-15 -8v16`} stroke={hema} strokeWidth="3" />)}
      <path d="M75 150H120m-8 -7 8 7-8 7M525 150H480m8 -7-8 7 8 7" stroke={teal} strokeWidth="3" fill="none" />
      <text x="300" y="282" textAnchor="middle" className="fig-label">{kind === 'gross' ? `${thickness} mm modeled thickness · not an instrument protocol` : step === 2 ? 'Access + chemical stabilization' : 'Fixative surrounds the specimen'}</text>
    </>}
    {kind === 'processing' && <>
      {['Water', 'Alcohol', 'Clearing agent', 'Paraffin'].map((v, i) => <g key={v} transform={`translate(${18 + i * 148} 65)`}><rect width="122" height="165" rx="8" fill={['#dbe9ef', '#dbe9ef', '#ded8f0', '#f1ddad'][i]} opacity={i <= step ? 1 : .3} /><rect x="24" y="55" width="74" height="54" rx="4" fill={eosin} stroke={hema} opacity={i === step ? 1 : .25} /><text x="61" y="195" textAnchor="middle" className="fig-label" fontSize="12">{v}</text>{i === step && <path d="M45 -20h32m-16 -10v20" stroke={teal} strokeWidth="3" />}</g>)}
    </>}
    {kind === 'microtomy' && <>
      <rect x="65" y="70" width="150" height="150" fill="#f1ddad" stroke="#b59355" strokeWidth="2" /><rect x="90" y="100" width="100" height="90" fill={eosin} />
      <path d="M235 70V230" stroke="var(--ink-2)" strokeWidth="5" />
      {[0, 1, 2, 3].map(i => <motion.g key={i} initial={false} animate={{ x: step > 0 ? 265 + i * 67 : 190, y: step > 0 ? 100 : 100, opacity: step > 0 ? 1 : 0 }} transition={{ duration: reduced ? 0 : .45, delay: reduced ? 0 : i * .06 }}><rect width="58" height="84" fill={pink ? '#edb4c7' : '#ddd'} stroke={damage ? '#a95559' : hema} strokeWidth={damage ? 5 : 1} /><path d="M12 25H46M12 43H46M12 61H46" stroke={hema} opacity=".45" /></motion.g>)}
      {step === 2 && <rect x="380" y="210" width="160" height="48" rx="4" fill="var(--hema-soft)" stroke="var(--hema)" />}
      <text x="65" y="280" className="fig-label">Block</text><text x="270" y="280" className="fig-label">Adjacent planes → ribbon → slide</text>
    </>}
    {kind === 'ihc' && <>
      <path d="M65 215H535" stroke={eosin} strokeWidth="14" /><text x="65" y="270" className="fig-label">Tissue target</text>
      {[150, 300, 450].map((x, i) => <g key={x}>
        <circle cx={x} cy="204" r="12" fill={hema} />
        {step >= 1 && <path d={`M${x} 195v-45l-24 -25m24 25 24 -25`} stroke={teal} strokeWidth="8" fill="none" />}
        {step >= 2 && <><circle cx={x - 25} cy="122" r="15" fill="#b5964d" /><text x={x - 25} y="127" textAnchor="middle" fill="#fff" fontSize="13">E</text></>}
        {step === 3 && Array.from({ length: 10 }, (_, j) => <circle key={j} cx={x - 40 + j % 5 * 18} cy={184 + Math.floor(j / 5) * 18} r="5" fill="#90572c" opacity={.5 + i * .1} />)}
      </g>)}
      <text x="300" y="65" textAnchor="middle" className="fig-label">{['Accessible epitope', 'Primary antibody', 'Enzyme-linked detection', 'Localized chromogen'][step]}</text>
    </>}
    {(kind === 'special' || kind === 'advanced' || kind === 'quality') && <>
      <path d="M95 155H505" stroke="var(--rule)" strokeWidth="3" />
      {spec.labels.map((v, i) => <g key={v} transform={`translate(${spec.labels.length === 4 ? 75 + i * 150 : 100 + i * 200} 150)`}><circle r="44" fill={step === i ? 'var(--hema-soft)' : 'var(--paper)'} stroke={step === i ? 'var(--hema)' : 'var(--rule)'} strokeWidth="2" /><text textAnchor="middle" y="8" fill="var(--hema)" fontSize="24">{i + 1}</text><text textAnchor="middle" y="83" className="fig-label" fontSize="12">{v}</text></g>)}
    </>}
  </svg>
}

export default function TeachingFigure({ kind }: { kind: FigureKind }) {
  const [step, setStep] = useState(0)
  const spec = DETAILS[kind]
  return <figure className="teaching-figure">
    <h3>{spec.title}</h3>
    <FigureCanvas kind={kind} step={step} thickness={[2, 4, 8][step]} />
    <div className="figure-controls" aria-label="Explore the diagram">
      {spec.labels.map((label, i) => <button key={label} className="chip-btn" aria-pressed={step === i} onClick={() => setStep(i)}>{label}</button>)}
      <button className="btn btn-quiet" onClick={() => setStep((step + 1) % spec.labels.length)}>Next view</button>
    </div>
    <figcaption aria-live="polite">{spec.captions[step]} <span className="muted">Schematic teaching model.</span></figcaption>
  </figure>
}

export function JourneyOverview() {
  return <svg viewBox="0 0 660 270" role="img" aria-label="Specimen bottle to cassette to paraffin block to section to stained slide. Each transition changes the material while preserving its identity." className="journey-overview">
    <path d="M70 130H590" stroke="var(--rule)" strokeWidth="2" />
    <g transform="translate(20 55)"><rect x="8" width="85" height="135" rx="18" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="2" /><rect x="5" y="-12" width="91" height="23" rx="4" fill="var(--teal)" /><rect x="22" y="42" width="58" height="43" rx="4" fill="var(--paper)" /><text x="51" y="66" textAnchor="middle" className="fig-label" fontSize="12">A1</text></g>
    <g transform="translate(160 85)"><rect width="94" height="80" rx="7" fill="var(--hema-soft)" stroke="var(--hema)" strokeWidth="2" />{Array.from({ length: 10 }, (_, i) => <rect key={i} x={12 + i % 5 * 15} y={15 + Math.floor(i / 5) * 25} width="8" height="16" rx="2" fill="var(--hema)" opacity=".45" />)}</g>
    <g transform="translate(295 75)"><rect width="96" height="105" fill="#e8d6ab" stroke="#b69858" strokeWidth="2" /><rect x="15" y="25" width="65" height="55" fill={eosin} /><path d="M15 42H80" stroke={hema} strokeWidth="8" /></g>
    <g transform="translate(425 92)">{[0, 1, 2].map(i => <rect key={i} x={i * 25} y={i * 5} width="22" height="65" fill="#edb3c8" stroke={hema} strokeWidth=".8" />)}</g>
    <g transform="translate(545 85)"><rect width="100" height="75" rx="4" fill="var(--paper)" stroke="var(--ink-3)" /><rect width="22" height="75" fill="var(--hema-soft)" /><rect x="34" y="22" width="52" height="32" rx="2" fill={eosin} />{[0, 1, 2, 3, 4].map(i => <circle key={i} cx={40 + i * 10} cy={30 + i % 2 * 15} r="3" fill={hema} />)}</g>
    {['Receive', 'Sample', 'Support', 'Section', 'Reveal'].map((s, i) => <text key={s} x={70 + i * 130} y="235" textAnchor="middle" className="fig-label" fontSize="14">{s}</text>)}
  </svg>
}
