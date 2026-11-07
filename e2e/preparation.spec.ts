import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { PerspectiveCamera, Vector3 } from 'three'
import { v3Progress } from './fixtures'
import { createScenario } from '../src/sim/core/scenarios'
import { replayRun } from '../src/sim/core/replay'
import { referenceTwin } from '../src/sim/core/reference'
import { PROCESS as P } from '../src/sim/params/process'
import type { LabRecord } from '../src/store/labSchema'

const seed = 'PREPARATION-BROWSER-01'
async function begin(page: Page, view: '2d' | '3d' = '2d', prepared = false) {
  const scenario = createScenario(seed, 'skin-ellipse')
  const record: LabRecord = {
    id: 'preparation-browser',
    version: 1,
    seed,
    archetype: 'skin-ellipse',
    difficulty: 1,
    mode: 'free',
    startedAt: '2026-11-07T00:00:00.000Z',
    title: 'Preparation browser fixture',
    events: prepared
      ? referenceTwin(scenario).events.filter(
          (event) =>
            event.sequence <
            referenceTwin(scenario).events.find((event) => event.station === 'microtomy')!.sequence,
        )
      : [],
  }
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('histoquest:state'))
        localStorage.setItem('histoquest:state', JSON.stringify(state))
    },
    {
      ...v3Progress,
      version: 4,
      lab: {
        draft: record,
        runs: [],
        passedPracticals: [],
        tutorials: [],
        reviewRecords: [],
        view,
        quality: 'low',
      },
    },
  )
  await page.goto('lab3d')
}
async function twin(page: Page) {
  return replayRun(
    await page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft),
  )
}
async function station(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: new RegExp(name) })
    .click()
}
async function sample(page: Page, thickness = 3) {
  await station(page, 'Receipt & LIS')
  await page.getByRole('button', { name: 'Place discrepancy on hold', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Resolution record' })
    .fill('Synthetic submitting team confirmed source identifiers and site.')
  await page
    .getByRole('checkbox', { name: 'Submitting source supplied and authorized the correction' })
    .check()
  await page.getByRole('button', { name: 'Record source-authorized correction' }).click()
  await page.getByRole('button', { name: 'Accept accession', exact: true }).click()
  await station(page, 'Grossing')
  await page.getByRole('button', { name: 'Record dimensions', exact: true }).click()
  await page.getByRole('spinbutton', { name: /Maximum piece thickness/ }).fill(String(thickness))
  await page.getByRole('combobox', { name: 'Containment', exact: true }).selectOption('biopsy')
  await page
    .getByRole('combobox', { name: 'Ink convention (scenario-specific)' })
    .selectOption('blue deep / black lateral')
  await page
    .getByRole('textbox', { name: 'Cassette key and orientation record' })
    .fill('A1: three pieces, epidermis perpendicular; blue deep and black lateral.')
  await page.getByRole('checkbox', { name: 'Local fume extraction checked' }).check()
  await page.getByRole('button', { name: 'Sample into cassette', exact: true }).click()
}
async function appendExchange(page: Page, reagent: string, minutes: number, exhaustion = 0) {
  await page.getByRole('combobox', { name: 'Reagent', exact: true }).selectOption(reagent)
  await page.getByRole('spinbutton', { name: /Exposure/ }).fill(String(minutes))
  await page
    .getByRole('spinbutton', { name: /^Temperature/ })
    .fill(
      String(reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature']),
    )
  await page.getByRole('spinbutton', { name: /Reagent exhaustion/ }).fill(String(exhaustion))
  await page.getByRole('checkbox', { name: 'Vacuum enabled in this scenario' }).check()
  await page.getByRole('button', { name: 'Append program step' }).click()
}

test('keyboard cutting-plane preview changes the predicted face without consuming tissue', async ({
  page,
}) => {
  await begin(page, '2d', true)
  await station(page, 'Embedding')
  const before = await twin(page)
  const slider = page.getByRole('slider', { name: /Additional facing depth/ })
  await slider.focus()
  await page.keyboard.press('End')
  await expect(page.getByRole('img', { name: /^Predicted face at/ })).toHaveAccessibleName(
    new RegExp(
      `Predicted face at ${before.block.trimmed + before.block.remaining} micrometers depth`,
    ),
  )
  expect(await twin(page)).toEqual(before)
  await page.keyboard.press('Home')
  await expect(slider).toHaveValue('0')
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(audit.violations).toEqual([])
})

test('receipt → measured, inked samples → fixation → editable processor program → oriented block', async ({
  page,
}) => {
  await begin(page)
  await sample(page)
  await station(page, 'Fixation')
  await page.getByRole('button', { name: 'Run fixation exposure' }).click()
  await station(page, 'Processing')
  await appendExchange(page, 'clearant', P['processing.minutes'])
  await appendExchange(page, 'alcohol', P['processing.minutes'])
  await page.getByRole('button', { name: 'Move step 2 earlier' }).click()
  await appendExchange(page, 'paraffin', P['processing.minutes'])
  await appendExchange(page, 'alcohol', 1)
  await page.getByRole('button', { name: 'Remove step 4' }).click()
  await page.getByRole('button', { name: 'Run programmed exchange' }).click()
  await station(page, 'Embedding')
  const expectedPieces = (await twin(page)).gross.fragments
  for (let index = 0; index < expectedPieces; index++) {
    await page.getByRole('textbox', { name: 'Piece identifier' }).fill(`A1-${index + 1}`)
    await page
      .getByRole('spinbutton', { name: /X position/ })
      .fill(String(index * P['reference.piece-spacing']))
    await page.getByRole('button', { name: 'Place / update piece' }).click()
  }
  await page.getByRole('button', { name: 'Cool block', exact: true }).click()
  const result = await twin(page)
  expect(result.identity).toMatchObject({ accepted: true, resolved: true, broken: false })
  expect(result.gross).toMatchObject({
    sampled: true,
    ink: 'blue deep / black lateral',
    thickness: 3,
    cassette: 'biopsy',
  })
  expect(result.processing.history.map((step) => step.reagent)).toEqual([
    'alcohol',
    'clearant',
    'paraffin',
  ])
  expect(result.regions.at(-1)!.fixed).toBeGreaterThan(0.8)
  expect(result.regions.at(-1)!.wax).toBeGreaterThan(0)
  expect(result.embedding).toMatchObject({ cooled: true, representation: 1 })
  expect(result.embedding.pieces).toHaveLength(expectedPieces)
  expect(result.block.face.some((value) => value > 0)).toBe(true)
  expect(result.issues.some((issue) => issue.id === 'gross-extraction')).toBe(false)
  await page.reload()
  expect((await twin(page)).events).toEqual(result.events)
})

test('thick, briefly fixed tissue and exhausted out-of-order processing retain the modeled deficit', async ({
  page,
}) => {
  await begin(page)
  await sample(page, 10)
  await station(page, 'Fixation')
  await page.getByRole('spinbutton', { name: /Exposure duration/ }).fill('1')
  await page.getByRole('button', { name: 'Run fixation exposure' }).click()
  await station(page, 'Processing')
  await appendExchange(page, 'paraffin', 5)
  await appendExchange(page, 'alcohol', 5, 0.9)
  await appendExchange(page, 'clearant', 5)
  await page.getByRole('button', { name: 'Run programmed exchange' }).click()
  const result = await twin(page)
  const reference = referenceTwin(createScenario(seed, 'skin-ellipse'))
  expect(result.regions.at(-1)!.fixed).toBeLessThan(reference.regions.at(-1)!.fixed)
  expect(result.regions.at(-1)!.water).toBeGreaterThan(reference.regions.at(-1)!.water)
  expect(result.regions.at(-1)!.wax).toBe(0)
  expect(result.processing.history.map((step) => step.reagent)).toEqual([
    'paraffin',
    'alcohol',
    'clearant',
  ])
  await page.reload()
  expect((await twin(page)).regions).toEqual(result.regions)
})

async function dragWorld(page: Page, point: [number, number, number], dx: number, dy: number) {
  const canvas = page.locator('.lab-scene canvas[data-render-state=ready]')
  await expect(canvas).toBeVisible()
  await canvas.scrollIntoViewIfNeeded()
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing scene bounds')
  const camera = new PerspectiveCamera(42, bounds.width / bounds.height, 0.1, 70)
  camera.position.set(4.3, 3, 5.8)
  camera.lookAt(0, 0.65, 0)
  camera.updateMatrixWorld()
  const projected = new Vector3(...point).project(camera)
  const x = bounds.x + (projected.x * 0.5 + 0.5) * bounds.width
  const y = bounds.y + (-projected.y * 0.5 + 0.5) * bounds.height
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps: 8 })
  await page.mouse.up()
}

test('preparation scenes expose real specimen state and six-axis manipulation', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await begin(page, '3d', true)
  await station(page, 'Receipt & LIS')
  const beforeView = (await twin(page)).events
  await page.getByRole('button', { name: 'Rotate specimen bottle', exact: true }).click()
  expect((await twin(page)).events).toEqual(beforeView)
  for (const [name, file] of [
    ['Grossing', 'grossing'],
    ['Fixation', 'fixation'],
    ['Processing', 'processor'],
    ['Embedding', 'embedding'],
  ] as const) {
    await station(page, name)
    await expect(page.locator('.lab-scene canvas[data-render-state=ready]')).toBeVisible()
    await expect(page.locator('.lab-scene canvas')).toHaveAttribute(
      'data-station-model',
      name.toLowerCase(),
    )
    await page.locator('.lab-scene canvas').scrollIntoViewIfNeeded()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    await expect(page.locator('.scene-projected-label').first()).toBeVisible()
    if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium')
      await page
        .locator('.lab-work-surface')
        .screenshot({ path: `docs/screens/phase3-${file}-desktop.png` })
  }
  const before = await twin(page)
  await page.getByRole('button', { name: 'Rotate X', exact: true }).click()
  const piece = before.embedding.pieces[0]
  await dragWorld(page, [piece.x / 15, 0.32 + piece.z / 15, piece.y / 15], 32, 0)
  await expect
    .poll(async () => (await twin(page)).events.length)
    .toBeGreaterThan(before.events.length)
  let result = await twin(page)
  const moved = result.embedding.pieces.find(
    (item) => item.id === result.events.at(-1)!.params.piece,
  )!
  await expect(page.getByRole('combobox', { name: 'Selected tissue piece' })).toHaveValue(moved.id)
  expect(moved.rx).not.toBe(before.embedding.pieces.find((item) => item.id === moved.id)!.rx)
  await page.getByRole('button', { name: 'Move Z', exact: true }).click()
  await dragWorld(page, [moved.x / 15, 0.32 + moved.z / 15, moved.y / 15], 0, -35)
  result = await twin(page)
  expect(result.events.at(-1)!.params.z).toBeGreaterThan(0)
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(audit.violations).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page.locator('.lab-scene canvas').scrollIntoViewIfNeeded()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    await page.screenshot({ path: 'docs/screens/phase3-embedding-phone.png' })
  }
  expect(errors).toEqual([])
})

test('guided 3D cut keeps the recorded ink, cassette key and extraction decision', async ({
  page,
}) => {
  await begin(page, '3d', true)
  await station(page, 'Grossing')
  await expect(
    page.getByText('Drag the blade guide along the ruler', { exact: true }),
  ).toBeVisible()
  const before = await twin(page)
  const maximum = Math.max(0.1, Math.min(20, before.scenario.dimensions[0]))
  const x = -1.15 + Math.min(1, before.gross.thickness / maximum) * 2
  await dragWorld(page, [x, 0.61, -0.34], 55, 0)
  await expect
    .poll(async () => (await twin(page)).events.length)
    .toBeGreaterThan(before.events.length)
  const result = await twin(page)
  expect(result.gross.thickness).not.toBe(before.gross.thickness)
  expect(result.gross).toMatchObject({
    ink: before.gross.ink,
    key: before.gross.key,
    cassette: before.gross.cassette,
  })
  expect(result.events.at(-1)!.params.extraction).toBe(true)
  expect(result.issues.filter((issue) => issue.id === 'gross-extraction')).toEqual([])
})
