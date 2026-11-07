# HistoQuest

A specimen-to-slide learning platform and interactive study lab for the **Scientist in Histotechnology, HTL(ASCP)** exam: daily plans, lessons, virtual-lab simulations, practice and timed exams, spaced review, a reference atlas, and a Route 2 evidence tracker.

> HistoQuest is an independent study tool. It is not affiliated with, endorsed by, or reviewed by the ASCP Board of Certification. Questions are original and do not reproduce exam items. Content is author-checked, **not expert-reviewed**. See [docs/VERIFICATION.md](docs/VERIFICATION.md).

Follow a **12-chapter pathway** from tissue foundations through technical handoff. Rehearse **three specimens across ten connected stations**, inspect animated teaching figures and real attributed micrographs, and keep a field notebook. The original daily planner, 19 topic lessons, eight focused simulations and exam practice remain available.

## Run it

Requires Node 20+ (built with Node 24) and npm.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit, engine and content-structure tests
npm run typecheck
npm run build        # production bundle in dist/
npm run inventory    # regenerate docs/CONTENT_INVENTORY.md from the bank
```

No account, server or API key is needed. Progress is stored in this browser's `localStorage`. Export a backup from **Settings → Your data**.

## What's inside

| Area | Where |
|---|---|
| Pathway: 12 chapters, interactive figures, 24 checkpoints, field notes | `src/features/pathway` |
| Specimen workbench: skin, mucosal biopsies and bone; ten stations with persistent consequences | `src/features/workbench` |
| Slide library: two CC0 micrographs, digital zoom, guided observation and five artifact exercises | `src/features/pathway/SlideLibrary.tsx` |
| Daily plan: 10/20/45-minute plan with reasons, skip, move to tomorrow, resume | `src/features/today` |
| Learn: 19 lessons in an 8-step structure (bench question → takeaway and sources) | `src/features/learn` |
| Virtual Lab: 8 simulations, from specimen journey to the IHC troubleshooting room | `src/features/lab` |
| Practice: quick quiz, area practice, cases, review queue, timed exams | `src/features/practice` |
| Progress: readiness with uncertainty ranges, separate evidence streams, badges | `src/features/progress` |
| Atlas, Route 2 tracker, Settings | `src/features/{atlas,route2,settings}` |
| Deterministic engine: grading, scheduling, blueprint selection, readiness, planner | `src/engine` |
| Content: typed and validated, separate from rendering | `src/content` |
| Persistence: versioned schema, migrations, JSON export/import | `src/store` |

Stack: React 19, TypeScript, Vite, React Router, Zod (content and storage validation), Motion (animation), Vitest. Teaching illustrations use SVG; the two real micrographs are separately identified and attributed in `public/micrographs/ATTRIBUTION.md`. There are no 3D dependencies.

The workbench uses synthetic, qualitative teaching models. It rehearses decisions and investigation; it does not reproduce instrument handling, validate clinical procedures, or establish professional competency or eligibility.

## Documentation

- [docs/SPECIMEN_STUDIO.md](docs/SPECIMEN_STUDIO.md): pathway, model rules, sources, image provenance and storage behavior

- [docs/CURRICULUM.md](docs/CURRICULUM.md): the verified ASCP sources, blueprint and objective mapping
- [docs/CONTENT_INVENTORY.md](docs/CONTENT_INVENTORY.md): counts, coverage and review status (generated)
- [docs/CONTENT_WORKFLOW.md](docs/CONTENT_WORKFLOW.md): how content is added, corrected, reviewed and retired
- [docs/LEARNING_LOGIC.md](docs/LEARNING_LOGIC.md): scheduler, planner, readiness and mastery rules
- [docs/VERIFICATION.md](docs/VERIFICATION.md): test results, browser checks, limitations and prioritized gaps
