# Rendering verification

## Phase 1 microscope

The production `/histoquest/workbench` route is exercised with seeded synthetic completed runs. The fixtures use the same event adapter and model reducers as the application; no image is injected into the UI. The compatible CPU renderer is selected using the visible control.

Seven raw canvas PNG baselines live in `e2e/goldens/microscope.spec.ts/`: skin, gut and bone reference preparations, plus skin with short fixation/thick tissue, a thick section, a nicked blade, or omitted dewaxing. They are regression fixtures for qualitative teaching output, not validated microscopy. Pixel comparisons run in Chromium with 0.5% maximum changed pixels and a 0.05 color threshold. Only the raw CPU canvas is compared, avoiding platform font/chrome differences. Firefox and WebKit run the interaction checks rather than sharing pixel baselines.

The microscope behavior test changes objective, compares the reference, pans, places a measurement, adds a named annotation, and runs axe WCAG 2.2 AA rules on the integrated surface. The phone check uses a 390 × 844 viewport and verifies no horizontal overflow. Automated accessibility results supplement, and do not replace, assistive-technology review.

Validation on the Phase 1 production build:

- TypeScript passed; 118 unit/property tests passed and two environment-gated helpers were skipped. This local total includes three unintegrated Phase 2 camera tests; the selective Phase 1 commit has a smaller count.
- Production build and asset budget passed. Static entry graph: 130,904 gzip bytes (+2,737 from baseline); all JavaScript: 443,949 gzip bytes; deployed assets: 2,256,993 bytes. No 3D engine is imported at this checkpoint.
- Full Chromium + Firefox suite: 95 passed, seven intentional Firefox pixel-baseline skips, in 27.3 seconds. After the bounded texture/label correction, the microscope interaction/a11y tests passed again in both browsers. Final image baselines were explicitly refreshed and compared again in Chromium.
- Local macOS 14 WebKit remains unavailable before page creation, as documented in `BASELINE.md`. Phase 0's Ubuntu CI passed all three browser projects; that result does not imply Phase 1 CI has run.
- A concurrent unintegrated Phase 2 `fields.tsx` helper export produced a lint warning during the local checkpoint; it is outside the microscope change. The deployment workflow still requires zero lint warnings and all three browser projects.

Screenshots from the production build: [desktop comparison](screens/phase1-microscope-desktop.png), [20× field](screens/phase1-microscope-20x.png), [phone viewport](screens/phase1-microscope-phone.png). They show generated teaching tissue and are not real micrographs. The visual review replaced repetitive skin collagen bands with seeded anisotropic bundles and enlarged annotation/measurement labels for split/mobile fields.

Remaining evidence: five-family browser goldens require two more family routes beyond the three legacy workbench cases; the lab route will supply them. Real Safari/iOS, screen readers, WebGPU, device frame rate, sustained battery behavior and independent histotechnology review remain unverified. View annotations are transient within the open microscope and are not exported records.
