import { test, expect, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { cpus, platform, release } from 'node:os'
import { v3Progress } from './fixtures'
import { createScenario } from '../src/sim/core/scenarios'
import { referenceTwin } from '../src/sim/core/reference'
import { STATION_IDS } from '../src/sim/core/events'
import type { RenderMetrics } from '../src/render3d/metrics'

const metrics = (page: Page): Promise<RenderMetrics> =>
  page.evaluate(
    () =>
      (window as unknown as { __histoquestRenderMetrics: RenderMetrics }).__histoquestRenderMetrics,
  )
async function twoFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
}
async function fixture(
  page: Page,
  tutorials = true,
  quality: 'low' | 'medium' = 'low',
  motion: 'full' | 'reduced' = 'reduced',
) {
  const scenario = createScenario('RENDER-RESOURCE-01', 'skin-ellipse')
  const reference = referenceTwin(scenario)
  const stop = reference.events.find((event) => event.intent === 'microtomy.cut')!.sequence
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('histoquest:state'))
        localStorage.setItem('histoquest:state', JSON.stringify(state))
    },
    {
      ...v3Progress,
      settings: { ...v3Progress.settings, motion },
      version: 4,
      lab: {
        view: '3d',
        quality,
        tutorials: tutorials ? [...STATION_IDS] : [],
        runs: [],
        passedPracticals: [],
        reviewRecords: [],
        draft: {
          id: 'render-resource-fixture',
          version: 1,
          seed: scenario.seed,
          archetype: scenario.archetype,
          difficulty: 1,
          mode: 'free',
          startedAt: '2026-11-07T00:00:00.000Z',
          title: 'Renderer resource fixture',
          events: reference.events.slice(0, stop),
        },
      },
    },
  )
}

test('ten station transitions keep live resources bounded and idle/offscreen rendering stops', async ({
  page,
}, testInfo) => {
  await fixture(page)
  const started = Date.now()
  await page.goto('lab3d?renderDebug')
  const canvas = page.locator('.lab-scene canvas[data-render-state=ready]')
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveAttribute('data-station-model', 'microtomy')
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const node = element as HTMLCanvasElement
        return Math.abs(node.width - node.clientWidth)
      }),
    )
    .toBeLessThanOrEqual(1)
  await canvas.scrollIntoViewIfNeeded()
  await expect(page.getByText('Drag or tap handwheel', { exact: true })).toBeVisible()
  await twoFrames(page)
  const firstInteractiveMs = Date.now() - started
  await expect.poll(async () => (await metrics(page)).geometries).toBeGreaterThan(0)
  const initial = await metrics(page)
  const transitions: { station: string; resources: RenderMetrics }[] = []
  for (const name of [
    'Grossing',
    'Fixation',
    'Processing',
    'Embedding',
    'Microtomy',
    'Grossing',
    'Fixation',
    'Processing',
    'Embedding',
    'Microtomy',
  ]) {
    await page
      .getByRole('navigation', { name: 'Lab stations' })
      .getByRole('button', { name: new RegExp(name) })
      .click()
    await canvas.scrollIntoViewIfNeeded()
    await expect(canvas).toHaveAttribute('data-station-model', name.toLowerCase())
    await page.getByRole('button', { name: 'Front', exact: true }).click()
    await twoFrames(page)
    await expect.poll(async () => (await metrics(page)).activeCanvases).toBe(1)
    transitions.push({ station: name, resources: await metrics(page) })
  }
  // Returning to the same authored station allows direct live renderer-info comparison.
  await expect
    .poll(async () => (await metrics(page)).geometries)
    .toBeLessThanOrEqual(initial.geometries + 2)
  await expect
    .poll(async () => (await metrics(page)).textures)
    .toBeLessThanOrEqual(initial.textures + 1)
  expect((await metrics(page)).disposedResources).toBeGreaterThan(0)
  await page.waitForTimeout(200) // Deliberate idle measurement window, not a readiness workaround.
  const idleStart = (await metrics(page)).frames
  await page.waitForTimeout(400)
  const idleFrames = (await metrics(page)).frames - idleStart
  expect(idleFrames).toBeLessThanOrEqual(1)
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await expect
    .poll(() => canvas.evaluate((element) => element.getBoundingClientRect().bottom < 0))
    .toBe(true)
  await page.waitForTimeout(150)
  const offscreenStart = (await metrics(page)).frames
  await page.waitForTimeout(400)
  const offscreenFrames = (await metrics(page)).frames - offscreenStart
  expect(offscreenFrames).toBe(0)
  await canvas.scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Front', exact: true }).click()
  await expect.poll(async () => (await metrics(page)).frames).toBeGreaterThan(offscreenStart)
  await page.getByRole('button', { name: '2D work surface', exact: true }).click()
  await expect.poll(async () => (await metrics(page)).activeCanvases).toBe(0)
  const report = {
    browser: testInfo.project.name,
    viewport: page.viewportSize(),
    quality: 'low',
    reducedMotion: true,
    network: 'local preview; not a device/network benchmark',
    firstInteractiveMs,
    initial,
    transitions,
    idleFrames,
    offscreenFrames,
    afterUnmount: await metrics(page),
  }
  await testInfo.attach('renderer-lifecycle.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  })
  if (process.env.CAPTURE_SCREENS)
    await writeFile(
      `docs/screens/phase8-renderer-${testInfo.project.name}.json`,
      JSON.stringify(report, null, 2) + '\n',
    )
})

test('detailed station modules load on demand and only the next station is prefetched', async ({
  page,
}) => {
  const scripts: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname)
  })
  await fixture(page)
  await page.goto('lab3d')
  await expect(page.locator('canvas[data-station-model=microtomy]')).toBeVisible()
  await expect.poll(() => scripts.some((path) => /\/Microtome-/.test(path))).toBe(true)
  await expect.poll(() => scripts.some((path) => /\/WaterBath-/.test(path))).toBe(true)
  expect(scripts.some((path) => /\/(?:Grossing|Processor|Embedding|Staining)-/.test(path))).toBe(
    false,
  )
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: /Grossing/ })
    .click()
  await expect(page.locator('canvas[data-station-model=grossing]')).toBeVisible()
  await expect.poll(() => scripts.some((path) => /\/Grossing-/.test(path))).toBe(true)
  await expect.poll(() => scripts.some((path) => /\/Fixation-/.test(path))).toBe(true)
  expect(scripts.some((path) => /\/(?:Processor|Embedding|Staining)-/.test(path))).toBe(false)
})

for (const profile of [
  { name: 'desktop-medium', width: 1280, height: 720, quality: 'medium' as const },
  { name: 'phone-viewport-low', width: 390, height: 844, quality: 'low' as const },
])
  test(`active camera frame-time report: ${profile.name}`, async ({
    page,
    browser,
    headless,
  }, testInfo) => {
    // Emulation changes viewport and quality only; this deliberately makes no claim about phone hardware.
    await page.setViewportSize({ width: profile.width, height: profile.height })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await fixture(page, true, profile.quality, 'full')
    const started = Date.now()
    await page.goto('lab3d?renderDebug')
    const canvas = page.locator('canvas[data-station-model=microtomy]')
    await expect(canvas).toBeVisible()
    await canvas.scrollIntoViewIfNeeded()
    await twoFrames(page)
    const firstInteractiveMs = Date.now() - started
    const intervals: number[] = []
    for (const view of ['Detail', 'Top', 'Front', 'Detail']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await page.evaluate(() =>
        (
          window as unknown as {
            __histoquestFrameCapture: { begin: () => void }
          }
        ).__histoquestFrameCapture.begin(),
      )
      await page.waitForTimeout(400) // Sample the active camera flight, not an idle demand-rendered scene.
      intervals.push(
        ...(await page.evaluate(() =>
          (
            window as unknown as {
              __histoquestFrameCapture: { end: () => number[] }
            }
          ).__histoquestFrameCapture.end(),
        )),
      )
    }
    expect(intervals.length).toBeGreaterThan(8)
    const sorted = [...intervals].sort((a, b) => a - b)
    const percentile = (fraction: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]
    const hostCpu =
      platform() === 'darwin'
        ? execFileSync('sysctl', ['-n', 'machdep.cpu.brand_string'], { encoding: 'utf8' }).trim()
        : (cpus()[0]?.model ?? 'unreported')
    const graphics = await canvas.evaluate((element) => {
      const gl = (element as HTMLCanvasElement).getContext('webgl2')
      const debug = gl?.getExtension('WEBGL_debug_renderer_info')
      return {
        renderer:
          gl && debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : 'not exposed',
        vendor: gl && debug ? String(gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)) : 'not exposed',
        devicePixelRatio,
        drawingBuffer: gl ? [gl.drawingBufferWidth, gl.drawingBufferHeight] : null,
      }
    })
    const report = {
      profile: profile.name,
      host: { cpu: hostCpu, platform: platform(), release: release() },
      browser: testInfo.project.name,
      version: browser.version(),
      headless,
      graphics,
      viewport: page.viewportSize(),
      quality: profile.quality,
      reducedMotion: false,
      network:
        'local production preview; unthrottled host; viewport emulation is not phone hardware',
      workload:
        'Four 400 ms camera flights with station geometry visible; initial demand-idle interval removed per flight; later stalls retained',
      firstInteractiveMs,
      sampleCount: intervals.length,
      medianFrameMs: percentile(0.5),
      p95FrameMs: percentile(0.95),
      maximumFrameMs: sorted.at(-1),
      medianEquivalentFps: 1000 / percentile(0.5),
      intervalsMs: intervals,
    }
    await testInfo.attach('active-camera-frame-times.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    if (process.env.CAPTURE_SCREENS)
      await writeFile(
        `docs/screens/phase8-frames-${testInfo.project.name}-${profile.name}${headless ? '' : '-headed'}.json`,
        JSON.stringify(report, null, 2) + '\n',
      )
  })

test('station tour is keyboard usable, replayable and does not change specimen evidence', async ({
  page,
}) => {
  await fixture(page, false)
  await page.goto('lab3d')
  const tour = page.getByRole('region', { name: 'Microtomy · quick tour' })
  await expect(tour.getByText('Set up safely', { exact: true })).toBeVisible()
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft.events,
  )
  const next = tour.getByRole('button', { name: 'Next tip', exact: true })
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(tour.getByText('Make a deliberate cut', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(tour.getByText('Inspect before repeating', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(tour.getByRole('button', { name: 'Replay station tour' })).toBeVisible()
  await page.reload()
  await expect(tour.getByRole('button', { name: 'Replay station tour' })).toBeVisible()
  await tour.getByRole('button', { name: 'Replay station tour' }).click()
  await expect(tour.getByText('Set up safely', { exact: true })).toBeVisible()
  await tour.getByRole('button', { name: 'Skip tour' }).click()
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!).lab)
  expect(after.tutorials).toContain('microtomy')
  expect(after.draft.events).toEqual(before)
})
