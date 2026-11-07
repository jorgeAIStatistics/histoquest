# HistoQuest Lab roadmap

Implementation checkmarks below record the delivered code and content. They do **not** mean that pending release gates, device targets or scientific review have passed. Learning milestones and synthetic outcomes never establish professional competency, certification or experience.

## Implementation

- [x] **Phase 0 — Audit, foundations, fixes.** Formatter/lint, explicit unanswered workbench decisions, seeded choices, route smoke tests, baseline budgets, pure deterministic core, parameter provenance and v4 migration.
- [x] **Phase 1 — Specimen twin and procedural microscopy.** History-dependent specimen fields, five reference tissue families, absorbance rendering, spatial artifacts, microscope controls/comparison/polarization, graded workbench and golden images.
- [x] **Phase 2 — 3D microtomy bench.** Lazy WebGL2 lab, procedural instruments, camera/pointer/touch/native keyboard controls, quality controls and 2D fallback; cutting, levels/deepers, flotation, pickup, drying and safety. Merged and deployed.
- [x] **Phase 3 — Upstream stations.** Synthetic accessioning and identity resolution, measured/inked sampling, fixation/decalcification history, editable processor program, six-axis embedding and a non-consuming cutting-plane preview.
- [x] **Phase 4 — Staining and frozen sections.** Manual/automated H&E with shared event semantics, actual-reagent stainer display, coverslipping, 25 conceptual special-stain graphs (22 with target-bearing synthetic comparators) and controls, paired digestion/polarization exercises, frozen sectioning and time-dependent outcomes.
- [x] **Phase 5 — IHC mastery.** 71 technical marker references, molecular teaching scene and ten exercises covering manual/automated runs, retrieval, titration, controls, preanalytics, multiplex, ISH, investigation and validation planning. Adjacent-section application preserves earlier slides and irreversible history.
- [x] **Phase 6 — Career, practicals and shifts.** L0–L6 learning milestones and rubrics, critical-error gates, L0–L3 practical progression, seeded shifts, state/slide debrief replay, separate practice evidence, planner/SRS links and a six-case troubleshooting clinic. Complete archive/export/import includes explicit retention and failure behavior.
- [x] **Phase 7 — Content and review tooling.** 304 original questions, 23 lessons including STAIN-11/12/13/14 coverage, 21 specimen archetypes, six attributed real micrographs, reviewer annotations and senior/supervisor planning. Counts are generated in [CONTENT_INVENTORY.md](CONTENT_INVENTORY.md).
- [x] **Phase 8 — Implemented polish and safeguards.** Per-station lazy loading/idle prefetch, quality caps, ten-transition resource checks, context-loss fallback, skippable/replayable tours, phone/dark layouts and axe checks. Local host measurements exist; real-device acceptance remains open below. Optional audio/WebXR were not added.

## Release and acceptance

- [x] Phases 0 and 1 passed their isolated gates and three-browser CI (`42336608342`, `42337712856`).
- [x] Phase 2 passed the three-browser gate (`42340035756`), merged as `c19acdb`, and deployed successfully in [Pages run 42340359283](https://github.com/jorgeAIStatistics/histoquest/actions/runs/42340359283).
- [x] **Combined Phases 3–8 software gate:** final source `e0126a1` passes typecheck, 271 unit/content/model tests, zero-warning lint, production build and budgets, and 291 browser checks across all three engines in [run 42354373962](https://github.com/jorgeAIStatistics/histoquest/actions/runs/42354373962). Eighteen non-Chromium pixel baselines are deliberately skipped; behavioral checks run everywhere. [PR #5](https://github.com/jorgeAIStatistics/histoquest/pull/5) carries the release; publication is gated by the main-branch [Pages workflow](https://github.com/jorgeAIStatistics/histoquest/actions/workflows/deploy.yml).
- [ ] **Remaining device/accessibility acceptance:** real mid-range laptop/network and phone targets, physical touch devices, Safari/iOS, assistive-technology review and sustained battery/long-session behavior. The measured Apple M3 Pro results and 390px viewport emulation are not substitutes.
- [ ] **Scientific endorsement:** qualified histotechnology review, source-currency review and educational/user validation. All content remains author-checked; reviewer notes never automatically confer expert-reviewed status.

## Scope accounting and approximations

- Instruments and cutaways are procedural teaching models. Grossing uses a guided thickness operation, not arbitrary volumetric cutting, calibrated force feedback or actual LIS/barcode verification. Embedding uses a coarse geometric heightfield; the receipt bottle's rotation is view-only.
- Archetypes share procedural tissue families. Histochemical and IHC fields use selected authored compartment cues and illustrative kinetics, not complete specimen-specific microanatomy, measured reaction calibration or diagnostic images. Special-stain graphs are conceptual exercises, not complete bench SOPs.
- IHC device/protease choices lack separate calibrated kinetics. Multiplex/ISH channels illustrate localization and control logic, not measured spectra, molecular counts or clinical cutoffs. Biotin, cross-reactivity, necrosis/crush and pigment-specific investigations use structured reasoning where the core does not model the mechanism quantitatively. Senior planning requires qualified review.
- Debrief scrubbing replays specimen state, actions and slide appearance; recorded 3D camera-path playback is not implemented. Camera presets remain presentation preferences. Scientific scores may change with documented model revisions; retained events are original observations, not immutable certified outcomes.
- WebGL2 and CPU/HTML alternatives are implemented. WebGPU, optional WebXR, gamepad support and new laboratory audio/captions are not implemented. There are no external model/texture assets requiring a compression pipeline. Local renderer counters are not GPU-heap measurements.

Detailed evidence and limits: [VERIFICATION.md](VERIFICATION.md), [RENDERING_QA.md](RENDERING_QA.md), [SCIENTIFIC_MODEL_NOTES.md](SCIENTIFIC_MODEL_NOTES.md) and [PERSISTENCE.md](PERSISTENCE.md). Existing exam, SRS, readiness, Route 2, atlas and legacy simulation routes remain preserved. Baseline: `a5d5fa4`; implementation branch: `codex/histoquest-lab`.
