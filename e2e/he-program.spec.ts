import { expect, test } from '@playwright/test'
import { referenceTwin } from '../src/sim/core/reference'
import { CURATED_SCENARIOS } from '../src/sim/core/scenarios'
import { replayRun } from '../src/sim/core/replay'
import { v3Progress } from './fixtures'
import type { LabRecord } from '../src/store/labSchema'

test('linear stainer preserves reagent activity, renders its control and requires a QC observation', async ({
  page,
}) => {
  const reference = referenceTwin(CURATED_SCENARIOS[0])
  const stop = reference.events.findIndex((e) => e.intent === 'stain.step')
  const record: LabRecord = {
    id: 'he-program-test',
    version: 1,
    seed: reference.scenario.seed,
    archetype: reference.scenario.archetype,
    difficulty: 1,
    mode: 'free',
    title: 'H&E program exercise',
    startedAt: '2026-11-06T12:00:00Z',
    events: reference.events.slice(0, stop),
  }
  await page.addInitScript(
    (state) => localStorage.setItem('histoquest:state', JSON.stringify(state)),
    {
      ...v3Progress,
      version: 4,
      lab: {
        draft: record,
        runs: [],
        view: '2d',
        quality: 'low',
        passedPracticals: [],
        tutorials: [],
        reviewRecords: [],
      },
    },
  )
  await page.goto('lab3d')
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: /H&E/ })
    .click()
  await page.getByRole('button', { name: 'Load editable teaching sequence' }).click()
  await page.getByLabel('Station 3 reagent activity (0–1)', { exact: true }).fill('0')
  await page.getByRole('button', { name: 'Run linear stainer program', exact: true }).click()
  const stored = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft,
  )) as LabRecord
  const t = replayRun(stored)
  expect(t.staining.hematoxylin).toBe(0)
  expect(t.staining.eosin).toBeGreaterThan(0)
  expect(t.staining.history.find((h) => h.reagent === 'hematoxylin')?.freshness).toBe(0)
  expect(stored.events.filter((e) => e.params.mode === 'linear-stainer')).toHaveLength(8)
  await page.getByRole('button', { name: 'Inspect H&E control comparison' }).click()
  await expect(
    page.locator('.he-control-comparison').getByText('Reference section', { exact: true }),
  ).toBeVisible()
  await page
    .getByLabel('Observed differences, reagent lot, disposition and corrective action', {
      exact: true,
    })
    .fill(
      'Hematoxylin is absent in both case and control with TRAIN-HE-A. Hold and investigate exhausted hematoxylin before repeating.',
    )
  await page.getByRole('button', { name: 'Save H&E control review' }).click()
  await expect(
    page.getByText(
      'Record your observed comparison and confirm the control inspection before saving.',
    ),
  ).toBeVisible()
  await page
    .getByLabel('Compared nuclear/cytoplasmic detail, background and control appearance')
    .check()
  await page.getByRole('button', { name: 'Save H&E control review' }).click()
  await expect(page.getByText('H&E control comparison recorded.')).toBeVisible()
  const after = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft,
  )) as LabRecord
  expect(replayRun(after).documentation.some((d) => d.text.includes('H&E QC / lots:'))).toBe(true)
})
