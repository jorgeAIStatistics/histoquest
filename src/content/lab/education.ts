import type { ChoiceQuestion, Lesson } from '../schema'
import { OBJECTIVE_BY_ID } from '../curriculum'

const checked = {
  status: 'author-checked',
  reviewedOn: '2026-11-06',
  verification:
    'Original teaching scenarios checked for technical consistency with the listed public references. Not recalled examination items; qualified histotechnology review remains required.',
} as const
type Answer = [text: string, rationale: string]
let questionNumber = 300
function q(
  objective: string,
  stem: string,
  correct: Answer,
  wrong1: Answer,
  wrong2: Answer,
  wrong3: Answer,
  sourceId: string,
  difficulty: 1 | 2 | 3 = 2,
): ChoiceQuestion {
  const sequence = questionNumber++
  const domain = OBJECTIVE_BY_ID[objective].domain
  const choices = [wrong1, wrong2, wrong3]
  const position = sequence % 4
  choices.splice(position, 0, correct)
  return {
    id: `Q-${domain}-${sequence}`,
    version: 1,
    domain,
    objective,
    difficulty,
    kind: difficulty === 3 ? 'case' : 'application',
    format: 'choice',
    stem,
    options: choices.map(([text, rationale], i) => ({ id: 'abcd'[i], text, rationale })),
    answer: 'abcd'[position],
    explanation: correct[1],
    references: [
      {
        sourceId,
        note: 'Technical principle supports this original fictional teaching scenario; the scenario is not a clinical protocol.',
      },
    ],
    review: checked,
    tags: ['laboratory-reasoning'],
  }
}

export const LAB_QUESTIONS: ChoiceQuestion[] = [
  // 300–311: mounting and optical review
  q(
    'STAIN-11',
    'A trainee proposes putting a lipid-preserving frozen stain through the routine alcohol–clearant finish before mounting. Which feature of the request should change that plan?',
    [
      'The method must retain the demonstrated lipid and use a compatible aqueous finish.',
      'Routine solvent finishing can extract the lipid target; Oil Red O needs a compatible lipid-preserving preparation and mount.',
    ],
    [
      'The nuclei need a darker counterstain.',
      'Counterstain intensity cannot prevent extraction of the demonstrated lipid.',
    ],
    [
      'The section needs a longer clearing interval.',
      'Longer solvent exposure increases extraction risk rather than preserving the lipid target.',
    ],
    [
      'The stain must be converted to a silver method.',
      'A different target chemistry is not required simply because the section needs aqueous mounting.',
    ],
    'webpath-oil-red',
  ),
  q(
    'STAIN-11',
    'A rack looked clear when loaded into the coverslipper, but pink haze develops later. Which record is most useful to inspect first?',
    [
      'Water carryover and replacement of post-eosin alcohols and clearant.',
      'Water carried into the final solvents can continue to extract eosin and produce a delayed pink haze.',
    ],
    [
      'The number of blocks faced before section collection.',
      'Facing depth does not explain a delayed haze after otherwise clear mounting.',
    ],
    [
      'The original hematoxylin differentiation record.',
      'Differentiation may affect nuclei, but delayed pink haze points first to eosin and finishing solvents.',
    ],
    [
      'The water-bath temperature used for section collection.',
      'The flotation bath may affect section quality, but does not best explain delayed eosin redistribution.',
    ],
    'leica-he-troubleshoot',
  ),
  q(
    'STAIN-11',
    'A slide scanner repeatedly focuses above the tissue at a circular clear area under the coverslip. What should be investigated?',
    [
      'A bubble that the scanner is treating as a focus target.',
      'A bubble over tissue can divert autofocus away from the section; inspect the physical slide before adjusting stain chemistry.',
    ],
    [
      'A missing hematoxylin mordant in every section.',
      'A reagent problem does not specifically explain a circular object above the tissue plane.',
    ],
    [
      'Excess paraffin remaining in the block.',
      'The described obstacle is under the coverslip and above the section, not in the block.',
    ],
    [
      'An underdeveloped eosin reaction in the tissue.',
      'Weak eosin does not explain a discrete circular structure above the section plane.',
    ],
    'leica-digital-slides',
  ),
  q(
    'STAIN-11',
    'Tiny black-looking refractile patches appeared after stained sections waited exposed before coverslipping. Which step deserves review?',
    [
      'Prevention of section drying before mounting.',
      'Partial drying can trap microscopic air over nuclei and create a corn-flaking appearance.',
    ],
    [
      'Increasing the microtome feed for all future blocks.',
      'Increasing thickness does not correct air introduced during slide finishing.',
    ],
    [
      'Increasing hematoxylin oxidation before the next run.',
      'Hematoxylin chemistry does not correct air introduced by drying after staining.',
    ],
    [
      'Omitting the final clearant.',
      'Omitting a required solvent exchange introduces another incompatibility rather than preventing the described drying event.',
    ],
    'leica-101-histology',
  ),
  q(
    'STAIN-11',
    'After changing mountant, an automated coverslipper leaves incomplete coverage even though the programmed dispense time is unchanged. What is the best next check?',
    [
      'Verify viscosity-related instrument settings and dispense performance for the new medium.',
      'A different mountant can change delivery behavior; instrument settings must be appropriate to that medium.',
    ],
    [
      'Assume all mounting media dispense identically.',
      'Equal programmed time does not guarantee equal volume or spreading with a different medium.',
    ],
    [
      'Lengthen fixation of the next specimen.',
      'Fixation does not correct a coverslipper delivery mismatch.',
    ],
    [
      'Add extra differentiation to the stain program.',
      'Differentiation changes stain retention, not mountant dispensing.',
    ],
    'leica-routine-troubleshoot',
  ),
  q(
    'STAIN-11',
    'A new solvent substitute and a familiar resinous mountant are both labeled for histology. What must still be established before routine use together?',
    [
      'Their actual compatibility in the complete finishing system.',
      'General product purpose does not establish solvent–mountant compatibility; some combinations produce cloudiness or streaks.',
    ],
    [
      'That both products gave acceptable results when tested separately with other partners.',
      'Separate success does not establish compatibility of this particular solvent–mountant combination.',
    ],
    [
      'That either product can replace all other reagents.',
      'A solvent and a mountant perform different roles and are not universal substitutes.',
    ],
    [
      'That a darker eosin will conceal any incompatibility.',
      'More dye cannot correct an incompatible optical environment.',
    ],
    'merck-neomount',
  ),
  q(
    'STAIN-11',
    'A laboratory changes a clearant but does not update the coverslipper bath. Which system-level issue is now plausible?',
    [
      'An incompatible solvent transition between stainer and coverslipper.',
      'The stainer endpoint and coverslipper solvent must work together; evaluate the complete transition.',
    ],
    [
      'A new biological change in every specimen.',
      'A batch-associated change following a reagent substitution first suggests a technical cause.',
    ],
    [
      'A universal loss of tissue nuclei during fixation.',
      'The only reported change occurred during slide finishing.',
    ],
    [
      'A need to increase nuclear staining time on all future racks.',
      'Increasing nuclear staining does not correct an incompatible solvent handoff.',
    ],
    'leica-routine-troubleshoot',
  ),
  q(
    'STAIN-11',
    'Control slides were acceptable at release, but archived examples develop refractile crystals beneath intact coverslips months later. Which material should be included in the investigation?',
    [
      'The mountant and its long-term storage performance.',
      'Delayed crystal formation can arise in mounting medium; storage quality is part of the finished-slide system.',
    ],
    [
      'Only the hematoxylin exposure time.',
      'Nuclear staining time is less directly connected to delayed crystal formation within a mount.',
    ],
    [
      'Only the initial tissue-fixation interval.',
      'Fixation history can affect tissue, but the delayed deposit within the mount requires investigation of finishing materials.',
    ],
    [
      'Only the microtome section-thickness setting.',
      'Thickness can change color density, but is not the first explanation for crystals appearing during storage.',
    ],
    'leica-101-histology',
  ),
  q(
    'STAIN-11',
    'A coverslip extends over the painted label area and leaves an air pocket at its edge. What is the most direct correction to evaluate?',
    [
      'Use the appropriate coverslip size and placement for the tissue and slide.',
      'Coverslip dimensions and placement should cover tissue without riding onto the raised label area.',
    ],
    [
      'Increase mountant volume without checking coverslip placement.',
      'More medium may not eliminate a gap created by a coverslip riding on a raised label.',
    ],
    [
      'Use a longer coverslip to extend farther across the label.',
      'Extending farther onto the label can maintain the same mechanical gap.',
    ],
    [
      'Delete the label so the glass lies flat.',
      'Removing identity information would create a serious traceability failure.',
    ],
    'leica-routine-troubleshoot',
  ),
  q(
    'STAIN-11',
    'Two mounting products list different refractive indices. What does that property describe in the viewing system?',
    [
      'How the medium changes light propagation relative to the surrounding optical materials.',
      'Refractive index is an optical property, not a concentration of stain or a measure of antigen expression.',
    ],
    [
      'The number of nuclei per field.',
      'Cell number is a specimen property and is not encoded by a mountant refractive index.',
    ],
    [
      'The proportion of fixed tissue in the block.',
      'Fixation extent is not what the refractive-index specification reports.',
    ],
    [
      'The resistance of the medium to dispensing through a narrow nozzle.',
      'That describes viscosity-related flow behavior, not refractive index.',
    ],
    'merck-dpx',
  ),
  q(
    'STAIN-11',
    'A bubble-free mount obscures part of the accession label with spilled resin. Which review is still necessary before handoff?',
    [
      'Confirm readable identity and a clean usable slide, not only tissue appearance.',
      'Technical handoff includes identification and handling quality; a clear tissue image cannot repair an unreadable label.',
    ],
    [
      'Release because a clean field is the only requirement.',
      'The pathologist must be able to link the physical slide to the correct case.',
    ],
    [
      'Assign the identity of the next slide in the rack.',
      'Inferring identity from position risks a specimen mix-up.',
    ],
    [
      'File the slide separately and reconstruct its identity after interpretation.',
      'Identity must be established before handoff, not reconstructed after interpretation.',
    ],
    'hq-original',
  ),
  q(
    'STAIN-11',
    'An aqueous mountant is available in the lab. What is the soundest reason to avoid assuming it works with every chromogen and counterstain?',
    [
      'Compatibility is formulation-specific and must be checked for the complete stain system.',
      'Manufacturer guidance lists differing dye compatibilities; the word aqueous is not a universal approval for every stained section.',
    ],
    [
      'All aqueous mounting media dissolve all chromogens.',
      'Some are designed for particular chromogens, so this universal claim is incorrect.',
    ],
    [
      'All aqueous media preserve every dye equally well.',
      'Retention and stability depend on the dye and the particular mounting formulation.',
    ],
    [
      'Compatibility follows automatically from an acceptable initial image.',
      'An initially clear image does not establish later dye stability or chemical compatibility.',
    ],
    'merck-crystal-mount',
  ),
  // 312–323: stain-line quality and causal investigation
  q(
    'STAIN-12',
    'H&E controls drift in color over several days while the saved instrument program remains identical. What does an unchanged program fail to establish?',
    [
      'That the reagent and instrument states remained unchanged.',
      'Carryover, oxidation, workload and reagent condition can change outcomes even when the programmed sequence is constant.',
    ],
    [
      'That the file contains a sequence.',
      'The saved program can remain intact while the working chemistry changes.',
    ],
    [
      'That every specimen has the same diagnosis.',
      'Clinical diagnosis is not inferred from stain-line consistency.',
    ],
    [
      'That all control blocks must be discarded.',
      'A drift needs investigation; it does not automatically invalidate every control block.',
    ],
    'leica-he',
  ),
  q(
    'STAIN-12',
    'A stain line processes twice its usual slide load, but the reagent-change schedule is based only on elapsed days. Which improvement most directly addresses the new risk?',
    [
      'Review workload and observed control performance when setting reagent replacement.',
      'Reagent use depends on throughput and carryover as well as time; workload changes can invalidate an old schedule.',
    ],
    [
      'Keep the old schedule because dates always predict reagent exhaustion.',
      'Calendar time alone does not capture increased reagent load.',
    ],
    [
      'Reduce the number of control reviews because the program is unchanged.',
      'Higher workload can change reagent condition even when the programmed steps are unchanged.',
    ],
    [
      'Shorten every stain step by half.',
      'A workload increase does not justify an unvalidated change to all reaction times.',
    ],
    'leica-he',
  ),
  q(
    'STAIN-12',
    'A control section is patchy after entering hematoxylin with residual clearant. Which earlier transition should be investigated?',
    [
      'Complete dewaxing and hydration into the required aqueous environment.',
      'Residual wax or clearant prevents uniform access and contaminates the nuclear stain.',
    ],
    [
      'The intensity of the final eosin bath.',
      'Eosin is applied later and does not correct residual clearant entering hematoxylin.',
    ],
    [
      'The dehydration interval after eosin.',
      'A later dehydration step cannot correct the earlier access barrier in hematoxylin.',
    ],
    [
      'The mounting-medium refractive index.',
      'Optical mounting properties do not establish whether clearant was removed before staining.',
    ],
    'leica-he',
  ),
  q(
    'STAIN-12',
    'A technician replaces hematoxylin after a documented QC failure. What evidence should precede releasing the held slides?',
    [
      'A satisfactory control run under the corrected conditions and a documented disposition.',
      'A reagent change is an intervention; repeat control review verifies whether it corrected the failure.',
    ],
    [
      'The fact that the new bottle was unopened.',
      'An unopened bottle does not verify the entire staining process.',
    ],
    [
      'A shorter turnaround time on the next rack.',
      'Speed is not evidence of acceptable stain quality.',
    ],
    [
      'Removal of the original failed QC entry.',
      'The failed record is part of the investigation and must be retained.',
    ],
    'leica-he-fundamentals',
  ),
  q(
    'STAIN-12',
    'A staining comparison changes the hematoxylin, differentiation time and section thickness simultaneously. Why is the result hard to interpret?',
    [
      'Several factors changed, so the contribution of each cannot be separated.',
      'A controlled comparison should isolate variables or use an explicit experimental design; a single multi-change comparison is confounded.',
    ],
    [
      'Only patient tissue can ever be used for optimization.',
      'Appropriate control material is useful for method development.',
    ],
    [
      'Section thickness cannot influence appearance.',
      'Thickness changes the amount of stained material in the optical path.',
    ],
    [
      'Different reagent lots are always chemically identical.',
      'Lot changes require appropriate verification rather than an assumption of identity.',
    ],
    'hq-original',
  ),
  q(
    'STAIN-12',
    'The stainer reports a timing interruption during a rack run, but the completed slides appear attractive. What should happen to the interruption information?',
    [
      'Retain it and assess the affected run under the laboratory quality process.',
      'Visual appeal is one observation; the actual exposure history and control results must inform disposition.',
    ],
    [
      'Delete it once the rack is unloaded.',
      'Deleting the event would remove evidence needed for the quality assessment.',
    ],
    [
      'Replace it with the nominal programmed duration.',
      'Nominal time is not the same as the actual interrupted exposure.',
    ],
    [
      'Assume an attractive slide proves no effect occurred.',
      'Appearance alone cannot establish every assay or workflow requirement.',
    ],
    'hq-original',
  ),
  q(
    'STAIN-12',
    'A control contains abundant red cells but no useful connective tissue or epithelium. What limitation does this create for routine H&E QC?',
    [
      'It samples too little of the desired range of tissue staining.',
      'A control should represent the structures needed to judge the intended stain balance; one intensely eosinophilic component is incomplete evidence.',
    ],
    [
      'Red cells make every stain control invalid.',
      'They can be useful components but do not replace the other relevant structures.',
    ],
    [
      'The control can assess every tissue type equally.',
      'Different tissue compartments reveal different aspects of stain performance.',
    ],
    [
      'No nuclear assessment is ever needed in H&E.',
      'Nuclear detail is a major component of H&E quality.',
    ],
    'leica-he-validation',
  ),
  q(
    'STAIN-12',
    'Only one rack position repeatedly shows weak staining while the rest of the run and the reference control are consistent. Which hypothesis best fits the pattern?',
    [
      'A position-dependent delivery, immersion or loading problem.',
      'A reproducible location effect directs attention to local reagent access and instrument/loading conditions.',
    ],
    [
      'The entire hematoxylin bath is uniformly exhausted.',
      'Uniform exhaustion is less consistent with a reproducible defect confined to one physical position.',
    ],
    [
      'Every block assigned to that position was underfixed.',
      'Repeated position dependence across different specimens first points toward a local instrument or loading effect.',
    ],
    [
      'A global scanner color-profile change caused the physical staining pattern.',
      'A global display change should not selectively alter physical staining in one rack position.',
    ],
    'hq-original',
    3,
  ),
  q(
    'STAIN-12',
    'An assistant finds tissue fragments floating in a shared staining bath. Which response best protects the next cases?',
    [
      'Hold affected work for investigation and follow the cleaning/reagent procedure before continuing.',
      'Floating tissue creates a carryover risk; preserve affected-case information and remove the source under the approved process.',
    ],
    [
      'Assume the fragments will stay off all slides.',
      'Loose tissue can transfer to another section and create a floater.',
    ],
    [
      'Add extra eosin to hide foreign tissue.',
      'Stronger staining does not resolve cross-contamination.',
    ],
    [
      'Assign every fragment to the nearest specimen.',
      'Position in a shared bath is not evidence of tissue identity.',
    ],
    'leica-he-fundamentals',
  ),
  q(
    'STAIN-12',
    'A new stain formulation gives a different color balance on one favorite tissue. What is the better comparison before adoption?',
    [
      'Review representative tissue types and the complete intended workflow with designated reviewers.',
      'A staining system must be evaluated across the material and workflow it will serve, not only one visually pleasing example.',
    ],
    [
      'Adopt it solely because one field is brighter.',
      'Brightness in one field does not establish overall technical quality.',
    ],
    [
      'Ignore mounting compatibility during evaluation.',
      'Slide finishing is part of the complete staining system.',
    ],
    [
      'Let the simulator score substitute for laboratory verification.',
      'An educational model is not clinical method verification.',
    ],
    'leica-he-validation',
  ),
  q(
    'STAIN-12',
    'Eosin becomes weak soon after a shortened rinse was introduced between bluing and eosin. Which causal link should be tested?',
    [
      'Alkaline carryover changing the eosin environment.',
      'Insufficient washing after bluing can carry alkali into eosin and alter staining performance.',
    ],
    [
      'The bluing rinse removing all tissue proteins.',
      'The proposed wholesale protein removal does not follow from the shortened rinse; alkaline carryover is the direct concern.',
    ],
    [
      'A weaker eosin caused solely by reducing hematoxylin exposure.',
      'No change in hematoxylin exposure was described; the rinse alteration provides the direct hypothesis.',
    ],
    [
      'A need to skip hematoxylin entirely.',
      'Removing the nuclear stain does not directly correct the rinse-related cause.',
    ],
    'leica-he-webinar',
  ),
  q(
    'STAIN-12',
    'A new reference photograph is noticeably more saturated because its scanner settings changed. What should be controlled before using it to judge stain drift?',
    [
      'The image-acquisition/display conditions as well as the physical control slide.',
      'Digital color changes can arise from acquisition or display; a comparison needs consistent conditions and the physical-slide context.',
    ],
    [
      'Only the nominal staining times printed on the protocol.',
      'Nominal times do not control the scanner and display differences in this comparison.',
    ],
    [
      'Only the physical slide thickness.',
      'Thickness can matter to appearance, but checking it alone does not resolve changed acquisition settings.',
    ],
    [
      'Nothing, because image pixels are direct measurements of stain quantity.',
      'Displayed RGB is influenced by optics and processing and is not a universal chemical measurement.',
    ],
    'landini-colour-deconvolution',
  ),
  // 324–335: dye chemistry and model reasoning
  q(
    'STAIN-13',
    'A learner says that any blue dye must bind the same tissue sites. Which observation best challenges that assumption?',
    [
      'Binding depends on molecular chemistry and the staining environment, not the perceived dye color alone.',
      'Color is an optical property; charge, target chemistry and method conditions determine binding and retention.',
    ],
    [
      'All blue dyes share the same ionic charge.',
      'Perceived color alone does not establish charge or binding chemistry.',
    ],
    [
      'Increasing exposure always makes a dye bind every tissue compartment.',
      'Longer exposure does not make different molecular targets chemically equivalent.',
    ],
    [
      'A common solvent guarantees identical selectivity.',
      'Solvent choice is only one condition and does not establish identical dye–target interactions.',
    ],
    'webpath-alcian',
  ),
  q(
    'STAIN-13',
    'A silver method includes sensitization, impregnation and a separate reducer. What conceptual distinction does the reducer illustrate?',
    [
      'Argyrophil staining requires external reduction to develop the visible silver.',
      'In this reticulin method, tissue supports silver binding but a separate reducing step is needed for visible deposition.',
    ],
    [
      'Every silver method is automatically specific for fungi.',
      'Different silver reactions target different structures.',
    ],
    [
      'The reducer is merely a nuclear counterstain.',
      'Reduction develops metallic silver rather than serving as the contrasting nuclear dye.',
    ],
    [
      'A reducer proves the reaction is argentaffin.',
      'Argentaffin material can reduce bound silver without an added external reducer.',
    ],
    'webpath-reticulin',
  ),
  q(
    'STAIN-13',
    'Why is the black product in Fontana–Masson not itself proof that the target was melanin?',
    [
      'Other argentaffin substances can also reduce silver in the method.',
      'The reaction demonstrates a chemical behavior and is not unique to melanin; localization and appropriate comparisons matter.',
    ],
    [
      'Black is the expected color of every counterstain.',
      'The contrasting nuclear stain in this method is not the same as the black silver product.',
    ],
    [
      'The method never reacts with melanin.',
      'Melanin is one intended target, but not an exclusive one.',
    ],
    [
      'All dark deposits are air bubbles.',
      'Air artifacts and deposited reaction product have different causes.',
    ],
    'webpath-fontana',
  ),
  q(
    'STAIN-13',
    'A mast-cell granule stains a different hue from the surrounding blue dye solution. Which concept explains that teaching observation?',
    [
      'Metachromasia at suitable highly charged tissue sites.',
      'Dye interactions at densely charged sites can shift the observed color relative to the dye solution.',
    ],
    [
      'Simple failure to remove paraffin.',
      'Incomplete dewaxing usually impairs access rather than explaining the characteristic target-specific color shift.',
    ],
    [
      'A bacterial Gram reaction in every mast cell.',
      'The described basic-dye phenomenon is not evidence of bacteria.',
    ],
    [
      'A mordant automatically turning every tissue component purple.',
      'The localized shift reflects the tissue sites and dye interactions, not a universal mordant effect.',
    ],
    'webpath-toluidine',
  ),
  q(
    'STAIN-13',
    'A section contains retained wax and shows sharply patchy weak staining. Why might simply doubling dye exposure fail?',
    [
      'The access barrier may remain even with longer exposure.',
      'A chemical target cannot react uniformly when reagent access is blocked; identify the barrier before changing exposure.',
    ],
    [
      'Time never affects staining reactions.',
      'Time can affect staining, but it does not necessarily remove residual wax.',
    ],
    [
      'All tissue targets become stronger as wax accumulates.',
      'Wax interferes with reagent access rather than amplifying targets.',
    ],
    [
      'Adding more counterstain always removes the barrier.',
      'Counterstain is not a dewaxing reagent and does not reliably remove residual wax.',
    ],
    'leica-he',
  ),
  q(
    'STAIN-13',
    'Two sections have the same target chemistry, but one is folded over itself. Why can the fold appear darker in an absorbance model?',
    [
      'The optical path contains more stained material.',
      'A fold adds tissue thickness and absorbance along the viewing path; darker color need not mean more target per cell.',
    ],
    [
      'Folding creates a new antigen by itself.',
      'Mechanical folding changes geometry, not the molecular identity of the target.',
    ],
    [
      'Every fold is a positive reagent control.',
      'A tissue fold is an artifact and not a suitable control.',
    ],
    [
      'Transmitted intensity is independent of path length.',
      'Absorbance depends on the path through absorbing material; a folded section changes that path.',
    ],
    'landini-colour-deconvolution',
  ),
  q(
    'STAIN-13',
    'In a simulated brightfield image, adding absorbance from two stains should generally have which optical effect?',
    [
      'Reduce transmitted light according to the combined absorption.',
      'Brightfield histologic dyes mix subtractively; additional absorbance reduces the transmitted intensity.',
    ],
    [
      'Add emitted light exactly as two fluorophores would.',
      'Fluorescence is an additive emission problem and should not reuse the same subtractive model.',
    ],
    [
      'Increase transmission because both stains are transparent in solution.',
      'Visible solutions can still absorb selected wavelengths; absorbance reduces transmission.',
    ],
    [
      'Average the two absorbances so added stain cannot darken the section.',
      'In the simplified model, absorbances add along the path rather than being averaged.',
    ],
    'landini-colour-deconvolution',
  ),
  q(
    'STAIN-13',
    'A colleague treats a standard H/E/DAB color vector as a universal laboratory constant. Which limitation should be explained?',
    [
      'Preset vectors can require calibration for the actual stain and imaging method.',
      'The published software presets provide a useful color basis, but staining and acquisition conditions vary.',
    ],
    [
      'A vector is the incubation time in minutes.',
      'These vectors describe color-channel behavior, not reaction duration.',
    ],
    [
      'Every preset is a regulatory acceptance threshold.',
      'A software color preset is not an assay acceptance criterion.',
    ],
    [
      'The same basis is automatically valid for a fluorescence image.',
      'The cited brightfield vectors describe absorption and cannot simply be transferred to additive fluorescence.',
    ],
    'fiji-stain-vectors',
  ),
  q(
    'STAIN-13',
    'A learner sees stronger DAB after longer development and concludes that the specimen necessarily contains twice as much antigen. What is the central problem?',
    [
      'IHC chromogen intensity is not generally a stoichiometric measure of antigen amount.',
      'Detection amplification, development and imaging influence color, so a darker result alone does not establish a proportional antigen quantity.',
    ],
    [
      'Any increase in development is exactly proportional to antigen concentration.',
      'Development conditions can change product accumulation without a proportional biological change.',
    ],
    [
      'A fixed camera exposure eliminates all detection-system nonlinearity.',
      'Controlling acquisition does not remove nonlinearities in staining and signal amplification.',
    ],
    [
      'A successful negative control establishes quantitative linearity.',
      'Background control performance does not demonstrate a linear relationship between antigen and chromogen.',
    ],
    'landini-colour-deconvolution',
  ),
  q(
    'STAIN-13',
    'A cyan or red color is substituted for an approximate special-stain channel in a teaching renderer. What should the interface make clear?',
    [
      'The visual approximation does not establish calibrated chemistry or diagnostic performance.',
      'A declared illustrative color model can teach cause and effect without claiming measured biological calibration.',
    ],
    [
      'A realistic color makes the model expert-reviewed.',
      'Visual realism is not scientific review.',
    ],
    [
      'The substitute color validates every clinical protocol.',
      'A rendering choice cannot validate a laboratory assay.',
    ],
    [
      'No label is needed because all histology images are simulations.',
      'Real microscopy and synthetic teaching imagery must remain distinguishable.',
    ],
    'hq-original',
  ),
  q(
    'STAIN-13',
    'A Prussian blue reaction is negative on one specimen and positive on the control. Which claim stays within what the method directly demonstrates?',
    [
      'No demonstrable ferric-iron reaction was seen under the valid method conditions.',
      'Perls chemistry demonstrates suitable ferric iron; it is not a measurement of every form of tissue iron.',
    ],
    [
      'The specimen contains no iron atoms of any kind.',
      'That conclusion exceeds the target specificity of the stain.',
    ],
    [
      'The specimen must have no red blood cells.',
      'A negative ferric-iron deposit stain does not establish absence of red cells.',
    ],
    [
      'The positive control proves all other special stains are valid.',
      'Controls are method-specific and do not validate unrelated reactions.',
    ],
    'webpath-iron',
  ),
  q(
    'STAIN-13',
    'A student calls the gold-chloride step in a silver protocol the primary nuclear stain. What is the better description for the cited reticulin sequence?',
    [
      'A toning step applied after silver development.',
      'Gold toning modifies the developed silver image; the nuclear counterstain is a separate step.',
    ],
    ['The first step that removes paraffin.', 'Dewaxing occurs before the staining chemistry.'],
    [
      'The step that first impregnates tissue with silver.',
      'Impregnation precedes reduction and toning in the cited sequence.',
    ],
    [
      'The enzyme that digests glycogen.',
      'Diastase is the digestion reagent used for glycogen comparisons.',
    ],
    'webpath-reticulin',
  ),
  // 336–343: Romanowsky and cytology workflows
  q(
    'STAIN-14',
    'A rapid tissue Giemsa control has satisfactory tissue color but no known organisms in the control section. What remains untested for an organism request?',
    [
      'The ability of that run to demonstrate the intended organism target.',
      'A useful organism control must actually contain demonstrable targets; generic tissue contrast is incomplete evidence.',
    ],
    [
      'Whether the tissue counterstain has acceptable color balance.',
      'The stem already reports satisfactory tissue color; that does not verify organism demonstration.',
    ],
    [
      'Whether every cell has the same color.',
      'Romanowsky-type contrast intentionally produces different cellular colors.',
    ],
    [
      'Whether the mounting medium remained optically clear.',
      'Mount clarity is useful QC, but it does not test organism demonstration by the staining chemistry.',
    ],
    'webpath-giemsa',
  ),
  q(
    'STAIN-14',
    'A cytology Papanicolaou program uses hematoxylin followed by orange G and an EA mixture. Which statement best describes their roles?',
    [
      'Nuclear detail is combined with complementary cytoplasmic contrast.',
      'The components serve different staining roles; the multicolor result is not produced by a single interchangeable reagent.',
    ],
    [
      'All three reagents are substitutes for fixation.',
      'Staining does not replace the required preservation of the cells.',
    ],
    [
      'EA is a tissue-clearing solvent.',
      'EA is a cytoplasmic staining mixture, not the final clearant.',
    ],
    [
      'Orange G is the sole nuclear stain and replaces hematoxylin.',
      'Orange G provides cytoplasmic contrast; hematoxylin provides the nuclear component in the stated method.',
    ],
    'merck-pap',
  ),
  q(
    'STAIN-14',
    'A laboratory changes from a standard Pap sequence to a validated rapid variant. What should a trainee avoid assuming?',
    [
      'That every reagent order and exposure can be transferred unchanged between variants.',
      'Named methods can have distinct formulations and sequences; use the specific validated program and appropriate controls.',
    ],
    ['That nuclei still need review.', 'Nuclear detail remains part of Pap technical quality.'],
    [
      'That the specimen still needs traceability.',
      'Identity requirements remain regardless of method speed.',
    ],
    [
      'That a control slide is useful.',
      'Controls remain necessary when assessing a staining method.',
    ],
    'merck-pap',
  ),
  q(
    'STAIN-14',
    'Spray-fixed cytology slides stain unevenly when the preparation step that removes the coating is omitted. Which mechanism is most plausible?',
    [
      'Residual coating interferes with access to the cells.',
      'The cited Pap guidance removes the spray-fixative layer so staining reagents can reach the specimen.',
    ],
    [
      'The coating supplies the required differentiation reaction.',
      'A residual fixation coating is an access issue, not a controlled differentiation step.',
    ],
    [
      'Removing the coating would necessarily remove all diagnostic cells.',
      'The cited preparation includes coating removal specifically to enable staining of retained cells.',
    ],
    [
      'Additional eosin always dissolves the coating completely.',
      'Increasing a later dye is not equivalent to the prescribed preparation step.',
    ],
    'merck-pap',
  ),
  q(
    'STAIN-14',
    'A rapid Giemsa comparison loses target contrast after a prolonged differentiation/dehydration interval. What should be investigated before increasing the primary dye?',
    [
      'Excess removal of dye during later steps.',
      'A weak final result can arise from removal after staining, not just inadequate initial uptake.',
    ],
    [
      'Only the primary Giemsa lot, while ignoring the altered later interval.',
      'Reagent quality may warrant review, but the changed differentiation/dehydration exposure is the direct lead.',
    ],
    [
      'Whether the stained section needs an additional differentiating step.',
      'Additional differentiation can further reduce an already depleted signal.',
    ],
    [
      'Whether prolonged clearant exposure can restore dye already removed.',
      'Clearant cannot restore a dye signal lost during earlier chemical removal.',
    ],
    'webpath-giemsa',
  ),
  q(
    'STAIN-14',
    'A learner describes Romanowsky staining as a single blue reagent that colors all cells identically. Which correction is useful?',
    [
      'Its acidic and basic dye components create contrasting cellular colors.',
      'Romanowsky-type methods use interacting dye components to create a range of tissue and cellular contrasts.',
    ],
    [
      'It is synonymous with ammoniacal silver reduction.',
      'Silver impregnation is a different staining principle.',
    ],
    [
      'It requires DAB to bind every nucleus.',
      'DAB-based immunodetection is not the defining Romanowsky principle.',
    ],
    [
      'It is a mounting medium with no staining function.',
      'Romanowsky methods stain cellular constituents.',
    ],
    'webpath-giemsa',
  ),
  q(
    'STAIN-14',
    'Two Pap slides have the same stain sequence, but one was not preserved according to the method before staining. What must be assessed separately from color balance?',
    [
      'Cell preservation and nuclear detail.',
      'An attractive color balance does not repair preanalytic cellular damage; preservation and staining are separate quality dimensions.',
    ],
    [
      'Only the difference in cytoplasmic color saturation.',
      'Cytoplasmic color does not establish nuclear preservation after a preanalytic error.',
    ],
    [
      'Only the nominal hematoxylin exposure time.',
      'Equal staining times do not establish equal preanalytic preservation.',
    ],
    [
      'Whether the stronger stain can be called better automatically.',
      'More intense color is not a substitute for interpretable morphology.',
    ],
    'merck-pap',
  ),
  q(
    'STAIN-14',
    'A blood-rich marrow preparation and a gastric biopsy are both stained with methods called Giemsa. Which practice is most defensible?',
    [
      'Verify the intended preparation, variant and target-specific quality criteria for each.',
      'A shared method name does not make different specimen preparations and technical targets interchangeable.',
    ],
    [
      'Use identical criteria because every blue cell is equivalent.',
      'Different specimens and applications require appropriate controls and morphology review.',
    ],
    [
      'Omit all controls when the stain name is familiar.',
      'Familiarity does not establish current run performance.',
    ],
    [
      'Interpret a gastric organism stain as a blood-cell count.',
      'That changes the purpose beyond what the specimen and method demonstrate.',
    ],
    'webpath-giemsa',
  ),
  // 344–375: marker-specific technical reasoning
  q(
    'STAIN-09',
    'A CDX2 control stains bowel epithelium strongly, but the laboratory is concerned about reduced assay sensitivity. Which additional control element is most informative in the cited guidance?',
    [
      'Lower-expressing pancreatic duct nuclei.',
      'NordiQC identifies pancreatic ductal elements as a sensitivity challenge that strongly positive bowel alone may not provide.',
    ],
    [
      'Another section containing only strongly positive bowel.',
      'Repeating only a high-expressing target may leave the same sensitivity blind spot.',
    ],
    [
      'Negative tonsillar lymphocytes alone.',
      'Negative tissue helps assess specificity but cannot establish detection of a weak positive target.',
    ],
    [
      'A no-primary-antibody slide alone.',
      'A reagent control cannot replace a positive sensitivity control.',
    ],
    'nordiqc-39',
    3,
  ),
  q(
    'STAIN-09',
    'Chromogranin staining is strong in pancreatic islets, but a weaker clinical target is unexpectedly negative. Which control comparison best challenges sensitivity?',
    [
      'Appendiceal neural elements as well as endocrine cells.',
      'The cited guidance recommends appendix because weaker neural targets challenge sensitivity that strong pancreatic islets may conceal.',
    ],
    [
      'Only a larger pancreatic islet.',
      'A larger strongly expressing target does not test the low-expression range.',
    ],
    [
      'Only an unstained slide.',
      'An unstained slide cannot show whether the assay detects the intended low-level antigen.',
    ],
    [
      'Only smooth muscle expected to be negative.',
      'A negative compartment tests background rather than positive sensitivity.',
    ],
    'nordiqc-40',
    3,
  ),
  q(
    'STAIN-09',
    'A CD117 control shows brilliant mast cells but barely perceptible interstitial cells of Cajal. What is the most useful technical concern?',
    [
      'The run may detect strong targets while underperforming on weaker targets.',
      'Cajal cells provide a lower-expression control relative to strong mast cells; inspect both populations.',
    ],
    [
      'All Cajal cells are the negative control for CD117.',
      'Cajal cells are expected positive elements in the cited appendix/colon control.',
    ],
    [
      'Mast-cell staining proves every target level is adequate.',
      'High expression can mask a sensitivity deficit.',
    ],
    [
      'The correct response is to ignore cell identity and average color.',
      'A whole-field color average obscures the control populations that matter.',
    ],
    'nordiqc-36',
    3,
  ),
  q(
    'STAIN-09',
    'Normal skin contains visible melanocytes but is negative with an HMB-45 assay. Why is that observation alone insufficient to declare reagent failure?',
    [
      'Resting melanocytes are not a dependable positive control for this target.',
      'HMB-45-associated antigen expression can be absent in resting melanocytes; characterized positive material is needed.',
    ],
    [
      'HMB-45 is expected to stain only nuclei.',
      'The intended melanosomal pattern is cytoplasmic rather than a nuclear transcription-factor pattern.',
    ],
    [
      'Every negative normal tissue proves the primary antibody worked.',
      'A negative result in unsuitable positive-control material cannot establish assay performance.',
    ],
    [
      'Normal skin never contains melanocytes.',
      'Melanocytes can be present even when this particular target is not demonstrable.',
    ],
    'nordiqc-54',
  ),
  q(
    'STAIN-09',
    'For SOX10, skin and appendix controls show different positive cell populations. What is a sound reason to retain complementary controls?',
    [
      'They sample distinct expected nuclear patterns, and no consistent low-expression normal control is established in the cited guidance.',
      'NordiQC recommends complementary tissues; one strongly positive compartment does not characterize every aspect of assay performance.',
    ],
    [
      'Both tissues must show diffuse epithelial cytoplasmic positivity.',
      'SOX10 assessment focuses on the expected nuclear-positive populations, not diffuse epithelial background.',
    ],
    [
      'The second control converts SOX10 into S100.',
      'Using another control does not change the marker being detected.',
    ],
    [
      'Only the number of controls matters, regardless of their tissue content.',
      'Control suitability depends on represented targets and negative elements.',
    ],
    'nordiqc-94',
  ),
  q(
    'STAIN-09',
    'A Melan-A slide contains brown pigment before the chromogen is applied. Which comparison would help separate pigment from specific signal?',
    [
      'Review an appropriate comparison section and distinguish endogenous pigment from assay-dependent staining.',
      'Melanin or other pigment can resemble DAB; the observed brown color must be attributed using suitable controls and localization.',
    ],
    [
      'Call every pre-existing brown granule a positive antibody reaction.',
      'Color present before detection cannot be assumed to originate from antibody binding.',
    ],
    [
      'Increase DAB until all cells look equally dark.',
      'Additional chromogen can worsen the distinction rather than resolve it.',
    ],
    [
      'Discard the negative-tissue control because pigment is visible.',
      'Negative tissue and comparison controls remain useful for identifying background and pigment.',
    ],
    'nordiqc-53',
  ),
  q(
    'STAIN-09',
    'An EMA control has strong epithelial staining but weak plasma-cell membranes. What should the reviewer avoid concluding?',
    [
      'That strong epithelium alone proves optimal sensitivity.',
      'Plasma-cell and renal control elements can challenge different expression levels; a strong compartment is not a universal assay check.',
    ],
    [
      'That EMA can label plasma cells.',
      'Plasma-cell staining is a recognized normal control feature.',
    ],
    [
      'That membrane and cytoplasmic patterns can coexist.',
      'EMA localization can differ with cell type and polarity.',
    ],
    [
      'That the negative lymphocytes should be inspected.',
      'Negative compartments are useful when reviewing specificity and background.',
    ],
    'nordiqc-45',
  ),
  q(
    'STAIN-09',
    'A CD79a control shows B-cell membrane labeling and plasma-cell cytoplasmic labeling. Which technical assessment is appropriate?',
    [
      'Both patterns can be expected in the relevant cell populations.',
      'CD79a localization differs across B-lineage maturation; recognize each population rather than imposing one compartment on all cells.',
    ],
    [
      'The plasma-cell cytoplasm proves contamination by CD3.',
      'Expected CD79a plasma-cell labeling does not demonstrate a CD3 contamination event.',
    ],
    [
      'Only a nuclear reaction can validate CD79a.',
      'CD79a is not assessed as a nuclear transcription-factor stain.',
    ],
    [
      'All cytoplasmic signal must be removed by further retrieval.',
      'Further retrieval is not justified simply because a valid cytoplasmic population is present.',
    ],
    'nordiqc-34',
  ),
  q(
    'STAIN-09',
    'Tonsillar germinal centers stain with CD10, but individual B-cell borders are indistinct. Which aspect needs attention?',
    [
      'Membrane definition, not merely a diffuse positive-colored area.',
      'The cited control guidance expects discernible B-cell membranes; diffuse color can conceal poor technical quality.',
    ],
    [
      'Making mantle-zone B cells equally positive.',
      'Mantle-zone B cells are expected negative in this control comparison.',
    ],
    [
      'Removing all germinal-center staining.',
      'The germinal-center B-cell population is the intended positive compartment.',
    ],
    [
      'Accepting any blue counterstain as CD10 positivity.',
      'Counterstain is not the antigen-specific reaction product.',
    ],
    'nordiqc-23',
  ),
  q(
    'STAIN-09',
    'A CD30 tonsil control contains only scattered positive cells. Which conclusion best fits an appropriate reactive control?',
    [
      'Sparse activated-cell staining can be the expected pattern.',
      'CD30 control assessment includes scattered activated cells; uniform lymphocyte staining is not the goal.',
    ],
    [
      'Every tonsillar lymphocyte must be positive.',
      'Widespread uniform staining would not match the expected normal distribution.',
    ],
    [
      'The control is invalid unless all squamous epithelium stains.',
      'Squamous epithelium is not the defining positive control population for CD30.',
    ],
    [
      'A stronger counterstain will create missing activated cells.',
      'Counterstaining cannot create target-bearing cells.',
    ],
    'nordiqc-5',
  ),
  q(
    'STAIN-09',
    'Strong portal vessels are present in a CD34 liver control. Which additional region should be inspected to challenge lower expression?',
    [
      'Periportal sinusoidal endothelium.',
      'These endothelial elements provide a lower-expression check beyond the strongly stained portal vessels.',
    ],
    [
      'Hepatocyte nuclei.',
      'Hepatocytes are expected negative and do not supply a nuclear CD34 positive control.',
    ],
    [
      'Only the acellular capsule.',
      'Acellular collagen is not the relevant CD34-positive population.',
    ],
    [
      'Only the coverslip edge.',
      'The relevant target cells are within the tissue, not the glass margin.',
    ],
    'nordiqc-30',
  ),
  q(
    'STAIN-09',
    'A CD31 slide includes positive endothelial membranes and some positive hematolymphoid cells. What should the learner remember?',
    [
      'CD31 expression is not absolutely restricted to endothelium.',
      'Selected hematolymphoid and platelet-related elements can react, so location and cell identity matter.',
    ],
    [
      'Any non-endothelial positive cell proves reagent failure.',
      'The marker has recognized non-endothelial expression.',
    ],
    [
      'The marker must be reclassified as a nuclear stain.',
      'The normal control pattern is predominantly membranous, not a nuclear transcription-factor pattern.',
    ],
    [
      'The positive cells can be counted as blood vessels without morphology.',
      'Positive-cell identity cannot be assigned from chromogen alone.',
    ],
    'nordiqc-29',
  ),
  q(
    'STAIN-09',
    'ERG staining clearly outlines vessels, but the color lies in endothelial cytoplasm with no convincing nuclear signal. What is the main review point?',
    [
      'Whether the intended nuclear target is actually demonstrated.',
      'ERG is a nuclear transcription factor; cytoplasmic color alone does not establish the expected technical result.',
    ],
    [
      'Whether every epithelial nucleus also stains.',
      'Epithelial nuclei are not the routine normal positive population in the appendix control.',
    ],
    [
      'Whether the section can be called positive from vessel shape alone.',
      'Morphology locates cells but does not replace assessment of target localization.',
    ],
    [
      'Whether stronger eosin can stand in for ERG.',
      'A counterstain cannot substitute for an immunohistochemical target reaction.',
    ],
    'nordiqc-101',
  ),
  q(
    'STAIN-09',
    'A Ki-67 tonsil control stains dark-zone germinal-center nuclei strongly while light-zone nuclei are weaker. Which question best tests the method?',
    [
      'Are the expected weaker positive nuclei still distinctly demonstrated with suitable negative compartments?',
      'Control review should assess both expression levels and localization rather than demanding one uniform intensity.',
    ],
    [
      'Can every mantle-zone B cell be made strongly positive?',
      'Most mantle-zone B cells are expected negative and provide useful contrast.',
    ],
    [
      'Can nuclear staining be replaced by diffuse cytoplasmic DAB?',
      'The intended Ki-67 reaction is nuclear.',
    ],
    [
      'Does the control establish a universal clinical proliferation cutoff?',
      'A technical control does not define clinical interpretation for every specimen.',
    ],
    'nordiqc-1',
  ),
  q(
    'STAIN-09',
    'A specimen appears negative for an MMR protein, and its stromal and lymphoid nuclei are also unstained. What is the defensible technical disposition?',
    [
      'Treat the result as potentially invalid and investigate the absent internal controls.',
      'Without demonstrably working internal positive elements, a loss pattern cannot be safely distinguished from assay or preservation failure.',
    ],
    [
      'Report biological loss solely because all nuclei are negative.',
      'Uniform negativity can result from technical failure.',
    ],
    [
      'Use cytoplasmic background as proof of nuclear assay sensitivity.',
      'The expected control localization is nuclear.',
    ],
    [
      'Assign the result of a different marker to the failed stain.',
      'Another assay does not directly establish the validity of this marker run.',
    ],
    'nordiqc-81',
    3,
  ),
  q(
    'STAIN-09',
    'A p53 control contains weak scattered normal nuclear staining. Why can that be valuable compared with only a strongly positive control?',
    [
      'It challenges detection of lower-level nuclear signal.',
      'Weak normal elements provide information about sensitivity that a very strong target may not reveal.',
    ],
    [
      'It proves that every clinical specimen has a mutation.',
      'Normal control staining does not establish specimen genetic status.',
    ],
    [
      'It eliminates the need to assess internal controls.',
      'Specimen-specific internal control information remains important.',
    ],
    ['It means the stain is expected to be membranous.', 'The intended p53 assessment is nuclear.'],
    'nordiqc-60',
  ),
  q(
    'STAIN-09',
    'A trainee substitutes p63 control expectations directly into a p40 exercise. Which point should be clarified?',
    [
      'Related markers and reagents can have different isoform specificity and control expectations.',
      'p40 focuses on a p63 isoform; related biology does not make every staining expectation interchangeable.',
    ],
    [
      'Both markers are universal cytoplasmic structural proteins.',
      'These are assessed as nuclear markers.',
    ],
    [
      'Every p63-positive cell must be identical to every p40-positive cell.',
      'The markers are related but should be validated and interpreted in their own assay context.',
    ],
    [
      'A new antibody name removes the need for a control.',
      'Every assay still needs appropriate technical controls.',
    ],
    'nordiqc-10',
  ),
  q(
    'STAIN-09',
    'Thyroid follicles stain intensely for TTF-1, but a laboratory wants a more demanding normal control. Which tissue is informative?',
    [
      'Lung with appropriate bronchiolar epithelial elements.',
      'Normal lung contains useful lower-expression control elements; strong thyroid alone can conceal reduced sensitivity.',
    ],
    [
      'Only thyroid tissue cut thicker.',
      'Increasing a strong control signal does not test weaker target detection.',
    ],
    [
      'Only a negative muscle section.',
      'A negative section assesses background, not detection of a weak positive target.',
    ],
    [
      'Only tissue without epithelial cells.',
      'It lacks the relevant normal positive epithelial elements.',
    ],
    'nordiqc-75',
  ),
  q(
    'STAIN-09',
    'GATA3 stains a subset of T-zone cells in a tonsil control. Which response is appropriate?',
    [
      'Recognize the expected normal T-cell-associated nuclear control pattern.',
      'The cited guidance includes T-helper-cell nuclear staining, so immune-cell positivity is not automatically nonspecific.',
    ],
    [
      'Reject every immune-cell positive reaction as contamination.',
      'This would discard a recognized control population.',
    ],
    [
      'Convert the assay to a cytoplasmic scoring system.',
      'GATA3 is assessed as a nuclear transcription factor.',
    ],
    [
      'Require every germinal-center B cell to stain equally.',
      'The expected distribution is not uniform positivity of all B cells.',
    ],
    'nordiqc-8',
  ),
  q(
    'STAIN-09',
    'A hormone-receptor assay has strong normal epithelial nuclei but lacks evidence from weaker control elements. What does the strong signal fail to prove?',
    [
      'Adequate sensitivity across the relevant expression range.',
      'Strong targets can remain visible when lower-expression detection is inadequate; control design should challenge that range.',
    ],
    [
      'That the tissue section exists.',
      'The visible cells establish presence of tissue, but not the sensitivity range.',
    ],
    [
      'That nuclear localization should be considered.',
      'Nuclear localization remains central to receptor assay review.',
    ],
    [
      'That any negative compartment is useful.',
      'Negative compartments still help assess unintended staining.',
    ],
    'nordiqc-2',
  ),
  q(
    'STAIN-09',
    'A HER2 exercise offers only a very strongly expressing positive control. What additional control design is most valuable?',
    [
      'An assay-characterized range including intermediate expression and relevant negative material.',
      'Intermediate controls can reveal performance drift that an extreme positive alone misses; clinical scoring remains assay and indication dependent.',
    ],
    [
      'Only a thicker section from the same extreme positive.',
      'Increasing target amount does not cover the missing sensitivity range.',
    ],
    [
      'Only a no-primary slide with no tissue.',
      'A blank slide cannot test tissue-related assay performance.',
    ],
    [
      'A universal threshold copied from an unrelated tissue assay.',
      'Assay and tissue-indication differences prevent uncritical transfer of clinical thresholds.',
    ],
    'nordiqc-11',
    3,
  ),
  q(
    'STAIN-09',
    'Synaptophysin control nerves are intensely positive while mucosal endocrine cells are difficult to find. What should happen next?',
    [
      'Inspect the expected weaker cellular controls and verify that they are adequately demonstrated.',
      'The neural high-expression signal alone does not establish performance in lower-expressing endocrine cells.',
    ],
    [
      'Ignore the endocrine elements because nerves are dark.',
      'That removes a useful sensitivity check.',
    ],
    [
      'Require the signal to move into every nucleus.',
      'Synaptophysin is a vesicle-associated cytoplasmic marker.',
    ],
    [
      'Use a negative RNA probe as the sole positive control.',
      'A negative ISH reagent does not establish synaptophysin protein detection.',
    ],
    'nordiqc-73',
  ),
  q(
    'STAIN-09',
    'A nuclear neuroendocrine marker is requested to contrast with cytoplasmic granule/vesicle markers. Which teaching catalog entry fits that localization?',
    [
      'INSM1.',
      'INSM1 is a nuclear transcription factor; localization distinguishes it from cytoplasmic chromogranin and synaptophysin patterns.',
    ],
    ['Chromogranin A.', 'Its characteristic control signal is granular cytoplasmic.'],
    ['Synaptophysin.', 'Its expected signal is associated with cytoplasmic vesicular structures.'],
    ['Oil Red O.', 'Oil Red O is a histochemical lipid stain rather than a nuclear immunomarker.'],
    'nordiqc-120',
  ),
  q(
    'STAIN-09',
    'WT1 controls behave differently after a change of antibody and retrieval method. What is the best interpretation of that observation?',
    [
      'Control suitability and cytoplasmic background can depend on the specific antibody/retrieval combination.',
      'The cited WT1 guidance explicitly qualifies control expectations by antibody and retrieval; verify the new assay context.',
    ],
    [
      'Every WT1 reagent must give an identical result under any retrieval.',
      'This ignores documented assay-dependent behavior.',
    ],
    [
      'Podocyte nuclei can never serve as a control.',
      'Kidney can be useful for appropriate WT1 assays.',
    ],
    [
      'The change can be judged only from the color of the reagent bottle.',
      'Packaging color does not establish target localization or assay performance.',
    ],
    'nordiqc-77',
  ),
  q(
    'STAIN-09',
    'A PAX8 antibody labels tonsillar B-cell nuclei unexpectedly. Which specificity issue should be investigated?',
    [
      'Possible cross-reactivity with another PAX-family target such as PAX5.',
      'The cited guidance identifies B-cell nuclear labeling as a warning for PAX5 cross-reaction in some PAX8 reagents.',
    ],
    [
      'A universal requirement for all lymphocytes to express renal markers.',
      'That is not the expected PAX8 control pattern.',
    ],
    [
      'Only the final coverslip size.',
      'Coverslip dimensions do not explain a specific unexpected nuclear cell population.',
    ],
    [
      'A need to classify all tonsillar cells as renal epithelium.',
      'Cell identity cannot be redefined to fit an unexpected stain.',
    ],
    'nordiqc-64',
    3,
  ),
  q(
    'STAIN-09',
    'Calretinin control cells show cytoplasmic color but no expected nuclear component. Which question is most useful?',
    [
      'Does this satisfy the expected combined localization for the chosen control and assay?',
      'The cited control guidance expects nuclear as well as cytoplasmic staining; isolated cytoplasmic color warrants investigation.',
    ],
    [
      'Should the reviewer ignore localization whenever color is strong?',
      'Strong color in the wrong compartment can be misleading.',
    ],
    [
      'Should every epithelial cell be made positive?',
      'The recommended bowel control includes negative epithelial elements.',
    ],
    [
      'Does this prove the tissue contains no calcium?',
      'Calretinin IHC is not a measurement of total tissue calcium.',
    ],
    'nordiqc-18',
  ),
  q(
    'STAIN-09',
    'A podoplanin control stains lymphatic endothelium while nearby blood-vessel endothelium is negative. Which conclusion is appropriate?',
    [
      'That contrast can be expected and useful for technical control review.',
      'The recommended appendix control distinguishes lymphatic vessels from blood vessels.',
    ],
    [
      'All vessels must stain equally or the run is invalid.',
      'The marker does not have an identical expected pattern in these vessel types.',
    ],
    [
      'Negative blood vessels prove that all lymphatic staining is artifact.',
      'The negative compartment is part of the expected control contrast.',
    ],
    [
      'The marker must therefore be a nuclear stain.',
      'The vascular control is assessed at the cell surface rather than as a nuclear transcription factor.',
    ],
    'nordiqc-66',
  ),
  q(
    'STAIN-09',
    'An ALK lung assay is controlled only with a very strongly positive lymphoma. What is the important limitation?',
    [
      'That control may not challenge the lower expression relevant to the intended lung assay.',
      'Control selection must match the assay purpose and sensitivity range; a strongly positive unrelated application can be insufficient.',
    ],
    [
      'A lymphoma control cannot contain ALK protein.',
      'Some lymphomas can strongly express ALK, which is why this sensitivity issue arises.',
    ],
    [
      'A stronger counterstain will create the missing low-level control.',
      'Counterstaining cannot provide a target-expression range.',
    ],
    [
      'The lung assay can use any clinical cutoff regardless of validation.',
      'Intended use and assay validation remain necessary.',
    ],
    'nordiqc-14',
    3,
  ),
  q(
    'STAIN-09',
    'A beta-catenin control has crisp epithelial membranes, but the intended assay also needs to detect nuclear localization. What remains to be checked?',
    [
      'Appropriate nuclear-positive control performance.',
      'A membrane-positive control does not by itself establish sensitivity for the nuclear pattern required by the intended use.',
    ],
    [
      'Whether the membrane signal can simply be renamed nuclear.',
      'Localization must follow the observed compartment.',
    ],
    [
      'Whether negative stroma alone can replace a positive nuclear control.',
      'Negative tissue tests background, not nuclear-positive sensitivity.',
    ],
    [
      'Whether all cytoplasmic signal should be treated as an RNA probe.',
      'Beta-catenin IHC detects protein, not an ISH transcript.',
    ],
    'leica-beta-catenin',
  ),
  q(
    'STAIN-09',
    'A DOG1 control is selected solely because it contains many CD117-positive mast cells. What is wrong with the rationale?',
    [
      'A control for one marker need not supply the required positive cells for another.',
      'DOG1 controls assess Cajal and other appropriate elements; mast-cell positivity for CD117 does not validate DOG1.',
    ],
    [
      'Cajal cells cannot be used in any immunostain control.',
      'They are useful positive elements in these gastrointestinal marker controls.',
    ],
    [
      'Both markers are always nuclear and therefore interchangeable.',
      'Their expected patterns are primarily membrane/cytoplasmic and their expression differs.',
    ],
    [
      'Mast cells are absent from all bowel tissue.',
      'Mast cells can be present, but presence alone does not make them DOG1-positive controls.',
    ],
    'nordiqc-7',
  ),
  q(
    'STAIN-09',
    'A brain control contains GFAP-positive astrocytes but unstained neighboring neurons. What should the learner conclude?',
    [
      'Different neural cell types have different expected marker expression.',
      'GFAP is not a universal label for every cell in brain; expected positive and negative populations provide context.',
    ],
    [
      'Every unstained brain cell proves inadequate retrieval.',
      'Some cells are expected negative for GFAP.',
    ],
    [
      'Neuronal negativity means the tissue was never fixed.',
      'The result alone does not establish fixation history.',
    ],
    [
      'All brain nuclei should become positive with a darker counterstain.',
      'Counterstain intensity cannot create GFAP antigen expression.',
    ],
    'nordiqc-50',
  ),
  q(
    'STAIN-09',
    'Most neurons in a NeuN control react, but Purkinje cells do not. Which interpretation stays within the manufacturer-described pattern?',
    [
      'Some neuronal populations can be negative despite otherwise suitable staining.',
      'NeuN labels many, not all, neurons; Purkinje cells are a recognized negative population.',
    ],
    [
      'The assay is invalid unless every neuron is equally positive.',
      'That ignores known normal expression differences.',
    ],
    [
      'Only glial cells should show the expected NeuN signal.',
      'NeuN is used for neuronal rather than general glial labeling.',
    ],
    [
      'The negative cells prove that the entire control contains no RNA.',
      'NeuN protein IHC is not an RNA-integrity assay.',
    ],
    'millipore-neun',
  ),
  // 376–395: special-stain and ISH investigation
  q(
    'STAIN-02',
    'A PAS-D comparison shows identical glycogen-rich liver staining in the digested and undigested controls. What needs investigation before interpreting the specimen?',
    [
      'Whether the digestion step actually removed control glycogen.',
      'The paired control must demonstrate effective digestion; an unchanged glycogen-containing control does not establish it.',
    ],
    [
      'Whether the undigested control should be discarded.',
      'The undigested companion is needed to interpret the digestion comparison.',
    ],
    [
      'Whether both sections can automatically be called diastase-resistant.',
      'Failed digestion can mimic resistance.',
    ],
    [
      'Whether a darker nuclear counterstain will verify amylase activity.',
      'Nuclear color does not measure glycogen digestion.',
    ],
    'webpath-pasd',
  ),
  q(
    'STAIN-02',
    'A PAS specimen and its positive control are weak after a new Schiff reagent bottle is introduced. Which explanation should be tested before declaring the specimen target absent?',
    [
      'A reaction or reagent failure affecting the shared run.',
      'A failed positive control prevents confident interpretation of a specimen-negative result; investigate the common analytic process.',
    ],
    [
      'Biological absence in every control target.',
      'A known-positive control should not be assumed biologically negative without investigating the run.',
    ],
    [
      'Successful digestion of all targets even though no diastase was used.',
      'The method history does not support a digestion explanation.',
    ],
    [
      'A requirement to omit oxidation from the repeat.',
      'Oxidation is part of the PAS reaction, not a step to remove arbitrarily.',
    ],
    'webpath-pas',
  ),
  q(
    'STAIN-02',
    'An Alcian blue bottle is prepared at the wrong acidity. Why is matching stain time alone insufficient to preserve the intended result?',
    [
      'The chemical environment affects which charged tissue groups are demonstrated.',
      'pH is part of the stain selectivity and binding conditions, so time alone cannot make a different chemical environment equivalent.',
    ],
    [
      'A sufficiently long exposure always compensates for altered pH.',
      'Longer exposure cannot be assumed to recreate the selectivity of the intended pH.',
    ],
    [
      'A stronger nuclear counterstain restores the intended mucin selectivity.',
      'Counterstain intensity does not establish which charged mucin groups bound Alcian blue.',
    ],
    [
      'Every mucin dye has identical pH behavior.',
      'Different dyes and methods have different chemical requirements.',
    ],
    'webpath-alcian',
  ),
  q(
    'STAIN-02',
    'A colloidal-iron stain shows blue material that also appears in a companion section where the colloidal reagent was omitted. What should be considered?',
    [
      'Pre-existing tissue iron contributing to the visualization reaction.',
      'The iron-revealing step can demonstrate endogenous iron; an omission comparison helps distinguish that from bound colloidal iron.',
    ],
    [
      'Proof that every blue deposit is acidic mucin.',
      'The omission result challenges that exclusive attribution.',
    ],
    [
      'Proof that omitting colloidal iron increases mucin specificity.',
      'Removing the target-binding reagent does not make the remaining endogenous-iron reaction more specific for mucin.',
    ],
    [
      'A need to call the omission slide a positive mucin control.',
      'An omission slide serves a different control purpose.',
    ],
    'webpath-colloidal',
  ),
  q(
    'STAIN-03',
    'In a Masson comparison, collagen retains too much red and separates poorly from muscle. Which part of the reaction history is most relevant?',
    [
      'Differentiation before the collagen dye.',
      'The sequence uses differentiation to establish selective contrast; inadequate removal can leave collagen red.',
    ],
    [
      'Only final nuclear bluing after the coverslip is applied.',
      'That is not the relevant stage of this trichrome sequence.',
    ],
    [
      'Only the amount of eosin in the separate routine H&E line.',
      'A separate H&E reagent does not explain the deficient differentiation within this trichrome sequence.',
    ],
    [
      'Only increasing all stain times equally.',
      'A uniform increase can worsen imbalance and does not isolate the deficient step.',
    ],
    'webpath-masson',
  ),
  q(
    'STAIN-03',
    'Large elastic arteries remain dark on a VVG control, but fine elastic fibers have disappeared. What endpoint problem is plausible?',
    [
      'Over-differentiation that is hidden by the robust large-fiber signal.',
      'Fine fibers can be lost before coarse elastic structures; control review should include the more demanding elements.',
    ],
    [
      'A requirement for all collagen to become black.',
      'This variant uses contrasting collagen color rather than blackening every connective-tissue component.',
    ],
    [
      'Successful demonstration of every elastic fiber because one artery is dark.',
      'A coarse positive alone does not establish preservation of fine-fiber sensitivity.',
    ],
    [
      'A need to ignore differentiation entirely on the next run.',
      'The method depends on controlled differentiation rather than its arbitrary omission.',
    ],
    'webpath-elastic',
  ),
  q(
    'STAIN-03',
    'A reticulin run omits its external reducing step. Which result would be consistent with that procedural error?',
    [
      'Inadequate development of the visible silver framework.',
      'This argyrophil method needs reduction after impregnation; merely binding silver does not complete the image.',
    ],
    [
      'Selective digestion of glycogen by the omitted reducer.',
      'Glycogen digestion is unrelated to the role of the silver reducer.',
    ],
    [
      'Automatic conversion to an equivalent Fontana–Masson method.',
      'Omitting a step does not validate a different reaction system.',
    ],
    [
      'A completed stain because counterstain can replace metallic silver.',
      'The counterstain supplies contrast but not the reticulin reaction product.',
    ],
    'webpath-reticulin',
  ),
  q(
    'STAIN-03',
    'Congo red deposits are visible in brightfield, but the positive control is not assessed under the same polarization setup. What remains incomplete?',
    [
      'Verification of the optical comparison required by the method.',
      'The known-positive control and specimen need an appropriate shared polarization assessment; brightfield redness alone is insufficient.',
    ],
    [
      'Verification that all red staining disappears when the analyzer is inserted.',
      'Disappearance of all red color is not the required positive-control assessment of birefringence.',
    ],
    [
      'The requirement that every red structure be called amyloid.',
      'Other structures and artifacts can complicate color interpretation.',
    ],
    [
      'The assumption that increasing eosin substitutes for polarization.',
      'Eosin does not establish the characteristic Congo red optical behavior.',
    ],
    'webpath-congo',
  ),
  q(
    'STAIN-04',
    'A GMS control is so dark that target walls cannot be separated from background. What is the best description of the problem?',
    [
      'Excess deposition has reduced useful target-to-background contrast.',
      'A technically stronger overall silver reaction can be worse if background obscures the intended structures.',
    ],
    [
      'An optimal result because the total black signal is maximal.',
      'Maximum darkness is not the same as interpretable staining.',
    ],
    [
      'A negative result because no counterstain is visible.',
      'The issue is obscuring deposition, not proof of target absence.',
    ],
    [
      'Proof that all dark structures are organisms.',
      'Silver background must not be interpreted as organism-specific signal.',
    ],
    'webpath-gms',
  ),
  q(
    'STAIN-04',
    'A tissue Gram control includes both expected bacterial categories, but both now take only the counterstain after prolonged decolorization. What is the leading technical concern?',
    [
      'Excess decolorization removed primary-dye retention from the positive category.',
      'The paired organism control reveals loss of the differential staining behavior expected from the method.',
    ],
    [
      'The counterstain has demonstrated that the run is fully valid.',
      'A visible counterstain alone does not validate primary-dye retention.',
    ],
    [
      'The bacteria necessarily changed their biology during staining.',
      'The documented exposure error provides a technical explanation.',
    ],
    [
      'The iodine step should always be omitted to prevent this.',
      'Iodine participates in the primary dye complex and should not be arbitrarily removed.',
    ],
    'webpath-gram',
  ),
  q(
    'STAIN-04',
    'The acid-fast positive control loses its red targets after an unusually long acid-alcohol step. Which corrective investigation is most appropriate?',
    [
      'Review differentiation conditions against the validated method.',
      'Excess differentiation can remove the intended acid-fast signal; the control makes the failure visible.',
    ],
    [
      'Accept all specimen negatives because the blue background is clean.',
      'A failed positive control makes those negative interpretations unreliable.',
    ],
    [
      'Assume every red target was a contaminant before differentiation.',
      'The known-positive control is expected to contain targets.',
    ],
    [
      'Replace the target control with ordinary tissue lacking organisms.',
      'A target-free section cannot verify acid-fast detection sensitivity.',
    ],
    'webpath-afb',
  ),
  q(
    'STAIN-04',
    'A Fite teaching run is accidentally given a routine aggressive dewaxing preparation. Which concern follows from the selected method?',
    [
      'The preparation may compromise the weakly acid-fast target that the variant is designed to preserve.',
      'Fite preparation differs intentionally from routine approaches; the target-matched control and preparation record must be reviewed.',
    ],
    [
      'Every acid-fast method has identical preparation requirements.',
      'The variant exists because preparation and differentiation affect target retention.',
    ],
    [
      'A routine AFB control automatically validates every Fite target.',
      'Control suitability depends on the intended organism and method.',
    ],
    [
      'A different counterstain can restore any extracted target.',
      'Changing contrast cannot guarantee restoration of material lost during preparation.',
    ],
    'webpath-fite',
  ),
  q(
    'STAIN-05',
    'Black material is seen on a Fontana–Masson section. Which technical report best avoids overinterpretation?',
    [
      'Describe the reactive material and controls, then defer identification to the requested comparison and qualified review.',
      'The method demonstrates argentaffin behavior and is not uniquely specific for melanin.',
    ],
    [
      'State that black staining alone proves melanin.',
      'That excludes other reactive substances without adequate evidence.',
    ],
    [
      'Treat the black material as a universal negative control.',
      'The visible reaction product is not automatically a negative control.',
    ],
    [
      'Use the result to infer total iron concentration.',
      'Fontana–Masson is not a quantitative total-iron assay.',
    ],
    'webpath-fontana',
  ),
  q(
    'STAIN-06',
    'Neutral lipid was extracted during routine paraffin processing before an Oil Red O request arrived. What limitation should be documented?',
    [
      'The original lipid target may no longer be available in that processed material.',
      'Stain strength cannot recreate extracted lipid; discuss whether suitable preserved material exists.',
    ],
    [
      'The target can always be restored by doubling dye concentration.',
      'More dye cannot replace absent target material.',
    ],
    [
      'Aqueous mounting alone reverses all prior extraction.',
      'The mount preserves the remaining result but cannot undo earlier target loss.',
    ],
    [
      'A negative processed section proves the original specimen lacked lipid.',
      'Preanalytic extraction prevents that conclusion.',
    ],
    'webpath-oil-red',
  ),
  q(
    'STAIN-06',
    'Luxol fast blue staining is visible throughout a brain section but white-to-gray-matter contrast is poor. Which operation is intended to establish that contrast?',
    [
      'Controlled differentiation assessed on an appropriate brain control.',
      'The method removes excess staining while retaining myelin contrast; the endpoint must be judged on suitable tissue.',
    ],
    [
      'Omitting all differentiation because more blue is always better.',
      'Diffuse over-retention can obscure the intended tissue distinction.',
    ],
    [
      'Replacing the section with an unrelated lipid-depleted control.',
      'That removes the morphology needed to judge the intended contrast.',
    ],
    [
      'Interpreting the final blue intensity as a direct neuron count.',
      'The stain targets myelin contrast, not a calibrated neuronal count.',
    ],
    'webpath-lfb',
  ),
  q(
    'STAIN-06',
    'A toluidine-blue control stains generally blue but lacks the expected distinct mast-cell granule hue. What should be checked?',
    [
      'The presence of control mast cells and the dye conditions that support metachromasia.',
      'A suitable target and appropriate dye environment are both needed; generic blue background does not establish the metachromatic reaction.',
    ],
    [
      'Only whether the glass is free of fingerprints.',
      'Clean glass matters but does not establish the target-dependent color behavior.',
    ],
    [
      'Whether all nuclei should be called mast-cell granules.',
      'Cellular structures must be identified rather than equated by color.',
    ],
    [
      'Whether a silver toning step was accidentally omitted.',
      'Gold toning is not the defining toluidine-blue metachromasia step.',
    ],
    'webpath-toluidine',
  ),
  q(
    'STAIN-10',
    'An RNA ISH target is absent, the negative probe is clean, and the housekeeping-RNA control also fails in the specimen. Which conclusion is justified?',
    [
      'The target result is technically uninterpretable until RNA suitability is resolved.',
      'A clean negative probe excludes some background but cannot prove that degraded or inaccessible specimen RNA was detectable.',
    ],
    [
      'The target is definitely biologically absent.',
      'The failed RNA control prevents that inference.',
    ],
    [
      'A clean negative probe substitutes for a positive RNA control.',
      'The two controls answer different questions.',
    ],
    [
      'Strong hematoxylin proves all RNA is intact.',
      'Nuclear counterstaining does not establish RNA preservation.',
    ],
    'biotechne-rna-controls',
    3,
  ),
  q(
    'STAIN-10',
    'Kappa mRNA ISH works on the external control, but lambda was not run on the companion specimen section. What part of the planned comparison is missing?',
    [
      'The paired light-chain probe result.',
      'The manufacturer describes evaluation using both probes; one light-chain result alone does not complete the paired technical comparison.',
    ],
    [
      'A DAB-only stain can replace the missing lambda probe.',
      'A chromogen without the target probe cannot demonstrate lambda transcript.',
    ],
    [
      'The kappa result mathematically specifies the lambda result.',
      'Different probes require their own demonstrated performance.',
    ],
    [
      'Protein IHC and RNA ISH can be assumed identical.',
      'They detect different analytes and have different technical requirements.',
    ],
    'agilent-light-chain-ish',
  ),
  q(
    'STAIN-10',
    'An EBER exercise shows convincing nuclear dots on a known-positive control. Which analyte is the probe designed to detect?',
    [
      'EBV-encoded nuclear RNA targets.',
      'EBER ISH detects the specified viral RNAs; it is not an antibody stain for a general lymphocyte protein.',
    ],
    ['All human immunoglobulin protein.', 'Immunoglobulin is not the EBER probe target.'],
    [
      'All genomic DNA in every nucleus.',
      'The probe targets specific viral RNA sequences rather than all DNA.',
    ],
    [
      'A universal cytoplasmic bacterial wall component.',
      'That is neither the analyte nor the expected compartment.',
    ],
    'agilent-eber',
  ),
  q(
    'STAIN-10',
    'A p16 IHC result and an HPV RNA ISH result differ in an otherwise technically reviewed exercise. Why should they not be treated as the same measurement?',
    [
      'One detects a host protein and the other detects selected viral transcripts.',
      'p16 is a surrogate concept in defined contexts, while HPV RNA ISH directly targets the covered viral transcripts.',
    ],
    [
      'Both methods detect the same antibody molecule.',
      'ISH uses nucleic-acid probes rather than the p16 antibody target.',
    ],
    [
      'A p16-positive result always guarantees every HPV RNA probe is positive.',
      'Probe coverage, biology and technical factors prevent that universal equivalence.',
    ],
    [
      'RNA-integrity controls are unnecessary when p16 is positive.',
      'Protein staining does not prove RNA suitability for ISH.',
    ],
    'biotechne-hpv-ish',
  ),
  // 396–405: preservation and specimen allocation
  q(
    'FIX-02',
    'Two synthetic tissue pieces have equal volume but different maximum thickness. Why can their centers respond differently to the same fixation exposure?',
    [
      'The distance reagent must traverse differs.',
      'Reagent access depends on geometry, including the distance to the center; equal total volume does not imply equal access.',
    ],
    [
      'Equal volume guarantees identical internal exposure.',
      'Volume alone does not describe the diffusion path.',
    ],
    [
      'Thickness affects only the final coverslip.',
      'Thickness can influence fixation and later processing before sectioning.',
    ],
    [
      'Agitation eliminates every difference caused by tissue thickness.',
      'Improving the external fluid environment does not eliminate the different paths through the tissue.',
    ],
    'leica-fixation',
  ),
  q(
    'FIX-02',
    'A fixation model shows reagent at the center before its stabilization state reaches the exercise target. What distinction is being taught?',
    [
      'Penetration and chemical fixation are separate processes.',
      'The presence of reagent does not mean all preservation reactions have reached the desired state.',
    ],
    [
      'Penetration is the same event as coverslipping.',
      'These occur at different stages and describe different mechanisms.',
    ],
    [
      'Any wet tissue is necessarily fully fixed.',
      'Wetness does not establish adequate chemical preservation.',
    ],
    [
      'The stabilization indicator is a clinical validation result.',
      'The model is illustrative and cannot certify a clinical fixation endpoint.',
    ],
    'leica-fixation',
  ),
  q(
    'FIX-03',
    'A renal core arrives with requests for light microscopy, IF and EM. What must be clarified before putting all tissue into one routine fixative?',
    [
      'How material must be allocated and preserved for each requested pathway.',
      'Different downstream studies have different preservation requirements; indiscriminate fixation may remove options.',
    ],
    [
      'Only which H&E counterstain looks most attractive.',
      'The immediate issue is preserving the requested testing pathways.',
    ],
    [
      'Whether all requested tests can use one arbitrary medium.',
      'That cannot be assumed without the receiving laboratory requirements.',
    ],
    [
      'Whether section labels can be created after the tests without a block key.',
      'Traceable allocation and identity are needed from the start.',
    ],
    'leica-fixation',
  ),
  q(
    'FIX-03',
    'An enzyme-histochemistry request is discovered after the entire muscle specimen underwent routine processing. Which response best protects scientific validity?',
    [
      'Document the preparation and consult the receiving laboratory about remaining suitability or alternatives.',
      'Prior preparation can affect enzyme activity; suitability cannot be assumed from a readable paraffin section.',
    ],
    [
      'Report preserved enzyme activity from good H&E morphology alone.',
      'Morphology does not directly establish enzyme activity.',
    ],
    [
      'Increase the reaction time until any color appears.',
      'Unvalidated signal enhancement cannot restore or prove preserved enzyme activity.',
    ],
    [
      'Remove the processing history from the request.',
      'Concealing preanalytic history undermines interpretation and quality review.',
    ],
    'leica-fixation',
  ),
  q(
    'FIX-07',
    'The container states the fixative type, but the time before fixation is unknown. How should that uncertainty be recorded?',
    [
      'As unknown, with an attempt to obtain the actual history through the authorized process.',
      'A truthful incomplete record is preferable to inventing a preservation interval that may affect downstream testing.',
    ],
    [
      'As zero delay because no delay is written.',
      'Absence of documentation is not evidence of immediate fixation.',
    ],
    [
      'As the average delay from yesterday’s cases.',
      'Another case does not establish this specimen’s history.',
    ],
    ['As the slide staining start time.', 'Staining time is not the pre-fixation interval.'],
    'hq-original',
  ),
  q(
    'FIX-03',
    'A breast-core IHC request arrives with a known preservation deviation. Which technical action is appropriate before interpreting a weak stain?',
    [
      'Review and document the preanalytic deviation alongside assay and control results.',
      'A working external control does not erase specimen-specific preservation limitations.',
    ],
    [
      'Ignore preservation because the external control is strong.',
      'The external control may not share the specimen’s preanalytic history.',
    ],
    [
      'Assume every weak signal is a true biological negative.',
      'Preanalytic damage can affect detectable target.',
    ],
    [
      'Replace the documented time with the protocol target.',
      'Changing the record would conceal the actual exposure.',
    ],
    'cap-ihc',
    3,
  ),
  q(
    'FIX-05',
    'Brown pigment is present before IHC detection. Why should the fixation and preparation history be reviewed?',
    [
      'Endogenous or preparation-related pigment can resemble chromogen.',
      'Pigment and specific reaction product can overlap in color; history, localization and suitable comparisons help separate them.',
    ],
    [
      'Every brown deposit must have been generated by the primary antibody.',
      'Color present before detection cannot be attributed solely to the antibody reaction.',
    ],
    [
      'A darker counterstain identifies the pigment chemically.',
      'Counterstain intensity is not a chemical identification test.',
    ],
    [
      'The record can be discarded once a red chromogen is chosen.',
      'A different chromogen may aid contrast but does not remove the need for provenance.',
    ],
    'leica-ihc',
  ),
  q(
    'FIX-02',
    'A sealed specimen is tightly packed with tissue and little surrounding fluid. Which concern follows even if the nominal fixative concentration is correct?',
    [
      'Reagent access and available volume may be inadequate for the load.',
      'Fixative identity and concentration are only part of preservation; geometry, fluid access and loading also matter.',
    ],
    [
      'Correct concentration guarantees uniform fixation in every geometry.',
      'It does not eliminate access or loading constraints.',
    ],
    [
      'More tissue automatically increases the effective fixative supply.',
      'A larger tissue load consumes rather than creates available reagent capacity.',
    ],
    [
      'The final stain can always reverse poor preservation.',
      'Later staining cannot reliably restore lost morphology or targets.',
    ],
    'leica-fixation',
  ),
  q(
    'FIX-01',
    'A learner assumes every fixative preserves tissue through the same chemical mechanism. Which comparison challenges that assumption?',
    [
      'Cross-linking approaches versus coagulating approaches.',
      'Fixatives can preserve material through different chemical mechanisms, which affects morphology and downstream test suitability.',
    ],
    ['Two bottles with different cap colors.', 'Packaging does not define fixation mechanism.'],
    [
      'A biopsy cassette versus a slide rack.',
      'Containers do not establish the chemical preservation mechanism.',
    ],
    [
      'A blue stain versus a pink stain.',
      'Final stain color does not by itself specify fixation chemistry.',
    ],
    'leica-fixation',
  ),
  q(
    'FIX-07',
    'A fixation time entry was entered incorrectly and the original timestamp can be verified. What is the appropriate educational recordkeeping model?',
    [
      'Record a traceable correction while preserving the original entry and reason.',
      'An audit trail shows what changed and why; silently overwriting the past removes essential evidence.',
    ],
    ['Overwrite the value without noting a correction.', 'That hides the history of the error.'],
    [
      'Delete the entire case record.',
      'The remaining specimen and workflow evidence should be preserved.',
    ],
    [
      'Use the expected time instead of the verified actual time.',
      'A protocol target is not a substitute for an observed timestamp.',
    ],
    'hq-original',
  ),
  // 406–415: processing and decalcification
  q(
    'PROC-01',
    'A tissue processor is programmed to move directly from an aqueous environment into paraffin. Which missing conceptual bridge should be recognized?',
    [
      'A compatible dehydration and clearing transition.',
      'Routine paraffin processing requires removal of water and exchange through compatible intermediate reagents.',
    ],
    [
      'An additional slide counterstain before infiltration.',
      'Slide staining occurs after processing and does not supply the solvent transition.',
    ],
    [
      'A larger coverslip during dehydration.',
      'Coverslips are not part of tissue processing in the cassette.',
    ],
    [
      'A longer barcode scan to remove water.',
      'Identity checking does not perform solvent exchange.',
    ],
    'leica-processing',
  ),
  q(
    'PROC-02',
    'A block has a poorly supported center while its edge sections reasonably well. Which upstream investigation is most appropriate?',
    [
      'Piece thickness, reagent access and the processing/infiltration history.',
      'A center-to-edge support difference can reflect incomplete access or infiltration; investigate the tissue and run together.',
    ],
    [
      'Assume the blade alone explains every internal support defect.',
      'A blade problem does not fully explain a persistent under-supported center.',
    ],
    [
      'Increase section thickness indefinitely without reviewing processing.',
      'That can mask symptoms while leaving the underlying preparation problem unresolved.',
    ],
    [
      'Declare all edge tissue invalid because the center is soft.',
      'The extent and cause need assessment rather than an unsupported all-or-none conclusion.',
    ],
    'leica-processing',
  ),
  q(
    'PROC-04',
    'A processor run was selected for a light biopsy load, but thick fatty pieces were added late. Why should the program/load compatibility be reassessed?',
    [
      'The tissue properties and access demands of the actual load have changed.',
      'A suitable program depends on the material being processed; a program label alone does not validate every mixed load.',
    ],
    [
      'All tissues process identically if the cassette color is the same.',
      'Cassette color does not eliminate tissue-dependent processing behavior.',
    ],
    [
      'Fat creates its own paraffin support without infiltration.',
      'Routine support still depends on appropriate processing.',
    ],
    [
      'The original program can never be changed or reviewed.',
      'The relevant response is controlled reassessment under the approved workflow.',
    ],
    'leica-processing',
  ),
  q(
    'PROC-06',
    'A reagent is described as a bridge between dehydrating alcohol and paraffin. Which property is central to that role?',
    [
      'Compatibility with the preceding and following processing media.',
      'The clearing stage enables solvent exchange between media that cannot simply replace each other directly.',
    ],
    [
      'The reagent must be the same color as eosin.',
      'Visible color is not the relevant solvent-compatibility property.',
    ],
    [
      'The reagent must bind every nuclear antigen.',
      'Clearing is not an antigen-specific binding reaction.',
    ],
    [
      'The reagent must act as the final coverslip adhesive.',
      'Infiltration exchange and slide mounting are different functions.',
    ],
    'leica-processing',
  ),
  q(
    'PROC-03',
    'A bone block remains difficult to cut and repeatedly damages the blade. What preparation issue should be evaluated?',
    [
      'Residual mineral after inadequate decalcification.',
      'Incomplete removal of mineral can produce cutting difficulty and blade damage; investigate the endpoint and tissue history.',
    ],
    [
      'Only an insufficiently dark eosin stain.',
      'Staining follows cutting and does not explain residual mineral resistance.',
    ],
    ['Only a missing coverslip.', 'The block is cut before coverslipping.'],
    [
      'Automatic proof that the blade clearance angle is always wrong.',
      'Instrument setup matters, but the mineralized specimen supplies another plausible cause.',
    ],
    'leica-decalcification',
  ),
  q(
    'PROC-03',
    'A strong-acid decalcification exposure continued well beyond the documented endpoint. Which downstream risk deserves consideration?',
    [
      'Damage to nuclear detail and some antigen/nucleic-acid targets.',
      'Excessive decalcification can trade faster mineral removal for loss of information needed by later methods.',
    ],
    [
      'Guaranteed improvement of every molecular assay.',
      'More acid exposure does not universally improve target preservation.',
    ],
    [
      'Creation of additional tissue that compensates for section loss.',
      'Chemical exposure does not replenish the specimen.',
    ],
    [
      'Elimination of the need for control slides.',
      'Preanalytic risk increases, rather than removes, the importance of appropriate controls and history.',
    ],
    'leica-decalcification',
  ),
  q(
    'PROC-03',
    'A specimen requires a target-sensitive ancillary test after decalcification. What is the best basis for selecting a method?',
    [
      'The requested test requirements, tissue characteristics and the laboratory’s validated approach.',
      'Decalcifier choice and endpoint must balance mineral removal with preservation of downstream targets.',
    ],
    [
      'The fastest reagent regardless of the intended assay.',
      'Speed alone may compromise the requested target.',
    ],
    [
      'The most concentrated acid available in the room.',
      'Availability and concentration do not establish suitability.',
    ],
    [
      'The assumption that chelation makes endpoint monitoring unnecessary.',
      'Slower methods still need appropriate endpoint control.',
    ],
    'leica-decalcification',
  ),
  q(
    'PROC-04',
    'A processor log shows an interrupted clearing step. A trainee proposes documenting only the successful final wax step. What would be lost?',
    [
      'The actual solvent-exchange history needed to assess the run.',
      'Later infiltration does not prove that earlier transitions were adequate; the interruption must remain part of the record.',
    ],
    [
      'Nothing, because only the last step matters.',
      'Upstream solvent exchange influences the final support state.',
    ],
    [
      'Only a cosmetic note with no technical relevance.',
      'The interruption can affect interpretation of a poorly processed block.',
    ],
    [
      'A clinical diagnosis that the processor already established.',
      'The processor does not establish a diagnostic interpretation.',
    ],
    'hq-original',
  ),
  q(
    'PROC-02',
    'A poorly processed block is considered for reprocessing. Why must a technical review precede treating this as an automatic reset?',
    [
      'Further treatment can consume time and alter an already compromised specimen.',
      'Corrective processing may help selected problems but cannot be assumed to restore all lost targets or morphology.',
    ],
    [
      'Reprocessing always returns tissue to its original fresh state.',
      'Prior fixation, extraction and damage are not universally reversible.',
    ],
    [
      'The specimen identity becomes irrelevant during rescue.',
      'Traceability remains essential through corrective work.',
    ],
    [
      'Only the color of the wax determines whether rescue is possible.',
      'Suitability depends on the actual preparation defect and intended studies.',
    ],
    'leica-processing',
  ),
  q(
    'PROC-05',
    'A lipid demonstration is requested on material preserved for a frozen pathway. Why should the routine paraffin program not be substituted casually?',
    [
      'The solvent pathway may remove the intended lipid target.',
      'The preparation must preserve the analyte that the later method is designed to demonstrate.',
    ],
    [
      'All frozen specimens are automatically sterile.',
      'Frozen or unfixed material can remain a biological hazard.',
    ],
    [
      'Paraffin processing always improves every lipid stain.',
      'Routine solvents extract many lipids and can prevent the intended demonstration.',
    ],
    [
      'The stain name alone guarantees preservation regardless of preparation.',
      'The analyte must survive the upstream workflow.',
    ],
    'webpath-oil-red',
  ),
  // 416–427: embedding, sectioning and tissue conservation
  q(
    'EMB-01',
    'A mucosal fragment is embedded so the cut plane runs almost parallel to the surface. Which problem should the learner anticipate?',
    [
      'An oblique or incomplete surface-to-depth relationship.',
      'Embedding determines the tissue plane represented on the slide; tangential views can distort the intended architecture.',
    ],
    [
      'Automatic improvement in every villus-to-crypt relationship.',
      'A tangential plane can obscure rather than clarify those relationships.',
    ],
    [
      'A guaranteed change in the chemical target of PAS.',
      'Orientation changes the sampled geometry, not the intrinsic PAS reaction.',
    ],
    [
      'A requirement to change the specimen identity.',
      'Orientation adjustment must retain the original identity and block key.',
    ],
    'leica-processing',
  ),
  q(
    'EMB-01',
    'Several small biopsy fragments lie at different depths in a mold. Why is arranging them in a common cutting plane valuable?',
    [
      'It improves representation while reducing avoidable facing to reach every fragment.',
      'Depth differences can force more tissue removal before all pieces appear in the section.',
    ],
    [
      'It guarantees that all tissues have identical fixation.',
      'Embedding cannot undo different preanalytic exposure histories.',
    ],
    ['It eliminates the need to count the pieces.', 'Piece reconciliation is still needed.'],
    [
      'It allows the section log to omit tissue consumption.',
      'Tissue consumption remains important, especially for limited samples.',
    ],
    'leica-processing',
  ),
  q(
    'EMB-01',
    'A core is sharply curved within the block, and only its middle appears on the first section. Which embedding consideration explains the result?',
    [
      'The core length is not contained in the current section plane.',
      'A curved or tilted core can be only partly represented at a given depth.',
    ],
    [
      'The stain has selectively dissolved both ends before cutting.',
      'The missing ends were not represented in the cut section before staining.',
    ],
    [
      'The block label can establish that all core length is present on the slide.',
      'Label information does not replace examination of tissue representation.',
    ],
    [
      'Every core is supposed to be seen only in cross section.',
      'The requested plane depends on the specimen and block key.',
    ],
    'leica-processing',
  ),
  q(
    'EMB-03',
    'A handwheel adjustment is needed close to an exposed blade. Which sequence protects the learner in the simulated workflow?',
    [
      'Stop and secure the instrument and blade before adjusting.',
      'The hazard is addressed before hands approach the cutting area; speed or a good section does not justify unsafe manipulation.',
    ],
    [
      'Keep cutting while reaching across the blade.',
      'That combines motion with hand exposure to the cutting edge.',
    ],
    [
      'Remove the block with the blade unguarded and wheel free.',
      'Uncontrolled motion and an exposed edge create avoidable risk.',
    ],
    [
      'Use the ribbon to hold the blade still.',
      'A tissue ribbon is not a safe instrument restraint.',
    ],
    'leica-microtomy',
  ),
  q(
    'EMB-02',
    'A narrow defect remains at the same lateral position through successive sections and disappears after moving to an intact blade region. What does the comparison support?',
    [
      'A localized blade-edge defect contributed to the line.',
      'Changing the blade region while holding other conditions stable links the repeated position to the cutting edge.',
    ],
    [
      'The specimen must have an identical biological cleft at every depth.',
      'The defect’s disappearance with blade movement supports a technical explanation.',
    ],
    [
      'The final mountant caused the line before pickup.',
      'The artifact was already present during sectioning.',
    ],
    [
      'All processing defects have been excluded conclusively.',
      'The comparison supports a blade contribution but does not establish every other preparation feature.',
    ],
    'leica-microtomy',
  ),
  q(
    'EMB-02',
    'Sections are compressed in the cutting direction, and a trainee changes block temperature, blade region and speed all at once. What would improve causal learning?',
    [
      'Repeat a controlled comparison changing one suspected factor at a time.',
      'Several variables can influence section quality; isolating changes helps identify which action improves compression.',
    ],
    [
      'Assume the last variable mentioned must be the cause.',
      'The order of discussion does not isolate the causal contribution.',
    ],
    [
      'Judge quality only after increasing eosin.',
      'Stain intensity cannot establish the cause of mechanical compression.',
    ],
    [
      'Treat compression as proof of an identity error.',
      'Compression is a mechanical/processing issue and does not by itself establish a mix-up.',
    ],
    'leica-microtomy',
  ),
  q(
    'EMB-03',
    'A tiny biopsy has already been faced deeply, and a new levels request arrives. Which information is most important before continuing?',
    [
      'Remaining tissue and the section-depth/consumption record.',
      'Additional levels consume finite material; the plan should account for what has already been removed and what remains.',
    ],
    [
      'Only the number of unused slides in the drawer.',
      'Slide supply does not establish the available tissue.',
    ],
    [
      'Only the preferred nuclear stain shade.',
      'Stain preference does not answer whether the requested depth is available.',
    ],
    [
      'The assumption that re-embedding creates new tissue.',
      'Re-embedding can change orientation but cannot replace consumed tissue.',
    ],
    'hq-original',
  ),
  q(
    'EMB-05',
    'A section needed for demanding retrieval is picked up on a slide with unsuitable adhesion. Which downstream problem becomes more plausible?',
    [
      'Section lifting or loss during later treatment.',
      'Adhesion and preparation must support the downstream treatment; a clean initial pickup does not guarantee retention.',
    ],
    [
      'Automatic proof that the antibody has expired.',
      'Tissue detachment is different from primary-antibody activity.',
    ],
    [
      'A guaranteed increase in antigen concentration.',
      'Lifting does not create more antigen in the remaining tissue.',
    ],
    [
      'A conversion of the method into frozen sectioning.',
      'The slide-adhesion problem does not change the specimen pathway.',
    ],
    'leica-ihc',
  ),
  q(
    'EMB-02',
    'An apparent dark band on the finished slide coincides with a folded section edge. Which first check is more informative than increasing differentiation?',
    [
      'Inspect section geometry and thickness at the band.',
      'A folded region contains extra tissue in the optical path; the darkness may be geometric rather than a uniform chemical overstain.',
    ],
    [
      'Assume all dark areas have the same chemical cause.',
      'Local geometry can alter intensity without a change in reagent conditions.',
    ],
    [
      'Apply a new clinical interpretation based on the band alone.',
      'An artifact should be assessed technically before interpretation.',
    ],
    [
      'Replace every stain reagent before inspecting the section.',
      'That changes many variables without testing the visible fold hypothesis.',
    ],
    'leica-microtomy',
  ),
  q(
    'EMB-06',
    'Unstained sections for a contamination-sensitive molecular request are collected beside another open case. What should guide the work setup?',
    [
      'The receiving method’s contamination controls and strict separation of case material.',
      'Molecular preparation depends on traceable collection and avoidance of carryover, not merely a clean-looking final section.',
    ],
    [
      'Only whether both cases use the same fixative.',
      'Shared fixative does not make cross-case contamination acceptable.',
    ],
    [
      'Whether the tissue fragments look similar enough to combine.',
      'Morphologic similarity does not establish identity.',
    ],
    [
      'The assumption that a water bath removes all foreign nucleic acids.',
      'A bath is not a universal decontamination guarantee.',
    ],
    'hq-original',
  ),
  q(
    'EMB-04',
    'A frozen-section slide stains unevenly because embedding support remains over the tissue. What does that resemble conceptually in routine paraffin staining?',
    [
      'An access barrier from incompletely removed embedding material.',
      'Support medium can impede reagent access in a frozen workflow just as retained wax can in routine staining.',
    ],
    [
      'A validated positive control for every special stain.',
      'Residual support is a preparation problem rather than a positive control.',
    ],
    [
      'The intended effect of nuclear differentiation.',
      'The problem arises from access before uniform staining, not a controlled nuclear endpoint.',
    ],
    [
      'Proof that freezing has sterilized the sample.',
      'Staining access says nothing about infectious risk.',
    ],
    'leica-he-troubleshoot',
  ),
  q(
    'EMB-03',
    'A section order calls for an additional cut from the existing face, but the learner aggressively refaces the block first. What information should the debrief emphasize?',
    [
      'Unnecessary facing consumes tissue before the requested section is collected.',
      'Section planning should distinguish a recut from a deeper sampling request and preserve limited material.',
    ],
    [
      'Facing has no effect on remaining tissue.',
      'Every removed section reduces the finite tissue budget.',
    ],
    [
      'A thicker requested section will replace material removed during facing.',
      'Collecting a thicker section cannot recover tissue already discarded during facing.',
    ],
    [
      'Every recut requires an arbitrary large depth advance.',
      'Depth should follow the actual order and approved procedure.',
    ],
    'hq-original',
  ),
  // 428–439: quality, math, teaching and oversight
  q(
    'OPS-08',
    'A beautiful slide is traced to a cassette with an unresolved identifier discrepancy. What determines the technical disposition?',
    [
      'Hold the case until the discrepancy is resolved through the authorized process.',
      'Appearance cannot establish identity; the unresolved chain-of-custody problem remains critical.',
    ],
    [
      'Release because morphology is excellent.',
      'Good morphology cannot repair uncertain specimen identity.',
    ],
    [
      'Assign the most likely identifier from rack position.',
      'Rack position is not adequate evidence for relabeling.',
    ],
    [
      'Delete the discrepancy note after scanning.',
      'Removing the note conceals an unresolved quality issue.',
    ],
    'hq-original',
  ),
  q(
    'OPS-08',
    'A new IHC validation plan is written after the reviewer has already seen which samples agree. Which design risk should be addressed?',
    [
      'Acceptance criteria may be chosen to fit the observed results.',
      'Define intended use and acceptance rules prospectively so the evaluation is not driven by hindsight.',
    ],
    [
      'A comparator is never useful for IHC validation.',
      'Appropriate comparator material can be essential to the plan.',
    ],
    [
      'Weak-positive samples should always be excluded.',
      'Excluding demanding samples can conceal sensitivity limitations.',
    ],
    [
      'Simulation scores can replace the clinical evidence set.',
      'An educational exercise does not provide clinical validation evidence.',
    ],
    'cap-ihc',
    3,
  ),
  q(
    'OPS-03',
    'A fictional dilution exercise requires 20 mL at 1:100 from a stock used neat. What stock volume is needed?',
    [
      '0.20 mL.',
      'For a 1:100 final dilution, stock volume is 20 mL divided by 100, giving 0.20 mL; bring to the stated final volume.',
    ],
    ['2.0 mL.', 'That would make the stock one tenth of the final volume, not one hundredth.'],
    ['20 mL.', 'Using the entire final volume as stock would leave it undiluted.'],
    ['0.020 mL.', 'That is one thousandth of 20 mL and gives a different dilution.'],
    'hq-original',
  ),
  q(
    'OPS-03',
    'A teaching block loses 0.15 mm during facing. How much depth is that in micrometers?',
    ['150 µm.', 'One millimeter equals 1000 micrometers, so 0.15 multiplied by 1000 is 150 µm.'],
    ['15 µm.', 'This conversion is a factor of ten too small.'],
    ['1500 µm.', 'This conversion is a factor of ten too large.'],
    [
      '0.00015 µm.',
      'This divides when conversion from millimeters to smaller micrometer units requires multiplication.',
    ],
    'hq-original',
  ),
  q(
    'OPS-03',
    'A fictional stock contains 10 g per 100 mL. What mass of solute is present in a 5 mL aliquot?',
    ['0.5 g.', 'The stock contains 0.1 g per mL; multiplying by 5 mL gives 0.5 g.'],
    ['5 g.', 'That is ten times the mass present at this concentration.'],
    ['50 g.', 'The aliquot cannot contain more solute than the stated whole 100 mL stock amount.'],
    ['0.05 g.', 'That is ten times too little for a 5 mL aliquot.'],
    'hq-original',
  ),
  q(
    'OPS-05',
    'A pH reading is unexpected, and the meter has not been checked with its prescribed standards. What should precede changing the reagent?',
    [
      'Verify instrument performance and measurement conditions.',
      'An unverified measuring system can mislead reagent adjustment; establish that the reading is trustworthy.',
    ],
    [
      'Add acid until the display matches a remembered number.',
      'Changing chemistry based on an unreliable reading risks creating another error.',
    ],
    [
      'Assume digital displays cannot be wrong.',
      'Electronic measurements still require appropriate checks and maintenance.',
    ],
    [
      'Ignore all future pH measurements.',
      'The response is to restore reliable measurement, not abandon it.',
    ],
    'hq-original',
  ),
  q(
    'OPS-08',
    'A reagent lot change coincides with weak staining. Which comparison best helps distinguish the lot effect from another simultaneous change?',
    [
      'Compare old and new lots under otherwise matched validated conditions using suitable controls.',
      'A matched comparison reduces confounding and can test the specific lot hypothesis.',
    ],
    [
      'Compare different lots on different tissues with different retrieval.',
      'Changing tissue and retrieval makes attribution to the lot difficult.',
    ],
    [
      'Use only the new lot on one strongly positive control.',
      'That does not provide a direct old-versus-new comparison or sensitivity range.',
    ],
    [
      'Judge the lot only from the color of the liquid.',
      'Visual reagent appearance does not establish assay performance.',
    ],
    'cap-ihc',
  ),
  q(
    'OPS-07',
    'A learner can repeat the correct microtomy steps but cannot explain why tissue was lost during a previous attempt. Which feedback best supports deeper learning?',
    [
      'Review the event sequence and ask the learner to connect actions with tissue consumption.',
      'Explaining observable consequences develops reasoning beyond memorized step completion.',
    ],
    [
      'Award full mastery solely for reciting the sequence.',
      'Recitation does not establish understanding of the causal error.',
    ],
    [
      'Hide the failed attempt to avoid discussing it.',
      'A respectful review of the failure provides useful evidence for learning.',
    ],
    [
      'Replace all practical feedback with a speed ranking.',
      'Speed alone does not measure safe, representative preparation.',
    ],
    'hq-original',
  ),
  q(
    'OPS-06',
    'A rush frozen case interrupts sectioning of a limited routine biopsy. What is the most defensible coordination response?',
    [
      'Secure the current work and preserve identity before switching according to priority and staffing arrangements.',
      'Urgency changes prioritization, but safe interruption and traceability remain necessary.',
    ],
    [
      'Leave the blade exposed and both cases open to save time.',
      'That adds sharps and contamination risks.',
    ],
    [
      'Mix both cases in one unlabeled holding area.',
      'Shared unlabeled storage compromises identity.',
    ],
    [
      'Discard the routine section log because the case is no longer urgent.',
      'Its tissue history remains necessary when work resumes.',
    ],
    'hq-original',
  ),
  q(
    'OPS-08',
    'A simulator user reaches the L4 milestone and asks whether that authorizes independent grossing in their workplace. What is the correct boundary?',
    [
      'Workplace authorization depends on actual qualifications, policy, supervision and jurisdiction.',
      'A HistoQuest learning milestone does not establish legal scope or documented practical competency.',
    ],
    [
      'Every L4 learner automatically meets every jurisdiction’s personnel requirements.',
      'The simulation does not verify those qualifications or local rules.',
    ],
    [
      'A high virtual score replaces the laboratory’s competency process.',
      'Workplace assessment requires its own approved evidence and process.',
    ],
    [
      'The platform title is itself a professional license.',
      'The milestone is an educational label rather than a license.',
    ],
    'hq-original',
  ),
  q(
    'OPS-06',
    'A staffing plan meets specimen throughput only by removing maintenance, QC and training time. What should the planner recognize?',
    [
      'The capacity estimate omits necessary work and is therefore incomplete.',
      'Sustainable laboratory capacity includes quality, maintenance and training tasks as well as specimen counts.',
    ],
    [
      'Those activities never affect usable capacity.',
      'They consume real time and support reliable operations.',
    ],
    [
      'Higher throughput automatically proves fewer errors.',
      'Throughput and quality must be assessed separately.',
    ],
    [
      'The omitted work can be documented as completed in advance.',
      'Records must reflect actual work rather than planned or assumed completion.',
    ],
    'hq-original',
  ),
  q(
    'OPS-08',
    'A failed-run investigation identifies a cause and applies a correction. What additional evidence is needed before calling the corrective action effective?',
    [
      'A defined follow-up showing the process now meets requirements and monitoring for recurrence.',
      'Finding a plausible cause and making a change are not the same as verifying that the change worked.',
    ],
    [
      'Only a statement that the cause seems reasonable.',
      'A plausible hypothesis still needs verification.',
    ],
    [
      'Removal of earlier failed controls from the trend.',
      'Deleting failures conceals the evidence needed to judge improvement.',
    ],
    [
      'A new SOP title without testing the change.',
      'Document naming does not establish process performance.',
    ],
    'hq-original',
  ),
]

export const LAB_LESSONS: Lesson[] = [
  {
    id: 'L-20',
    version: 1,
    slug: 'mounting-and-the-optical-path',
    title: 'Mounting: finish the optical path',
    domain: 'STAIN',
    objectives: ['STAIN-11'],
    minutes: 12,
    prerequisites: ['L-11'],
    labQuestion:
      'The stain looks balanced. Why can the finished slide still be difficult to read or scan?',
    basics: [
      'The microscope observes light after it passes through tissue, medium and glass.',
      'A compatible mount preserves the stain and provides a usable optical environment.',
      'Refractive index describes an optical property; it is not a stain concentration.',
    ],
    explanation: [
      'Mounting is part of the analytical result. A bubble over the tissue can disrupt focus; an incompatible solvent–medium transition can produce haze; partial drying before coverslipping can trap microscopic air. Review the physical slide when an apparent image problem could originate at the mount.',
      'The correct finishing path depends on the target and stain. A routine resinous mount commonly follows dehydration and clearing. A lipid-preserving frozen stain such as Oil Red O uses a compatible aqueous path so that the demonstrated lipid is not extracted. Aqueous does not mean compatible with every dye or chromogen: check the actual method and product requirements.',
      'Keep technical quality and traceability together. Inspect tissue coverage, bubbles, excess medium, readable identity and the control result before handoff. A clean-looking field does not repair an identity discrepancy or an invalid stain run.',
    ],
    keyPoints: [
      'Match the preparation, solvent and mounting medium as one system.',
      'Separate optical artifacts from staining and tissue artifacts.',
      'Do not let a section dry unintentionally before the specified mounting step.',
    ],
    demo: {
      key: 'sequence',
      caption: 'Follow the section from the final stain to a readable, traceable mounted slide.',
      steps: [
        {
          label: 'Choose the path',
          detail: 'Identify whether the target tolerates routine dehydration and clearing.',
        },
        {
          label: 'Check compatibility',
          detail: 'Match the final solvent and medium to the method.',
        },
        {
          label: 'Apply the coverslip',
          detail: 'Avoid drying, trapped air and incomplete tissue coverage.',
        },
        {
          label: 'Inspect and reconcile',
          detail: 'Review optical quality and readable case identity.',
        },
      ],
    },
    prediction: {
      prompt:
        'A frozen lipid stain enters the routine solvent finish. Can a stronger Oil Red O step reliably restore extracted lipid?',
      options: [
        { id: 'a', text: 'No; the upstream pathway may have removed the target.' },
        { id: 'b', text: 'Yes; stronger dye restores any lost lipid.' },
      ],
      answer: 'a',
      reveal:
        'More dye cannot replace an extracted target. The specimen pathway is part of test suitability.',
    },
    workedExample: {
      problem:
        'A rack develops delayed pink haze while the original staining control had good contrast. Where should the investigation begin?',
      steps: [
        'Confirm whether the haze is a mounting/solvent issue by inspecting the physical slides.',
        'Review water carryover, post-eosin alcohols, clearant condition and medium compatibility.',
        'Correct the supported cause under the laboratory method and review the repeat result.',
      ],
      result:
        'The proposed cause is tested through records and a controlled comparison, rather than assuming weak dye uptake.',
    },
    retrieval: ['Q-STAIN-300', 'Q-STAIN-301', 'Q-STAIN-302'],
    troubleshooting: {
      prompt:
        'A scanner focuses on a bubble above tissue. Which response addresses the suspected source?',
      options: [
        {
          id: 'a',
          text: 'Inspect and correct the mount using the approved procedure, then reassess the image.',
        },
        { id: 'b', text: 'Increase hematoxylin on all future cases without checking the slide.' },
      ],
      answer: 'a',
      reveal: 'An optical obstruction should be confirmed on the slide before changing chemistry.',
    },
    takeaway:
      'A slide is complete when target preservation, stain quality, optical access and identity all support review.',
    references: [
      { sourceId: 'leica-routine-troubleshoot' },
      { sourceId: 'leica-digital-slides' },
      { sourceId: 'leica-he-troubleshoot' },
      { sourceId: 'webpath-oil-red' },
      { sourceId: 'merck-dpx' },
      { sourceId: 'merck-crystal-mount' },
    ],
    review: checked,
  },
  {
    id: 'L-21',
    version: 1,
    slug: 'stainer-qc-and-carryover',
    title: 'Stainer QC: follow the reagent history',
    domain: 'STAIN',
    objectives: ['STAIN-12'],
    minutes: 14,
    prerequisites: ['L-11'],
    labQuestion:
      'The program has not changed, so why does today’s control differ from last week’s?',
    basics: [
      'A saved program describes intended steps; a run record describes what actually happened.',
      'Reagent state changes with use, carryover and storage.',
      'A control is useful only when its tissue and expected result are known.',
    ],
    explanation: [
      'A staining line is a sequence of changing chemical environments. Slides and racks carry small amounts of reagent into the next bath. Throughput, reagent replacement, water quality and interruption history can therefore change the result even when the saved program stays constant.',
      'Read a control by compartments and features. For H&E, judge nuclear detail, cytoplasmic contrast, tissue coverage and background across representative material. A single strongly colored feature does not establish that the entire staining system performs adequately.',
      'When QC fails, preserve the evidence, hold affected work, form a testable hypothesis and use a controlled comparison. A new bottle is an intervention, not proof of correction. A satisfactory repeat control and documented disposition are needed before the held work can move forward.',
    ],
    keyPoints: [
      'Track actual exposure, workload and reagent changes.',
      'Separate common-run failures from specimen-specific preparation problems.',
      'Verify a corrective action rather than assuming it worked.',
    ],
    demo: {
      key: 'sequence',
      caption: 'A quality loop links observation to evidence, correction and verification.',
      steps: [
        { label: 'Observe', detail: 'Describe the defect and the affected control compartments.' },
        { label: 'Trace', detail: 'Review reagent, program, loading and interruption records.' },
        { label: 'Compare', detail: 'Test a specific cause while controlling other variables.' },
        { label: 'Verify', detail: 'Review the repeat control and document the outcome.' },
      ],
    },
    prediction: {
      prompt:
        'Throughput doubles but a calendar-only reagent schedule stays unchanged. Is an unchanged program enough evidence of equivalent staining?',
      options: [
        { id: 'a', text: 'No; the working reagent conditions may have changed.' },
        { id: 'b', text: 'Yes; the saved program controls every chemical variable.' },
      ],
      answer: 'a',
      reveal:
        'Slide load and carryover affect working reagent conditions independently of the saved program.',
    },
    workedExample: {
      problem: 'Eosin becomes weak shortly after the post-bluing rinse was shortened.',
      steps: [
        'Compare the actual program versions and confirm when the change began.',
        'Consider alkaline carryover into eosin as a specific hypothesis.',
        'Restore or test the appropriate rinse under the controlled method while keeping other factors stable.',
        'Review control contrast and reagent condition before release.',
      ],
      result:
        'The investigation connects the observed trend to a plausible chemical transition and tests it.',
    },
    retrieval: ['Q-STAIN-312', 'Q-STAIN-313', 'Q-STAIN-322'],
    troubleshooting: {
      prompt:
        'Only one rack position repeatedly under-stains. What should the next comparison examine?',
      options: [
        { id: 'a', text: 'Position-dependent reagent access or loading, with matched material.' },
        { id: 'b', text: 'Every dye at once, without preserving the position information.' },
      ],
      answer: 'a',
      reveal:
        'The repeatable location is evidence. Keep it in the investigation rather than changing many unrelated factors.',
    },
    takeaway:
      'A stable program file is not the same as a stable process. Use control trends and actual run evidence.',
    references: [
      { sourceId: 'leica-he' },
      { sourceId: 'leica-he-webinar' },
      { sourceId: 'leica-he-validation' },
      { sourceId: 'leica-he-fundamentals' },
      {
        sourceId: 'hq-original',
        note: 'Original quality-loop and controlled-comparison examples.',
      },
    ],
    review: checked,
  },
  {
    id: 'L-22',
    version: 1,
    slug: 'dye-chemistry-to-slide-color',
    title: 'Dye chemistry: explain the color',
    domain: 'STAIN',
    objectives: ['STAIN-13'],
    minutes: 15,
    prerequisites: ['L-11', 'L-12'],
    labQuestion: 'Why can a section become darker while the staining result becomes less useful?',
    basics: [
      'Binding, reaction-product formation and the optical path are different parts of the result.',
      'A dye’s visible color alone does not specify its tissue target.',
      'Some methods deliberately remove excess staining to reveal contrast.',
    ],
    explanation: [
      'Stain chemistry can rely on charge interactions, reactive groups, metal complexes or selective deposition. Alcian blue depends on the acidic environment and available anionic sites. PAS first creates aldehyde groups and then reveals them with Schiff reagent. The reaction order is part of the mechanism.',
      'Silver methods illustrate a useful distinction: argyrophil approaches need an external reducing step, while argentaffin material can reduce bound silver without that separate reducer. Toning and removal of unreduced silver have different roles from the counterstain. Do not describe every dark deposit as the same target.',
      'The observed image also depends on thickness and optics. In a simplified brightfield absorbance model, additional stain or a doubled tissue fold reduces transmitted light. Published H/E/DAB vectors are presets requiring calibration for an actual method. IHC color is not generally proportional to antigen amount, and fluorescence requires an emission model rather than the same subtractive rule.',
    ],
    keyPoints: [
      'Explain the role of each reagent before changing it.',
      'Compare target localization and background, not total darkness.',
      'Keep illustrative optical parameters distinct from measured biological quantities.',
    ],
    demo: {
      key: 'sequence',
      caption: 'Separate target chemistry, reaction product and optical appearance.',
      steps: [
        { label: 'Access', detail: 'The reagent must reach the tissue site.' },
        {
          label: 'React',
          detail:
            'The required chemical sequence creates or retains the target-associated product.',
        },
        {
          label: 'Differentiate',
          detail: 'Where required, remove excess staining to improve contrast.',
        },
        {
          label: 'Observe',
          detail: 'Thickness, light and mounting influence the final visible color.',
        },
      ],
    },
    prediction: {
      prompt:
        'A fold becomes darker although no reagent setting changed. Must it contain more antigen per cell?',
      options: [
        { id: 'a', text: 'No; added tissue thickness can increase absorbance.' },
        { id: 'b', text: 'Yes; every darker pixel indicates proportionally more antigen.' },
      ],
      answer: 'a',
      reveal:
        'Geometry can increase the amount of stained material along the optical path without changing expression per cell.',
    },
    workedExample: {
      problem: 'A reticulin simulation completes impregnation but omits reduction.',
      steps: [
        'Identify the intended argyrophil reaction sequence.',
        'Locate the missing step that develops bound silver into visible material.',
        'Compare the affected control with a complete run while keeping other steps fixed.',
      ],
      result:
        'The defect is explained by reaction history, not by increasing an unrelated counterstain.',
    },
    retrieval: ['Q-STAIN-325', 'Q-STAIN-329', 'Q-STAIN-332'],
    troubleshooting: {
      prompt: 'Silver background obscures the target. Which goal should guide optimization?',
      options: [
        { id: 'a', text: 'Useful target-to-background contrast with valid controls.' },
        { id: 'b', text: 'The darkest possible whole-slide image.' },
      ],
      answer: 'a',
      reveal:
        'A strong reaction can be technically poor when nonspecific deposition masks the target.',
    },
    takeaway:
      'A useful stain is a controlled chemical contrast, observed through a physical optical system.',
    references: [
      { sourceId: 'webpath-alcian' },
      { sourceId: 'webpath-pas' },
      { sourceId: 'webpath-reticulin' },
      { sourceId: 'webpath-fontana' },
      { sourceId: 'webpath-gms' },
      { sourceId: 'landini-colour-deconvolution' },
      { sourceId: 'fiji-stain-vectors' },
    ],
    review: checked,
  },
  {
    id: 'L-23',
    version: 1,
    slug: 'romanowsky-and-cytology-preparations',
    title: 'Romanowsky and cytology: match the preparation',
    domain: 'STAIN',
    objectives: ['STAIN-14'],
    minutes: 12,
    prerequisites: ['L-11'],
    labQuestion:
      'Why can two methods with familiar stain names require different preparation and quality criteria?',
    basics: [
      'A smear and a paraffin tissue section are different physical preparations.',
      'Romanowsky-type methods use acidic and basic dye components for cellular contrast.',
      'Pap combines nuclear detail with multiple cytoplasmic colors.',
    ],
    explanation: [
      'Match the method to the preparation and requested purpose. A rapid tissue Giemsa used to demonstrate organisms is not automatically the same workflow or quality assessment as a hematologic preparation. Select the correct variant, control material and expected appearance instead of relying only on the stain name.',
      'Papanicolaou staining combines hematoxylin nuclear staining with complementary cytoplasmic components such as orange G and an EA mixture. The manufacturer’s standard and rapid variants illustrate that sequence and formulation belong together. Appropriate preservation and removal of a spray-fixative coating, when required, affect access before the dyes are applied.',
      'Separate preservation, staining, representation and interpretation. Good color cannot restore damaged cells or demonstrate an organism that is absent from the control section. Histotechnical review reports whether the preparation is suitable for the intended examination; diagnostic interpretation remains with qualified reviewers.',
    ],
    keyPoints: [
      'Use preparation-specific methods and controls.',
      'Review nuclear preservation as well as color balance.',
      'Do not transfer every step between method variants without validation.',
    ],
    demo: {
      key: 'sequence',
      caption: 'The preparation determines the stain workflow and the review target.',
      steps: [
        {
          label: 'Identify the material',
          detail: 'Distinguish smear, frozen section and paraffin section.',
        },
        {
          label: 'Confirm preservation',
          detail: 'Review the method-specific preanalytic requirements.',
        },
        {
          label: 'Choose the variant',
          detail: 'Use the validated combination of components and sequence.',
        },
        {
          label: 'Review the target',
          detail: 'Assess the relevant cell/organism control and preservation.',
        },
      ],
    },
    prediction: {
      prompt:
        'A gastric organism control has attractive tissue color but no known organisms. Has organism detection been tested?',
      options: [
        { id: 'a', text: 'No; the required target-positive material is missing.' },
        { id: 'b', text: 'Yes; any multicolor tissue is an organism-positive control.' },
      ],
      answer: 'a',
      reveal:
        'General tissue contrast does not verify sensitivity for a target absent from that control section.',
    },
    workedExample: {
      problem:
        'A spray-fixed Pap preparation is patchy after the coating-removal preparation is skipped.',
      steps: [
        'Verify the preservation product and the method’s preparation requirements.',
        'Consider residual coating as an access barrier.',
        'Repeat the approved preparation and compare suitable control material.',
      ],
      result:
        'The investigation tests access and preparation instead of changing every dye at once.',
    },
    retrieval: ['Q-STAIN-337', 'Q-STAIN-339', 'Q-STAIN-343'],
    troubleshooting: {
      prompt:
        'A Giemsa slide becomes pale after a prolonged late differentiation interval. Which history matters?',
      options: [
        { id: 'a', text: 'Both initial staining and subsequent dye removal.' },
        { id: 'b', text: 'Only the primary stain bottle name.' },
      ],
      answer: 'a',
      reveal: 'A weak final result may reflect excessive removal after adequate staining.',
    },
    takeaway:
      'Preparation, method variant and intended target must agree before color can be meaningfully assessed.',
    references: [
      { sourceId: 'webpath-giemsa' },
      { sourceId: 'merck-pap' },
      { sourceId: 'hq-original', note: 'Original comparison and technical-review framework.' },
    ],
    review: checked,
  },
]
