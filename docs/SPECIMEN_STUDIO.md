# Specimen-to-slide studio

## Learning sequence

The home route is a twelve-chapter pathway: tissue foundations → accessioning → grossing → fixation → processing → embedding → microtomy → H&E → special stains → IHC → alternate preparation → technical handoff. The daily planner remains at `/today`.

Each chapter includes three explanation sections, an interactive labeled SVG model, four bench-reasoning prompts, a downstream consequence, a misconception, a deeper explanation, references, two original retrieval questions, topic-lesson links and field notes. The 24 questions join the existing study bank and spaced review. Chapter completion requires reviewing both checkpoints; it records study rather than mastery or verified competence.

The special-stain chapter compares ten methods by target, expected result, control and limitation. The slide library adds five artifact investigations and two real images with guided observation, digital zoom and keyboard panning. These photographs are not whole-slide scans or paired images of the same specimen. No optical magnification or physical scale is inferred from digital zoom.

## Connected workbench

Three synthetic cases—skin excision, mucosal biopsies and decalcified bone core—pass through ten stations. The learner resolves identity, reconciles fragments and geometry, chooses preservation, orders reagent exchanges, selects a section plane, prepares a modeled section, checks H&E milestones, selects a special stain/control, investigates an IHC failure and makes a technical disposition.

The model carries findings forward. Later correct decisions do not erase earlier problems. A final handoff is supported only when all nine upstream decisions are supported; otherwise a hold is the correct disposition. The accessioning correction and corrected IHC repeat are explicitly simulated branches. Other failed decisions remain unresolved in that run.

Thickness values, specimen classes and preparation rules are exercise specifications, not universal laboratory settings. The model does not simulate diffusion kinetics, complete reagent protocols, tissue mechanics or actual instrument handling. It does not provide diagnostic interpretation. Practical training and professional eligibility remain separate.

## Sources and images

The source registry retains ASCP content-guideline/eligibility references and adds public Leica Biosystems educational articles, CAP IHC validation guidance, Histology Guide and the CAP/NSH specimen-handling reference. Access status is recorded per source. The CAP/NSH PDF and frozen-section reference were not fully accessed and are labeled general references; they are not represented as page-verified evidence.

The real photographs are by Mikael Häggström, M.D., offered under CC0 1.0 on Wikimedia Commons. Their source pages and license were checked and the actual images visually inspected. Original image pixels are retained. See [the image registry](../public/micrographs/ATTRIBUTION.md). No generated image is represented as histologic evidence. Teaching SVGs are clearly labeled schematics.

All newly authored education is author-checked. It still needs an independent qualified histotechnology review, particularly before using the material as part of an institutional curriculum.

## Progress and portability

Storage schema v3 migrates v2 progress, existing lessons, exam history and Route 2 records. New chapter notes/completion and the current workbench draft are included in JSON export/import. Each control change saves locally; an unfinished case resumes after reload. A completed run may be recorded once in simulation history, independently of fresh question evidence. The notebook displays run summaries and exports chapter notes as Markdown. Starting a new specimen replaces the active detailed record; recorded summaries remain. No patient data or server account is required.

## Verification

See [VERIFICATION.md](VERIFICATION.md) for automated checks, manual browser coverage and remaining limitations. The production app retains the existing GitHub Pages base path and SPA fallback.
