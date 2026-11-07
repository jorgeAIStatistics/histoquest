import type { StationId } from '../../sim/core/events'
export const STATIONS: {
  id: StationId
  label: string
  task: string
  why: string
  safety: string
  document: string
  lesson: string
}[] = [
  {
    id: 'accessioning',
    label: 'Receipt & LIS',
    task: 'Reconcile the container and request. Establish identity before moving tissue.',
    why: 'Identity travels with every cassette, block and slide. Histology cannot repair an uncertain label.',
    safety: 'All identifiers here are fictional. Never enter patient information.',
    document: 'Receipt, two identifiers, source, discrepancy, authorized resolution and custody.',
    lesson: '/pathway/accessioning',
  },
  {
    id: 'grossing',
    label: 'Grossing',
    task: 'Measure, orient, sample and account for every piece.',
    why: 'Diffusion distance is set here. Thick pieces and crowded cassettes leave vulnerable centers.',
    safety:
      'Check extraction. Grossing scope and supervision depend on laboratory policy and personnel qualifications.',
    document: 'Dimensions, orientation, ink convention, sampling approach and cassette key.',
    lesson: '/pathway/grossing',
  },
  {
    id: 'fixation',
    label: 'Fixation',
    task: 'Choose a preparation compatible with the requested downstream work.',
    why: 'Reagent arrival and chemical stabilization are separate. The model shows a depth field, not a universal timer.',
    safety:
      'Follow the exposure-control plan and current SDS; historical mercury and picric methods are reference only.',
    document: 'Cold ischemia, fixative, start/end times, volume and temperature.',
    lesson: '/pathway/fixation',
  },
  {
    id: 'decalcification',
    label: 'Decalcification',
    task: 'Remove mineral while protecting the requested targets.',
    why: 'Residual calcium damages sections and blades. Acid exposure can irreversibly reduce target preservation.',
    safety:
      'Acids require the laboratory’s chemical controls. Do not probe patient tissue as an improvised endpoint.',
    document: 'Agent, exposure, endpoint method/result and assay limitations.',
    lesson: '/learn/L-05',
  },
  {
    id: 'processing',
    label: 'Processing',
    task: 'Build and run an ordered exchange program.',
    why: 'Water, alcohol, clearant and wax exchange only through compatible pathways. Exhaustion and thickness change the rate.',
    safety: 'Instrument recovery and reprocessing must follow a controlled laboratory procedure.',
    document:
      'Reagents, lots, usage, concentrations, exposure, temperature, alarms and corrective action.',
    lesson: '/pathway/processing',
  },
  {
    id: 'embedding',
    label: 'Embedding',
    task: 'Place every piece in the intended cutting plane, then cool the block.',
    why: 'Depth and tilt determine what a section intersects. Deeper facing spends tissue; it cannot replace missing material.',
    safety: 'Hot wax and forceps can injure the operator and damage tissue.',
    document: 'Block key, piece count, orientation, mold and any re-embedding.',
    lesson: '/pathway/embedding',
  },
  {
    id: 'microtomy',
    label: 'Microtomy',
    task: 'Mount safely, align, face and cut a controlled ribbon.',
    why: 'Temperature, blade wear, support, clearance, speed and clamping interact. Investigate one cause at a time.',
    safety:
      'Lock the handwheel and guard the blade before mounting or blade-area adjustment. Unlock only for cutting with hands clear.',
    document: 'Section thickness, depth, purpose, levels, blade condition and corrective actions.',
    lesson: '/pathway/microtomy',
  },
  {
    id: 'bath',
    label: 'Float & pick up',
    task: 'Float the section, inspect it and pick it up on the correctly labeled slide.',
    why: 'Heat and handling change folds, stretching and holes. A carried-over floater keeps its foreign accession.',
    safety: 'A clean bath and verified labels protect specimen identity.',
    document: 'Bath condition and temperature, slide identity, section level and slide type.',
    lesson: '/pathway/microtomy',
  },
  {
    id: 'drying',
    label: 'Drying',
    task: 'Establish adhesion without excessive heat.',
    why: 'Poorly attached sections may lift during retrieval. Excess heat can harm targets even if tissue stays attached.',
    safety: 'Use the validated assay drying procedure and instrument temperature controls.',
    document: 'Drying temperature, duration, slide type and relevant storage history.',
    lesson: '/learn/L-10',
  },
  {
    id: 'he',
    label: 'H&E',
    task: 'Build nuclear and cytoplasmic contrast through ordered reagent exposure.',
    why: 'Wax blocks access; differentiation removes hematoxylin; bluing changes nuclear hue. Water left in clearing produces haze.',
    safety:
      'Use chemical controls and the current reagent SDS. These simulation times are not a bench recipe.',
    document: 'Program, reagent lot/age, control appearance and corrective action.',
    lesson: '/pathway/he',
  },
  {
    id: 'special',
    label: 'Special stains',
    task: 'Execute the chemical graph and review appropriate controls.',
    why: 'Oxidation, reduction, digestion, pH and differentiation determine which targets become visible.',
    safety:
      'Historical reference recipes are not current safety instructions. Use laboratory-approved formulations.',
    document: 'Method, target, control tissue, each reaction and control interpretation.',
    lesson: '/pathway/special-stains',
  },
  {
    id: 'ihc',
    label: 'IHC',
    task: 'Preserve, expose, bind, detect and control the target.',
    why: 'Retrieval can reverse masking; it cannot restore destroyed antigen. Strong signal alone does not establish specificity.',
    safety:
      'Technical control interpretation is taught here, not diagnosis or predictive-marker clinical scoring.',
    document:
      'Marker, protocol, retrieval, primary dilution, lot, detection, controls and disposition.',
    lesson: '/pathway/ihc',
  },
  {
    id: 'ish',
    label: 'ISH',
    task: 'Balance probe access, hybridization and stringency against target integrity.',
    why: 'A failed housekeeping control makes an absent target signal uninterpretable.',
    safety: 'Assay chemistry, tissue requirements and acceptance criteria are laboratory-specific.',
    document: 'Probe, preparation, hybridization, wash conditions and positive/negative controls.',
    lesson: '/pathway/alternate-pathways',
  },
  {
    id: 'coverslip',
    label: 'Coverslipping',
    task: 'Choose a compatible medium and avoid bubbles, haze and drying.',
    why: 'Aqueous-sensitive chromogens and lipids need a compatible finish. Optical clarity depends on the entire solvent path.',
    safety: 'Use ventilation and handling controls for the actual mounting medium.',
    document: 'Medium, preparation compatibility and optical QC.',
    lesson: '/pathway/he',
  },
  {
    id: 'frozen',
    label: 'Frozen section',
    task: 'Freeze, section and stain while protecting tissue and managing TAT.',
    why: 'Slow freezing creates ice spaces. Tissue composition affects useful cryostat settings.',
    safety:
      'Freezing does not sterilize unfixed tissue. Biohazard, blade and decontamination controls are required.',
    document: 'Receipt, freezing conditions, section/stain times, limitations and handoff time.',
    lesson: '/pathway/alternate-pathways',
  },
  {
    id: 'quality',
    label: 'Technical handoff',
    task: 'Review identity, preparation, controls and limitations before disposition.',
    why: 'An attractive slide cannot override an invalid analytical or identity chain.',
    safety: 'Only a technical handoff is modeled. A pathologist interprets the clinical specimen.',
    document: 'QC findings, unresolved problems, corrective action and technical disposition.',
    lesson: '/pathway/quality-handoff',
  },
]
export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]))
