# HistoQuest Lab

A specimen-to-slide learning platform and interactive study lab for the **Scientist in Histotechnology, HTL(ASCP)** exam: daily plans, lessons, virtual-lab simulations, practice and timed exams, spaced review, a reference atlas, and a Route 2 evidence tracker.

> HistoQuest is an independent study tool. It is not affiliated with, endorsed by, or reviewed by the ASCP Board of Certification. Questions are original and do not reproduce exam items. Content is author-checked, **not expert-reviewed**. See [docs/VERIFICATION.md](docs/VERIFICATION.md).

Start with the **L0–L6 career pathway**, then rehearse a specimen journey in the interactive **3D or 2D laboratory**. The shared specimen model carries identity, preparation history, tissue loss, artifacts and analytical controls from bottle to slide. A procedural microscope shows the consequences of your decisions.

Practice includes 21 specimen archetypes, a five-case shift, six troubleshooting investigations, 25 conceptual special-stain graphs (22 with target-bearing synthetic comparators), and an IHC academy with ten exercises and 71 marker references. The study library includes 12 chapters, 23 lessons, eight focused simulations, 304 original questions, 88 retrieval cards and 98 atlas entries, alongside the preserved daily planner and exam engine. Six attributed real micrographs are clearly separated from synthetic slide renderings.

[Open the live platform](https://jorgeaistatistics.github.io/histoquest/).

## Run it

Use Node 24 and npm, matching the deployment workflow.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit, engine and content-structure tests
npm run typecheck
npm run lint
npm run test:e2e     # install Playwright browsers first
npm run bundle:check # after a production build
npm run build        # production bundle in dist/
npm run inventory    # regenerate docs/CONTENT_INVENTORY.md from the bank
```

No account, server or API key is needed. Progress stays in this browser: current study data and recent laboratory work use localStorage; completed event histories use IndexedDB. **Settings → Your data** exports one complete JSON backup of both. See [persistence and retention details](docs/PERSISTENCE.md).

## What's inside

| Area                                                                                                    | Where                                   |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Career: seven learning levels, practical rubrics and separate practice evidence                         | `src/features/career`                   |
| Interactive laboratory: sixteen stations, replay and debrief                                            | `src/features/lab3d`                    |
| Simulated shift: priorities, interruptions, processor recovery, IHC controls and levels                 | `src/features/shift`                    |
| Troubleshooting clinic: inspect, hypothesize, change one variable, verify                               | `src/features/clinic`                   |
| Scientific review desk: prioritized queue, provenance and local reviewer notes                          | `src/features/review`                   |
| Pathway: 12 chapters, interactive figures, 24 checkpoints, field notes                                  | `src/features/pathway`                  |
| Specimen workbench: skin, mucosal biopsies and bone; ten stations with persistent consequences          | `src/features/workbench`                |
| Slide library: six attributed micrographs, digital zoom, guided observation and five artifact exercises | `src/features/pathway/SlideLibrary.tsx` |
| Daily plan: 10/20/45-minute plan with reasons, skip, move to tomorrow, resume                           | `src/features/today`                    |
| Learn: 23 lessons in an 8-step structure (bench question → takeaway and sources)                        | `src/features/learn`                    |
| Virtual Lab: 8 simulations, from specimen journey to the IHC troubleshooting room                       | `src/features/lab`                      |
| Practice: quick quiz, area practice, cases, review queue, timed exams                                   | `src/features/practice`                 |
| Progress: readiness with uncertainty ranges, separate evidence streams, badges                          | `src/features/progress`                 |
| Atlas, Route 2 tracker, Settings                                                                        | `src/features/{atlas,route2,settings}`  |
| Deterministic engine: grading, scheduling, blueprint selection, readiness, planner                      | `src/engine`                            |
| Content: typed and validated, separate from rendering                                                   | `src/content`                           |
| Persistence: versioned schema, migrations, JSON export/import                                           | `src/store`                             |

Stack: React 19, TypeScript, Vite, React Router, Zod (content and storage validation), Motion (animation), Vitest. Teaching illustrations use SVG; the real micrographs are separately identified and attributed in `public/micrographs/ATTRIBUTION.md`. The `/lab3d` route adds Three.js, React Three Fiber and Drei for lazy-loaded procedural instruments; these packages are not imported by the existing study routes. See [the Lab roadmap](docs/ROADMAP.md) and [baseline measurements](docs/BASELINE.md).

The Workbench now derives a simulated microscope slide from a deterministic specimen twin: depth-dependent fixation, reagent exchange, section mechanics and Beer–Lambert stain optics. Eleven procedural tissue families support comparison, teaching zoom, focus, polarization, measurements and annotations, with a Canvas fallback. IHC uses saturating teaching reactions with nuclear, cytoplasmic and membranous localization; FISH uses additive synthetic fluorescence and independent integrity controls. Neither readout establishes diagnostic findings. The workbench uses synthetic, qualitative teaching models. It rehearses decisions and investigation; it does not reproduce instrument handling, validate clinical procedures, or establish professional competency or eligibility.

## Documentation

- [docs/SPECIMEN_STUDIO.md](docs/SPECIMEN_STUDIO.md): pathway, model rules, sources, image provenance and storage behavior

- [docs/CURRICULUM.md](docs/CURRICULUM.md): the verified ASCP sources, blueprint and objective mapping
- [docs/CONTENT_INVENTORY.md](docs/CONTENT_INVENTORY.md): counts, coverage and review status (generated)
- [docs/CONTENT_WORKFLOW.md](docs/CONTENT_WORKFLOW.md): how content is added, corrected, reviewed and retired
- [docs/LEARNING_LOGIC.md](docs/LEARNING_LOGIC.md): scheduler, planner, readiness and mastery rules
- [docs/SCIENTIFIC_MODEL_NOTES.md](docs/SCIENTIFIC_MODEL_NOTES.md): scientific scope, accessed references and uncalibrated assumptions
- [docs/ARCHITECTURE_3D.md](docs/ARCHITECTURE_3D.md): specimen/event/rendering layers
- [docs/VERIFICATION.md](docs/VERIFICATION.md): test results, browser checks, limitations and prioritized gaps
