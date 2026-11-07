# Scientific model notes

Access date for the new scientific references: **2026-11-06**. The source records in `src/content/lab/sources.ts` distinguish the part actually read from the limits of that access. These catalogs are author-checked teaching summaries and require qualified histotechnology review. No entry is represented as expert-reviewed, a validated assay, a diagnostic rule, an approved laboratory SOP or proof of practical competence.

## What the catalogs establish

- **21 specimen archetypes** describe morphology, orientation questions, containment and downstream-pathway risks. Their mesh dimensions are fictitious specimens in `src/sim/params/archetypes.ts`, not recommended grossing sizes. Orientation and allocation instructions remain dependent on the actual request, approved procedure and qualified personnel. A preserved profile can be taught computationally; tactile handling skill cannot be certified by it.
- **19 special-stain reaction graphs** provide explicit reagent/action nodes and dependency edges, target/appearance summaries, controls and a troubleshooting hypothesis. They establish chemical sequence for the exercise. They are not complete bench procedures. The simulation time scales in `src/sim/params/protocols.ts` are deliberately synthetic; equal action types can share a teaching time constant even though real reactions have different kinetics.
- **The marker catalog** separates expected localization, normal expression, external controls, possible internal controls, pitfalls and technical learning purpose. There are no clinical cutoffs, treatment recommendations, invented clones or generic dilution recipes. An internal control exists only if the relevant tissue element is actually present, preserved and reactive. Some normal-expression-derived control candidates are explicitly labeled as candidates.
- **L0–L6** contains original educational competencies and practical rubrics mapped to existing HistoQuest objectives. These are learning milestones, not employment titles or regulatory competency standards. Grossing scope and qualification decisions require current laboratory and jurisdictional review.

## Absorbance rendering

The [Fiji Colour Deconvolution vector data](https://raw.githubusercontent.com/fiji/Colour_Deconvolution/master/src/main/resources/sc/fiji/colourDeconvolution/colourdeconvolution.txt), read directly, gives this **H&E DAB preset**:

| Component   |   Red | Green |  Blue |
| ----------- | ----: | ----: | ----: |
| Hematoxylin | 0.650 | 0.704 | 0.286 |
| Eosin       | 0.072 | 0.990 | 0.105 |
| DAB         | 0.268 | 0.570 | 0.776 |

These are preset stain-vector components, not universally measured absorption coefficients for all laboratories. [Landini's documentation](https://blog.bham.ac.uk/intellimic/g-landini-software/colour-deconvolution-2/) explains the need for method-specific calibration. The [Ruifrok–Johnston abstract](https://pubmed.ncbi.nlm.nih.gov/11531144/) establishes the color-deconvolution method provenance; the original paper's numerical tables were not independently verified for this build. Exact numbers are therefore attributed to the Fiji file. No GPL plugin implementation was copied into the app.

A forward teaching renderer can calculate transmitted intensity as an illuminant multiplied by an exponential of summed channel absorbance. It must state whether its scalar channel amount uses natural-log absorbance or base-10 optical density; switching between them requires the corresponding conversion. Display RGB, broadband scattering, stain precipitate and tissue optics make this a simplified appearance model. Most histochemical/IHC staining is not stoichiometric: darker DAB cannot be interpreted as a calibrated amount of antigen. Fluorescence combines emitted light and must not reuse the brightfield subtractive model unchanged. Other stain vectors and all kinetic response parameters remain illustrative unless a separately scoped source says otherwise.

## Mechanism and validation boundaries

- Reagent access and chemical stabilization are different processes. A square-root penetration front and a later reaction state can teach the distinction; neither a coefficient nor a simulated threshold predicts adequate clinical fixation.
- Dehydration, clearing and infiltration depend on reagent compatibility, tissue properties, geometry and program conditions. The model may show retained-water or poor-support effects but cannot declare a clinically adequate processing endpoint.
- Section compression, periodic chatter, knife defects, folds and incomplete representation are separable appearance mechanisms. Cutting angle, block temperature and speed effects are qualitative relationships; no simulator setting is a universal instrument recommendation.
- Retrieval can increase epitope accessibility while harming tissue adherence or morphology. Marker, clone, fixation, decalcification, section age, detection system and intended use matter. A generic model cannot establish clinical optimization or validation.
- Known-positive controls must challenge relevant sensitivity. The NordiQC marker guidance repeatedly distinguishes high-expression tissue from weaker control elements. Examples include CDX2 pancreatic ducts rather than bowel alone, chromogranin neural elements rather than pancreatic islets alone, and CD117 Cajal cells in addition to strong mast cells. Some control choices depend on antibody clone; the catalog identifies that limitation.
- RNA ISH requires evidence of specimen RNA suitability and acceptable background in addition to a target-positive external control. A target-negative image with a failed RNA control is not a valid negative result. p16 protein IHC is not direct HPV nucleic-acid detection.
- A satisfactory appearance never repairs an identity discrepancy, contamination event or invalid control run. Technical disposition must preserve those upstream facts.

## Historical special-stain sources

The University of Utah WebPath manuals support reaction principles, order, control examples and target appearance. They are historical documents with outdated or unsafe handling/disposal directions in places. This project deliberately does not reproduce their reagent-mixing recipes, microwave instructions, waste directions or personal protective equipment instructions as laboratory guidance. The graph is a conceptual teaching abstraction; practical work must use the current approved SOP, safety data and local waste rules.

The initial executable graph set does not yet include Alcian blue pH 1.0, Warthin–Starry/Steiner, melanin bleach, von Kossa, Alizarin red or rhodanine. Those must not be presented as implemented merely because the existing atlas names them. The current PAS-D graph describes a paired digestion comparison; a UI must actually display paired sections and their controls before claiming that full exercise is complete. Congo red requires the same care with implemented polarization and a known-positive comparator. The Oil Red O graph uses a lipid-preserving frozen/aqueous path; routine paraffin processing cannot be corrected by increasing stain strength.

## Review items before clinical teaching endorsement

1. Qualified reviewers should confirm specimen-specific handling/orientation, marker control suitability, source currency and every proposed workflow boundary.
2. The 2025 CAP/NSH handling guide remains **not accessed** in the existing source registry. Listing it is not evidence of having checked its pages. Existing clinical reference books likewise must not be represented as read.
3. NordiQC epitope essays and older manufacturer references can contain historical clinical statements. Only the technical localization/control portions were used; clinical classification, therapeutic claims and numerical scoring rules were not imported. Current run reports were not exhaustively reviewed.
4. Research-only manufacturer data (for example the NeuN reference) supports a teaching pattern, not a claim that a particular clinical assay is approved.
5. Candidate normal-tissue controls and broad cocktails require assay-specific characterization. A CK5 control reference does not validate every CK5/6 cocktail.
6. The model requires empirical educational review and user testing. A deterministic, internally tested model is not biologically calibrated solely because it is reproducible.
