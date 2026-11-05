/**
 * Fixation detective cases. Qualitative, standard histotechnology teaching; fictional specimens.
 * Each case: identify the variables that matter, choose one approach, predict the artifacts.
 */
export interface Choice { id: string; text: string; correct: boolean; why: string }

export interface FixationCase {
  id: string
  title: string
  /** Short tab label. */
  short: string
  tissue: string
  test: string
  problem: string
  /** Show the penetration-vs-fixation animation for this case. */
  penetration?: boolean
  variables: Choice[]
  approaches: Choice[]
  artifacts: Choice[]
  principle: string
}

export const FIXATION_CASES: FixationCase[] = [
  {
    id: 'thick-node',
    short: 'Thick node',
    title: 'The node that fixed only at its edges',
    tissue: 'An intact 2.5 cm lymph node, placed whole in formalin late in the evening.',
    test: 'H&E, followed by an IHC panel.',
    problem: 'Next morning the node is grossed and processed. The periphery shows crisp nuclei, but the centre has smudgy chromatin, poor cytoplasmic detail and patchy IHC.',
    penetration: true,
    variables: [
      { id: 'thickness', text: 'Specimen thickness (not sliced)', correct: true, why: 'Penetration slows with depth: under the d ≈ K√t teaching model, doubling the distance roughly quadruples the time. An intact node leaves a thick core.' },
      { id: 'time', text: 'Time in fixative before processing', correct: true, why: 'Penetration reaching the centre is not the same as the centre being fixed. Cross-linking lags behind the front.' },
      { id: 'volume', text: 'Fixative-to-tissue volume', correct: true, why: 'Too little fixative is depleted and diluted by tissue fluid, slowing fixation further.' },
      { id: 'eosin', text: 'Eosin pH', correct: false, why: 'Eosin affects cytoplasmic staining evenly. It cannot explain an edge-to-centre gradient.' },
      { id: 'bath', text: 'Flotation bath temperature', correct: false, why: 'The bath affects how sections spread, not the fixation state of the tissue.' },
    ],
    approaches: [
      { id: 'slice', text: 'Bisect or slice the node thinly at receipt, use ample fresh fixative, and allow adequate fixation time before processing', correct: true, why: 'Thin slices shorten the distance fixative must travel, so both penetration and cross-linking can finish before processing.' },
      { id: 'heat', text: 'Leave it whole but warm the formalin to speed fixation', correct: false, why: 'Heat speeds reactions and diffusion but also autolysis. Unvalidated heating risks uneven fixation and does not fix the thickness problem.' },
      { id: 'longer-proc', text: 'Keep it whole and just run a longer processing schedule', correct: false, why: 'Processing alcohols would then "fix" the core by coagulation, giving a different morphology and antigen state from the formalin-fixed rim.' },
      { id: 'acid', text: 'Switch to an acidic fixative to penetrate faster', correct: false, why: 'Speed of penetration is not the only goal. An acidic fixative changes morphology and antigen preservation and can harm nucleic acids.' },
    ],
    artifacts: [
      { id: 'zonal', text: 'Zonal fixation: good rim, poorly preserved centre', correct: true, why: 'This is the classic gradient of under-fixation in a thick specimen.' },
      { id: 'ihc-gradient', text: 'IHC stronger at the edge than the centre', correct: true, why: 'Different fixation histories across the tissue change epitope preservation and retrieval needs.' },
      { id: 'autolysis', text: 'Central autolysis, with smudgy nuclei and loss of detail', correct: true, why: 'Enzymes keep working in the unfixed core.' },
      { id: 'pigment', text: 'Birefringent brown-black pigment everywhere', correct: false, why: 'That pattern points to acid formaldehyde hematin from unbuffered or acidic formalin, not to thickness.' },
    ],
    principle: 'Penetration and fixation are different events. Slice thick specimens so the fixative reaches every part early enough to finish cross-linking before processing.',
  },
  {
    id: 'dif-skin',
    short: 'DIF in formalin',
    title: 'Direct immunofluorescence, in the wrong container',
    tissue: 'A 4 mm punch biopsy of perilesional skin from a dermatology clinic.',
    test: 'Direct immunofluorescence (DIF) for a suspected blistering disorder.',
    problem: 'The specimen arrives in 10% neutral buffered formalin. The requisition clearly says DIF.',
    variables: [
      { id: 'fixative-test', text: 'Fixative or transport medium versus the requested test', correct: true, why: 'DIF needs unfixed tissue (frozen, or transported in a medium such as Michel). Formalin is not suitable for routine DIF.' },
      { id: 'time', text: 'How long it has been in formalin', correct: false, why: 'Formalin is unsuitable for DIF however briefly it was used. Timing does not rescue it.' },
      { id: 'size', text: 'Biopsy size', correct: false, why: 'A 4 mm punch is a normal DIF specimen. Size is not the problem.' },
      { id: 'identity', text: 'Confirming the specimen identifiers match the requisition', correct: true, why: 'Always relevant, and essential before any recollection request is made for this patient.' },
    ],
    approaches: [
      { id: 'notify', text: 'Process this specimen for routine histology if appropriate, and promptly notify the clinic that DIF needs a new biopsy in Michel medium (or fresh, per lab protocol)', correct: true, why: 'This follows the lab’s rejection or notification policy. The clinician decides on recollection, and the formalin specimen can still support H&E.' },
      { id: 'freeze', text: 'Rinse off the formalin and freeze it for DIF', correct: false, why: 'Rinsing does not undo cross-linking. Results would be unreliable and could be falsely negative.' },
      { id: 'run', text: 'Run DIF anyway and add a comment', correct: false, why: 'A test on an unsuitable specimen can mislead. A comment does not make it valid.' },
      { id: 'michel', text: 'Transfer it into Michel medium now', correct: false, why: 'Michel medium preserves unfixed tissue. It cannot reverse formalin fixation that has already started.' },
    ],
    artifacts: [
      { id: 'false-neg', text: 'Weak or absent specific immunofluorescence (possible false negative)', correct: true, why: 'Fixation masks or alters the antigens that the fluorescent antibodies target.' },
      { id: 'autofluor', text: 'Increased background autofluorescence', correct: true, why: 'Aldehyde fixation is known to increase tissue autofluorescence.' },
      { id: 'ice', text: 'Ice crystal artifact', correct: false, why: 'Ice crystals come from slow freezing of fresh tissue, not from formalin exposure.' },
    ],
    principle: 'Work back from the test. DIF, enzyme histochemistry and some molecular work need unfixed or specially transported tissue, and formalin cannot be undone.',
  },
  {
    id: 'urate',
    short: 'Urate crystals',
    title: 'The crystals that vanished',
    tissue: 'A chalky white nodule from a finger joint, clinically a gout tophus.',
    test: 'Demonstrate urate crystals, including under polarized light.',
    problem: 'Sections from formalin-fixed tissue show amorphous pale material and empty clefts, with very little birefringence.',
    variables: [
      { id: 'aqueous', text: 'An aqueous fixative used on a water-soluble deposit', correct: true, why: 'Urate crystals are water-soluble and are dissolved by aqueous fixatives and reagents.' },
      { id: 'polar', text: 'Whether the downstream test depends on crystal birefringence', correct: true, why: 'Polarization needs the crystals still present. Losing them removes the evidence.' },
      { id: 'buffer', text: 'Whether the formalin was buffered', correct: false, why: 'Buffering prevents formalin pigment. It does not stop urate dissolving in water.' },
      { id: 'decal', text: 'Need for decalcification', correct: false, why: 'Urate deposits are not calcium. Decalcification is a separate question and acids would not help here.' },
    ],
    approaches: [
      { id: 'alcohol', text: 'Fix a portion in absolute (non-aqueous) alcohol and avoid aqueous steps where the protocol allows', correct: true, why: 'Non-aqueous fixation preserves water-soluble crystals so they can be shown and polarized.' },
      { id: 'longer', text: 'Fix longer in formalin to harden the crystals', correct: false, why: 'Longer exposure to water dissolves more crystals.' },
      { id: 'bouin', text: 'Use Bouin solution', correct: false, why: 'Bouin is aqueous and acidic, so it does not preserve water-soluble urate.' },
      { id: 'zinc', text: 'Use zinc formalin', correct: false, why: 'Still an aqueous formalin, so the solubility problem is unchanged.' },
    ],
    artifacts: [
      { id: 'clefts', text: 'Empty clefts and amorphous material where crystals were', correct: true, why: 'This is what remains after the crystals dissolve.' },
      { id: 'lost-biref', text: 'Little or no birefringence under polarized light', correct: true, why: 'No crystals left means nothing to polarize.' },
      { id: 'pigment', text: 'Formalin pigment over the deposits', correct: false, why: 'Pigment relates to acidic formalin and blood, not to urate loss.' },
    ],
    principle: 'Fixative chemistry must protect the target. Water-soluble deposits need non-aqueous fixation.',
  },
  {
    id: 'em-renal',
    short: 'Renal EM',
    title: 'A renal biopsy for electron microscopy',
    tissue: 'Renal cores; one fragment has been allocated for EM.',
    test: 'Transmission electron microscopy.',
    problem: 'The EM fragment was placed in formalin along with the light-microscopy cores.',
    variables: [
      { id: 'fixative', text: 'Fixative type: EM needs rapid, strong cross-linking', correct: true, why: 'Glutaraldehyde-based fixatives preserve ultrastructure far better than formalin.' },
      { id: 'size', text: 'Piece size: EM tissue is cut very small (about 1 mm)', correct: true, why: 'Glutaraldehyde penetrates slowly, so tiny pieces are needed for even fixation.' },
      { id: 'temp', text: 'Fixative temperature and promptness', correct: true, why: 'Prompt fixation (often cold, per protocol) limits autolysis that becomes obvious at EM magnifications.' },
      { id: 'counterstain', text: 'Hematoxylin type', correct: false, why: 'Not relevant to ultrastructural preservation.' },
    ],
    approaches: [
      { id: 'glut', text: 'Notify the requesting service and lab director. For future cases, place EM tissue in glutaraldehyde-based fixative in small pieces. Formalin-fixed tissue may still be processed for EM per protocol, with its limitations stated', correct: true, why: 'Communicate, follow the protocol, and fix the allocation step. Formalin-fixed tissue can sometimes be used, but its ultrastructure is compromised.' },
      { id: 'transfer', text: 'Move it to glutaraldehyde now; that fully restores ultrastructure', correct: false, why: 'Post-fixing in glutaraldehyde helps somewhat, but damage that already happened is not reversed.' },
      { id: 'bigger', text: 'Use a larger piece next time so there is more to look at', correct: false, why: 'Larger pieces fix unevenly in glutaraldehyde. EM needs tiny pieces.' },
      { id: 'carnoy', text: 'Use Carnoy for EM', correct: false, why: 'Carnoy is a coagulant fixative that extracts lipids and disrupts membranes, which is poor for ultrastructure.' },
    ],
    artifacts: [
      { id: 'membranes', text: 'Poorly preserved membranes and organelles', correct: true, why: 'Formalin cross-links slowly and less completely at the ultrastructural level.' },
      { id: 'extraction', text: 'Extraction and swelling artifacts at high magnification', correct: true, why: 'Slow fixation lets components move or extract before they are stabilized.' },
      { id: 'chatter', text: 'Chatter in the H&E sections', correct: false, why: 'Chatter is a microtomy problem, unrelated to the EM fixative choice.' },
    ],
    principle: 'EM fixation is about speed and completeness at very small scale: glutaraldehyde, tiny pieces, prompt handling.',
  },
  {
    id: 'pigment',
    short: 'Brown pigment',
    title: 'Brown-black dust on a blood-rich specimen',
    tissue: 'A congested spleen fixed in formalin from an old stock bottle.',
    test: 'Routine H&E and an iron stain.',
    problem: 'Fine brown-black granules lie on and between the cells, mostly where blood is plentiful. They are birefringent and Prussian blue is negative.',
    variables: [
      { id: 'ph', text: 'Fixative pH: acidic or unbuffered formalin', correct: true, why: 'Acid formaldehyde hematin forms when formalin is acidic (for example, formic acid has built up) and reacts with hemoglobin.' },
      { id: 'blood', text: 'How much blood the tissue contains', correct: true, why: 'The pigment derives from hemoglobin, so blood-rich tissues show it most.' },
      { id: 'time', text: 'Long fixation in that solution', correct: true, why: 'Prolonged exposure to acidic formalin increases pigment formation.' },
      { id: 'thickness', text: 'Section thickness', correct: false, why: 'Thickness changes how much you see, not whether pigment forms.' },
    ],
    approaches: [
      { id: 'buffer', text: 'Use buffered formalin going forward; remove pigment from sections (for example with alcoholic picric acid or alkaline alcohol) before staining', correct: true, why: 'Buffering prevents it. Removal methods clear existing pigment without needing to recut.' },
      { id: 'iron', text: 'Report it as hemosiderin', correct: false, why: 'Hemosiderin is Prussian blue positive. This pigment is negative and birefringent, a formalin pigment pattern.' },
      { id: 'bleach', text: 'Bleach with permanganate as for melanin', correct: false, why: 'Melanin bleaching is a different test. The pigment pattern and history point to formalin pigment.' },
      { id: 'ignore', text: 'Ignore it because it is only an artifact', correct: false, why: 'It can obscure detail and be mistaken for real pigment. Prevent and remove it.' },
    ],
    artifacts: [
      { id: 'granules', text: 'Birefringent brown-black granules not tied to cell structure', correct: true, why: 'Typical of acid formaldehyde hematin.' },
      { id: 'pb-neg', text: 'Negative Prussian blue over the pigment', correct: true, why: 'It is not ferric iron, which separates it from hemosiderin.' },
      { id: 'mushy', text: 'Mushy, poorly infiltrated blocks', correct: false, why: 'A processing problem, unrelated to pigment.' },
    ],
    principle: 'Buffer the fixative. Acidic formalin plus hemoglobin makes a pigment that mimics real deposits.',
  },
]

export interface CaseAnswer { variables: string[]; approach?: string; artifacts: string[] }

/**
 * Score: variables and artifacts are graded as sets (a correct pick +1, a wrong pick −1, floored at 0),
 * scaled to 1 point each; the approach is 1 point. Total 3 per case.
 */
export function scoreCase(c: FixationCase, a: CaseAnswer): { variables: number; approach: number; artifacts: number; total: number } {
  const setScore = (opts: Choice[], picked: string[]) => {
    const good = opts.filter((o) => o.correct).length
    const raw = picked.reduce((s, id) => s + (opts.find((o) => o.id === id)?.correct ? 1 : -1), 0)
    return Math.max(0, raw) / good
  }
  const variables = setScore(c.variables, a.variables)
  const artifacts = setScore(c.artifacts, a.artifacts)
  const approach = c.approaches.find((o) => o.id === a.approach)?.correct ? 1 : 0
  return { variables, approach, artifacts, total: variables + approach + artifacts }
}
