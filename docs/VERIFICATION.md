# Verification, limitations and gaps

Software verification and scientific verification are separate. **Passing tests does not establish educational accuracy.**

## Specimen-to-slide upgrade (2026-11-06)

`npm test` passes **46 tests**, with two environment-gated helpers skipped. `npm run build` passes TypeScript and creates the production bundle; `npm run inventory` regenerates the bank inventory. No new runtime dependencies were added.

The ten new tests cover all three complete specimen paths, restore at every station, early identity failures, IHC control/localization failures, fragment reconciliation, processing order, cutting safety, malformed drafts, v2 migration, notes/backup round-trips, and chapter references. These verify encoded behavior, not clinical validity.

Browser checks against the local Vite app:
- Desktop and phone layouts, including 1440×1000 and 390×844, plus the initial narrow 319px overview; light and dark themes.
- Full ten-station skin case, including an incorrect sampling decision carried into a correct final hold (9/10 supported decisions), save and reload.
- Repeat case, keyboard-operated thickness/fragment sliders, saved uncommitted controls after reload, correct sampling feedback, processing reordering, embedding selection, animated ribbon, H&E contrast and IHC repeat controls.
- Both chapter checkpoints, confidence and explanations, completion gating, field-note saving, and completed status on the pathway.
- Real H&E and SOX10 images, image selection, zoom, guided observations, and fit-to-window sizing.
- Reduced-motion preference and page titles. New content remains usable without animations.

The new chapter text, qualitative case rules and diagrams are author-checked, **not independently expert-reviewed**. See [SPECIMEN_STUDIO.md](SPECIMEN_STUDIO.md) for boundaries. Browser checks are manual; there is no automated end-to-end UI suite. No full clinical protocol, physical skill competency or exam eligibility claim is inferred from a simulation result.

## Earlier software tests (2026-11-04)

`npm run typecheck` is clean. `npm test` passes 36 tests; 2 env-gated helpers are skipped. (Rerun 2026-11-05 after adding Fixation detective and the IHC room.)

**`src/engine/engine.test.ts`**
- Local-date handling across DST and month ends.
- Guideline selection by exam date.
- Answer grading: stable seeded option shuffles, and grading that is independent of option order.
- Numeric grading: value tolerance, unit aliases, missing or wrong unit, known-error feedback and bad input.
- The spaced-repetition scheduler:
  - interval growth and lapses
  - same-day cramming that cannot inflate the interval
  - correct guesses scheduled sooner than confident correct answers
- Blueprint allocation within every ASCP range.
- Exam forms:
  - no duplicate questions, even with a duplicated pool
  - deterministic per seed
  - unseen questions preferred
  - an honest shortfall when the pool is too small
- The readiness model separates fresh, immediate and delayed answers; repeats don't inflate the sample.
- The planner fits each duration and gives a reason for every item.
- Persistence: export → import round-trip, v1 → v2 migration, and rejection of malformed, newer or invalid files.

**`src/features/lab/sims/sims.test.ts`**
- Processing rules accept the correct sequence and flag each class of error.
- Fixation detective cases: one best approach per case, mixed variable and artifact sets, and scoring that penalizes wrong picks.
- IHC runs: one correct answer per decision, all four control slides present, and encoded QC rules. A failed external positive control, or signal in the negative reagent control, always makes the run uninterpretable; a passing external control with failing internal controls is a specimen problem.
- Lab-math generator: across 234 generated problems, every stated answer passes the grader and common errors fail it. Known values are checked, for example 70% from 95% for 500 mL = 368.42 mL.

**`src/content/content.test.ts`**
- Every item parses, and release targets are met.
- Ids are unique.
- Every objective and source reference resolves.
- Every objective has at least one question, and every area has a lesson.
- Lesson cross-references resolve: retrieval questions, prerequisites, simulations and the prediction and troubleshooting keys.
- Atlas `compareWith` links resolve.
- Answer keys are balanced, with no duplicate options.
- No near-duplicate stems (word-set Jaccard below 0.8).
- No item claims expert review, and no item cites pages for unread sources.

All 10 bank calculation answers were also recomputed by hand, and all are correct.

## Browser verification (2026-11-04)

Checked with the in-app browser against the Vite dev server, at 1440×900, 1280×800 and 390×844, in light and dark themes.

**Core loop.** Each step passed:
1. Today → Start
2. Lesson L-01: step navigation, demo, retrieval answer, confidence, check
3. Rationale for every option
4. Finish lesson
5. Attempt saved (`first: true`), question scheduled for the next day, lesson cards scheduled, plan item marked done, XP recorded
6. Resume → failed-run case session

**Timed exam**
- 100 unique questions: FIX 20, PROC 15, EMB 19, STAIN 34, OPS 12.
- A 150-minute deadline.
- Explanations and difficulty are hidden during the exam.
- After answering, flagging and moving on, a page reload restored the same question, the answer, the flag and a still-running clock.
- The submit confirmation lists unanswered and flagged counts.
- Results show a per-area table and missed, flagged and all explanations.

**Simulations**
- The lab map renders, with the list alternative.
- Processing bench: consequences and principles for a wrong order.
- Embedding studio: keyboard arrows tip and rotate.
- Microtomy challenge and stain studio PAS/PAS-D render and respond.
- Specimen journey and lab math render.

**Other checks**
- Every primary and secondary page renders with no console errors.
- The phone layout has no horizontal scroll and uses a bottom tab bar.
- The reduced-motion setting removes transitions.

**Bugs found and fixed during verification**
- An invisible current-step pill.
- A lesson step that blanked when animation frames were paused.
- Exam submission recording unanswered questions as wrong "fresh" attempts.
- Ambiguous "second change" station labels.
- Mismatched demo captions.
- An empty readiness bar drawing a 0–100% band.
- A mislabelled embedding view.
- The exam-date prompt pushing the plan below the fold on phones.

**Not checked in a browser:** JSON import through the file picker (the logic is unit-tested), and a full 150-minute timeout auto-submit (the logic is code-reviewed, not run to completion).

## Scientific verification status

- All 369 bank content items are `author-checked`: 164 questions, 88 cards, 19 lessons and 98 atlas entries. **No item is expert-reviewed.**
- The four content authors (Claude subagents) wrote from standard histotechnology knowledge.
- Textbooks on the ASCP reading list were **not accessed**. Citations to them are chapter-level and say "not page-verified".
- Read and used directly: the ASCP guideline, the HTL eligibility page, the Route 2/3 form, the reading list, OSHA 1910.1048 (formaldehyde limits) and OSHA Table Z-1 (xylene PEL).

Facts the authors deliberately softened to ranges or qualitative wording, which an expert reviewer should check first:

- **Fixation:**
  - the fixative-to-tissue ratio (stated as "at least 10:1, often 15–20:1")
  - the ~1 mm/hr penetration figure (labelled an approximation)
  - the breast fixation window (stated as commonly cited, without an ASCO/CAP source in the registry)
  - Michel medium composition
- **Processing:**
  - paraffin melting point (55–58 °C, varies)
  - nail clipping softening vs decalcification
- **Staining:**
  - Congo red and Jones section thicknesses
  - HIER buffer pH values
  - ATPase preincubation pH values
  - Alcian yellow, written as the Leung method for H. pylori
  - PASH usage conventions
- **Microtomy:**
  - water bath temperature (5–10 °C below the melting point)
  - cryostat temperatures, given only relatively
- **Regulations:**
  - CLIA competency frequencies and IHC validation case numbers, left out

## Prioritized remaining gaps

1. **Expert review.** A qualified HTL(ASCP) reviewer should review all items, starting with the softened facts above and the HTL-only chemistry. Record `reviewer` and `reviewedOn`.
2. **Thin objectives.** STAIN-11 (mounting and refractive index), STAIN-13 (dye chemistry) and STAIN-14 (Romanowsky and Pap) have one question each. Several FIX, PROC and EMB objectives have two. Add more original questions here first.
3. **Simulation depth.** Fixation detective has 5 cases and the IHC room has 6 runs. Both are rule-based and qualitative, and their content is author-checked like everything else. Add more cases, for example zinc formalin for flow-like markers, under-fixed breast tissue for predictive markers, and ISH runs.
4. **Micrograph breadth.** Two CC0 photographs are bundled in the slide library with source attribution. The bank’s image questions still use schematics. Broader organ coverage, calibrated whole-slide images and expert-reviewed annotations remain future work.
5. **Older guideline comparison.** The guideline for exams through Oct 31, 2026 was not diffed against the current one. This only matters for someone who tested before Nov 1, 2026.
6. **Optional grounded AI tutor.** Not built. The app has a structured hint ladder and says plainly that no AI tutor is connected. A future tutor needs a small server for credentials, retrieval over the atlas and lessons, and citation of the passages it used.
7. **Stain studio breadth.** Interactive sequencing covers H&E and PAS/PAS-D only. Other stains are taught through the atlas (target, principle, reagents, expected result, control, failures, comparisons).
8. **Bank size and difficulty calibration.** At 164 questions, a full-length exam reuses most of the bank, so the exam is mainly useful for pacing. Difficulty values are author estimates only.
9. **End-to-end automated UI tests.** Playwright is installed but no specs are written. The browser checks above were done by hand with an agent.
10. **Minor lint warnings.** For example, a React "fast refresh" export notice and one setState-in-effect in the sequence demo.

## HistoQuest Lab — Phase 0 checkpoint (2026-11-06)

Version 4 adds a validated, deterministic event-log storage boundary while preserving version 1–3 migration paths and all existing progress. The Workbench now requires explicit choices and uses stable seeded option ordering with equal-detail labels. Shared grading helpers and touched UI lint defects are corrected. All existing routes remain available.

Local software gates: 57 unit/content tests passed, two inventory helpers skipped; typecheck, warning-free lint, production build and bundle budget passed. Browser gates: 86 tests passed across Chromium and Firefox, including thirteen automated accessibility scans per browser, keyboard-only accessioning and a real migration/export/import round trip. Local WebKit cannot create a page because the host's frozen macOS 14 runtime rejects PushAPIEnabled. All three browsers remain required in the Ubuntu deployment workflow; its result is pending this checkpoint.

Initial JavaScript grew from 128,167 to 129,349 gzip bytes (+1,182); total deployment is 2,086,974 bytes. Dependency justifications, screenshots and exact coverage are in [BASELINE.md](BASELINE.md). No laptop/phone frame-rate claim or new scientific validation is made. Content counts remain 164 original questions, 88 cards, 19 lessons and 98 atlas entries; all are author-checked, none expert-reviewed. Next: causal specimen fields and procedural microscopy.
