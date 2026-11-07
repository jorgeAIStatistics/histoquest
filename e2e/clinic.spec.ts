import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { v3Progress } from './fixtures'
import { gradeClinic } from '../src/sim/core/clinic'
import { replayRun } from '../src/sim/core/replay'
import { createShiftCase } from '../src/sim/core/shifts'
import { PROCESS as P } from '../src/sim/params/process'
import type { LabRecord } from '../src/store/labSchema'

const note =
  'The observed artifact is compared with the recorded preparation. I predict the selected setting will change its extent while the remaining conditions are held constant.'
async function open(page: Page, id: string) {
  const active = { ...createShiftCase('PRESERVED-BENCH', 'routine'), id: 'unrelated-active-shift' }
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('histoquest:state'))
        localStorage.setItem('histoquest:state', JSON.stringify(state))
    },
    { ...v3Progress, version: 4, lab: { draft: active, runs: [], view: '2d', quality: 'low' } },
  )
  await page.goto('clinic')
  await page.getByRole('combobox', { name: 'Observed problem' }).selectOption(id)
  await page.getByRole('button', { name: 'Open the flawed slide' }).click()
  await expect(page.locator('.microscope-panel[data-render-state=ready]')).toBeVisible()
  return active
}
async function current(page: Page): Promise<LabRecord> {
  const id = new URL(page.url()).searchParams.get('run')
  return page.evaluate(
    (id) =>
      JSON.parse(localStorage.getItem('histoquest:state')!).lab.runs.find(
        (run: LabRecord) => run.id === id,
      ),
    id,
  )
}
async function trial(page: Page, variable: string, value: number) {
  await expect(
    page.getByRole('button', { name: 'Cut and run the controlled repeat' }),
  ).toBeDisabled()
  await page
    .getByRole('textbox', { name: 'Observation, suspected cause and prediction' })
    .fill(note)
  await page.getByRole('combobox', { name: 'One setting to test' }).selectOption(variable)
  await page.getByRole('spinbutton', { name: /^Proposed value/ }).fill(String(value))
  await page.getByRole('button', { name: 'Record hypothesis and change' }).click()
  await page.getByRole('button', { name: 'Cut and run the controlled repeat' }).click()
  await expect(page.locator('.microscope-panel[data-render-state=ready]')).toHaveCount(2)
}
async function verify(page: Page, outcome: string, disposition: string) {
  await page
    .getByRole('textbox', {
      name: 'What changed, what persisted, and what would you investigate next?',
    })
    .fill(
      'The comparison was reviewed alongside the complete preparation history. The observation is limited to this model and the remaining technical problems require qualified review.',
    )
  await page.getByRole('combobox', { name: 'Your observed outcome' }).selectOption(outcome)
  await page.getByRole('combobox', { name: 'Technical disposition' }).selectOption(disposition)
  await page.getByRole('button', { name: 'Save investigation and verification' }).click()
  await expect(
    page.getByText('Verification and complete event history saved.', { exact: false }),
  ).toBeVisible()
}

test('clinic records a one-variable correction, real recut, comparison and complete verification without replacing a shift draft', async ({
  page,
}, testInfo) => {
  const active = await open(page, 'compressed')
  const before = await current(page)
  await trial(page, 'blockTemperature', P['microtomy.block-temperature'])
  const repeated = await current(page)
  expect(repeated.events.slice(0, before.events.length)).toEqual(before.events)
  expect(replayRun(repeated).block.sections).toHaveLength(2)
  expect(replayRun(repeated).archivedSlides).toHaveLength(1)
  await verify(page, 'improved', 'review')
  const completed = await current(page)
  expect(gradeClinic(completed).complete).toBe(true)
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft),
  ).toEqual(active)
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(audit.violations).toEqual([])
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page.getByRole('radio', { name: '10×', exact: true }).check()
    await expect(page.locator('.microscope-panel[data-render-state=ready]')).toHaveCount(2)
    await page
      .locator('.microscope')
      .evaluate((element) =>
        window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 20),
      )
    await page.screenshot({ path: 'docs/screens/clinic-desktop.png' })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  const mobileAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(mobileAudit.violations).toEqual([])
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page
      .locator('.microscope-panel')
      .first()
      .evaluate((element) =>
        window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 80),
      )
    await page.screenshot({ path: 'docs/screens/clinic-phone.png' })
  }
  await page.reload()
  expect((await current(page)).events).toEqual(completed.events)
  await expect(
    page.getByText('Investigation method and outcome checks recorded.', { exact: true }),
  ).toBeVisible()
})

test('an upstream preservation deficit survives a downstream recut and requires an acknowledged hold', async ({
  page,
}) => {
  await open(page, 'center')
  const before = replayRun(await current(page))
  await trial(page, 'thickness', 3)
  const after = replayRun(await current(page))
  expect(after.regions).toEqual(before.regions)
  expect(after.ihc.preservation).toBe(before.ihc.preservation)
  await verify(page, 'persisted', 'review')
  expect(gradeClinic(await current(page)).complete).toBe(false)
  await expect(
    page.getByText('Review the outcome or disposition against the remaining defect.', {
      exact: true,
    }),
  ).toBeVisible()
  await verify(page, 'persisted', 'hold')
  expect(gradeClinic(await current(page)).complete).toBe(true)
})
