# Procedural teaching microscope

`Microscope.tsx` exports both `default` and named `Microscope`, accepting
`{ appearance: SlideAppearance, ideal?: SlideAppearance, force2D?: boolean }`.
Consumers load this module lazily. No scoring or learner-choice interpretation
occurs here: the renderer accepts the specimen twin's derived appearance.

The CPU phenotype sampler creates eleven recognizable, synthetic tissue families
in an authored 2000 × 1500 model-micrometer field. An integer spatial hash anchors
all geometry to the seed, family, archetype, and coordinates; traversal order and
wall-clock time have no effect. The viewer's 2×–40× settings change field of view,
not a claimed calibration of a physical microscope or display. Measurements are
distances in that synthetic coordinate system.

The viewer requests 128 × 128 pixel tiles as needed. Each panel owns a 96-tile LRU
cache (6 MiB of RGBA pixels), cleared on unmount. Tile work yields between batches
and aborted views stop at the next tile. WebGL2 uploads the composed CPU image and
applies the focus sampling kernel. This is **CPU tissue synthesis with GPU
presentation**, not a GPU tissue-generation shader. A lower-resolution Canvas2D
path uses the same sampler and optical model; GPU context loss switches to that
path. Texture, buffer, shader, and program resources are disposed on unmount.

H/E/DAB transmission follows Beer–Lambert absorption using the exact numerical
Fiji H&E DAB preset cited in `src/sim/models/optics.ts`. This is illustrative
forward rendering, not calibrated histomorphometry or quantitative antigen
measurement. Other stain vectors, all geometry, and polarization appearance are
authored approximations. The polarization cue is not a physical retardance model.

The field applies compression, chatter, knife-line tears, holes, folded seams,
wrinkles, bubbles, ice spaces, residual-wax exclusion, haze, edge deposition,
lifting, pigment, retraction, missing planes, and foreign accession fragments.
Artifact locations are seeded and remain anchored while zooming. Each active
artifact and its consequence is also described in text. The current frozen twin
uses the wax compartment as a **support proxy** after freezing; it does not imply
that a frozen section contains paraffin or model actual cryostat rheology.

Annotations and measurements are local viewer notes and are explicitly described
as lasting while the viewer remains open. They do not alter specimen identity,
assessment, or the event log. Both pointer and native keyboard controls can place
marks, pan, zoom, compare, focus, and adjust illumination.

Model tests check deterministic geometry/pixels, distinct families, compartment
localization, each spatial artifact, coordinate measurements, and bounded caches.
Playwright holds small CPU reference/causal goldens and tests the integrated UI.
These checks establish software behavior; they do not validate the simulation as
clinical training or as an independently reviewed morphology reference.
