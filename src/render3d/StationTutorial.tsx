import { useId, useState } from 'react'
import type { SceneStation } from './types'
import { STATION_NAMES } from './types'
import './tutorial.css'

type Step = { title: string; text: string }
const TOURS: Record<SceneStation, [Step, Step, Step]> = {
  overview: [
    {
      title: 'One specimen, one history',
      text: 'Each station reads the same specimen passport and event log. Moving around the room does not reset preparation.',
    },
    {
      title: 'Choose your view',
      text: 'Use the room labels or station list to enter. The 2D work surface has the same procedure controls and modeled outcomes.',
    },
    {
      title: 'Try, inspect, explain',
      text: 'Use free practice to investigate one change at a time. Save and debrief to follow its downstream effects.',
    },
  ],
  accessioning: [
    {
      title: 'Inspect the fictional request',
      text: 'Compare the container information, two identifiers, source and requested work. Rotating the bottle only changes your view.',
    },
    {
      title: 'Resolve before proceeding',
      text: 'The hold and resolution controls record your decisions. Enter the source-authorized correction; accepting or relabeling does not repair an unresolved identity chain.',
    },
    {
      title: 'Keep a traceable record',
      text: 'Read the identity chain and specimen passport. Record your reasoning in the technical note, then continue to the next station.',
    },
  ],
  grossing: [
    {
      title: 'Measure and describe',
      text: 'Record specimen dimensions, piece count, cassette containment, ink convention and the orientation key using the forms.',
    },
    {
      title: 'Establish the sampling plan',
      text: 'Record the extraction check explicitly. The 3D blade guide then adjusts thickness while keeping your recorded cassette and ink choices.',
    },
    {
      title: 'Follow thickness downstream',
      text: 'Thicker pieces and crowding affect the modeled fixation and processing fields. Compare those fields before deciding to alter the next step.',
    },
  ],
  fixation: [
    {
      title: 'Read the preparation history',
      text: 'Check piece thickness, ischemia and previous exposures before choosing a fixative and exposure. The parameter provenance explains the teaching values.',
    },
    {
      title: 'Separate access from reaction',
      text: 'The cutaways show fixative access and the slower reaction as distinct model fields. A filled access field does not mean fixation is complete.',
    },
    {
      title: 'Compare center and surface',
      text: 'Run an exposure, inspect both fields and record your interpretation. Repeating adds exposure to this specimen; it does not begin a new case.',
    },
  ],
  decalcification: [
    {
      title: 'Consider the requested work',
      text: 'The passport carries the specimen family and ancillary request. Use these to explain why mineral removal and target preservation both matter.',
    },
    {
      title: 'Record the method and endpoint',
      text: 'Select an agent, exposure and endpoint assessment in the procedure controls. Values are illustrative scenario settings, not a clinical recipe.',
    },
    {
      title: 'Inspect the tradeoff',
      text: 'Follow residual mineral and preservation into sectioning and staining. A harder block and a lost target can originate before those stations.',
    },
  ],
  processing: [
    {
      title: 'Build the program',
      text: 'Append reagent exchanges with their time, temperature, concentration and exhaustion. Reorder or remove rows before running the program.',
    },
    {
      title: 'Execute in order',
      text: 'Run programmed exchange records each step separately. The rack shows executed history; changing an unsubmitted row does not change the specimen.',
    },
    {
      title: 'Check the center',
      text: 'Inspect water, clearant and wax fields. Reprocessing accumulates exposure and cannot silently remove earlier damage.',
    },
  ],
  embedding: [
    {
      title: 'Account for every piece',
      text: 'Place each piece by its identifier. Keep the cassette key and requested histologic plane in view.',
    },
    {
      title: 'Choose a piece and pose',
      text: 'In 3D, select a tissue piece, choose Move X/Y, Move Z or a rotation mode, then drag. The six numerical controls below provide the keyboard path.',
    },
    {
      title: 'Inspect the model face',
      text: 'The preview reads the current block-face map. Cooling and deeper facing affect the same block; deeper cuts spend tissue.',
    },
  ],
  microtomy: [
    {
      title: 'Set up safely',
      text: 'Use Lock and guard before mounting or blade-area adjustments. Then use Prepare to cut — hands clear when ready to section.',
    },
    {
      title: 'Make a deliberate cut',
      text: 'Set thickness and mechanical controls below. Tap the handwheel for a section or drag it; the Turn handwheel button is the keyboard equivalent.',
    },
    {
      title: 'Inspect before repeating',
      text: 'Every section or deeper step spends material. Compare the ribbon and microscope result, then change one suspected cause and inspect again.',
    },
  ],
  bath: [
    {
      title: 'Inspect the section and bath',
      text: 'Read the latest section and check the bath-clearing and handling decisions explicitly. Previous tissue can carry a source identity.',
    },
    {
      title: 'Float, then pick up',
      text: 'Use the exposure controls for flotation, then select the slide and label for pickup. Frozen sections have a separate direct-pickup path.',
    },
    {
      title: 'Check the result',
      text: 'The model carries folds, floaters, label identity and adhesion forward. Inspect the section before moving to drying.',
    },
  ],
  drying: [
    {
      title: 'Check the slide first',
      text: 'Review pickup, slide treatment and labeling. Drying cannot correct an uncertain specimen identity.',
    },
    {
      title: 'Apply an exposure',
      text: 'Use Run drying with the selected temperature and duration. The action updates the section already on the slide.',
    },
    {
      title: 'Follow adhesion and heat',
      text: 'Inspect the modeled adhesion and later stain behavior. Read parameter provenance before treating a teaching setting as a real procedure.',
    },
  ],
  he: [
    {
      title: 'Review the section history',
      text: 'Preparation, section quality and pickup travel into staining. Begin with the current slide rather than assuming a reference preparation.',
    },
    {
      title: 'Apply each reagent step',
      text: 'Choose a reagent and exposure, then apply it. Order, differentiation, bluing and reagent condition affect the modeled appearance.',
    },
    {
      title: 'Compare and explain',
      text: 'Open the microscope and compare with the disclosed reference. Describe nuclei, counterstain and artifacts before deciding what to repeat.',
    },
  ],
  special: [
    {
      title: 'Read the protocol objective',
      text: 'Select a named method and inspect its target, ordered steps, expected result and control requirements.',
    },
    {
      title: 'Run and record controls',
      text: 'Execute the procedure controls and record what the positive and negative controls show. A colored image alone is not proof of a valid result.',
    },
    {
      title: 'Inspect the same specimen',
      text: 'The microscope reads the specimen history and reaction. Use the debrief to connect an omitted step or failed control to the interpretation.',
    },
  ],
  ihc: [
    {
      title: 'Start with target and localization',
      text: 'Read the marker profile and preparation history. The academy exercises provide separate adjacent-section comparisons without replacing the main specimen.',
    },
    {
      title: 'Change one condition',
      text: 'Use retrieval, titration, controls and detection exercises to compare conditions. Record what the controls support, including failed or missing evidence.',
    },
    {
      title: 'Review validity before release',
      text: 'Check localization, background and controls alongside patient-tissue appearance. The exercise result is educational evidence, not assay validation.',
    },
  ],
  ish: [
    {
      title: 'Read the target and preparation',
      text: 'Review the molecular request, pretreatment and preservation. Keep RNA/DNA controls and sequence requirements in the explanation.',
    },
    {
      title: 'Follow the ordered method',
      text: 'Apply the disclosed ISH teaching steps and record the controls. Omitted or incompatible steps remain in the event history.',
    },
    {
      title: 'Use controls to interpret signal',
      text: 'Inspect the model result and control evidence together. Do not equate missing target signal with a valid negative result without support.',
    },
  ],
  coverslip: [
    {
      title: 'Inspect readiness',
      text: 'Check the current stain, water/clearant state, label and section before mounting.',
    },
    {
      title: 'Apply the mounting choice',
      text: 'Set medium, volume, angle and delay, then apply the coverslip. The action changes the existing slide rather than generating a fresh one.',
    },
    {
      title: 'Review optical artifacts',
      text: 'Inspect bubbles, haze and retraction in the microscope and record the technical handoff decision.',
    },
  ],
  frozen: [
    {
      title: 'Recognize the separate pathway',
      text: 'Check the unfixed-tissue precautions and decontamination plan explicitly. The cryostat controls retain a frozen-section history.',
    },
    {
      title: 'Prepare and section',
      text: 'Choose preparation rate and temperature, then use the guarded instrument workflow. Ice injury and sectioning conditions affect the model.',
    },
    {
      title: 'Pick up and assess',
      text: 'Use direct pickup for the frozen section. Inspect morphology and the time record before technical handoff.',
    },
  ],
  quality: [
    {
      title: 'Read the whole chain',
      text: 'Review identity, tissue representation, preparation, section quality, staining and applicable controls.',
    },
    {
      title: 'State the disposition',
      text: 'Use the technical hold/release controls with a reason. A visually attractive slide does not erase an unresolved critical error.',
    },
    {
      title: 'Save and debrief',
      text: 'Follow the event timeline, explain the cause of a defect, and plan a controlled repeat. Export progress to preserve the complete history.',
    },
  ],
}

export interface StationTutorialProps {
  station: SceneStation
  seen: boolean
  onSeen: () => void
}
function Tour({ station, seen, onSeen }: StationTutorialProps) {
  const [open, setOpen] = useState(!seen)
  const [step, setStep] = useState(0)
  const headingId = useId()
  const panelId = useId()
  const title = station === 'overview' ? 'Lab overview' : STATION_NAMES[station]
  const current = TOURS[station][step]
  const finish = () => {
    onSeen()
    setOpen(false)
  }
  return (
    <section className="station-tutorial" aria-labelledby={headingId}>
      <div className="station-tutorial-heading">
        <h3 id={headingId}>{title} · quick tour</h3>
        <button
          type="button"
          className="btn btn-small"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setStep(0)
            setOpen((old) => !old)
          }}
        >
          {open ? 'Close tour' : 'Replay station tour'}
        </button>
      </div>
      {open && (
        <div id={panelId} className="station-tutorial-body">
          <p className="eyebrow">About a minute · step {step + 1} of 3</p>
          <div aria-live="polite" aria-atomic="true">
            <h4>{current.title}</h4>
            <p>{current.text}</p>
          </div>
          <div className="station-tutorial-actions">
            <button
              type="button"
              className="btn btn-small"
              disabled={step === 0}
              onClick={() => setStep((old) => old - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-small btn-primary"
              onClick={() => (step === 2 ? finish() : setStep((old) => old + 1))}
            >
              {step === 2 ? 'Finish tour' : 'Next tip'}
            </button>
            <button type="button" className="btn btn-small btn-quiet" onClick={finish}>
              Skip tour
            </button>
          </div>
          <p className="small muted">
            This introduces the simulation controls; it does not assess a practical or change the
            specimen.
          </p>
        </div>
      )}
    </section>
  )
}

/** Pure HTML component: the host stores seen/skipped preferences with the rest of learner progress. */
export default function StationTutorial(props: StationTutorialProps) {
  return <Tour key={props.station} {...props} />
}
