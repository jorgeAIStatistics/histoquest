# Phase 0 baseline and verification

Measured on the existing `a5d5fa4` production build before adding the simulation platform. Measurements use individual gzip level-9 compression of each emitted JavaScript file. They exclude source maps and development dependencies. The entry graph is the HTML module entry plus its transitive static imports; route chunks are loaded separately. This is a repeatable transfer-size budget, not a claim about device frame rate or page load time.

| Metric                                      | Before Phase 0 |   Phase 0 |
| ------------------------------------------- | -------------: | --------: |
| Initial static JavaScript graph, gzip bytes |        128,167 |   129,349 |
| All emitted JavaScript chunks, gzip bytes   |        400,580 |   401,755 |
| Total deployed bytes                        |      2,083,169 | 2,086,974 |
| Largest deployed file, bytes                |        652,136 |   652,136 |

`docs/bundle-baseline.json` stores the original measurements. `npm run bundle:check` checks the current build against the +10 KiB entry-graph limit, 50 MiB single-file limit, and 250 MiB deployment target. It must run after `npm run build`. A browser test separately verifies that the non-3D home does not request named Three/Fiber/Drei/lab3d chunks. Later phase reports must also describe the actual loaded route graph and runtime device evidence; this script does not measure interactive 3D performance.

## Dependencies

Registry compatibility was checked before installation on November 6, 2026:

- `three` 0.187.0: requested 3D engine, to be imported only inside the lazy lab surface. Procedural geometry avoids large model files.
- `@react-three/fiber` 9.8.2: React scene lifecycle and disposal. Its peer range is React/React DOM `>=19 <19.4`, compatible with the existing 19.3.1 installation. [Official introduction](https://r3f.docs.pmnd.rs/getting-started/introduction) pairs Fiber 9 with React 19.
- `@react-three/drei` 10.7.9: maintained camera/control/quality helpers, with React 19 and Fiber 9 peer support. Import only the used helpers on the lab route.
- `@types/three`: development-only TypeScript declarations for the installed engine.
- `prettier` 3.9.10: development-only readable source formatting. Format touched files with `npm run format -- <paths>`; avoid unrelated repository-wide churn.
- `fast-check` 4.10.2: development-only generated property tests for simulation determinism and invariants.
- `@axe-core/playwright` 4.14.0: development-only automated accessibility scans; these supplement manual keyboard and visual checks.

None of these new runtime dependencies is imported by Phase 0 code, so they add zero emitted 3D engine bytes at this stage. The small entry increase comes from the v4 schema and explicit-decision workbench support. No asset compression dependency is installed yet because the procedural scenes do not require imported binary models or textures.

The [Three.js WebGPU documentation](https://threejs.org/manual/pages/webgpurenderer) documents automatic WebGL2 fallback. The stable Fiber 9 scene may use WebGL2 first and gate experimental WebGPU by capability; it must not claim universal WebGPU support.

## Software checks

- TypeScript: passed.
- Oxlint with `--deny-warnings`: passed. Unused helper exports were made private; shared answer grading was moved to `answers.ts`; the sequence demonstration no longer sets state synchronously in an effect; the daily date is initialized once per mount.
- Vitest: 57 passed; two environment-gated inventory helpers skipped. Vitest is explicitly scoped to `src/**/*.test.{ts,tsx}` so it does not collect Playwright specs.
- Production build and bundle/asset budget: passed.
- Browser suite: 86/86 passed in Chromium and Firefox (43 tests each, 24.3 seconds for the combined run). WebKit is blocked locally before application navigation; details below. The CI workflow still requires Chromium, Firefox and WebKit on Ubuntu before publishing.

The existing installation reports two moderate dependency audit findings. This phase does not apply a forced major-version upgrade to unrelated dependencies.

## Browser coverage

The Playwright suite runs against `vite preview` at `/histoquest/`, exercising the production base path. It covers all 26 existing route shapes (including eight focused labs), a phone viewport, non-3D lazy loading, thirteen WCAG 2.2 AA automated scans, an explicit unanswered accessioning decision completed only through keyboard actions, shuffle stability on reload, and an actual JSON download/import after v3→v4 migration.

An initial Chromium scan found that unearned badge descriptions on Progress were faded below text-contrast requirements by parent opacity. Removing that opacity preserves the readable copy and uses the existing “Not yet” label for state. The initial run otherwise passed 41 of 42 tests, including all legacy route and migration checks.

The final Chromium and Firefox runs pass all 26 route checks, thirteen axe scans, phone navigation/overflow, lazy-engine check, migration/export/import and keyboard-only accessioning. The keyboard test traverses the page with Tab, selects a radio option with arrow keys and Space, commits with Enter, and verifies that focus moves to the next station heading. Its initial shuffle-order assertion incorrectly compared `innerText` with `textContent`; comparing radio values fixes the test without changing application behavior.

Verified screenshots from the passing Chromium run: [desktop accessioning](screens/phase0-accessioning-desktop.png), [phone overview](screens/phase0-home-phone.png). These are screenshots of the running production build, not mockups.

### Local WebKit environment limitation

Host: macOS 14.5 arm64. Playwright 1.64.1 selects frozen WebKit revision 2251 for macOS 14 and explicitly warns that this browser receives no updates. Page creation fails with `Protocol error (Page.overrideSetting): Unknown setting: PushAPIEnabled`, before any HistoQuest code is loaded. A forced browser reinstall completed successfully; one bounded retry reproduced the same failure. The local WebKit result is therefore **not verified**, not a pass. Do not downgrade the shared test suite or skip WebKit in CI to disguise this host limitation. Supported-host CI results must be recorded separately after the workflow runs. Real iOS Safari and WebGPU remain untested.

Automated axe results do not establish complete WCAG conformance. Pointer/touch fidelity, real iOS Safari, assistive-technology use, and hardware GPU performance require separate evidence. Headless browser timings are not representative laptop/phone benchmarks.

### Supported-host result

GitHub Actions Ubuntu run 42336608342 passed all gates, including all 129 browser tests across Chromium, Firefox and WebKit. This verifies the software in those engines; it does not substitute for real iOS Safari or hardware-performance measurements.
