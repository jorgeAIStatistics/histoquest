# Verification, limitations and gaps

Software verification and scientific verification are separate. **Passing tests does not establish educational accuracy.**

## Software tests (2026-11-04)

`npm run typecheck` is clean. `npm test` passes 32 tests; 2 env-gated helpers are skipped.

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

- All 345 content items are `author-checked`: 140 questions, 88 cards, 19 lessons and 98 atlas entries. **No item is expert-reviewed.**
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
3. **Fixation detective and IHC troubleshooting room.** Both are designed but not built, and are marked "In development" with no interactive controls. IHC topics are taught in L-16, the IHC layers demo and the bank.
4. **Licensed micrographs.** None are bundled. Image questions use original schematics only. Add a sourced, licensed asset registry, with verified annotations, before any photomicrograph questions.
5. **Older guideline comparison.** The guideline for exams through Oct 31, 2026 was not diffed against the current one. This only matters for someone who tested before Nov 1, 2026.
6. **Optional grounded AI tutor.** Not built. The app has a structured hint ladder and says plainly that no AI tutor is connected. A future tutor needs a small server for credentials, retrieval over the atlas and lessons, and citation of the passages it used.
7. **Stain studio breadth.** Interactive sequencing covers H&E and PAS/PAS-D only. Other stains are taught through the atlas (target, principle, reagents, expected result, control, failures, comparisons).
8. **Bank size and difficulty calibration.** At 140 questions, a full-length exam reuses most of the bank, so the exam is mainly useful for pacing. Difficulty values are author estimates only.
9. **End-to-end automated UI tests.** Playwright is installed but no specs are written. The browser checks above were done by hand with an agent.
10. **Minor lint warnings.** For example, a React "fast refresh" export notice and one setState-in-effect in the sequence demo.
