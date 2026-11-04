/**
 * Versioned curriculum configuration for HTL(ASCP).
 *
 * Domain names and percentage ranges below are transcribed from the official ASCP BOC
 * HT/HTL Examination Content Guideline (Revised July 10, 2026), valid for testing dates
 * beginning November 1, 2026. Learning objectives are HistoQuest's own wording; each one
 * points at the guideline outline codes it serves (e.g. "IV.B.11.c").
 */

export type DomainId = 'FIX' | 'PROC' | 'EMB' | 'STAIN' | 'OPS'

export interface GuidelineVersion {
  id: string
  credential: 'HTL(ASCP)'
  jurisdiction: string
  title: string
  url: string
  landingUrl: string
  revised: string
  validFrom?: string
  validThrough?: string
  verifiedOn: string
  verificationNote: string
  examModel: {
    questions: number
    minutes: number
    format: string
    adaptive: boolean
    adaptiveNote: string
  }
  domains: { id: DomainId; name: string; min: number; max: number }[]
}

export const GUIDELINES: GuidelineVersion[] = [
  {
    id: 'ascp-ht-htl-2026-11',
    credential: 'HTL(ASCP)',
    jurisdiction: 'United States (ASCP BOC). Regulatory questions are based on U.S. sources.',
    title: 'HT(ASCP), HT(ASCPi), HTL(ASCP), HTL(ASCPi) Examination Content Guideline',
    url: 'https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/content-guidelines/interim_ascp_ascpi_ht_htl_content_guideline_6-26.pdf',
    landingUrl: 'https://www.ascp.org/boc/explore-credentials/view-all-credentials/htl-interim-content-guideline',
    revised: '2026-07-10',
    validFrom: '2026-11-01',
    verifiedOn: '2026-11-04',
    verificationNote:
      'Full PDF read on 2026-11-04. Domains, percentage ranges, outline, fixative list and stain list transcribed from it.',
    examModel: {
      questions: 100,
      minutes: 150,
      format: 'Multiple choice, one best answer',
      adaptive: true,
      adaptiveNote:
        'ASCP administers the exam as computer adaptive testing (CAT). HistoQuest does not reproduce that algorithm; its full-length practice is a fixed-form, blueprint-weighted simulation.',
    },
    domains: [
      { id: 'FIX', name: 'Fixation', min: 15, max: 25 },
      { id: 'PROC', name: 'Processing', min: 10, max: 20 },
      { id: 'EMB', name: 'Embedding/Microtomy', min: 15, max: 25 },
      { id: 'STAIN', name: 'Staining', min: 30, max: 40 },
      { id: 'OPS', name: 'Laboratory Operations', min: 10, max: 15 },
    ],
  },
  {
    id: 'ascp-ht-htl-2025-11',
    credential: 'HTL(ASCP)',
    jurisdiction: 'United States (ASCP BOC)',
    title: 'HT/HTL Content Guideline (testing through October 31, 2026)',
    url: 'https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/content-guidelines/interim_ascp_ascpi_ht_htl_content_guideline_11-25.pdf',
    landingUrl: 'https://www.ascp.org/boc/explore-credentials/view-all-credentials/htl-interim-content-guideline',
    revised: '2025-11',
    validThrough: '2026-10-31',
    verifiedOn: '2026-11-04',
    verificationNote:
      'Retired for exam dates after 2026-10-31. Its PDF was downloaded but not compared line by line; HistoQuest does not use it.',
    examModel: { questions: 100, minutes: 150, format: 'Not re-verified', adaptive: true, adaptiveNote: 'Not re-verified' },
    domains: [],
  },
]

export const ACTIVE_GUIDELINE = GUIDELINES[0]

export function guidelineForExamDate(isoDate: string): GuidelineVersion | undefined {
  return GUIDELINES.find(
    (g) => (!g.validFrom || isoDate >= g.validFrom) && (!g.validThrough || isoDate <= g.validThrough),
  )
}

export interface Objective {
  id: string
  domain: DomainId
  title: string
  /** Guideline outline codes this objective serves. */
  codes: string[]
  htlOnly?: boolean
}

/** HistoQuest learning objectives. Every lesson, question and card maps to one of these. */
export const OBJECTIVES: Objective[] = [
  // I. Fixation
  { id: 'FIX-01', domain: 'FIX', title: 'Explain how formaldehyde and other fixatives preserve tissue (cross-linking vs coagulation)', codes: ['I.A.2', 'I.A.5', 'I.D.2', 'I.D.4'] },
  { id: 'FIX-02', domain: 'FIX', title: 'Distinguish penetration from fixation and apply size, volume, time and temperature parameters', codes: ['I.C.1', 'I.C.2', 'I.C.3', 'I.C.4'] },
  { id: 'FIX-03', domain: 'FIX', title: 'Select fixatives and transport media for downstream tests (IHC, EM, IF, enzymes, ISH, cytology)', codes: ['I.B.2', 'I.B.5', 'I.B.6', 'I.B.7', 'I.B.10', 'I.B.11'] },
  { id: 'FIX-04', domain: 'FIX', title: 'Know composition, properties and limitations of listed fixatives (NBF, zinc formalin, Bouin, Carnoy, alcohol, acetone, glutaraldehyde, Zamboni, Michel)', codes: ['I.D.1', 'I.D.2'] },
  { id: 'FIX-05', domain: 'FIX', title: 'Recognize and remove fixation pigments, precipitates and artifacts', codes: ['I.B.8', 'I.D.3'] },
  { id: 'FIX-06', domain: 'FIX', title: 'Apply fixation chemistry and pH/buffer principles at scientist level', codes: ['I.C.5', 'I.D.4'], htlOnly: true },
  { id: 'FIX-07', domain: 'FIX', title: 'Use and troubleshoot fixation instrumentation and fixation QC', codes: ['I.B.9', 'I.E.1', 'I.E.4', 'I.E.5'] },
  // II. Processing
  { id: 'PROC-01', domain: 'PROC', title: 'Sequence and explain dehydration, clearing and infiltration', codes: ['II.B.1', 'II.D.2'] },
  { id: 'PROC-02', domain: 'PROC', title: 'Troubleshoot incomplete dehydration, clearing and infiltration', codes: ['II.C.4', 'II.D.3'] },
  { id: 'PROC-03', domain: 'PROC', title: 'Select and monitor decalcification methods and endpoints', codes: ['II.B.4', 'II.D.1'] },
  { id: 'PROC-04', domain: 'PROC', title: 'Operate, maintain and QC tissue processors; manage reagent rotation', codes: ['II.C.1', 'II.C.2', 'II.C.3', 'II.C.5'] },
  { id: 'PROC-05', domain: 'PROC', title: 'Adapt processing for frozen sections, enzymes, IHC, ISH and cytology specimens', codes: ['II.B.2', 'II.B.3', 'II.B.5', 'II.B.8', 'II.B.9'] },
  { id: 'PROC-06', domain: 'PROC', title: 'Explain solvent and paraffin chemistry (miscibility, polarity, melting point)', codes: ['II.D.4'], htlOnly: true },
  // III. Embedding / Microtomy
  { id: 'EMB-01', domain: 'EMB', title: 'Orient tissues correctly during embedding', codes: ['III.A.1', 'III.B.1'] },
  { id: 'EMB-02', domain: 'EMB', title: 'Diagnose sectioning artifacts and their causes', codes: ['III.C.4', 'III.B.4'] },
  { id: 'EMB-03', domain: 'EMB', title: 'Operate and maintain microtome, flotation bath, ovens and embedding center', codes: ['III.C.1', 'III.C.2', 'III.C.3'] },
  { id: 'EMB-04', domain: 'EMB', title: 'Perform and troubleshoot frozen sectioning with the cryostat', codes: ['III.B.2', 'III.C.4'] },
  { id: 'EMB-05', domain: 'EMB', title: 'Use adhesives and charged slides appropriately', codes: ['III.B.3'] },
  { id: 'EMB-06', domain: 'EMB', title: 'Prepare sections and scrolls for molecular testing while controlling contamination', codes: ['III.B.5'], htlOnly: true },
  // IV. Staining
  { id: 'STAIN-01', domain: 'STAIN', title: 'Explain H&E chemistry: mordants, oxidation, progressive vs regressive, bluing, differentiation', codes: ['IV.B.1', 'IV.D.2', 'IV.D.4'] },
  { id: 'STAIN-02', domain: 'STAIN', title: 'Demonstrate carbohydrates and mucins (PAS, PAS-D, Alcian blue, mucicarmine, colloidal iron)', codes: ['IV.B.3'] },
  { id: 'STAIN-03', domain: 'STAIN', title: 'Demonstrate connective tissue (trichromes, VVG, reticulin, Movat) and amyloid (Congo red)', codes: ['IV.B.4', 'IV.B.9'] },
  { id: 'STAIN-04', domain: 'STAIN', title: 'Demonstrate microorganisms (Gram, AFB methods, GMS, Giemsa, spirochete silver stains)', codes: ['IV.B.6'] },
  { id: 'STAIN-05', domain: 'STAIN', title: 'Demonstrate pigments and minerals (Prussian blue, Fontana-Masson, melanin bleach, von Kossa, rhodanine, bile)', codes: ['IV.B.8'] },
  { id: 'STAIN-06', domain: 'STAIN', title: 'Demonstrate lipids, nerve, and cell components (Oil red O, LFB, Bielschowsky, toluidine blue)', codes: ['IV.B.5', 'IV.B.7', 'IV.B.9'] },
  { id: 'STAIN-07', domain: 'STAIN', title: 'Select appropriate positive and negative controls for special stains', codes: ['IV.B.12', 'IV.D.3'] },
  { id: 'STAIN-08', domain: 'STAIN', title: 'Explain IHC staining theory, antigen retrieval and detection systems', codes: ['IV.B.11.a', 'IV.B.11.b', 'IV.B.11.c', 'IV.B.11.f'], htlOnly: true },
  { id: 'STAIN-09', domain: 'STAIN', title: 'Select IHC controls, prepare antibodies and interpret failed runs', codes: ['IV.B.11.d', 'IV.B.11.e'], htlOnly: true },
  { id: 'STAIN-10', domain: 'STAIN', title: 'Explain enzyme histochemistry and in situ hybridization principles', codes: ['IV.B.10', 'IV.B.14'], htlOnly: true },
  { id: 'STAIN-11', domain: 'STAIN', title: 'Select mounting media and coverslipping; apply refractive index', codes: ['IV.E.1', 'IV.E.2', 'IV.E.3'] },
  { id: 'STAIN-12', domain: 'STAIN', title: 'Operate, maintain and QC automated stainers; troubleshoot staining', codes: ['IV.C.1', 'IV.C.4', 'IV.C.5'] },
  { id: 'STAIN-13', domain: 'STAIN', title: 'Explain dye chemistry at scientist level (charge, pH, metachromasia, silver reduction)', codes: ['IV.D.1', 'IV.D.4'], htlOnly: true },
  { id: 'STAIN-14', domain: 'STAIN', title: 'Apply bone marrow, Romanowsky and cytologic (Papanicolaou) staining', codes: ['IV.B.2', 'IV.B.13'] },
  // V. Laboratory Operations
  { id: 'OPS-01', domain: 'OPS', title: 'Apply chemical safety: SDS, labeling, spills, PPE and exposure limits', codes: ['V.A.1'] },
  { id: 'OPS-02', domain: 'OPS', title: 'Apply fire safety, ergonomics and infection control', codes: ['V.A.2', 'V.A.3', 'V.A.4'] },
  { id: 'OPS-03', domain: 'OPS', title: 'Calculate unit conversions, percent solutions and dilutions', codes: ['V.B.1', 'V.B.2'] },
  { id: 'OPS-04', domain: 'OPS', title: 'Calculate molar solutions', codes: ['V.B.3'] },
  { id: 'OPS-05', domain: 'OPS', title: 'Use and maintain ancillary instruments (microscope, pH meter, balance, pipettes, recycler)', codes: ['V.C.1', 'V.C.3', 'V.C.4'] },
  { id: 'OPS-06', domain: 'OPS', title: 'Apply basic management principles', codes: ['V.D.1', 'V.D.2'], htlOnly: true },
  { id: 'OPS-07', domain: 'OPS', title: 'Apply basic education principles', codes: ['V.E.1', 'V.E.2'], htlOnly: true },
  { id: 'OPS-08', domain: 'OPS', title: 'Apply regulations: QA, validation, proficiency testing, competency, HIPAA, procedures', codes: ['V.F.1', 'V.F.2', 'V.F.3', 'V.F.4', 'V.F.5', 'V.F.6'] },
]

export const OBJECTIVE_BY_ID = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o])) as Record<string, Objective>

/** Lists transcribed from guideline pages 5-6 (not all-inclusive per ASCP). */
export const GUIDELINE_FIXATIVES = [
  'Acetone', 'Alcohol', 'Bouin', 'Carnoy', 'Formalin (10% NBF, alcoholic formalin, zinc formalin)',
  'Glutaraldehyde', 'Michel medium', 'Zamboni',
]

export const GUIDELINE_STAINS = [
  'Alcian blue', 'Alcian blue-PAS', 'Alcian yellow', 'Bielschowsky', 'Bile stain (Hall)',
  'Carbol-fuchsin (Kinyoun, Ziehl-Neelsen, Fite, auramine-rhodamine)', 'Colloidal iron', 'Congo red',
  'Crystal violet', 'Enzyme histochemistry (ATPase, cytochrome oxidase, SDH, NADH, esterase, acid phosphatase)',
  'Fontana-Masson', 'Giemsa', 'Gram', 'Grocott/Gomori methenamine-silver (GMS)', 'Melanin bleach',
  'Hematoxylin & eosin (H&E)', 'Immunohistochemical stains', 'Immunofluorescence', 'In situ hybridization (FISH, CISH)',
  'Luxol fast blue (LFB/cresyl echt violet)', 'Movat pentachrome', 'Mucicarmine', 'Oil red O', 'Papanicolaou',
  'PAS-digestion (PASD)', 'PAS-hematoxylin (PASH)', 'Periodic acid-methenamine silver (PAMS) / Jones',
  'Periodic acid-Schiff (PAS)', 'Prussian blue (iron)', 'Reticulin/reticulum', 'Rhodanine', 'Romanowsky',
  'Spirochete (Steiner, Warthin-Starry)', 'Toluidine blue', 'Trichrome (Gomori, Masson)', 'Verhoeff-van Gieson (VVG)',
  'von Kossa',
]
