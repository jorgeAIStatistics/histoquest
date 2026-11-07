import { test, expect, type Page, type Locator } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { PerspectiveCamera, Vector3 } from 'three'
import { replayRun } from '../src/sim/core/replay'
import { createScenario } from '../src/sim/core/scenarios'
import { referenceTwin } from '../src/sim/core/reference'
import { PROCESS as P } from '../src/sim/params/process'
import type { LabRecord } from '../src/store/labSchema'
import { v3Progress } from './fixtures'

async function startBlock(page: Page, view: '2d' | '3d' = '2d') {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('histoquest:state'))
        localStorage.setItem('histoquest:state', JSON.stringify(state))
    },
    {
      ...v3Progress,
      version: 4,
      lab: {
        view,
        quality: 'low',
        runs: [],
        passedPracticals: [],
        tutorials: [],
        reviewRecords: [],
      },
    },
  )
  await page.goto('lab3d?renderDebug')
  await page.getByRole('textbox', { name: 'Replay seed' }).fill('LAB-BROWSER-01')
  await page.getByRole('button', { name: 'Practice on a prepared block' }).click()
  await expect(page.getByRole('heading', { name: 'Microtomy', exact: true })).toBeFocused()
}
async function readTwin(page: Page) {
  const record = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft,
  )) as LabRecord
  return replayRun(record)
}
async function station(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: new RegExp(name) })
    .click()
}
async function activateWithKeyboard(page: Page, target: Locator) {
  for (let i = 0; i < 120; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      await page.keyboard.press('Enter')
      return
    }
    await page.keyboard.press('Tab')
  }
  throw new Error('The procedure control was not reachable using Tab.')
}

test('prepared block → safe keyboard cut → levels → float → pickup → dry → H&E → mount', async ({
  page,
}) => {
  await startBlock(page)
  const before = await readTwin(page)
  await activateWithKeyboard(
    page,
    page.getByRole('button', { name: 'Lock and guard', exact: true }),
  )
  await activateWithKeyboard(
    page,
    page.getByRole('button', { name: 'Mount / align block', exact: true }),
  )
  await page.getByRole('button', { name: 'Prepare to cut — hands clear' }).click()
  await activateWithKeyboard(
    page,
    page.getByRole('button', { name: 'Turn handwheel — take section' }),
  )
  await expect(page.locator('.lab-hud')).toContainText('1 sections')
  await page.getByRole('spinbutton', { name: /Tissue consumed/ }).fill('50')
  await page.getByRole('button', { name: 'Advance block face' }).click()
  await page.getByRole('combobox', { name: 'Purpose', exact: true }).selectOption('level')
  await page.getByRole('spinbutton', { name: /Level number/ }).fill('2')
  await page.getByRole('button', { name: 'Turn handwheel — take section' }).click()
  let twin = await readTwin(page)
  expect(twin.block.sections).toHaveLength(2)
  expect(twin.block.sections[1].depth).toBe(54)
  expect(before.block.remaining - twin.block.remaining).toBe(58)
  expect(twin.issues.filter((issue) => issue.id === 'unsafe-sharps')).toEqual([])
  await station(page, 'Float & pick up')
  await page
    .getByRole('checkbox', { name: 'Bath inspected and cleared of previous tissue' })
    .check()
  await page.getByRole('checkbox', { name: 'Gentle section handling' }).check()
  await page.getByRole('button', { name: 'Float section', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Charged slide selected' }).check()
  await page.getByRole('button', { name: 'Pick up section', exact: true }).click()
  await station(page, 'Drying')
  await page.getByRole('button', { name: 'Run drying', exact: true }).click()
  await station(page, 'H&E')
  for (const reagent of [
    'dewax',
    'hydrate',
    'hematoxylin',
    'differentiate',
    'blue',
    'eosin',
    'dehydrate',
    'clear',
  ]) {
    await page.getByRole('combobox', { name: 'Reagent', exact: true }).selectOption(reagent)
    await page.getByRole('spinbutton', { name: /Exposure/ }).fill(String(P[`he.${reagent}-time`]))
    await page.getByRole('button', { name: 'Apply reagent step' }).click()
  }
  await station(page, 'Coverslip')
  await page.getByRole('button', { name: 'Apply coverslip' }).click()
  twin = await readTwin(page)
  expect(twin.block.sections.at(-1)).toMatchObject({
    pickedUp: true,
    charged: true,
    labelCorrect: true,
    dried: 1,
  })
  expect(twin.staining.hematoxylin).toBeGreaterThan(0)
  expect(twin.staining.eosin).toBeGreaterThan(0)
  expect(twin.mounting.mounted).toBe(true)
  await page.reload()
  expect((await readTwin(page)).events).toEqual(twin.events)
})

test('locked instrument cannot spend tissue and paused actions preserve the event log', async ({
  page,
}) => {
  await startBlock(page)
  await page.getByRole('button', { name: 'Lock and guard', exact: true }).click()
  const before = await readTwin(page)
  await page.getByRole('button', { name: 'Turn handwheel — take section' }).click()
  expect((await readTwin(page)).block.remaining).toBe(before.block.remaining)
  expect((await readTwin(page)).block.sections).toHaveLength(0)
  await page.getByRole('button', { name: 'Pause and think' }).click()
  await expect(page.getByRole('button', { name: 'Turn handwheel — take section' })).toBeDisabled()
  const paused = await readTwin(page)
  await page.getByRole('button', { name: 'Resume actions' }).click()
  expect((await readTwin(page)).events).toEqual(paused.events)
})

test('3D scene mounts, navigates, disposes and preserves its specimen on actual WebGL loss', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await startBlock(page, '3d')
  const canvas = page.locator('.lab-scene canvas[data-render-state=ready]')
  await expect(canvas).toBeVisible()
  await expect(
    page.locator('.scene-projected-label').filter({ hasText: 'Drag or tap handwheel' }),
  ).toBeVisible()
  const before = await readTwin(page)
  await page.getByRole('button', { name: 'Save view', exact: true }).click()
  await expect(page.getByText('Camera view saved for this station in this tab.')).toBeVisible()
  await station(page, 'Lab overview')
  await expect(page.locator('.scene-station-link')).toHaveCount(16)
  await page.getByRole('button', { name: 'Enter Microtomy station', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Microtomy', exact: true })).toBeFocused()
  await page.getByRole('button', { name: '2D work surface', exact: true }).click()
  await expect(page.locator('.lab-scene canvas')).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __histoquestRenderMetrics: { activeCanvases: number } })
            .__histoquestRenderMetrics.activeCanvases,
      ),
    )
    .toBe(0)
  await page.getByRole('button', { name: '3D work surface', exact: true }).click()
  await expect(canvas).toBeVisible()
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page
      .locator('.lab-work-surface')
      .screenshot({ path: 'docs/screens/phase2-lab-microtome-desktop.png' })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await expect
    .poll(() =>
      page.locator('.lab-scene-viewport').evaluate((viewport) => {
        const bounds = viewport.getBoundingClientRect()
        return Array.from(viewport.querySelectorAll('.scene-projected-label')).every((label) => {
          if (getComputedStyle(label).visibility === 'hidden') return true
          const box = label.getBoundingClientRect()
          return box.left >= bounds.left && box.right <= bounds.right
        })
      }),
    )
    .toBe(true)
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page.locator('.lab-scene').scrollIntoViewIfNeeded()
    await page.screenshot({ path: 'docs/screens/phase2-lab-microtome-phone.png' })
  }
  const actualLoss = await canvas.evaluate((element) => {
    const extension = (element as HTMLCanvasElement)
      .getContext('webgl2')
      ?.getExtension('WEBGL_lose_context')
    extension?.loseContext()
    return !!extension
  })
  expect(actualLoss).toBe(true)
  await expect(page.getByRole('button', { name: '2D work surface', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect((await readTwin(page)).events).toEqual(before.events)
  expect(errors).toEqual([])
})

test('lab controls, provenance and 2D view pass automated accessibility rules', async ({
  page,
}) => {
  await startBlock(page)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('2D preference keeps the 3D engine unloaded', async ({ page }) => {
  const scripts: string[] = []
  page.on('response', (response) => {
    if (/\.js(?:\?|$)/.test(response.url())) scripts.push(response.url())
  })
  await startBlock(page)
  await expect(page.locator('.lab-2d-stage')).toBeVisible()
  expect(scripts.filter((url) => /LabScene|three|fiber|render3d/i.test(url))).toEqual([])
})

test('dragging the actual handwheel emits ordered pace and section events', async ({ page }) => {
  await startBlock(page, '3d')
  const canvas = page.locator('.lab-scene canvas[data-render-state=ready]')
  await expect(canvas).toBeVisible()
  await expect(
    page.locator('.scene-projected-label').filter({ hasText: 'Drag or tap handwheel' }),
  ).toBeVisible()
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Instrument canvas has no screen bounds.')
  // Project the authored handwheel handle into the actual canvas; send real pointer gestures.
  const camera = new PerspectiveCamera(42, bounds.width / bounds.height, 0.1, 70)
  camera.position.set(4.3, 3, 5.8)
  camera.lookAt(0, 0.65, 0)
  camera.updateMatrixWorld()
  const handle = new Vector3(0.77, 0.73, -0.22).project(camera)
  const x = bounds.x + (handle.x * 0.5 + 0.5) * bounds.width
  const y = bounds.y + (-handle.y * 0.5 + 0.5) * bounds.height
  const before = await readTwin(page)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 105, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => (await readTwin(page)).block.sections.length).toBeGreaterThan(0)
  const events = (await readTwin(page)).events.slice(before.events.length)
  expect(events[0].intent).toBe('instrument.set')
  expect(events[1].intent).toBe('microtomy.cut')
  expect(events.map((event) => event.sequence)).toEqual(
    events.map((_, index) => before.events.length + index),
  )
})

test('frozen preparation carries ice injury into a directly picked-up section', async ({
  page,
}) => {
  await startBlock(page)
  await page.getByRole('button', { name: 'Cases & history' }).click()
  await page.getByRole('combobox', { name: 'Specimen', exact: true }).selectOption('frozen-consult')
  await page.getByRole('button', { name: 'Begin at specimen receipt' }).click()
  await station(page, 'Frozen')
  await page.getByRole('spinbutton', { name: /Freezing rate/ }).fill('1')
  await page
    .getByRole('checkbox', { name: 'Unfixed tissue precautions and decontamination plan checked' })
    .check()
  await page.getByRole('button', { name: 'Prepare frozen block' }).click()
  await station(page, 'Microtomy')
  await page.getByRole('button', { name: 'Mount / align block', exact: true }).click()
  await page.getByRole('button', { name: 'Prepare to cut — hands clear' }).click()
  await page.getByRole('button', { name: 'Turn handwheel — take section' }).click()
  await station(page, 'Float & pick up')
  await page.getByRole('button', { name: 'Pick up section', exact: true }).click()
  const twin = await readTwin(page)
  expect(twin.frozen).toMatchObject({ prepared: true, biohazardChecked: true })
  expect(twin.block.sections.at(-1)?.ice).toBeGreaterThan(0.5)
  expect(twin.block.sections.at(-1)?.pickedUp).toBe(true)
  expect(twin.events.some((event) => event.intent === 'bath.float')).toBe(false)
})

test('unavailable WebGL falls back to the same specimen and native controls', async ({ page }) => {
  await page.addInitScript(`(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return original.call(this, type, ...args);
    };
  })()`)
  await startBlock(page, '3d')
  await expect(page.getByRole('button', { name: '2D work surface', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.lab-2d-stage')).toBeVisible()
  expect((await readTwin(page)).block.sections).toHaveLength(0)
  await expect(page.getByRole('button', { name: 'Turn handwheel — take section' })).toBeEnabled()
})

test.describe('touch instrument input', () => {
  test.use({ hasTouch: true })
  test('a touch on the handwheel cuts one section through the same intent path', async ({
    page,
  }) => {
    await startBlock(page, '3d')
    const canvas = page.locator('.lab-scene canvas[data-render-state=ready]')
    await expect(canvas).toBeVisible()
    await expect(
      page.locator('.scene-projected-label').filter({ hasText: 'Drag or tap handwheel' }),
    ).toBeVisible()
    await canvas.scrollIntoViewIfNeeded()
    const bounds = await canvas.boundingBox()
    if (!bounds) throw new Error('Instrument canvas has no screen bounds.')
    const camera = new PerspectiveCamera(42, bounds.width / bounds.height, 0.1, 70)
    camera.position.set(4.3, 3, 5.8)
    camera.lookAt(0, 0.65, 0)
    camera.updateMatrixWorld()
    const handle = new Vector3(0.77, 0.73, -0.22).project(camera)
    await page.touchscreen.tap(
      bounds.x + (handle.x * 0.5 + 0.5) * bounds.width,
      bounds.y + (-handle.y * 0.5 + 0.5) * bounds.height,
    )
    await expect.poll(async () => (await readTwin(page)).block.sections.length).toBe(1)
  })
})

for (const [archetype, family] of [
  ['fatty-tissue', 'fat'],
  ['lymph-node', 'lymphoid'],
] as const) {
  test(`additional family golden: ${family}`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'Raw CPU golden pixels use Chromium; behavior runs in all projects.',
    )
    const seed = `MICROSCOPE-GOLDEN-${family}`
    const reference = referenceTwin(createScenario(seed, archetype))
    const draft: LabRecord = {
      id: `golden-${family}`,
      version: 1,
      seed,
      archetype,
      difficulty: 1,
      mode: 'free',
      startedAt: '2026-11-01T12:00:00.000Z',
      title: reference.scenario.title,
      events: reference.events,
    }
    await page.addInitScript(
      (state) => localStorage.setItem('histoquest:state', JSON.stringify(state)),
      {
        ...v3Progress,
        version: 4,
        lab: {
          draft,
          view: '2d',
          quality: 'low',
          runs: [],
          passedPracticals: [],
          tutorials: [],
          reviewRecords: [],
        },
      },
    )
    await page.goto('lab3d')
    await expect(page.locator('.microscope-panel')).toHaveAttribute('data-render-state', 'ready')
    await expect(page.locator('.microscope-panel')).toHaveAttribute('data-renderer', '2d')
    const data = await page
      .locator('.microscope-panel canvas:not([hidden])')
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png'))
    expect(Buffer.from(data.split(',')[1], 'base64')).toMatchSnapshot(`${family}-reference.png`, {
      maxDiffPixelRatio: 0.005,
      threshold: 0.05,
    })
  })
}
