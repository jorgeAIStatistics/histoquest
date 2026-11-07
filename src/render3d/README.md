# Procedural laboratory renderer

Import `LabScene.tsx` dynamically from the lab route. All Three.js/Fiber/Drei imports stay in this directory; the renderer reads `Twin` and emits intents, never scores an outcome.

The detailed rotary microtome has a block/cassette head, disposable blade and guard, handwheel and lock, coarse control, waste tray and section ribbon. Tap the handwheel for one section or drag it to cut successive sections; the drag pace updates the modeled speed. The model reducer still rejects cutting with a guard or lock engaged. Guard, lock and coarse controls emit the same intents as HTML controls. Cryostat controls retain the `frozen` station identity. Ribbon appearance reads section compression, chatter and folds.

Embedding pieces can be dragged within the mold. Pointer placement changes model x/y in millimeters; the six numerical pose controls in the host UI supply depth and rotations. Visual dimensions are scaled for legibility, not calibrated instrument dimensions. Pointer handlers capture touch/pointer gestures and temporarily suspend camera orbit while manipulating a piece or handwheel. Upstream stations provide procedural geometry and instrument state; detailed program entry and safety decisions remain in the host controls.

Camera presets are keyboard-accessible HTML buttons. Saved views live in `sessionStorage` as tab-specific presentation preferences, separate from exported simulation records. The HTML controls and 2D specimen/slide view are the keyboard and no-GPU equivalents; the canvas does not replace them.

Rendering uses stable WebGL2, PBR materials, local procedural geometry and studio lights. There are no remote textures, models or fonts. WebGPU is not implemented or claimed as verified. Demand rendering stops when idle; visibility handling pauses a hidden/offscreen canvas. Auto quality lowers DPR after sustained slow consecutive active frames, excluding idle gaps. Manual low/medium/high modes cap DPR and shadow quality. Reduced motion snaps camera and mechanism presentation to their final state without changing simulation events.

R3F owns and disposes the declarative geometry, materials and renderer. Context loss reports a fallback reason to the host, which preserves the specimen and switches to its 2D view. `?renderDebug` exposes a read-only local `window.__histoquestRenderMetrics` snapshot for tests: lifecycle counts, rendered frames, current Three.js resource counts, disposal callbacks and context losses. These are local diagnostic counters, not network telemetry or a measured GPU-memory benchmark. Do not treat zero active canvases as proof of a specific driver/heap release behavior.

No claim of instrument-fidelity validation or hands-on competency follows from these teaching models. Numeric procedure settings are supplied by the illustrative parameter registry; geometric mesh dimensions are presentation choices.
