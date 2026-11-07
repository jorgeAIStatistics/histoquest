# HistoQuest Lab architecture

## Data flow

A seeded scenario creates a synthetic specimen. Typed intents append validated events; pure TypeScript reducers replay those events into a specimen digital twin. Process models update continuous fields and append provenance-aware findings. Scoring reads the complete twin and log. Rendering reads the twin only and never determines a grade.

`content/lab → sim/core + sim/specimen + sim/models → render2d / render3d → features/lab3d`

React dispatches intents and persists run records. Three.js is dynamically imported only from the 3D route. The same controls, model and event log power an HTML/SVG mode when WebGL2 is absent or declined. No graphics types enter the core or storage schemas.

## Determinism and limits

A seed, scenario version and ordered event log determine the run under the current documented model revision. Version-1 scenario generation is retained for earlier logs; new free runs explicitly select version 2. Software updates can refine model behavior, so retained logs are original observations, not immutable certified scores. Events carry simulation time rather than reading the clock inside models. Numeric parameters carry a unit, scope, provenance, access status and explicit illustrative flag. Model coefficients express teaching relationships; they are not measured calibration or clinical SOPs. Seeded phenotype rendering labels every output as a simulated slide.

The twin retains identity/custody, geometry, fixation/decalcification fields, processing exchanges, embedding transforms, block consumption, section defects, stain optical densities, controls and target preservation. Identity and safety faults survive later technically attractive results.

## Persistence

Schema v4 extends the existing versioned JSON export. Migrations retain all v1/v2/v3 study, exam, Route 2 and workbench records. Large completed logs use bounded storage with explicit retention/export behavior; no patient data, backend, account or telemetry. Scientific reviewer annotations are learner-entered records, never automatically promoted to expert review.

## Rendering

Procedural instrument geometry avoids external model licenses and downloads. A microscope renders tissue compartments through absorbance channels and applies defects derived from section state. Camera presets and pointer/touch/keyboard inputs share intent handlers. Reduced motion changes presentation only. GPU resources are disposed on unmount and a text description accompanies every slide.

## Verification

Pure models get monotonic, boundary, invariant and deterministic replay tests. Route and practical tests exercise the same event dispatch as learners. Golden slides check visual reproducibility. Bundle checks compare non-lab route entry graphs with the baseline; performance claims require measured device evidence. Scientific validity remains a separate expert-review task.

## Learning and storage boundaries

Career, shift and clinic routes share the same pure replay reducer. Guided practicals require published observable checks and retain critical events. Senior/supervisor planning is held for qualified review. Simulation follow-ups may make related retrieval cards due, without fabricating an answer, review, lapse, exam attempt or fresh readiness evidence.

The archive stores completed logs in IndexedDB; recent local records, an active draft and archive results are merged by ID with the local revision taking precedence. Complete export reads and validates both stores before creating a single v4 JSON file. Explicit pruning requires a successful complete export and preserves changed/unexported records. See PERSISTENCE.md for caps and failure behavior.

Detailed instrument scenes load per station. The next scene is prefetched during idle time when connection and visibility conditions permit. The 3D engine remains absent from 2D-only lab navigation. Synthetic fluorescence uses an additive emission branch; brightfield channels retain the absorbance branch. All real micrographs remain separate attributed image assets.
