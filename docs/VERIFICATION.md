# Verification, limitations and gaps

Software verification and scientific verification are separate. **Passing tests does not establish educational accuracy.**

## Current release candidate — HistoQuest Lab (2026-11-07)

This is the current status. Older dated checkpoints below are retained as an audit trail; their smaller content counts and missing-feature lists describe those earlier versions.

### What is implemented

- **Career and study:** `/` and `/career` open the L0–L6 learning ladder with explicit rubrics, practical prerequisites and separate evidence. The original reference pathway is at `/pathway`; all previous study, exam, planner, atlas and Route 2 features remain. Lab debriefs can schedule relevant review without inventing question answers or workplace competency.
- **Specimen laboratory:** `/lab3d` offers 16 stations with shared 3D/native controls, 21 seeded specimen archetypes, replay and causal microscopy. Receipt discrepancies, grossing/sampling, cumulative fixation, decalcification, reagent exchange, per-piece embedding, section consumption, bath/pickup/drying, staining, mounting and disposition share one specimen history. Embedding has a non-consuming cutting-plane preview. Tours are skippable and replayable.
- **Staining and IHC:** manual and editable linear H&E programs retain reagent activity, lot and timing; a separately prepared synthetic control receives the same program. Twenty-five special-stain graphs provide concept-level reactions; 22 have target-bearing synthetic comparators. VVG, toluidine blue and rhodanine explicitly withhold comparator validity because their dedicated target compartments are not yet modeled. The IHC academy has ten exercises, 71 marker references, molecular scenes, checkerboards, preanalytic comparisons, investigation/validation planning, and separate fluorescence channels for IF/FISH. Deposited detection chemistry cannot be erased by changing settings; recovery needs a fresh section.
- **Applied practice:** `/shift` has a five-case queue with priorities, frozen interruption, processor reagent recovery, failed IHC controls and requested levels. `/clinic` provides six one-variable investigations with actual recuts, before/after views and verification. Senior/supervisor worksheets make assumptions and review requirements explicit.
- **Content and review:** 304 original questions, 23 lessons, 88 retrieval cards, 98 atlas entries, 12 reference chapters and six individually attributed real micrographs. The new lessons address mounting, stainer QC, dye chemistry, Romanowsky and Pap. `/review`, linked from Settings, prioritizes the 14 previously softened facts, parameters, markers, stain protocols and specimen archetypes and records local reviewer notes without automatically declaring expert approval.
- **Data preservation:** tested v1–v3 migration into v4; bounded recent local cache plus IndexedDB histories; one complete validated JSON export/import; explicit unreadable/quota/capacity failure handling; manual pruning only after a complete export. See [PERSISTENCE.md](PERSISTENCE.md).

### Software evidence

The combined candidate passes TypeScript, warning-free lint, production build and all enforced asset budgets. The final combined unit/content/property run passed **271 tests**, with two opt-in inventory/image-generation helpers skipped. The two opt-in helpers generate inventories or image baselines; they are not skipped behavioral tests. The complete local Chromium/Firefox suite passed **195 tests** in 1.7 minutes, with nine deliberate Firefox skips for Chromium-owned pixel baselines. No behavioral browser checks were skipped. Supported-host three-engine CI and Pages deployment remain the release gate.

Independent browser flows already cover actual L0→L3 progression from empty progress through saved L4 availability, the complete five-case shift, laboratory pointer/touch/native controls, independent-control failures and corrective sections, migration and full IndexedDB backup/restore, unreadable archives, and complete backups containing 6,000 events. The practical chain creates real learner actions, rather than inserting completed practical records. Axe checks cover desktop, phone and dark-theme surfaces, with keyboard checks and visible WebGL-loss/2D fallback. Automated scans do not establish full WCAG conformance or screen-reader usability.

The Phase 2 gate passed all three engines in [run 42340035756](https://github.com/jorgeAIStatistics/histoquest/actions/runs/42340035756), merged as `c19acdb`, and was deployed by successful [Pages run 42340359283](https://github.com/jorgeAIStatistics/histoquest/actions/runs/42340359283). The final combined release must pass the same Chromium, Firefox and WebKit workflow before merging. Local WebKit cannot create a page on this host's frozen macOS 14 runtime (`PushAPIEnabled`); Ubuntu CI supplies the supported-host WebKit check. Linux CI runs Firefox with Mesa/Xvfb to exercise actual software WebGL rather than skipping its 3D checks.

The final audit corrected Firefox-invalid seed-input patterns, protected automatic shift transitions at the 2,000-event limit, and tied special-stain comparator validity to actual target-bearing microscope fields. The 31 protocol-comparator regressions check visible target reactions separately from counterstaining; unsupported target compartments cannot earn a comparator pass.

### Performance and presentation

The combined build has **134,738 gzip bytes** of initial static JavaScript, **+6,571 bytes** against the original 128,167-byte baseline and within the +10 KiB gate. All JavaScript totals 864,047 gzip bytes; deployment is 7,149,013 bytes; the largest asset is 1,131,989 bytes. Three.js and detailed station modules load lazily; station prefetch respects hidden pages, Save-Data and slow connections. No external model/texture asset or runtime CDN is required. Three/fiber/drei support the procedural instruments; fast-check, axe and Prettier support invariants, accessibility checks and readable source. No UI kit was introduced.

On the actual Apple M3 Pro/Metal host, the measured Medium microtome camera workload reached interactive readiness in 1.745 s, with 8.3 ms median / 10.1 ms p95 frame interval. Headless software-renderer and Firefox measurements are separately identified. These are local, bounded workloads, not cold-network or phone benchmarks. Ten station transitions keep renderer-managed resources bounded; idle/offscreen windows stop frames. [RENDERING_QA.md](RENDERING_QA.md) contains the exact hardware, reports, viewport captures and limitations. Latest home, IHC, clinic, review, shift and station screenshots are in `docs/screens/`.

### Remaining acceptance limits and closest implemented versions

- **Scientific review:** all instructional material is author-checked and awaits qualified independent review. The 635 registered process/render parameters expose units, rationale and calibration status. Tests verify the encoded behavior, not clinical kinetics, diagnostic fidelity, eligibility or competency.
- **Microscopy:** authored CPU phenotype tiles are cached and displayed/composited through WebGL2 with a 2D fallback. This is not GPU generation or calibrated whole-slide pathology. Six real images supplement the synthetic microscope; they are not a comprehensive organ/diagnosis atlas.
- **Chemistry:** selected compartment cues illustrate special-stain reactions. Full Gram classes, multicolor counterstains, true metachromasia and organism-specific quantitative chemistry are incomplete. Target-class susceptibility is generic, not clone-specific calibration. Retrieval device/enzyme names are recorded without fitted device-specific kinetics; some IHC investigations assess a structured plan because the underlying specific chemistry is not modeled. Fluorescence is illustrative emission without measured spectra, unmixing or diagnostic copy counts. Detailed limits are in [SCIENTIFIC_MODEL_NOTES.md](SCIENTIFIC_MODEL_NOTES.md).
- **Instruments and operations:** generic procedural instruments support equivalent native actions, not tactile force, arbitrary volumetric cutting, manufacturer operation or real LIS/barcode hardware. Processor circulation/vacuum and block maps are simplified. L5/L6 plans require qualified review; arithmetic and completed fields cannot approve a validation, staffing model or clinical policy.
- **Hardware and accessibility:** real mid-range phone/laptop, iOS Safari, Edge, screen-reader and sustained battery testing remain unverified. Desktop viewport/touch emulation is explicitly not physical-device validation. WebGPU, optional audio and optional WebXR were not enabled without verification; WebGL2, text tutorials and 2D controls provide the implemented paths.

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

## Initial gap audit (historical, before the Lab expansion)

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

Local software gates: 57 unit/content tests passed, two inventory helpers skipped; typecheck, warning-free lint, production build and bundle budget passed. Browser gates: 86 tests passed across Chromium and Firefox, including thirteen automated accessibility scans per browser, keyboard-only accessioning and a real migration/export/import round trip. Local WebKit cannot create a page because the host's frozen macOS 14 runtime rejects PushAPIEnabled. All three browsers remain required in the Ubuntu deployment workflow; Ubuntu CI run 42336608342 passed all three engines (129 browser tests).

Initial JavaScript grew from 128,167 to 129,349 gzip bytes (+1,182); total deployment is 2,086,974 bytes. Dependency justifications, screenshots and exact coverage are in [BASELINE.md](BASELINE.md). No laptop/phone frame-rate claim or new scientific validation is made. Content counts remain 164 original questions, 88 cards, 19 lessons and 98 atlas entries; all are author-checked, none expert-reviewed. Next: causal specimen fields and procedural microscopy.

## HistoQuest Lab — Phase 1 checkpoint (2026-11-06)

The existing `/workbench` now expands decisions into a deterministic specimen event history, uses graded quality measures, and renders separate H&E, special-stain and IHC preparations from that history. A 3–5 µm teaching interval replaces exact-match 4 µm grading. Identity, safety and analytical-control failures remain independently visible and cannot be hidden by a good-looking slide. Every old stored finding still parses.

The microscope has eleven authored tissue families, Beer–Lambert H/E/DAB optics, spatial section/preparation artifacts, 2×/4×/10×/20×/40× teaching views, focus/illumination/condenser/polarization, comparison, measurement and annotations. “Simulated slide” labels and descriptions distinguish it from real micrographs. Seven deterministic CPU image baselines cover three Workbench families and four causal defects; these are software regressions, not scientific image validation. See [RENDERING_QA.md](RENDERING_QA.md) and [SCIENTIFIC_MODEL_NOTES.md](SCIENTIFIC_MODEL_NOTES.md).

Software verification includes monotonic and boundary tests, seeded fast-check invariants, irreversible injury, solvent conservation, distinct slide chemistry, blade wear, control validity, contamination identity and deterministic replay. The microscope passed axe and keyboard interaction checks. Local Chromium/Firefox regression passed 95 tests, with seven intentional Firefox skips for Chromium-owned pixel goldens; the final bounded texture/label correction passed the microscope checks again. Supported-host three-engine CI remains the release gate.

Known approximations: phenotype tiles are generated on the CPU and cached, then presented/composited using WebGL2 when available; there is no claim of GPU phenotype generation. Geometry and stain response are authored qualitative models, not calibrated laboratory kinetics or diagnostic histology. Whole-slide images, fluorescence and quantitative antigen calibration are not implemented here. Marker/protocol catalogs are author-checked and await qualified review. Numeric process settings and optical vectors have provenance records; procedural shape/noise coefficients are rendering choices. Real phone/iOS performance remains unmeasured.

Phase 1 isolated commit snapshot: 121 unit/content/property tests passed, two inventory helpers skipped; typecheck, warning-free lint and production build passed. Initial static JavaScript is 132,012 gzip bytes (+3,845 vs baseline); deployed assets 2,294,073 bytes, largest file 652,136 bytes. Browser execution requires a local preview listener and is run outside the restricted listener sandbox.

The isolated Phase 1 snapshot also passed the complete local Chromium/Firefox suite: 95 passed, seven Chromium-owned golden tests intentionally skipped in Firefox, 29.3 seconds. No new scientific review is inferred from these software checks.

Phase 1 supported-host release gate: GitHub Actions run 42337712856 passed all required build/unit/budget/browser checks, including WebKit. PR #3 merged for Pages deployment. Pixel goldens run in Chromium; interaction and accessibility checks run in all three engines.

## HistoQuest Lab — Phase 2 checkpoint (2026-11-06)

`/lab3d` adds a lazy procedural instrument work surface, a room overview and native controls sharing the deterministic core. The focused `/lab/:sim` routes remain available. The rotary microtome exposes lock/guard, mounting, clearance, lateral blade segments, pace, thickness, consistency, block conditioning, facing and section purpose/level. A spatial block-face depth map and section register track consumed material; each picked-up section keeps its own chemistry. Bath, pickup, drying and H&E/mounting are executable through native keyboard controls. Generic upstream instruments and procedure forms are present for the next refinement phase.

Mouse-drag and touch handwheel actions use the same intent dispatcher as native controls. Safety violations remain critical history; lock/guard prevents cutting; pause/replay prevent mutation. Demand rendering, quality selection, adaptive resolution, reduced-motion camera behavior, saved tab camera views, context-loss fallback and disposal counters are implemented. Choosing the 2D work surface does not request the Three scene bundle. No external 3D assets or textures are used, and no compression dependency is needed for procedural geometry.

The actual-route browser checks passed 20 tests across Chromium and Firefox, with two intentional Firefox skips for Chromium-owned fat/lymphoid pixel goldens. These complement the seven existing goldens, bringing browser phenotype coverage to five families. Checks include a keyboard-completed section→deeper level→bath→pickup→dry→H&E→mount path, physical pointer/touch intent dispatch, frozen-section pickup, axe scans, real context loss and unavailable-WebGL fallback. Scene lifecycle checks exercise repeated station transitions and renderer resource counts. A mobile grid overflow and nested-root label disposal error were found and fixed.

Limits: generic procedural instruments teach relationships and sequences, not actual hand force, tactile feedback, proprietary controls or instrument-specific operation. The frozen support fraction is a mechanical proxy for OCT and is explicitly not paraffin infiltration or chemical fixation. GPU/touch tests use automated desktop browsers; real phone/Safari frame rate and assistive-technology use remain unverified. The 60/30 fps hardware targets are targets, not measured claims.

The isolated Phase 2 commit snapshot passed TypeScript, 128 unit/content/property tests (two inventory helpers skipped), warning-free lint, production build, bundle/asset budgets and the complete local browser suite: 115 passed, nine intentional Firefox golden skips, 35.9 seconds. Entry JavaScript is 132,650 gzip bytes (+4,483 vs the original 128,167); all JavaScript 725,408 gzip bytes; deployed assets 3,325,706 bytes; largest asset 962,729 bytes. The lazy scene chunk is about 256 KB gzip and is absent from non-3D navigation. This is transfer-size evidence, not a device frame-rate claim.
