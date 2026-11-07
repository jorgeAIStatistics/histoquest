import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { idealControls } from '../src/features/workbench/twin'
import { advanceRun } from '../src/features/workbench/model'
import type { Controls, WorkbenchRun } from '../src/features/workbench/schema'
import { v3Progress } from './fixtures'

function preparedRun(
  caseId: WorkbenchRun['caseId'],
  overrides: Partial<Controls> = {},
): WorkbenchRun {
  let run: WorkbenchRun = {
    caseId,
    seed: `MICROSCOPE-GOLDEN-${caseId}`,
    station: 0,
    controls: { ...idealControls(caseId), ...overrides },
    findings: [],
    startedAt: '2026-11-01T12:00:00.000Z',
    recorded: false,
  }
  for (let i = 0; i < 10; i++) run = advanceRun(run)
  return run
}

async function openMicroscope(
  page: Page,
  caseId: WorkbenchRun['caseId'],
  overrides: Partial<Controls> = {},
) {
  await page.addInitScript(
    (state) => localStorage.setItem('histoquest:state', JSON.stringify(state)),
    {
      ...v3Progress,
      workbench: preparedRun(caseId, overrides),
    },
  )
  await page.goto('workbench')
  await expect(
    page.getByRole('heading', { name: 'Your specimen under the microscope' }),
  ).toBeVisible()
  await page.getByText('Read the slide and model limits', { exact: true }).click()
  await page.getByRole('checkbox', { name: 'Use compatible 2D rendering' }).check()
  await expect(page.locator('.microscope-panel')).toHaveAttribute('data-renderer', '2d')
  await expect(page.locator('.microscope-panel')).toHaveAttribute('data-render-state', 'ready')
  await page.getByText('Read the slide and model limits', { exact: true }).click()
}

const goldens: { name: string; caseId: WorkbenchRun['caseId']; controls?: Partial<Controls> }[] = [
  { name: 'skin-reference', caseId: 'skin' },
  { name: 'gut-reference', caseId: 'colon' },
  { name: 'bone-reference', caseId: 'bone' },
  { name: 'skin-short-fixation', caseId: 'skin', controls: { fixation: 'rush', thickness: 6 } },
  { name: 'skin-thick-section', caseId: 'skin', controls: { section: 10 } },
  { name: 'skin-nicked-blade', caseId: 'skin', controls: { blade: 'nicked' } },
  { name: 'skin-no-dewax', caseId: 'skin', controls: { dewax: false } },
]
for (const golden of goldens) {
  test(`causal slide golden: ${golden.name}`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'Golden pixels are captured in Chromium; browser behavior runs in every project.',
    )
    await openMicroscope(page, golden.caseId, golden.controls)
    const data = await page
      .locator('.microscope-panel canvas:not([hidden])')
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png'))
    expect(Buffer.from(data.split(',')[1], 'base64')).toMatchSnapshot(`${golden.name}.png`, {
      maxDiffPixelRatio: 0.005,
      threshold: 0.05,
    })
  })
}

test('microscope comparison, objective, measurements, annotation and accessibility', async ({
  page,
}, testInfo) => {
  await openMicroscope(page, 'skin')
  const microscope = page.locator('.microscope')
  await page.getByRole('checkbox', { name: 'Compare reference' }).check()
  await expect(page.locator('.microscope-panel')).toHaveCount(2)
  await page.getByRole('radio', { name: '10×', exact: true }).check()
  await expect(page.locator('.microscope-panel[data-render-state=ready]')).toHaveCount(2)
  await expect(
    page.getByRole('img', { name: /Simulated slide: skin. Your section. 10 times/ }),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'Measure', exact: true }).check()
  await page.getByRole('button', { name: 'Place first point at center' }).click()
  await page.getByRole('button', { name: 'Pan right', exact: true }).click()
  await page.getByRole('button', { name: 'Place second point at center' }).click()
  await expect(microscope.getByText(/Measurement: [1-9]/)).toBeVisible()
  await page.getByRole('radio', { name: 'Annotate', exact: true }).check()
  await page.getByRole('textbox', { name: 'Annotation label' }).fill('Synthetic epithelial edge')
  await page.getByRole('button', { name: 'Place annotation at center' }).click()
  await expect(page.locator('.microscope-mark-list')).toContainText('Synthetic epithelial edge')
  const results = await new AxeBuilder({ page })
    .include('.bench-microscopy')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await microscope.screenshot({ path: 'docs/screens/phase1-microscope-desktop.png' })
    await page.getByRole('radio', { name: '20×', exact: true }).check()
    await expect(page.locator('.microscope-panel[data-render-state=ready]')).toHaveCount(2)
    await page
      .locator('.microscope-panel')
      .first()
      .screenshot({ path: 'docs/screens/phase1-microscope-20x.png' })
    await page.getByRole('radio', { name: '10×', exact: true }).check()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('.microscope-panel[data-render-state=ready]')).toHaveCount(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await microscope.evaluate((element) =>
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 80),
    )
    await page.screenshot({ path: 'docs/screens/phase1-microscope-phone.png' })
  }
})
