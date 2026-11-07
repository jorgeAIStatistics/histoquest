import { test, expect } from '@playwright/test'
import { v3Progress } from './fixtures'

const routes = [
  '',
  'today',
  'learn',
  'learn/L-01',
  'lab',
  'practice',
  'practice/run',
  'practice/review',
  'practice/session/missing-session',
  'progress',
  'atlas',
  'atlas/fix-nbf',
  'route2',
  'settings',
  'workbench',
  'slides',
  'notebook',
  'pathway/fixation',
  ...[
    'specimen-journey',
    'fixation-detective',
    'processing-bench',
    'embedding-studio',
    'microtomy-challenge',
    'stain-studio',
    'ihc-room',
    'lab-math',
  ].map((id) => `lab/${id}`),
]

for (const route of routes) {
  test(`existing route /${route} renders without runtime errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.addInitScript(
      (state) => localStorage.setItem('histoquest:state', JSON.stringify(state)),
      v3Progress,
    )
    await page.goto(route || './')
    await expect(page.locator('main').getByRole('heading').first()).toBeVisible()
    await expect(page.getByText('Loading …', { exact: true })).toHaveCount(0)
    await expect(page.getByText('This screen hit an error', { exact: true })).toHaveCount(0)
    await expect
      .poll(async () => (await page.locator('main').innerText()).length)
      .toBeGreaterThan(60)
    expect(errors).toEqual([])
  })
}

test('phone overview has no page overflow and preserves primary navigation', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'From specimen to understanding.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(
    page.getByRole('navigation', { name: 'Primary' }).last().getByRole('link'),
  ).toHaveCount(5)
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page.screenshot({ path: 'docs/screens/phase0-home-phone.png', fullPage: true })
  }
})

test('the 3D engine is absent from the non-3D entry', async ({ page }) => {
  const scripts: string[] = []
  page.on('response', (response) => {
    if (/\.js(?:\?|$)/.test(response.url())) scripts.push(response.url())
  })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'From specimen to understanding.' })).toBeVisible()
  expect(scripts.filter((url) => /three|fiber|drei|render3d|lab3d/i.test(url))).toEqual([])
})
