/**
 * Source registry. `access` records honestly what HistoQuest actually read:
 *  - 'read': the document was retrieved and read while authoring.
 *  - 'not-accessed': a standard reference listed by ASCP that was NOT read for this build.
 *    Content citing it is consistent with widely taught material but has not been checked
 *    against that text's pages. Page numbers are never given for not-accessed sources.
 */
export interface Source {
  id: string
  title: string
  publisher: string
  year?: string
  url?: string
  access: 'read' | 'not-accessed'
  onAscpReadingList: boolean
}

export const SOURCES: Source[] = [
  { id: 'ascp-cg-2026', title: 'HT/HTL Examination Content Guideline (testing from Nov 1, 2026)', publisher: 'ASCP Board of Certification', year: '2026', url: 'https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/content-guidelines/interim_ascp_ascpi_ht_htl_content_guideline_6-26.pdf', access: 'read', onAscpReadingList: false },
  { id: 'ascp-htl-page', title: 'HTL - Scientist in Histotechnology (eligibility routes)', publisher: 'ASCP Board of Certification', year: '2026', url: 'https://www.ascp.org/boc/explore-credentials/view-all-credentials/HTL', access: 'read', onAscpReadingList: false },
  { id: 'ascp-htl-r2-form', title: 'HTL(ASCP) Experience Documentation Form (Routes 2 and 3), revised Dec 9, 2025', publisher: 'ASCP Board of Certification', year: '2025', url: 'https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/documentation-forms/ascp_htl_route_2_3_docbac04a08-952f-4f13-b912-ab2a3ea0d96e.pdf?sfvrsn=66314e4b_1', access: 'read', onAscpReadingList: false },
  { id: 'ascp-reading', title: 'HT/HTL Suggested Reading for Examination Preparation (reviewed June 2026)', publisher: 'ASCP Board of Certification', year: '2026', url: 'https://www.ascp.org/boc/explore-credentials/view-all-credentials/reading-lists/ht-htl', access: 'read', onAscpReadingList: false },
  { id: 'bancroft-8', title: "Bancroft's Theory and Practice of Histological Techniques, 8th ed.", publisher: 'Elsevier', year: '2019', access: 'not-accessed', onAscpReadingList: true },
  { id: 'carson-5', title: 'Histotechnology: A Self-Instructional Text, 5th ed. (Carson & Cappellano)', publisher: 'ASCP Press', year: '2020', access: 'not-accessed', onAscpReadingList: true },
  { id: 'kiernan-5', title: 'Histological and Histochemical Methods: Theory and Practice, 5th ed. (Kiernan)', publisher: 'Scion', year: '2015', access: 'not-accessed', onAscpReadingList: true },
  { id: 'brown-cap', title: 'Histologic Preparations: Common Problems and Their Solutions (Brown, ed.)', publisher: 'College of American Pathologists', year: '2009', access: 'not-accessed', onAscpReadingList: true },
  { id: 'dako-ihc-6', title: 'Dako IHC Guidebook: Immunohistochemical Staining Methods, 6th ed.', publisher: 'Dako/Agilent', year: '2013', access: 'not-accessed', onAscpReadingList: true },
  { id: 'dabbs-6', title: 'Diagnostic Immunohistochemistry, 6th ed. (Dabbs)', publisher: 'Elsevier', year: '2021', access: 'not-accessed', onAscpReadingList: true },
  { id: 'lott-cap-nsh', title: 'Practical Guide to Specimen Handling in Surgical Pathology (Lott et al.)', publisher: 'CAP / NSH', year: '2023', access: 'not-accessed', onAscpReadingList: true },
  { id: 'garcia-mgmt', title: 'Clinical Laboratory Management, 3rd ed. (Garcia et al.)', publisher: 'ASM Press', year: '2024', access: 'not-accessed', onAscpReadingList: true },
  { id: 'osha-1048', title: 'OSHA 29 CFR 1910.1048 Formaldehyde standard', publisher: 'U.S. OSHA', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1048', access: 'read', onAscpReadingList: false },
  { id: 'osha-z1', title: 'OSHA Annotated Table Z-1 (PELs; xylenes 100 ppm TWA)', publisher: 'U.S. OSHA', url: 'https://www.osha.gov/annotated-pels/table-z-1', access: 'read', onAscpReadingList: false },
  { id: 'osha-1450', title: 'OSHA 29 CFR 1910.1450 Occupational exposure to hazardous chemicals in laboratories', publisher: 'U.S. OSHA', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1450', access: 'not-accessed', onAscpReadingList: false },
  { id: 'osha-1200', title: 'OSHA 29 CFR 1910.1200 Hazard Communication', publisher: 'U.S. OSHA', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200', access: 'not-accessed', onAscpReadingList: false },
  { id: 'clia-493', title: 'CLIA regulations, 42 CFR Part 493', publisher: 'U.S. eCFR', url: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-493', access: 'not-accessed', onAscpReadingList: false },
  { id: 'hq-original', title: 'HistoQuest original worked example (arithmetic checked by unit test)', publisher: 'HistoQuest', access: 'read', onAscpReadingList: false },
]

export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s])) as Record<string, Source>
