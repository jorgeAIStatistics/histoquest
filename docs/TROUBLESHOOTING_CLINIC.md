# Troubleshooting clinic

`/clinic` opens six authored investigations: a compressed ribbon, periodic thickness bands, parallel knife tracks, deficient center preservation, inadequate wax support and an IHC run with absent positive controls. All slides come from the same specimen/replay and procedural microscopy models as the full laboratory. The initial history is supplied scenario preparation, not learner evidence.

The learner inspects the slide and record, writes a hypothesis, selects one different numerical or compatibility setting, then explicitly runs a controlled repeat. The repeat appends lock/guard, mounting, cutting, pickup, drying, staining, control and mounting events. Each cut consumes tissue and archives the previous slide. Before/after comparison uses the section immediately preceding the repeat as the comparison reference. It does not substitute a separate ideal slide.

Verification records the observed modeled direction and a technical disposition. Incorrect hypotheses remain selectable and produce their actual results. Persistent defects require a hold/escalation decision. Fixation injury, incomplete infiltration, and all earlier event history survive downstream recutting; the clinic does not offer an automatic pre-analytic repair. A fresh proposed change must be tested before verification can be completed.

Records use `LabRecord.mode: 'clinic'` with `CLINIC:<case>:<seed>` scenario seeds. Investigations persist independently in laboratory history, preserving an unrelated active bench/shift draft. Completed verification is committed to the shared IndexedDB archive and complete JSON backup. `/clinic?run=<id>` resumes a saved investigation.

## Scientific and assessment limits

- Synthetic tissue is a teaching visualization, not a micrograph or diagnostic specimen. Model coefficients and case/input thresholds are in `src/sim/params/clinic.ts` and the shared process parameter register, marked illustrative.
- The comparison metric measures the selected artifact or control validity, not whole-slide acceptability. Blade wear and tissue consumption naturally continue between sections; they are disclosed rather than reset.
- The fixed repeat recipe is a controlled teaching operation, not a clinically authorized protocol or a substitute for demonstrating every manual action. The full laboratory remains available for individually operating those steps.
- Free-text reasoning is checked for completeness only and requires qualified review. A completed investigation does not establish independent technical competency, assay validation, clinical release authority or professional eligibility.
- The clinic’s six exercises do not exhaust differential causes. It cannot infer specimen adequacy, select a clinical recovery method, validate an instrument, or reverse lost molecular targets. The two upstream cases intentionally stop at documented investigation and escalation.

Verification includes deterministic model tests for all six cases, correct/incorrect one-variable experiments, preservation invariants, and browser tests covering the actual correction workflow, bad verification, hold/escalation, history continuity, reload and accessibility.
