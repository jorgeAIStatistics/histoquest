# Rendering verification

## Phase 1 microscope

The production `/histoquest/workbench` route is exercised with seeded synthetic completed runs. The fixtures use the same event adapter and model reducers as the application; no image is injected into the UI. The compatible CPU renderer is selected using the visible control.

Seven raw canvas PNG baselines live in `e2e/goldens/microscope.spec.ts/`: skin, gut and bone reference preparations, plus skin with short fixation/thick tissue, a thick section, a nicked blade, or omitted dewaxing. They are regression fixtures for qualitative teaching output, not validated microscopy. Pixel comparisons run in Chromium with 0.5% maximum changed pixels and a 0.05 color threshold. Only the raw CPU canvas is compared, avoiding platform font/chrome differences. Firefox and WebKit run the interaction checks rather than sharing pixel baselines.

The microscope behavior test changes objective, compares the reference, pans, places a measurement, adds a named annotation, and runs axe WCAG 2.2 AA rules on the integrated surface. The phone check uses a 390 × 844 viewport and verifies no horizontal overflow. Automated accessibility results supplement, and do not replace, assistive-technology review.

Validation on the Phase 1 production build:

- TypeScript passed; 118 unit/property tests passed and two environment-gated helpers were skipped. This local total includes three unintegrated Phase 2 camera tests; the selective Phase 1 commit has a smaller count.
- Production build and asset budget passed. Static entry graph: 130,904 gzip bytes (+2,737 from baseline); all JavaScript: 443,949 gzip bytes; deployed assets: 2,256,993 bytes. No 3D engine is imported at this checkpoint.
- Full Chromium + Firefox suite: 95 passed, seven intentional Firefox pixel-baseline skips, in 27.3 seconds. After the bounded texture/label correction, the microscope interaction/a11y tests passed again in both browsers. Final image baselines were explicitly refreshed and compared again in Chromium.
- Local macOS 14 WebKit remains unavailable before page creation, as documented in `BASELINE.md`. Phase 0 and Phase 1 subsequently passed the three-browser Ubuntu CI gate; Phase 1 was merged in PR #3 (`d10dc20`).
- A concurrent unintegrated Phase 2 `fields.tsx` helper export produced a lint warning during the local checkpoint; it is outside the microscope change. The deployment workflow still requires zero lint warnings and all three browser projects.

Screenshots from the production build: [desktop comparison](screens/phase1-microscope-desktop.png), [20× field](screens/phase1-microscope-20x.png), [phone viewport](screens/phase1-microscope-phone.png). They show generated teaching tissue and are not real micrographs. The visual review replaced repetitive skin collagen bands with seeded anisotropic bundles and enlarged annotation/measurement labels for split/mobile fields.

The Phase 2 lab route adds the remaining two family baselines below. Real Safari/iOS, screen readers, WebGPU, device frame rate, sustained battery behavior and independent histotechnology review remain unverified. View annotations are transient within the open microscope and are not exported records.

## Phase 2 procedural lab

`e2e/lab3d.spec.ts` exercises the production `/histoquest/lab3d` route. The tests read the persisted event record and replay it with the application reducer to check material consumption and specimen effects. Native controls, pointer gestures and touch gestures all reach that same event path.

The browser coverage includes:

- Prepared block → safe keyboard mounting/cutting → deeper level → float → charged pickup → drying → the eight H&E steps → coverslip → reload with unchanged events. The first two sections and a 50 µm deeper cut consume exactly 58 µm in the fixture.
- Guard/lock rejection without consuming tissue, and paused controls that preserve the event log.
- Actual handwheel mouse dragging, ordered speed/cut events and actual touch input.
- Frozen preparation with modeled ice injury and direct pickup without a paraffin water-bath step.
- 3D room navigation, saved station camera view, 2D unmount/remount, local renderer lifecycle counters, actual `WEBGL_lose_context` fallback, and a separate unavailable-WebGL startup fallback. Both fallbacks retain the specimen and native controls.
- Whole-page axe WCAG 2.2 AA scans in the native and 3D views, 390 × 844 layout/label bounds, and no 3D engine request when the saved preference is 2D.

Two additional raw CPU canvas goldens in `e2e/goldens/lab3d.spec.ts/` cover fat and lymphoid tissue. Together with Phase 1, five distinct reference families and four preparation defects have browser regression images. These use the same strict Chromium-only pixel comparison settings described above. A bounded independent visual review found the adipocyte field and lymphoid follicular zones distinct and readable as procedural teaching images; this is not histotechnology validation.

The targeted Phase 2 production suite passed 20 tests in Chromium and Firefox, with two intentional Firefox pixel-golden skips, in 12.1 seconds. A final narrow-view label correction clamps complete label boxes inside the viewport; the browser test now checks those bounds. The subsequent complete production browser suite passed 115 tests, with nine intentional Firefox pixel-golden skips, in 36.2 seconds. After moving the thickness label above the handwheel instruction, the targeted 3D accessibility/lifecycle/phone test passed again in both browsers (two tests, 4.1 seconds). The all-three-browser deployment gate remains required; local WebKit still has the pre-page environment failure documented above.

The local pre-checkpoint unit/property run passed 142 tests with two environment-gated helpers skipped; TypeScript, lint and the production build passed. The final working-tree asset check passed: static entry graph 133,474 gzip bytes (+5,307 from baseline), all JavaScript 728,896 gzip bytes, deployed assets 6,730,301 bytes and largest asset 1,131,989 bytes. This working tree includes concurrent content/micrograph additions, so the isolated checkpoint report is authoritative for its exact asset totals. The approximately 256 kB gzip 3D chunk is loaded only after selecting 3D; Vite's 500 kB raw-chunk warning is expected for that lazy renderer.

Actual-route visual evidence: [microtome desktop](screens/phase2-lab-microtome-desktop.png) and [microtome phone viewport](screens/phase2-lab-microtome-phone.png). The model uses local procedural geometry, materials and lighting; these are teaching instruments, not calibrated replicas. Camera, blade/guard/lock, block and handwheel labels were checked at both widths. The phone review also led to the shell minimum-width correction that prevents page overflow.

Rendering uses stable WebGL2 with on-demand frames, hidden/offscreen pausing, manual quality caps and an adaptive DPR reduction. WebGPU and real-device frame-rate/battery targets have not been verified. An isolated development lifecycle probe observed geometry/material disposal callbacks and zero active canvases after unmount; the production browser tests repeat the active-canvas and context-loss checks. These counters are local diagnostics, not measured GPU heap release or a driver-memory benchmark. No performance or physical competency claim follows from them. Upstream stations currently combine procedural geometry with native procedure controls; later refinements are separate checkpoints.
