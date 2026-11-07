import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { v3Progress } from './fixtures'

async function start(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('histoquest:state'))
        localStorage.setItem('histoquest:state', JSON.stringify(state))
    },
    {
      ...v3Progress,
      settings: { ...v3Progress.settings, theme },
      version: 4,
      lab: {
        view: '2d',
        quality: 'low',
        runs: [],
        tutorials: [],
        passedPracticals: [],
        reviewRecords: [],
      },
    },
  )
}
async function scan(page: Page) {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(
    report.violations.map((issue) => ({
      id: issue.id,
      nodes: issue.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  ).toEqual([])
}

test('home learning milestones remain visible and accessible on desktop and phone', async ({
  page,
}, testInfo) => {
  await start(page, 'light')
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Practice through the laboratory' })).toBeVisible()
  await expect(page.locator('.career-journey')).toBeVisible()
  await scan(page)
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium')
    await page.screenshot({ path: 'docs/screens/phase8-career-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.career-journey')).toBeHidden()
  const firstLevel = page
    .getByRole('navigation', { name: 'Learning levels' })
    .getByRole('button')
    .first()
  await expect(firstLevel).toBeVisible()
  expect((await firstLevel.boundingBox())!.y).toBeLessThan(760)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await scan(page)
})
for (const route of ['career', 'shift', 'review', 'today'])
  test(`phone /${route} preserves layout, navigation and accessible controls`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await start(page, 'light')
    await page.goto(route)
    await expect(page.locator('main').getByRole('heading').first()).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
    await scan(page)
    if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium')
      await page.screenshot({ path: `docs/screens/phase8-${route}-phone.png` })
  })

test('dark review queue preserves contrast and phone layout', async ({ page }, testInfo) => {
  await start(page, 'dark')
  await page.goto('review')
  await expect(page.locator('main').getByRole('heading').first()).toBeVisible()
  await scan(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await scan(page)
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium')
    await page.screenshot({ path: 'docs/screens/phase8-review-dark-phone.png' })
})

test('dark IHC academy theory and checkerboard retain accessible mobile controls', async ({
  page,
}, testInfo) => {
  await start(page, 'dark')
  await page.goto('lab3d')
  await page.getByRole('button', { name: 'Practice on a prepared block' }).click()
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: /^12 IHC/ })
    .click()
  await expect(
    page.getByRole('heading', { name: 'IHC mastery academy', exact: true }),
  ).toBeVisible()
  await scan(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page
    .getByRole('heading', { name: 'IHC mastery academy', exact: true })
    .scrollIntoViewIfNeeded()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await scan(page)
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium')
    await page.screenshot({ path: 'docs/screens/phase8-ihc-dark-phone.png' })
  await page
    .getByRole('navigation', { name: 'IHC exercises' })
    .getByRole('button', { name: /Checkerboard/ })
    .click()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await scan(page)
})
