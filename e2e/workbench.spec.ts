import { test, expect, type Locator, type Page } from '@playwright/test'

async function keyboardActivate(page: Page, target: Locator, key: 'Enter' | 'Space' = 'Enter') {
  for (let presses = 0; presses < 100; presses++) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      await page.keyboard.press(key)
      return
    }
    await page.keyboard.press('Tab')
  }
  throw new Error('Control could not be reached with the keyboard.')
}

async function keyboardChooseRadio(page: Page, group: Locator, target: Locator) {
  for (let presses = 0; presses < 100; presses++) {
    if (await group.evaluate((element) => element.contains(document.activeElement))) break
    await page.keyboard.press('Tab')
  }
  const count = await group.getByRole('radio').count()
  for (let arrows = 0; arrows <= count; arrows++) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      await page.keyboard.press('Space')
      return
    }
    await page.keyboard.press('ArrowDown')
  }
  throw new Error('Radio choice could not be reached with keyboard arrow navigation.')
}

test('accessioning requires an explicit decision, preserves its order and works by keyboard', async ({
  page,
}, testInfo) => {
  await page.goto('workbench')
  await keyboardActivate(page, page.getByRole('button', { name: 'Start skin excision' }))
  const commit = page.getByRole('button', { name: 'Commit and move to next station' })
  await expect(page.getByRole('heading', { name: 'Accessioning', exact: true })).toBeVisible()
  await expect(commit).toBeDisabled()
  await expect(page.locator('input[type=radio]:checked')).toHaveCount(0)
  const choices = page
    .locator('fieldset')
    .filter({ has: page.getByText('Resolve the discrepancy', { exact: true }) })
  const readOrder = () =>
    choices
      .getByRole('radio')
      .evaluateAll((items) => items.map((item) => item.getAttribute('value')))
  const initialOrder = await readOrder()
  await page.reload()
  await expect.poll(readOrder).toEqual(initialOrder)
  await expect(commit).toBeDisabled()
  await keyboardChooseRadio(
    page,
    choices,
    page.getByRole('radio', { name: 'Hold and resolve with the submitting team', exact: true }),
  )
  await expect(commit).toBeEnabled()
  if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
    await page.screenshot({ path: 'docs/screens/phase0-accessioning-desktop.png', fullPage: true })
  }
  await keyboardActivate(page, commit)
  await expect(page.getByRole('heading', { name: 'Grossing', exact: true })).toBeFocused()
  await expect(
    page.getByText('Previous station: Decision supported', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Maximum piece thickness' })).toHaveValue('')
})
