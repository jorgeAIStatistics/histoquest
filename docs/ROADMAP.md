# HistoQuest Lab roadmap

This tracks the full build brief. A phase is complete only when its acceptance checks and software gates pass. Learning milestones and synthetic simulation outcomes never establish professional competency, certification or experience.

- [x] **Phase 0 — Audit, foundations, fixes.** Read current documentation and models; formatter/lint; seeded choices and explicit decisions; route smoke tests; bundle baseline; deterministic core, units, event schema and parameter provenance; tested v4 migration.
- [x] **Phase 1 — Specimen twin and procedural microscopy.** History-dependent twin; five or more phenotypes; absorbance optics; spatial artifacts; microscope with comparison/polarization; graded workbench; deterministic render tests.
- [ ] **Phase 2 — 3D microtomy bench.** Lazy three/fiber/drei shell; generic procedural rig; camera/intent controls; adaptive quality; 2D equivalent; facing, sectioning, bath, pickup, drying, levels/deepers and safety.
- [ ] **Phase 3 — Upstream stations.** LIS/identity, grossing, fixation, decalcification, processor editor, embedding geometry; consequential specimen-to-block workflow.
- [ ] **Phase 4 — Staining and frozen sections.** Procedural H&E/stainer, coverslipping, at least twelve executable special stains with controls, cryostat and frozen TAT.
- [ ] **Phase 5 — IHC mastery.** At least sixty reviewed-for-authorship marker entries; ten exercises spanning manual/automated runs, retrieval, titration, controls, preanalytics, multiplex, ISH, investigation and validation planning.
- [ ] **Phase 6 — Career, practicals and shifts.** L0–L6 learning milestones, published rubrics, critical errors, replay/debrief, separate practice evidence, seeded shifts, planner/SRS integration.
- [ ] **Phase 7 — Content and review tooling.** At least 300 original questions, STAIN-11/12/13/14 lessons, additional attributed micrographs, molecular scenes, review workflow, senior/supervisor learning.
- [ ] **Phase 8 — Performance and accessibility.** Bundle budgets, resource disposal checks, browser/device checks, axe, tutorials, optional captioned audio; optional feature-detected WebXR only if verified.

## Gates at every phase

`npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, Playwright; update inventory and verification. Main must remain deployable. Do not mark untested browser performance or unreviewed scientific content as verified.

## Scope accounting

No planned feature is silently dropped. Implementation status, approximations and remaining acceptance gaps are recorded here and in VERIFICATION.md. Laboratory timings and coefficients are educational models, with provenance shown on demand.

## Current work

Phase 0 passed all software gates, including Chromium, Firefox and WebKit in Ubuntu CI run 42336608342. Baseline is commit a5d5fa4; work occurs on codex/histoquest-lab. Phase 1 passed the isolated snapshot gates and all three browsers in CI run 42337712856. Phase 2 is in progress; the native station controls and procedural 3D scenes are being verified. Existing 19 lessons, 164 questions, 88 cards, 98 atlas entries, 12 pathway chapters and eight focused simulations are preserved.
