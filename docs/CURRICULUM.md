# Curriculum and verified sources

The machine-readable version is `src/content/curriculum.ts` (guideline versions, domains, objectives) and `src/content/sources.ts` (source registry with honest access status).

## Credential and applicable guideline

| Field | Value |
|---|---|
| Credential | Scientist in Histotechnology, HTL(ASCP) |
| Jurisdiction | United States, ASCP Board of Certification. The guideline states regulatory questions are based on U.S. sources. |
| Applicable guideline | *HT(ASCP), HT(ASCPi), HTL(ASCP), HTL(ASCPi) Examination Content Guideline*, revised **July 10, 2026**, valid for testing dates **beginning November 1, 2026** |
| URL | https://ascpcontentwebsite.blob.core.windows.net/boccontent/docs/default-source/explore-credentials/content-guidelines/interim_ascp_ascpi_ht_htl_content_guideline_6-26.pdf |
| Selection page | https://www.ascp.org/boc/explore-credentials/view-all-credentials/htl-interim-content-guideline |
| Verified | 2026-11-04 (full PDF read) |
| Why this version | Today is 2026-11-04, so any exam booked now falls on or after Nov 1, 2026. The app also selects a guideline by exam date (`guidelineForExamDate`) and warns when a date falls under the older guideline. |

**Exam model (verified):** 100 questions in 2 hours 30 minutes, multiple choice with one best answer, delivered by ASCP as computer adaptive testing (CAT). HistoQuest does **not** reproduce CAT. Its full-length practice is a fixed, blueprint-weighted form at the same pace.

**Older guideline:** the version for testing through October 31, 2026 (`…_11-25.pdf`) was downloaded but **not compared line by line**, because this machine had no PDF text tool for it. It is recorded as retired, and HistoQuest content is not mapped to it. This is a known gap.

## Content areas (verbatim from the guideline)

| Area | Share of exam | HistoQuest objectives |
|---|---|---|
| I. Fixation | 15–25% | FIX-01 … FIX-07 |
| II. Processing | 10–20% | PROC-01 … PROC-06 |
| III. Embedding/Microtomy | 15–25% | EMB-01 … EMB-06 |
| IV. Staining | 30–40% | STAIN-01 … STAIN-14 |
| V. Laboratory Operations | 10–15% | OPS-01 … OPS-08 |

HTL-only topics in the guideline are tagged `htlOnly`:
- fixation, processing and staining chemistry principles
- preparation for molecular testing
- enzyme histochemistry staining
- IHC staining theory, antigen retrieval, control selection, antibody preparation and detection theory
- ISH staining
- refractive index
- basic management and education principles

## Objectives → guideline codes

Each of the 41 objectives lists the outline codes it serves (for example `STAIN-08 → IV.B.11.a, b, c, f`). The full table, with question, card and lesson counts per objective, is generated in [CONTENT_INVENTORY.md](CONTENT_INVENTORY.md#objective-coverage). Every lesson, question and card references exactly one objective (lessons may list several), and `src/content/content.test.ts` fails the build if any reference is unknown.

The guideline's fixative list and stain list (pages 5–6) are transcribed in `curriculum.ts`. The atlas has one entry for every listed stain and fixative.

## Route 2 eligibility (verified 2026-11-04)

Source: https://www.ascp.org/boc/explore-credentials/view-all-credentials/HTL and the *HTL(ASCP) Experience Documentation Form (Routes 2 and 3)*, revised Dec 9, 2025. In summary:

- **Degree:** a baccalaureate from an accredited (regionally or nationally) college or university. It must have a biological science or chemistry major, or include 30 semester (45 quarter) hours of biology and chemistry, with both subjects represented.
- **Plus one of these:**
  - 1 year full-time clinical histopathology experience in the last 5 years
  - 1 year full-time veterinary, industry or research histopathology experience in the U.S. or Canada in the last 5 years
  - a two-part structured program of at least 9 months, including at least 480 clinical hours, in the last 5 years
- **Acceptable clinical laboratory:** CMS CLIA, DoD CLIP, JCI or ISO 15189.
- **Required experience areas:** experience in all listed areas, verified on the form by your supervisor, plus a letter of authenticity on institutional letterhead with a wet signature.

The tracker organizes this. It never decides eligibility, and simulations never count as experience.

## Suggested reading (ASCP list, reviewed June 2026)

The ASCP reading list was read, and its titles are in the source registry. **None of the textbooks were accessed for this build.** Items citing them carry chapter-level notes marked "not page-verified" and no page numbers. A test enforces this. The sources that *were* read are listed below.

| Source | What it was used for |
|---|---|
| The content guideline | Blueprint, outline and the fixative and stain lists |
| The HTL eligibility page | Route 2 requirements |
| The Route 2/3 documentation form | Experience areas and documentation steps |
| The reading list | Source registry titles |
| OSHA 29 CFR 1910.1048 | Formaldehyde limits: PEL 0.75 ppm as an 8-hour TWA, STEL 2 ppm, action level 0.5 ppm, and the eyewash requirement where ≥0.1% solutions could splash |
| OSHA Table Z-1 | Xylenes PEL 100 ppm |
