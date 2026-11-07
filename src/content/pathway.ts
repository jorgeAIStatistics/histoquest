import type { DomainId } from './curriculum'
import type { ChoiceQuestion } from './schema'

export type FigureKind = 'tissue' | 'identity' | 'gross' | 'fixation' | 'processing' | 'embedding' | 'microtomy' | 'he' | 'special' | 'ihc' | 'advanced' | 'quality'
export interface Chapter {
  id: string; title: string; short: string; tier: 'Foundations' | 'At the bench' | 'Advanced reasoning'; minutes: number;
  domain: DomainId; objective: string; figure: FigureKind; purpose: string;
  sections: { title: string; text: string }[];
  bench: string[]; downstream: string; misconception: string; deeper: string;
  lessons: string[]; sim: string; sources: string[]; checks: string[];
}

export const PATHWAY: Chapter[] = [
  {
    id: 'tissue-language', title: 'Learn to read the tissue', short: 'Tissue foundations', tier: 'Foundations', minutes: 12, domain: 'STAIN', objective: 'STAIN-01', figure: 'tissue',
    purpose: 'Connect the cells you studied in biology to the structures that a histology slide must preserve.',
    sections: [
      { title: 'A slide is a sampled plane', text: 'A specimen is three-dimensional; a section is a thin two-dimensional sample. One tube can look like a circle, an oval, or a long channel depending on how you cut it. Before naming an abnormality, ask what plane you are looking at. Multiple levels sample different depths; they do not magically reconstruct everything that was in the bottle.' },
      { title: 'Four tissue families, one visual vocabulary', text: 'Epithelium forms surfaces and glands: look for cell layers, polarity, a lumen, and its boundary with connective tissue. Connective tissue provides matrix, collagen, vessels, and supporting cells. Muscle is organized for contraction; fiber direction matters. Nervous tissue contains neurons and supporting glia. Most organs combine all four. First describe architecture at low power, then inspect cells at higher power.' },
      { title: 'What H&E makes visible', text: 'Hematoxylin with a mordant emphasizes basophilic structures such as nuclear chromatin, generally blue to purple after bluing. Eosin emphasizes many cytoplasmic and extracellular proteins in pink shades. White space could be a true lumen, extracted lipid, shrinkage, or a tear. Color alone cannot identify a structure or establish a diagnosis; its location and relationships matter.' },
    ],
    bench: ['Find the tissue boundary and orientation before increasing magnification.', 'Locate a surface, lumen, or other architectural landmark.', 'Compare nuclear detail, cytoplasm, and supporting matrix.', 'Ask whether a missing structure reflects sampling, orientation, or damage.'],
    downstream: 'Good processing preserves relationships between structures, not simply a pink-and-purple appearance.',
    misconception: 'A more intensely stained slide is not necessarily a better slide. Excess stain or thickness can obscure detail.',
    deeper: 'Resolution is the ability to separate nearby objects; magnification only enlarges them. A digital zoom cannot restore detail absent from the original image. Section thickness, optical setup, and staining all influence what can be resolved.',
    lessons: ['L-11'], sim: 'embedding-studio', sources: ['histology-guide', 'leica-he'], checks: ['Q-STAIN-201', 'Q-STAIN-202'],
  },
  {
    id: 'accessioning', title: 'Give every fragment a traceable identity', short: 'Accessioning', tier: 'Foundations', minutes: 10, domain: 'OPS', objective: 'OPS-08', figure: 'identity',
    purpose: 'Understand what must be true before a bottle can enter the laboratory workflow.',
    sections: [
      { title: 'Identity is a chain', text: 'The container, request, accession, specimen part, cassette, block, slide, and final report must remain connected. A patient identifier is different from a laboratory accession number. One accession can have several specimen parts, each with several blocks and slides. Laterality and anatomic site carry meaning that a matching surname cannot replace.' },
      { title: 'Resolve discrepancies at their source', text: 'Check identifiers and required specimen information against the request under the laboratory acceptance procedure. A mismatch is a discrepancy to hold, document, and resolve with authorized staff. Do not guess, silently relabel, or discard the original evidence. Preserve the specimen appropriately while the discrepancy is resolved.' },
      { title: 'The history of the sample matters', text: 'Receipt condition, requested tests, collection information, and preservation history affect what can be done next. Some tissues require a special pathway before routine formalin fixation. An accession record is both a tracking record and the beginning of the preanalytic story that later explains a poor stain or unexpected result.' },
    ],
    bench: ['Compare the container and request.', 'Confirm part, site, laterality and requested studies.', 'Record receipt condition and available timing information.', 'Escalate discrepancies and retain the resolution trail.'],
    downstream: 'A technically excellent slide with uncertain identity cannot support a reliable report.',
    misconception: 'A barcode makes a process easier to verify; it does not prove that the original label was correct.',
    deeper: 'Separate identification errors from analytical failures. Identity must be resolved through traceable documentation, not through the microscopic appearance of the tissue.',
    lessons: ['L-19'], sim: 'specimen-journey', sources: ['cap-nsh-2025'], checks: ['Q-OPS-201', 'Q-OPS-202'],
  },
  {
    id: 'grossing', title: 'Turn a specimen into a sampling plan', short: 'Grossing', tier: 'Foundations', minutes: 16, domain: 'FIX', objective: 'FIX-02', figure: 'gross',
    purpose: 'Connect description, orientation, sampling, and cassette selection to the pathologist’s question.',
    sections: [
      { title: 'Describe before you divide', text: 'Gross examination records what was received and guides what is submitted. Size, number of fragments, color, consistency, orientation markers, and a lesion’s relationship to surrounding tissue can matter. Cutting before understanding the specimen can destroy orientation or a margin relationship. Grossing is performed only within authorized training, supervision, and laboratory procedures.' },
      { title: 'A cassette is a sample of a larger question', text: 'A tiny biopsy may be submitted entirely; a larger specimen requires representative sections selected under a specimen-specific protocol. The block key explains what each cassette represents. A perpendicular margin section can demonstrate the relationship and distance between a lesion and an inked surface. An en face margin samples a surface differently and does not provide the same distance information.' },
      { title: 'Geometry determines reagent access', text: 'Thin, evenly sized pieces expose more tissue to fixative and processing reagents. Overfilled cassettes, thick pieces, and poor containment create different problems: inadequate access, crush, or fragment loss. Small biopsies require a suitable containment method; large samples should not be compressed to force them into a cassette.' },
    ],
    bench: ['Read the request and confirm orientation before cutting.', 'Use a specimen-specific description and sampling protocol.', 'Record each submitted piece in a block key.', 'Keep pieces evenly thin, contained, and free from cassette compression.'],
    downstream: 'A missing lesion or margin cannot be recovered from a beautifully stained section of the wrong tissue.',
    misconception: 'Submitting more tissue into one cassette is not the same as improving representation.',
    deeper: 'Sampling is a clinical decision carried out within the grossing protocol. Surface area and thickness influence reagent access, while the direction of the cut determines the diagnostic relationships retained.',
    lessons: ['L-02', 'L-08'], sim: 'embedding-studio', sources: ['cap-nsh-2025', 'leica-processing'], checks: ['Q-FIX-201', 'Q-FIX-202'],
  },
  {
    id: 'fixation', title: 'Preserve structure before it changes', short: 'Fixation', tier: 'At the bench', minutes: 18, domain: 'FIX', objective: 'FIX-02', figure: 'fixation',
    purpose: 'Explain why fixative, specimen size, time, and downstream testing belong in one decision.',
    sections: [
      { title: 'Penetration and reaction are different', text: 'Formaldehyde must reach the tissue and then react with its constituents. Penetration describes transport; fixation describes chemical stabilization. Tissue that looks firm at the surface may still be inadequately fixed centrally. The familiar name 10% neutral buffered formalin refers to a dilution of formalin stock, giving approximately 4% formaldehyde, not 10% formaldehyde.' },
      { title: 'Preservation has tradeoffs', text: 'Cross-linking helps maintain morphology but can alter access to protein epitopes. Coagulating fixatives act differently and can change morphology, lipid retention, or antigen detection. A fixative suitable for routine paraffin sections may be unsuitable for another investigation. Establish the required pathway for immunofluorescence, electron microscopy, enzyme work, or molecular studies before routine treatment.' },
      { title: 'Record the variables you cannot see later', text: 'Cold ischemia, fixation duration, thickness, temperature, and reagent condition can affect interpretation. An extra hour in wax cannot repair autolysis that happened before fixation. Conversely, retrieval is not a universal repair for every preanalytic defect. Follow the assay-specific validated window, rather than treating a single time as suitable for all tissues and tests.' },
    ],
    bench: ['Confirm the preservation pathway for the requested studies.', 'Check adequate fluid access and tissue thickness.', 'Record relevant times and deviations.', 'Use the laboratory’s validated fixation requirements before processing.'],
    downstream: 'Fixation influences nuclear detail, section integrity, antigen accessibility, and nucleic-acid quality.',
    misconception: 'Penetrated does not mean fully fixed; “more fixation” is not always the solution.',
    deeper: 'The demonstration uses relative diffusion geometry. It deliberately does not predict a validated fixation time. Diffusion distance, chemical binding, tissue composition, and assay requirements prevent a universal timing calculator.',
    lessons: ['L-01', 'L-02', 'L-03', 'L-04'], sim: 'fixation-detective', sources: ['leica-fixation', 'cap-nsh-2025'], checks: ['Q-FIX-203', 'Q-FIX-204'],
  },
  {
    id: 'processing', title: 'Exchange water for a cuttable support', short: 'Processing', tier: 'At the bench', minutes: 18, domain: 'PROC', objective: 'PROC-01', figure: 'processing',
    purpose: 'Understand the chemistry that makes a soft, water-rich specimen compatible with paraffin.',
    sections: [
      { title: 'Each reagent prepares for the next', text: 'After appropriate fixation, dehydration removes water, commonly through graded alcohols. Clearing replaces the dehydrant with a reagent compatible with the infiltration medium. Paraffin infiltration replaces that intermediate with wax. These are purposeful exchanges: wax cannot simply displace the water in a freshly received specimen.' },
      { title: 'A schedule belongs to a specimen class', text: 'A delicate biopsy and a large fatty specimen have different needs. Insufficient exchange leaves poorly supported tissue; excessive exposure can make small tissue hard or brittle. Reagent exhaustion and carryover can undermine a seemingly correct schedule. Processor records, reagent management, tissue size, and affected blocks should be reviewed together.' },
      { title: 'Troubleshoot the process, not just the blade', text: 'Soft centers, fragmentation, and inconsistent cutting can originate before microtomy. If many blocks from one run are affected, consider a shared processing cause. If only one unusually thick piece is affected, look at specimen preparation as well. Reprocessing is a controlled recovery decision because it can introduce further damage and affect subsequent assays.' },
    ],
    bench: ['Confirm fixation and any decalcification are complete per procedure.', 'Select the validated specimen-appropriate schedule.', 'Verify reagent order, condition and instrument readiness.', 'Review the run record and investigate shared failures.'],
    downstream: 'Uniform support is necessary for a thin section without tearing, holes, or severe compression.',
    misconception: 'A longer processor program is not automatically better for a tiny biopsy.',
    deeper: 'Routine paraffin processing extracts many lipids. To demonstrate neutral fat, preservation and section preparation must retain the target; choosing a stain after the lipid has been extracted cannot restore it.',
    lessons: ['L-05', 'L-06'], sim: 'processing-bench', sources: ['leica-processing'], checks: ['Q-PROC-201', 'Q-PROC-202'],
  },
  {
    id: 'embedding', title: 'Choose the plane the pathologist will see', short: 'Embedding', tier: 'At the bench', minutes: 15, domain: 'EMB', objective: 'EMB-01', figure: 'embedding',
    purpose: 'Mentally transform a three-dimensional tissue piece into the structures visible in a section.',
    sections: [
      { title: 'The bottom of the mold becomes the cutting face', text: 'The surface placed against the mold floor is the surface approached first at microtomy. Arrange the relevant face so that the needed structures enter the same section. Position multiple fragments deliberately rather than stacking them at different heights. The block must also provide sufficient wax support around the tissue.' },
      { title: 'Orientation follows the question', text: 'For a skin profile, placing the prepared cut surface down allows epidermis, dermis, and deeper tissue to appear together. A tube requested in cross-section needs its cross-sectional face toward the cutting surface. Mucosal biopsies benefit from orientation that shows the surface-to-base axis when feasible. There is no rule that every tissue should simply be flat.' },
      { title: 'Reconcile the cassette contents', text: 'Compare the tissue with the gross description and block key. Tiny fragments can be lost during transfer or retained in a cassette or sponge. Complete reconciliation before closing the chain between specimen and block. Excessive facing to find a poorly oriented fragment wastes tissue that may be needed for deeper levels or ancillary studies.' },
    ],
    bench: ['Match cassette identity and the block key.', 'Reconcile fragments and inspect the cassette after transfer.', 'Orient the required face at a common cutting level.', 'Confirm the block is supported and ready under the embedding procedure.'],
    downstream: 'Orientation determines whether the slide answers the sampling question before any stain is applied.',
    misconception: 'The largest visible tissue area is not always the most useful section plane.',
    deeper: 'A tangential section through an epithelial surface can obscure its relationship to underlying connective tissue. Re-embedding changes the plane; cutting deeper in the same orientation may never solve the underlying geometry.',
    lessons: ['L-08'], sim: 'embedding-studio', sources: ['leica-processing', 'cap-nsh-2025'], checks: ['Q-EMB-201', 'Q-EMB-202'],
  },
  {
    id: 'microtomy', title: 'Make a thin, intact, traceable section', short: 'Microtomy', tier: 'At the bench', minutes: 20, domain: 'EMB', objective: 'EMB-02', figure: 'microtomy',
    purpose: 'Separate block problems, blade problems, and flotation problems by their observable signatures.',
    sections: [
      { title: 'Face carefully, then section deliberately', text: 'Facing exposes the relevant tissue; final sectioning produces the thickness required for the method. Block temperature, wax properties, tissue hardness, blade condition, clearance angle, and cutting speed interact. Establish safe handling before adjustments: follow the instrument procedure for wheel locking, guarding, blade changes, and block manipulation.' },
      { title: 'An artifact is evidence, not a diagnosis of its cause', text: 'Repeated bands can suggest chatter; compressed sections may indicate a warm block, cutting conditions, or blade problems. A recurring line may arise from a blade nick or a hard particle. Folds can arise during flotation or pickup. Several causes can produce a similar appearance, so change one plausible variable and compare the next section rather than replacing everything at once.' },
      { title: 'Protect the section after cutting', text: 'A flotation bath relaxes the section, but excessive heat or prolonged floating can distort it. Match the slide to the block before pickup and control contamination between specimens. Use suitable slides, adhesion, and drying for the requested method. A section that looks acceptable initially may detach during retrieval if its preparation is unsuitable.' },
    ],
    bench: ['Secure and guard the instrument according to its procedure.', 'Face conservatively and select the required section thickness.', 'Inspect a ribbon, adjust one variable, and compare.', 'Check identity at pickup and prevent bath contamination.'],
    downstream: 'Thickness, integrity, adhesion, and identity all determine whether staining results can be evaluated.',
    misconception: 'Chatter does not prove a single cause. Interpret the pattern together with block and instrument conditions.',
    deeper: 'Section thickness is measured in micrometers; gross slices are measured in millimeters. A 3 mm piece contains 750 nominal 4 µm planes before accounting for facing, trimming, and losses. This is an arithmetic model, not a promise of usable sections.',
    lessons: ['L-09'], sim: 'microtomy-challenge', sources: ['leica-microtomy'], checks: ['Q-EMB-203', 'Q-EMB-204'],
  },
  {
    id: 'he', title: 'Build contrast with H&E', short: 'Routine H&E', tier: 'At the bench', minutes: 16, domain: 'STAIN', objective: 'STAIN-01', figure: 'he',
    purpose: 'Explain every major transition from a wax-containing section to a readable routine slide.',
    sections: [
      { title: 'Reach the tissue first', text: 'Paraffin must be removed and the section brought into the appropriate aqueous environment for the nuclear stain. Incomplete deparaffinization can produce patchy staining. A failed start cannot reliably be corrected by simply extending every later stain step.' },
      { title: 'Control nuclear and cytoplasmic contrast', text: 'Hematoxylin is oxidized to hematein and used with a mordant. Progressive methods build to the desired endpoint; regressive methods deliberately overstain and then differentiate. Bluing changes the nuclear stain to its familiar blue appearance. Eosin provides countercontrast. The exact sequence and endpoints belong to the validated method, not to one universal timer.' },
      { title: 'Finish for optical clarity', text: 'After staining, appropriate dehydration, clearing, and mounting create a clear optical path. Residual water can cause cloudiness with a nonaqueous mounting system. Bubbles, mounting-medium excess, an incomplete coverslip, and obscured labels can each make a slide harder to review or store. Evaluate a control and the tissue itself, including expected nuclear detail.' },
    ],
    bench: ['Verify deparaffinization and hydration.', 'Check nuclear detail, differentiation and bluing.', 'Assess cytoplasm and extracellular contrast.', 'Inspect clarity, coverslip, labels and control performance.'],
    downstream: 'H&E is the architectural baseline that gives context to special stains and IHC.',
    misconception: 'Bluing and differentiation are different operations with different purposes.',
    deeper: 'An H&E problem may be upstream: dark sections may be thick, weak nuclear staining may reflect poor fixation or decalcification, and patchiness may reflect wax. Troubleshooting begins with the pattern and its distribution across the run.',
    lessons: ['L-11'], sim: 'stain-studio', sources: ['leica-he', 'leica-staining'], checks: ['Q-STAIN-203', 'Q-STAIN-204'],
  },
  {
    id: 'special-stains', title: 'Match a chemical reaction to a target', short: 'Special stains', tier: 'Advanced reasoning', minutes: 20, domain: 'STAIN', objective: 'STAIN-07', figure: 'special',
    purpose: 'Predict what a stain demonstrates, what the control establishes, and what a negative result cannot prove.',
    sections: [
      { title: 'Start with the target', text: 'Special stains exploit chemical properties of carbohydrates, connective tissue, microorganisms, pigments, minerals, or other components. Learn the target and reaction before memorizing a color. PAS highlights several carbohydrate-rich structures; a magenta result is not specific for one substance or organism. GMS can demonstrate fungi but is not a stand-alone species identification.' },
      { title: 'Controls test a particular claim', text: 'A positive control must contain the intended target and demonstrate the expected result. For PAS with diastase, a paired glycogen-containing control can establish that digestion worked, while a known fungal-positive control addresses fungal staining performance when that is the purpose. These are distinct questions. Evaluate patient material and controls together.' },
      { title: 'A color belongs to a method and a context', text: 'Trichromes separate collagen from other components, but colors vary with the formulation. Congo red evaluation includes the appropriate optical assessment. Oil red O requires retained lipid; routine paraffin processing is usually incompatible with that aim. Before ordering or interpreting an additional stain, ask whether the target survived collection and preparation.' },
    ],
    bench: ['Name the target and expected localization.', 'Verify the preparation preserves the target.', 'Select controls for the reaction and any pretreatment.', 'Interpret the result with morphology and control performance.'],
    downstream: 'An interpretable negative requires evidence that the method could have detected its target.',
    misconception: 'One positive control does not validate every pretreatment and every diagnostic claim.',
    deeper: 'Compare a true negative with an analytical failure. A control can verify the staining run while leaving uncertainty about a patient specimen’s fixation, sampling, or target preservation.',
    lessons: ['L-12', 'L-13', 'L-14', 'L-15'], sim: 'stain-studio', sources: ['leica-special', 'cap-nsh-2025'], checks: ['Q-STAIN-205', 'Q-STAIN-206'],
  },
  {
    id: 'ihc', title: 'Make antigen detection interpretable', short: 'Immunohistochemistry', tier: 'Advanced reasoning', minutes: 22, domain: 'STAIN', objective: 'STAIN-09', figure: 'ihc',
    purpose: 'Build the detection chain and use localization and controls to reason through failed runs.',
    sections: [
      { title: 'An antibody is part of a system', text: 'After appropriate preparation and, where required, antigen retrieval, a primary antibody binds a target epitope. A detection system makes that binding visible, often through an enzyme and chromogen. The counterstain supplies tissue context. Retrieval can improve accessibility after fixation, but excessive retrieval can damage morphology or cause section loss.' },
      { title: 'Brown is not enough', text: 'Interpret the expected compartment: nuclear, membranous, or cytoplasmic. Unexpected distribution, edge staining, endogenous enzyme activity, pigment, and background can mislead. Signal intensity must be considered with its localization and the known performance of the assay. An isolated brown focus is not a diagnosis.' },
      { title: 'Read the controls before the conclusion', text: 'An external positive control evaluates run performance; appropriate internal controls can also inform whether the patient tissue behaved as expected. Negative tissue elements and reagent controls address different sources of unwanted signal. A failed expected-positive control makes a negative patient result uninterpretable for that run. Document the failure, investigate, and repeat according to the laboratory procedure.' },
    ],
    bench: ['Confirm the validated antibody, retrieval and detection combination.', 'Check expected positive and negative control elements.', 'Evaluate target localization, background and morphology.', 'Resolve failed controls before accepting a result.'],
    downstream: 'IHC adds molecular localization to morphology; it depends on preservation, preparation, controls, and expert interpretation.',
    misconception: 'A negative patient stain with a failed positive control is not a validated negative.',
    deeper: 'Validation establishes assay performance for its intended use and specimen preparation. A new clone, platform, decalcified substrate, or changed protocol may require verification or validation under applicable laboratory requirements. A training simulation cannot establish that performance.',
    lessons: ['L-16'], sim: 'ihc-room', sources: ['leica-ihc', 'cap-ihc'], checks: ['Q-STAIN-207', 'Q-STAIN-208'],
  },
  {
    id: 'alternate-pathways', title: 'Know when routine paraffin is the wrong path', short: 'Special preparation', tier: 'Advanced reasoning', minutes: 20, domain: 'PROC', objective: 'PROC-05', figure: 'advanced',
    purpose: 'Connect bone, frozen sections, IF, EM, and molecular studies to their preparation requirements.',
    sections: [
      { title: 'Bone adds a preservation decision', text: 'Mineral resists routine sectioning. After appropriate fixation, decalcification removes mineral before paraffin processing. Acid methods and chelation with EDTA offer different speed and preservation tradeoffs. Both insufficient decalcification and excessive treatment can harm the result. Endpoint assessment must suit the method. Retaining mineral for a particular study calls for a different preparation strategy.' },
      { title: 'Freezing is support, not routine paraffin processing', text: 'Frozen sections support rapid examination and selected targets poorly retained through routine processing. Ice-crystal artifact reflects how tissue freezes; cryostat temperature needs vary with tissue and medium. Fresh or frozen material can retain biological hazards. A cryostat does not make tissue noninfectious, and its operation requires supervised safety training.' },
      { title: 'Plan ancillary studies before consuming the specimen', text: 'Immunofluorescence, electron microscopy, enzyme histochemistry, and nucleic-acid testing have different preservation needs. Communicate early when multiple studies are needed. For molecular sections, preserve tissue, minimize carryover, and follow the assay’s contamination controls. A routine formalin-fixed block is useful for many assays but is not suitable for every investigation.' },
    ],
    bench: ['Identify nonroutine requests before irreversible preparation.', 'Coordinate allocation with authorized staff.', 'Use the specified fixative, transport medium, and pathway.', 'Document deviations and protect material for additional studies.'],
    downstream: 'The correct downstream assay begins with the right upstream preservation.',
    misconception: 'An alternative method is not inherently better; it must preserve the target and support the intended analysis.',
    deeper: 'Choosing EDTA may favor preservation of particular antigens or nucleic acids at the cost of speed. This is an assay-specific tradeoff, not permission to change an established clinical protocol without validation.',
    lessons: ['L-03', 'L-07', 'L-10'], sim: 'fixation-detective', sources: ['leica-decalcification', 'leica-frozen', 'cap-ihc'], checks: ['Q-PROC-203', 'Q-PROC-204'],
  },
  {
    id: 'quality-handoff', title: 'Explain why this slide is ready—or why it is not', short: 'Quality & handoff', tier: 'Advanced reasoning', minutes: 15, domain: 'OPS', objective: 'OPS-08', figure: 'quality',
    purpose: 'Integrate identification, representation, section quality, controls, and documentation into a defensible handoff.',
    sections: [
      { title: 'Review the whole chain', text: 'At technical review, check identity, requested sections, representation, section integrity, stain quality, controls, coverslipping, and documentation. A missing fragment is different from weak staining; a failed control is different from a true negative. Separate the problem you observed from the cause you suspect, then select a proportionate investigation.' },
      { title: 'Quality control and quality assurance', text: 'Quality control examines performance at a defined step, such as an expected stain reaction. Quality assurance looks across the process: trends in mislabeled material, repeated rework, reagent problems, instrument maintenance, and documented corrective actions. Improving the system requires recording near misses and recurring failures, not merely repairing individual slides.' },
      { title: 'Learning evidence and professional evidence', text: 'A correct quiz answer measures recall or reasoning. A simulated run measures decisions within a model. Supervised demonstration, documented training, and assessed competence provide different evidence. Keep these records separate. ASCP certification requirements and state licensure requirements are also separate; verify the current rules for your route and jurisdiction rather than assuming time in a job title is sufficient.' },
    ],
    bench: ['State the observation clearly.', 'Locate the earliest plausible failure in the chain.', 'Choose and document a corrective action.', 'Verify the correction and communicate unresolved limitations.'],
    downstream: 'The pathologist needs a correctly identified, representative, technically interpretable preparation and its relevant history.',
    misconception: 'One year in a laboratory role does not by itself demonstrate all required histotechnology experience.',
    deeper: 'Use the notebook to prepare questions for a supervisor: what you predict, what you would check, and which bench skill still needs direct observation. The Route 2 tracker organizes evidence; it does not certify eligibility.',
    lessons: ['L-18', 'L-19'], sim: 'specimen-journey', sources: ['ascp-htl-page', 'cap-nsh-2025'], checks: ['Q-OPS-203', 'Q-OPS-204'],
  },
]

const REVIEW = { status: 'author-checked' as const, reviewedOn: '2026-11-06', verification: 'Original educational question. Cross-checked against linked public technical guidance; not independently expert-reviewed.' }
function check(id: string, chapter: number, stem: string, options: [string, string, string, string], answer: number, explanation: string): ChoiceQuestion {
  const c = PATHWAY[chapter]
  return { id, version: 1, domain: c.domain, objective: c.objective, difficulty: 2, kind: 'application', format: 'choice', stem, options: options.map((text, i) => ({ id: 'abcd'[i], text, rationale: i === answer ? explanation : `This does not resolve the key issue. ${explanation}` })), answer: 'abcd'[answer], explanation, references: c.sources.map(sourceId => ({ sourceId })), review: REVIEW, tags: ['specimen-to-slide', c.id] }
}
export const pathwayQuestions: ChoiceQuestion[] = [
  check('Q-STAIN-201', 0, 'The same tube appears circular in one section and elongated in another. What should you consider first?', ['Section plane', 'A failed positive control', 'The specimen identity must be wrong', 'All elongated profiles are artifacts'], 0, 'The plane of section changes the two-dimensional profile of a three-dimensional tube. Consider geometry before inferring a structural change.'),
  check('Q-STAIN-202', 0, 'Increasing digital zoom makes an image larger but no clearer. What is the limiting concept?', ['Accession number', 'Resolution in the original image', 'The number of tissue blocks', 'The eosin label'], 1, 'Magnification enlarges an image; resolution determines whether nearby features can be distinguished. Zoom cannot recreate missing detail.'),
  check('Q-OPS-201', 1, 'The bottle and request have different dates of birth. What is the defensible next action?', ['Trust the matching surname', 'Rewrite the bottle label', 'Hold, document, and resolve the discrepancy through the authorized process', 'Process and let microscopy establish identity'], 2, 'An unresolved identifier mismatch requires a documented resolution through the authorized acceptance process. Appearance cannot establish identity.'),
  check('Q-OPS-202', 1, 'Why must a block key distinguish part A from part B within one accession?', ['They always require different stains', 'The accession number alone proves every anatomic site', 'Part labels are only for billing', 'Each block must remain traceable to the submitted specimen part'], 3, 'An accession may contain several parts and blocks. The block key preserves the anatomic and sampling relationship needed for interpretation.'),
  check('Q-FIX-201', 2, 'A thick tissue piece is compressed into an overfilled cassette. What is the central concern?', ['Compression and impaired reagent access', 'The tissue will necessarily fix faster', 'More tissue always improves representation', 'Only the label font matters'], 0, 'Overfilling can compress tissue and impede reagent access. Representation requires planned sampling and appropriate containment.'),
  check('Q-FIX-202', 2, 'Which sampling approach can preserve lesion-to-ink distance in the plane of section?', ['An arbitrary tissue fragment', 'A properly oriented perpendicular margin section', 'An unlabeled en face section', 'Any section irrespective of orientation'], 1, 'A perpendicular section can show the relationship and distance to an inked surface; an en face margin answers a different sampling question.'),
  check('Q-FIX-203', 3, 'Fixative has penetrated a specimen. What can you conclude about chemical fixation?', ['It is guaranteed complete', 'The specimen needs no processing', 'Penetration alone does not establish completion of fixation reactions', 'Antigen retrieval is no longer relevant'], 2, 'Transport into tissue and chemical stabilization are different processes. Penetration alone is insufficient evidence of adequate fixation.'),
  check('Q-FIX-204', 3, 'A team proposes using one fixation time for every assay and tissue. What is the best response?', ['Use the shortest time for all', 'Use the longest time for all', 'Use only color as the endpoint', 'Check specimen- and assay-specific validated requirements'], 3, 'Fixation requirements depend on the specimen and intended assay. A universal timing rule ignores preservation and analytical tradeoffs.'),
  check('Q-PROC-201', 4, 'Which order expresses routine paraffin-processing exchanges after fixation?', ['Dehydration → clearing → infiltration', 'Infiltration → water → clearing', 'Clearing → fixation → dehydration', 'Wax → alcohol → water'], 0, 'Dehydration removes water, clearing exchanges the dehydrant for a wax-compatible intermediate, and infiltration supplies support.'),
  check('Q-PROC-202', 4, 'Many blocks from one processor run have soft centers. What investigation is most informative first?', ['Change the microscope objective', 'Review the shared processing run and reagent records', 'Assume every slide has a different blade defect', 'Increase eosin time for all slides'], 1, 'A failure shared across a run suggests a common preparation or reagent problem. Review those records before treating every block as an isolated cutting issue.'),
  check('Q-EMB-201', 5, 'A prepared skin strip must show epidermis through deep tissue in one section. Which choice best serves the task?', ['Place the uncut epidermal surface flat against the mold', 'Stack all strips at different depths', 'Orient the prepared profile face toward the cutting face', 'Ignore the grossing description'], 2, 'The cutting plane should include the surface-to-depth relationship. Embedding the prepared profile face supports that goal.'),
  check('Q-EMB-202', 5, 'One fragment is missing when cassette contents are reconciled. What should happen?', ['Assume it was too small to matter', 'Complete embedding without documentation', 'Invent an expected count', 'Investigate and document the discrepancy before completing the transfer'], 3, 'Fragment reconciliation protects specimen representation. Inspect the cassette and containment material and follow the discrepancy process.'),
  check('Q-EMB-203', 6, 'A line recurs in successive sections. Which investigation is reasonable?', ['Check the blade edge and possible hard material under the safe instrument procedure', 'Immediately increase stain strength', 'Assume it proves disease', 'Discard the specimen without investigation'], 0, 'A recurring line can reflect blade damage or hard material. Investigate plausible mechanical causes safely and compare the resulting sections.'),
  check('Q-EMB-204', 6, 'Ignoring facing and losses, how many 4 µm planes fit in 3 mm of tissue?', ['75', '750', '7,500', '12'], 1, 'Convert 3 mm to 3,000 µm, then divide by 4 µm: 750 nominal planes. Real recovery is lower and depends on preparation.'),
  check('Q-STAIN-203', 7, 'H&E staining is patchy where wax remains. Which step needs investigation?', ['Only coverslip size', 'Only digital image brightness', 'Deparaffinization', 'Accession-number length'], 2, 'Remaining paraffin interferes with access by aqueous staining reagents. Investigate deparaffinization before extending later staining steps.'),
  check('Q-STAIN-204', 7, 'Which distinction correctly describes differentiation and bluing?', ['They are synonymous', 'Both remove the coverslip', 'Bluing removes all eosin', 'Differentiation removes excess nuclear stain; bluing changes its color under suitable conditions'], 3, 'Differentiation controls excess staining, whereas bluing changes the nuclear-stain appearance. They are distinct method steps.'),
  check('Q-STAIN-205', 8, 'A PAS/PAS-D pair on known glycogen-containing tissue shows glycogen lost after digestion. What does that support?', ['Diastase digestion worked in the control', 'All patient tissue is fungal-negative', 'Every fungal species is identified', 'No other staining control is needed'], 0, 'Loss of glycogen supports digestion performance. It does not replace a target-positive control for a separate fungal-detection claim.'),
  check('Q-STAIN-206', 8, 'Why is routine paraffin tissue generally unsuitable for demonstrating neutral fat with Oil red O?', ['It cannot be cut thinly', 'Routine processing extracts much of the target lipid', 'Oil red O is a nuclear stain', 'Every paraffin block is infectious'], 1, 'Routine processing extracts many lipids. Preparation must preserve the intended target before staining can demonstrate it.'),
  check('Q-STAIN-207', 9, 'The patient IHC slide is negative and the expected-positive control fails. What is the conclusion?', ['The patient is confidently negative', 'Increase report confidence', 'The negative result is not interpretable until the run failure is resolved', 'Ignore the control if morphology is good'], 2, 'A failed expected-positive control prevents validation of a negative result for the run. Investigate and repeat under the laboratory procedure.'),
  check('Q-STAIN-208', 9, 'A marker expected in nuclei produces only diffuse extracellular brown material. What matters most?', ['Brown automatically means positive', 'The intensity alone', 'The number of slides in the rack', 'Expected localization, background and control performance'], 3, 'Specific localization and controls matter as well as intensity. Unexpected extracellular material may reflect background or another source of color.'),
  check('Q-PROC-203', 10, 'Which principle best guides decalcifier selection for a specimen needing ancillary studies?', ['Balance speed with preservation and the assay’s validated requirements', 'Always use the fastest acid', 'Use the same duration for all bones', 'Decalcify before establishing adequate fixation'], 0, 'Decalcification changes preservation. Select and monitor the method in relation to specimen properties and required downstream testing.'),
  check('Q-PROC-204', 10, 'An IF study is requested before a specimen is placed into routine formalin. What is the best action?', ['Proceed routinely and decide later', 'Clarify allocation and the required preservation pathway now', 'Perform every assay on the same fragment automatically', 'Assume frozen tissue is noninfectious'], 1, 'Some ancillary studies require different handling. Clarify allocation before irreversible preparation or consumption of the specimen.'),
  check('Q-OPS-203', 11, 'What does a successful virtual workbench run establish?', ['Documented clinical competency', 'State licensure', 'Reasoning within a simplified educational model', 'Automatic ASCP eligibility'], 2, 'A virtual run provides learning evidence. Supervised competency, experience documentation, certification, and licensure are distinct requirements.'),
  check('Q-OPS-204', 11, 'A recurring issue affects several stain runs. Which response supports quality assurance?', ['Fix each slide silently', 'Record only successful runs', 'Assume the operator is always at fault', 'Track the pattern, investigate causes, document corrective action and verify improvement'], 3, 'Quality assurance addresses recurring process issues. A documented investigation and verified correction improve the system beyond a single repaired slide.'),
]

export const STAIN_COMPARISONS = [
  ['H&E', 'Architecture, nuclei and cytoplasm', 'Blue-purple nuclei; pink cytoplasm and matrix', 'Representative tissue with expected nuclear and cytoplasmic detail', 'A routine overview, not a specific molecular test'],
  ['PAS / PAS-D', 'Carbohydrate-rich structures; digestion helps assess glycogen', 'Magenta reaction product', 'Target-positive tissue; paired glycogen control for digestion', 'PAS positivity is not specific to glycogen or fungi'],
  ['Alcian blue, pH 2.5', 'Acid mucins', 'Blue mucin', 'Known acidic-mucin-containing tissue', 'pH and method affect what is demonstrated'],
  ['Masson trichrome', 'Connective tissue relationships', 'Collagen often blue or green, depending on method', 'Known collagen and muscle', 'Colors depend on the formulation'],
  ['Congo red', 'Amyloid evaluation', 'Red-orange by brightfield with characteristic birefringence under suitable polarization', 'Known amyloid-positive tissue', 'Examine optics, thickness and morphology; red alone is insufficient'],
  ['GMS', 'Fungal structures and other oxidizable targets', 'Dark/black fungal walls', 'Known fungal-positive tissue', 'Does not establish species on its own'],
  ['Acid-fast methods', 'Acid-fast organisms', 'Method-dependent: often red organisms in brightfield methods', 'Known acid-fast-positive tissue', 'Use the method appropriate for the organism and specimen'],
  ['Prussian blue', 'Ferric iron', 'Blue reaction product', 'Known iron-containing tissue', 'Not a stain for every pigment'],
  ['Oil red O', 'Retained neutral lipid', 'Red lipid', 'Known lipid-containing material prepared to retain fat', 'Routine paraffin processing commonly removes the target'],
  ['IHC with DAB', 'A validated protein target', 'Brown signal in the expected compartment', 'Appropriate positive and negative elements and run controls', 'Localization and validated assay context are essential'],
]

export const ARTIFACTS = [
  { name: 'Chatter', pattern: 'Repeated alternating bands', causes: 'Hard or brittle tissue; cutting conditions; blade or block instability', check: 'Review block preparation and fixation/processing history, then instrument setup and blade condition.', figure: 'artifact-chatter' as const },
  { name: 'Compression', pattern: 'A shortened or wrinkled section', causes: 'Warm block, wax properties, blade condition, or cutting technique', check: 'Compare a properly conditioned block and sound blade under the instrument procedure.', figure: 'artifact-compression' as const },
  { name: 'Knife lines', pattern: 'A recurring straight defect', causes: 'Nicked edge, hard particle, or residual mineral', check: 'Safely inspect the edge and specimen; decide whether the defect follows the blade or tissue.', figure: 'artifact-knife-lines' as const },
  { name: 'Folds', pattern: 'Overlapping tissue appears darker', causes: 'Flotation, pickup, or section handling', check: 'Inspect the unstained section and flotation/pickup conditions.', figure: 'artifact-folds' as const },
  { name: 'Holes or tearing', pattern: 'Missing areas and disrupted continuity', causes: 'Poor support, incomplete processing, hard inclusions, or mechanical damage', check: 'Compare other blocks and review processing before assigning a single cause.', figure: 'artifact-holes' as const },
]
