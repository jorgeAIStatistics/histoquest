import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { v3Progress } from './fixtures'

const routes = [
  '',
  'today',
  'career',
  'shift',
  'review',
  'learn',
  'lab',
  'practice',
  'progress',
  'atlas',
  'route2',
  'settings',
  'workbench',
  'slides',
  'notebook',
  'pathway/fixation',
]
for (const route of routes) {
  test(`WCAG 2.2 AA automated scan /${route}`, async ({ page }) => {
    await page.addInitScript(
      (state) => localStorage.setItem('histoquest:state', JSON.stringify(state)),
      v3Progress,
    )
    await page.goto(route || './')
    await expect(page.locator('main').getByRole('heading').first()).toBeVisible()
    await expect(page.getByText('Loading …', { exact: true })).toHaveCount(0)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([])
  })
}
