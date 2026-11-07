import { test, expect, type Page } from '@playwright/test'
import { v3Progress } from './fixtures'
import { RUN_STEPS } from '../src/sim/models/ihcExperiments'
import { replayRun } from '../src/sim/core/replay'
import type { LabRecord } from '../src/store/labSchema'

async function start(page: Page, station = 'IHC') {
  await page.addInitScript(
    (state) => localStorage.setItem('histoquest:state', JSON.stringify(state)),
    {
      ...v3Progress,
      version: 4,
      lab: {
        view: '2d',
        quality: 'low',
        runs: [],
        passedPracticals: [],
        tutorials: [],
        reviewRecords: [],
      },
    },
  )
  await page.goto('lab3d', { waitUntil: 'domcontentloaded' })
  await page.getByRole('textbox', { name: 'Replay seed' }).fill('IHC-BROWSER-INTEGRITY')
  await page.getByRole('button', { name: 'Practice on a prepared block' }).click()
  await page.getByRole('button', { name: 'Lock and guard', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: new RegExp(station) })
    .click()
}
async function record(page: Page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft as LabRecord,
  )
}
async function lastEvidence(page: Page, id: string) {
  return (await record(page)).events
    .filter((e) => e.intent === 'practice.evidence' && e.params.checkId === id)
    .at(-1)?.params
}

test('manual IHC records real ordered actions, recovers from missing work, and keeps preview separate from specimen', async ({
  page,
}) => {
  await start(page)
  const academy = page.getByRole('region', { name: 'IHC mastery academy' })
  await academy.getByRole('button', { name: 'Manual run', exact: true }).click()
  const before = replayRun(await record(page))
  await academy.getByRole('button', { name: 'Evaluate completed manual run' }).click()
  expect((await lastEvidence(page, 'ihc-manual'))?.passed).toBe(false)
  await academy.getByRole('button', { name: 'Start a fresh practice run' }).click()
  await academy
    .getByRole('checkbox', {
      name: 'Block identity, requested marker and tissue selection reconciled',
    })
    .check()
  for (const step of RUN_STEPS) {
    await academy.getByRole('combobox', { name: 'Next manual action' }).selectOption(step)
    await academy.getByRole('button', { name: 'Perform action', exact: true }).click()
  }
  await academy.getByRole('button', { name: 'Evaluate completed manual run' }).click()
  await expect.poll(async () => (await lastEvidence(page, 'ihc-manual'))?.passed).toBe(true)
  const after = replayRun(await record(page))
  expect(after.block.sections.length).toBe(before.block.sections.length)
  expect(after.block.remaining).toBe(before.block.remaining)
  expect(after.events.filter((e) => e.params.checkId === 'ihc-manual-action')).toHaveLength(
    RUN_STEPS.length,
  )
  await expect(academy.locator('.microscope-panel')).toHaveAttribute('data-render-state', 'ready')
})

test('FISH uses independent fluorescence channels and cannot pass without specimen integrity', async ({
  page,
}, info) => {
  await start(page)
  const academy = page.getByRole('region', { name: 'IHC mastery academy' })
  await academy.getByRole('button', { name: 'ISH workflows', exact: true }).click()
  await academy.getByRole('combobox', { name: 'Detection readout' }).selectOption('FISH')
  for (const step of ['prepare', 'pretreat', 'hybridize', 'stringency', 'detect', 'controls']) {
    await academy.getByRole('combobox', { name: 'Next workflow action' }).selectOption(step)
    await academy.getByRole('button', { name: 'Perform action', exact: true }).click()
  }
  await academy.getByRole('checkbox', { name: 'Known target-positive control' }).check()
  await academy.getByRole('checkbox', { name: 'Negative probe / background control' }).check()
  await academy.getByRole('button', { name: 'Evaluate ISH workflow' }).click()
  expect((await lastEvidence(page, 'ihc-ish'))?.passed).toBe(false)
  await academy.getByRole('checkbox', { name: 'Specimen RNA integrity control' }).check()
  await academy.getByRole('button', { name: 'Evaluate ISH workflow' }).click()
  await expect.poll(async () => (await lastEvidence(page, 'ihc-ish'))?.passed).toBe(true)
  await academy.getByText('Read the slide and model limits', { exact: true }).click()
  await academy.getByRole('checkbox', { name: 'Use compatible 2D rendering' }).check()
  const panel = academy.locator('.microscope-panel')
  await expect(panel).toHaveAttribute('data-render-state', 'ready')
  const canvas = panel.locator('canvas:not([hidden])')
  const composite = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL())
  await academy.getByRole('combobox', { name: 'Fluorescence channel' }).selectOption('nuclear')
  await expect(panel).toHaveAttribute('data-render-state', 'ready')
  const nuclear = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL())
  expect(nuclear).not.toBe(composite)
  await expect(academy.getByRole('slider', { name: /Crossed polarization/ })).toBeDisabled()
  if (process.env.CAPTURE_SCREENS && info.project.name === 'chromium') {
    await academy.getByRole('combobox', { name: 'Fluorescence channel' }).selectOption('composite')
    await expect(panel).toHaveAttribute('data-render-state', 'ready')
    await panel.screenshot({ path: 'docs/screens/phase5-fish.png' })
  }
})

test('PAS-D comparison exposes failed digestion despite preserved PAS reaction', async ({
  page,
}) => {
  await start(page, 'Special')
  await page.getByRole('combobox', { name: 'Protocol graph' }).selectOption('pas-d')
  const bench = page.getByRole('region', { name: 'Special stain comparison bench' })
  await bench
    .getByRole('combobox', { name: 'Comparison condition' })
    .selectOption('inactive-diastase')
  await bench.getByRole('button', { name: 'Run matched specimen and controls' }).click()
  await expect(bench.getByRole('status').first()).toContainText('control criteria failed')
  await bench
    .getByRole('combobox', { name: 'Interpret this technical comparison' })
    .selectOption('reaction-supported')
  await bench.getByRole('button', { name: 'Record control interpretation' }).click()
  expect((await lastEvidence(page, 'special-comparison'))?.passed).toBe(false)
  await bench
    .getByRole('combobox', { name: 'Interpret this technical comparison' })
    .selectOption('digestion-failed')
  await bench.getByRole('button', { name: 'Record control interpretation' }).click()
  expect((await lastEvidence(page, 'special-comparison'))?.passed).toBe(true)
  await bench.getByRole('combobox', { name: 'Comparison condition' }).selectOption('matched')
  await bench.getByRole('button', { name: 'Run matched specimen and controls' }).click()
  await expect(bench.getByRole('status').first()).toContainText('controls support')
  await expect(bench.locator('.microscope-panel')).toHaveCount(2)
  await expect(bench.locator('.microscope-panel').first()).toHaveAttribute(
    'data-render-state',
    'ready',
  )
})

test('applying a grid condition prepares a distinct specimen section and preserves the earlier slide', async ({
  page,
}) => {
  await start(page)
  const academy = page.getByRole('region', { name: 'IHC mastery academy' })
  await academy.getByRole('button', { name: 'Retrieval optimization', exact: true }).click()
  await academy.getByRole('button', { name: 'Run comparison grid' }).click()
  await academy
    .locator('.ihc-grid-cell')
    .filter({ hasText: 'within exercise rubric' })
    .first()
    .click()
  const before = replayRun(await record(page))
  await academy
    .getByRole('button', { name: 'Prepare an adjacent section and apply condition' })
    .click()
  const after = replayRun(await record(page))
  expect(after.events.at(-1)?.intent).toBe('ihc.experiment.apply')
  expect(after.block.sections).toHaveLength(before.block.sections.length + 1)
  expect(after.block.remaining).toBeLessThan(before.block.remaining)
  expect(after.ihc.dab).toBeGreaterThan(0)
  expect(after.ihc.valid).toBe(true)
  expect(after.block.sections.at(-1)).toMatchObject({
    pickedUp: true,
    charged: true,
    labelCorrect: true,
  })
  expect(after.identity).toEqual(before.identity)
  expect(after.time).toBeGreaterThan(before.time)
})
