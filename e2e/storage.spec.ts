import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { v3Progress } from './fixtures'

test('v3 progress migrates and exports/imports without losing existing records', async ({
  page,
}) => {
  await page.addInitScript((state) => {
    if (!localStorage.getItem('histoquest:state'))
      localStorage.setItem('histoquest:state', JSON.stringify(state))
  }, v3Progress)
  await page.goto('settings')
  const downloadReady = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export progress (JSON)' }).click()
  const download = await downloadReady
  const file = await download.path()
  expect(file).not.toBeNull()
  const exported = JSON.parse(await readFile(file!, 'utf8'))
  expect(exported.version).toBe(4)
  expect(exported.pathway).toEqual(v3Progress.pathway)
  expect(exported.route2).toEqual(v3Progress.route2)
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('input[type=file]').setInputFiles({
    name: 'histoquest-roundtrip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  })
  await expect(page.getByRole('status')).toContainText('0 laboratory runs preserved in the archive')
  await page.reload()
  await page.goto('notebook')
  await expect(page.getByText(v3Progress.pathway.notes.fixation)).toBeVisible()
})
