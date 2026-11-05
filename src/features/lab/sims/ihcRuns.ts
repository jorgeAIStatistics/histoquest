/**
 * IHC troubleshooting runs: fictional, technique-focused. The learner reads the control pattern,
 * decides whether the run is interpretable, names the most informative control, and picks the
 * first thing to investigate. Patterns follow standard QC logic for polymer HRP/DAB IHC.
 */
export type Pattern = 'strong' | 'weak' | 'none' | 'background' | 'edge' | 'overstain'

export interface Slide { id: 'external' | 'patient' | 'internal' | 'negative'; label: string; pattern: Pattern; note: string }
export interface Option { id: string; text: string; correct: boolean; why: string }

export interface IhcRun {
  id: string
  title: string
  short: string
  context: string
  slides: Slide[]
  interpretable: Option[]
  control: Option[]
  investigate: Option[]
  lesson: string
}

const INTERP = (correct: 'no' | 'yes' | 'patient', why: Record<'no' | 'yes' | 'patient', string>): Option[] => [
  { id: 'yes', text: 'Yes, report the patient result', correct: correct === 'yes', why: why.yes },
  { id: 'patient', text: 'The run worked, but this patient result is not reliable', correct: correct === 'patient', why: why.patient },
  { id: 'no', text: 'No, the run failed and must be repeated', correct: correct === 'no', why: why.no },
]

export const IHC_RUNS: IhcRun[] = [
  {
    id: 'all-negative',
    short: 'All negative',
    title: 'Nothing is brown',
    context: 'A stainer run of one antibody. Nuclei are nicely counterstained blue on every slide.',
    slides: [
      { id: 'external', label: 'External positive control', pattern: 'none', note: 'No staining in cells known to express the antigen.' },
      { id: 'patient', label: 'Patient tissue', pattern: 'none', note: 'Negative.' },
      { id: 'internal', label: 'Internal control elements', pattern: 'none', note: 'Normal structures expected to stain are negative.' },
      { id: 'negative', label: 'Negative reagent control', pattern: 'none', note: 'Clean.' },
    ],
    interpretable: INTERP('no', {
      yes: 'A negative patient result means nothing when the known positive control also failed.',
      patient: 'The external control failed too, so this is a run-level failure, not a specimen problem.',
      no: 'Correct: a failed external positive control invalidates the run.',
    }),
    control: [
      { id: 'external', text: 'External positive control', correct: true, why: 'It shows whether the procedure can detect the antigen at all, so it is the deciding control here.' },
      { id: 'negative', text: 'Negative reagent control', correct: false, why: 'Useful for background, but a clean negative control is expected when nothing stained.' },
      { id: 'counter', text: 'Counterstain quality', correct: false, why: 'Good counterstain shows the slides reached the end of the run. It says nothing about antibody detection.' },
    ],
    investigate: [
      { id: 'reagents', text: 'Reagent steps: was the primary dispensed and in date, were detection and chromogen prepared and applied, was retrieval run?', correct: true, why: 'A global loss of signal with a good counterstain points to a missing or failed reagent or retrieval step.' },
      { id: 'fixation', text: 'This patient’s fixation history', correct: false, why: 'The control tissue failed too. A single specimen’s history cannot explain that.' },
      { id: 'titer', text: 'Increase the antibody concentration tenfold', correct: false, why: 'Changing the titer before finding the failed step hides the cause and risks overstaining later.' },
    ],
    lesson: 'Start with the external positive control. If it fails, the run is invalid, whatever the patient slide shows.',
  },
  {
    id: 'patient-only',
    short: 'Patient only',
    title: 'The control worked; the patient didn’t',
    context: 'The same antibody on a decalcified bone biopsy. It was decalcified in a strong mineral acid for an extended time.',
    slides: [
      { id: 'external', label: 'External positive control', pattern: 'strong', note: 'Expected cells stain crisply.' },
      { id: 'patient', label: 'Patient tissue', pattern: 'none', note: 'Negative.' },
      { id: 'internal', label: 'Internal control elements', pattern: 'none', note: 'Structures that normally express the antigen are also negative.' },
      { id: 'negative', label: 'Negative reagent control', pattern: 'none', note: 'Clean.' },
    ],
    interpretable: INTERP('patient', {
      yes: 'The patient’s internal controls failed. A "negative" here may be a false negative.',
      patient: 'Correct: the run is valid (the external control worked), but the specimen’s own internal controls failed, so this negative can’t be trusted.',
      no: 'The external control worked, so the procedure itself performed.',
    }),
    control: [
      { id: 'internal', text: 'Internal positive control elements in the patient tissue', correct: true, why: 'They show whether this specimen can stain at all, which separates a true negative from a pre-analytic failure.' },
      { id: 'external', text: 'External positive control', correct: false, why: 'It passed, which rules out a reagent failure but says nothing about this specimen.' },
      { id: 'negative', text: 'Negative reagent control', correct: false, why: 'It checks for background, not for lost antigen.' },
    ],
    investigate: [
      { id: 'preanalytic', text: 'Pre-analytic history: the decalcification agent and time, plus fixation delay and duration', correct: true, why: 'Strong acid decalcification and fixation problems can destroy or mask antigens. Chelating agents such as EDTA are gentler on many antigens.' },
      { id: 'stainer', text: 'Stainer dispense logs', correct: false, why: 'The control on the same run stained well.' },
      { id: 'chromogen', text: 'Chromogen preparation', correct: false, why: 'The chromogen worked on the control slide.' },
    ],
    lesson: 'When the external control passes and internal controls fail, suspect the specimen: fixation, delay or decalcification. Don’t suspect the run.',
  },
  {
    id: 'peroxidase',
    short: 'Brown red cells',
    title: 'Brown where it shouldn’t be',
    context: 'An HRP polymer detection run on a bloody specimen. The lab recently changed its peroxide block reagent supplier.',
    slides: [
      { id: 'external', label: 'External positive control', pattern: 'strong', note: 'Expected cells stain, but red cells are also brown.' },
      { id: 'patient', label: 'Patient tissue', pattern: 'background', note: 'Granular brown in red cells and some granulocytes.' },
      { id: 'internal', label: 'Internal control elements', pattern: 'strong', note: 'Appropriate staining.' },
      { id: 'negative', label: 'Negative reagent control', pattern: 'background', note: 'No primary antibody, yet red cells and granulocytes are brown.' },
    ],
    interpretable: INTERP('no', {
      yes: 'Brown signal in the no-primary control means some signal is not antibody-specific.',
      patient: 'The external control and the negative reagent control show the same false signal. This is run-level.',
      no: 'Correct: signal without primary antibody means a detection-level false positive. Fix it and repeat.',
    }),
    control: [
      { id: 'negative', text: 'Negative reagent control', correct: true, why: 'With no primary, any brown must come from the tissue or the detection system, here endogenous peroxidase.' },
      { id: 'external', text: 'External positive control', correct: false, why: 'It shows that detection works, but not where false signal comes from.' },
      { id: 'internal', text: 'Internal control elements', correct: false, why: 'Appropriate specific staining doesn’t rule out added nonspecific signal.' },
    ],
    investigate: [
      { id: 'block', text: 'The endogenous peroxidase block: reagent, concentration, time, and whether the step ran', correct: true, why: 'Red cells and granulocytes contain peroxidase activity that converts DAB unless it is blocked.' },
      { id: 'retrieval', text: 'Lengthen antigen retrieval', correct: false, why: 'More retrieval would not remove endogenous enzyme signal.' },
      { id: 'primary', text: 'Change the primary antibody clone', correct: false, why: 'The false signal appears without any primary antibody.' },
    ],
    lesson: 'The negative reagent control isolates signal that doesn’t come from the primary antibody. Brown red cells point to unblocked endogenous peroxidase.',
  },
  {
    id: 'edges',
    short: 'Dark rims',
    title: 'Dark rims',
    context: 'An automated run on a humid afternoon, after a stainer service visit.',
    slides: [
      { id: 'external', label: 'External positive control', pattern: 'edge', note: 'Expected staining, plus a dark band along the tissue edges.' },
      { id: 'patient', label: 'Patient tissue', pattern: 'edge', note: 'Edges are dark brown, regardless of cell type.' },
      { id: 'internal', label: 'Internal control elements', pattern: 'strong', note: 'Appropriate in the centre of the section.' },
      { id: 'negative', label: 'Negative reagent control', pattern: 'edge', note: 'Edge brown even without primary antibody.' },
    ],
    interpretable: INTERP('no', {
      yes: 'Edge staining in the negative control shows the rim signal is nonspecific.',
      patient: 'Every slide shows the pattern, including the controls. That’s run-level.',
      no: 'Correct: nonspecific edge staining on all slides, including the negative reagent control, calls for a repeat after the cause is fixed.',
    }),
    control: [
      { id: 'negative', text: 'Negative reagent control', correct: true, why: 'Edge staining without primary antibody proves the rim signal is an artifact.' },
      { id: 'external', text: 'External positive control', correct: false, why: 'It shows the expected staining, but the artifact sits on top of it.' },
      { id: 'internal', text: 'Internal control elements', correct: false, why: 'Central structures look fine. The artifact is at the edges.' },
    ],
    investigate: [
      { id: 'drying', text: 'Section drying and reagent coverage: dispense volume, slide position, humidity or evaporation control, the service changes', correct: true, why: 'Sections that partly dry during the run trap reagents at the edges, a classic edge artifact.' },
      { id: 'fix', text: 'Re-fix the tissue longer', correct: false, why: 'Fixation would not produce a rim pattern on the control too.' },
      { id: 'counter', text: 'Shorten the hematoxylin', correct: false, why: 'The counterstain is not the brown signal.' },
    ],
    lesson: 'A pattern tied to geometry (edges, a corner, one end of the slide) points to a process step such as drying or reagent coverage. It isn’t biology.',
  },
  {
    id: 'overstain',
    short: 'Overstained',
    title: 'Everything is positive',
    context: 'A new technologist prepared the working antibody this morning from concentrate.',
    slides: [
      { id: 'external', label: 'External positive control', pattern: 'overstain', note: 'Expected cells are very dark, and cell types that should be negative are also brown.' },
      { id: 'patient', label: 'Patient tissue', pattern: 'overstain', note: 'Diffuse cytoplasmic brown in many cell types.' },
      { id: 'internal', label: 'Internal control elements', pattern: 'overstain', note: 'Known-negative structures stain.' },
      { id: 'negative', label: 'Negative reagent control', pattern: 'none', note: 'Clean.' },
    ],
    interpretable: INTERP('no', {
      yes: 'Known-negative structures are staining, so specificity has been lost.',
      patient: 'The control shows the same overstaining. This is a reagent problem.',
      no: 'Correct: positivity in known-negative tissue elements means the run cannot be interpreted.',
    }),
    control: [
      { id: 'external', text: 'External positive control, especially its known-negative elements', correct: true, why: 'A good control has both positive and negative components. Staining in the negatives exposes over-concentration.' },
      { id: 'negative', text: 'Negative reagent control', correct: false, why: 'It is clean, which places the problem with the primary antibody step itself.' },
      { id: 'counter', text: 'Counterstain', correct: false, why: 'Not related to brown overstaining.' },
    ],
    investigate: [
      { id: 'dilution', text: 'The working dilution calculation and preparation (for example 1:50 made instead of 1:500), against the validated titer', correct: true, why: 'A clean negative reagent control with overstaining everywhere else points to too much primary antibody.' },
      { id: 'block', text: 'The peroxidase block', correct: false, why: 'A block failure would also show in the no-primary control, and it is clean.' },
      { id: 'decal', text: 'Decalcification history', correct: false, why: 'Decalcification typically weakens staining. It does not cause excess.' },
    ],
    lesson: 'A clean negative reagent control means the extra signal depends on the primary antibody, so check the dilution and the validated titer.',
  },
  {
    id: 'weak-retrieval',
    short: 'Faint everywhere',
    title: 'Faint everywhere after a buffer change',
    context: 'A new lot of heat-induced retrieval buffer was put into use today.',
    slides: [
      { id: 'external', label: 'External positive control', pattern: 'weak', note: 'Expected cells stain only faintly. Low-expressing cells are negative.' },
      { id: 'patient', label: 'Patient tissue', pattern: 'weak', note: 'Faint.' },
      { id: 'internal', label: 'Internal control elements', pattern: 'weak', note: 'Faint.' },
      { id: 'negative', label: 'Negative reagent control', pattern: 'none', note: 'Clean.' },
    ],
    interpretable: INTERP('no', {
      yes: 'The control’s low-expressing cells are negative, so sensitivity has dropped below the validated level.',
      patient: 'The control is weak too, so the problem is run-level.',
      no: 'Correct: a positive control below its expected intensity, especially in low-expressing cells, invalidates the run.',
    }),
    control: [
      { id: 'external', text: 'External positive control, including its low-expressing cells', correct: true, why: 'Low-expressing cells are the most sensitive indicator that the assay lost strength.' },
      { id: 'negative', text: 'Negative reagent control', correct: false, why: 'A clean result is expected and doesn’t help explain weakness.' },
      { id: 'internal', text: 'Internal control alone', correct: false, why: 'Helpful, but the external control’s known expression levels are the benchmark.' },
    ],
    investigate: [
      { id: 'hier', text: 'The retrieval buffer: the new lot’s pH and preparation, plus the heating device’s temperature and time', correct: true, why: 'HIER depends on buffer pH, temperature and time. A change made today is the prime suspect.' },
      { id: 'more-ab', text: 'Raise the antibody concentration to compensate', correct: false, why: 'This hides the real cause and changes a validated assay without revalidation.' },
      { id: 'longer-dab', text: 'Leave DAB on much longer', correct: false, why: 'Longer DAB raises background and doesn’t fix lost retrieval.' },
    ],
    lesson: 'Connect a change in results to a change in process: a new reagent lot, service visit or protocol edit. Verify new lots against controls before use.',
  },
]

export interface RunAnswer { interpretable?: string; control?: string; investigate?: string }

export function scoreRun(r: IhcRun, a: RunAnswer) {
  const ok = (opts: Option[], id?: string) => (opts.find((o) => o.id === id)?.correct ? 1 : 0)
  const parts = { interpretable: ok(r.interpretable, a.interpretable), control: ok(r.control, a.control), investigate: ok(r.investigate, a.investigate) }
  return { ...parts, total: parts.interpretable + parts.control + parts.investigate }
}
