import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { StateSchema } from '../src/store/state'
import { startRun } from '../src/features/workbench/model'
import { v3Progress } from './fixtures'

function backup(count = 23) {
  return StateSchema.parse({
    ...v3Progress,
    version: 4,
    attempts: [
      {
        qid: 'archive-legacy-question',
        qVersion: 1,
        at: '2026-11-01T12:00:00.000Z',
        day: '2026-11-01',
        correct: true,
        confidence: 2,
        mode: 'study',
        first: true,
      },
    ],
    workbench: { ...startRun('skin', 'ARCHIVE-LEGACY'), startedAt: '2026-11-01T12:00:00.000Z' },
    lab: {
      view: '2d',
      quality: 'low',
      runs: Array.from({ length: count }, (_, index) => ({
        id: `archive-run-${String(index).padStart(3, '0')}`,
        version: 1,
        seed: `ARCHIVE-${index}`,
        archetype: 'skin-ellipse',
        difficulty: 1,
        mode: 'free',
        title: `Synthetic archive fixture ${index}`,
        startedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
        completedAt: new Date(Date.UTC(2026, 0, 1, 0, index, 30)).toISOString(),
        events: [
          {
            sequence: 0,
            t: 0,
            station: 'accessioning',
            intent: 'document',
            params: { text: `Synthetic stored practice record ${index}; no competency claim.` },
          },
        ],
      })),
    },
  })
}
async function importBackup(page: Page, state: ReturnType<typeof backup>) {
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('input[type=file]').setInputFiles({
    name: 'complete-progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(state)),
  })
}
async function archiveCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('histoquest-lab-archive', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('runs', 'readonly')
          const count = tx.objectStore('runs').count()
          count.onsuccess = () => resolve(count.result)
          tx.oncomplete = () => db.close()
          tx.onerror = () => reject(tx.error)
        }
      }),
  )
}
async function local(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!))
}

test('23 archived runs roundtrip through real IndexedDB and JSON without losing legacy progress', async ({
  page,
  browser,
  baseURL,
}) => {
  const original = backup()
  await page.goto('settings')
  await importBackup(page, original)
  await expect(page.getByRole('status')).toContainText(
    '23 laboratory runs preserved in the archive',
  )
  expect(await archiveCount(page)).toBe(23)
  const cached = await local(page)
  expect(cached.lab.runs).toHaveLength(20)
  for (const key of ['attempts', 'workbench', 'route2', 'pathway'] as const)
    expect(cached[key]).toEqual(original[key])
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export progress (JSON)' }).click()
  const file = await (await downloaded).path()
  const exported = StateSchema.parse(JSON.parse(await readFile(file!, 'utf8')))
  expect(exported.lab.runs).toEqual(original.lab.runs)
  for (const key of ['attempts', 'workbench', 'route2', 'pathway'] as const)
    expect(exported[key]).toEqual(original[key])
  await expect(page.getByRole('status')).toContainText(
    'Complete progress exported, including 23 laboratory runs',
  )

  const fresh = await browser.newContext({ baseURL })
  const restored = await fresh.newPage()
  await restored.goto('settings')
  await importBackup(restored, exported)
  await expect(restored.getByRole('status')).toContainText(
    '23 laboratory runs preserved in the archive',
  )
  expect(await archiveCount(restored)).toBe(23)
  await restored.reload()
  const afterReload = await local(restored)
  expect(afterReload.lab.runs).toHaveLength(20)
  for (const key of ['attempts', 'workbench', 'route2', 'pathway'] as const)
    expect(afterReload[key]).toEqual(original[key])
  restored.once('dialog', (dialog) => dialog.accept())
  await restored.getByRole('button', { name: 'Erase all progress' }).click()
  await expect(restored.getByRole('status')).toHaveText(
    'Progress and archived laboratory runs erased.',
  )
  expect(await archiveCount(restored)).toBe(0)
  expect((await local(restored)).lab.runs).toEqual([])
  expect((await local(restored)).attempts).toEqual([])
  await fresh.close()
})

test('unreadable archive blocks a complete-backup claim without dropping the local cache', async ({
  page,
}) => {
  await page.goto('settings')
  await importBackup(page, backup())
  await expect(page.getByRole('status')).toContainText('23 laboratory runs preserved')
  const before = await local(page)
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('histoquest-lab-archive', 1)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('runs', 'readwrite')
          tx.objectStore('runs').put({ id: 'corrupt-fixture', record: { unreadable: true } })
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      }),
  )
  await page.reload()
  let downloads = 0
  page.on('download', () => downloads++)
  await page.getByRole('button', { name: 'Export progress (JSON)' }).click()
  await expect(page.getByRole('status')).toContainText('No complete backup was exported.')
  expect(downloads).toBe(0)
  expect(await local(page)).toEqual(before)
  expect(await archiveCount(page)).toBe(24)
})

test('capacity rejection preserves the existing local and durable records', async ({ page }) => {
  await page.goto('settings')
  await importBackup(page, backup())
  await expect(page.getByRole('status')).toContainText('23 laboratory runs preserved')
  const before = await local(page)
  await importBackup(page, backup(201))
  await expect(page.getByRole('status')).toContainText('Import could not complete.')
  await expect(page.getByRole('status')).toContainText('Nothing was pruned.')
  expect(await local(page)).toEqual(before)
  expect(await archiveCount(page)).toBe(23)
})

test('manual pruning requires a complete export and keeps changed, unexported and recent records', async ({
  page,
}) => {
  await page.goto('settings')
  const original = backup()
  await importBackup(page, original)
  await expect(page.getByRole('status')).toContainText('23 laboratory runs preserved')
  await page.getByText('Archive limits and manual pruning', { exact: true }).click()
  const prune = page.getByRole('button', { name: 'Remove backed-up older archive records' })
  await expect(prune).toBeDisabled()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export progress (JSON)' }).click()
  const file = await (await downloaded).path()
  const exported = StateSchema.parse(JSON.parse(await readFile(file!, 'utf8')))
  expect(exported.lab.runs).toEqual(original.lab.runs)
  await expect(prune).toBeEnabled()
  const changed = { ...original.lab.runs[0], title: 'Updated after the complete export' }
  const unexported = { ...original.lab.runs[1], id: 'new-unexported-run' }
  await page.evaluate(
    (records) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('histoquest-lab-archive', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('runs', 'readwrite')
          for (const record of records)
            tx.objectStore('runs').put({ id: record.id, record, bytes: 0, updatedAt: '2026-11-07' })
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
    [changed, unexported],
  )
  page.once('dialog', (dialog) => dialog.accept())
  await prune.click()
  await expect(page.getByRole('status')).toContainText('2 unchanged, backed-up older runs removed')
  expect(await archiveCount(page)).toBe(22)
  expect((await local(page)).lab.runs).toHaveLength(20)
  const retained = await page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open('histoquest-lab-archive', 1)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('runs', 'readonly')
          const keys = tx.objectStore('runs').getAllKeys()
          keys.onsuccess = () => resolve(keys.result as string[])
          tx.oncomplete = () => db.close()
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      }),
  )
  expect(retained).toContain(changed.id)
  expect(retained).toContain(unexported.id)
  expect(retained).not.toContain(original.lab.runs[1].id)
  expect(retained).not.toContain(original.lab.runs[2].id)
})

test('large complete histories fit the byte-aware recent cache and still export every event', async ({
  page,
}) => {
  const original = backup(3)
  for (const run of original.lab.runs)
    run.events = Array.from({ length: 2000 }, (_, sequence) => ({
      sequence,
      t: sequence,
      station: 'quality',
      intent: 'document',
      params: { text: 'a'.repeat(260) },
    }))
  await page.goto('settings')
  await importBackup(page, original)
  await expect(page.getByRole('status')).toContainText('3 laboratory runs preserved in the archive')
  expect(await archiveCount(page)).toBe(3)
  const cached = await local(page)
  expect(cached.lab.runs).toHaveLength(1)
  expect(cached.lab.runs[0].id).toBe(original.lab.runs[2].id)
  expect(
    new TextEncoder().encode(JSON.stringify({ runs: cached.lab.runs })).byteLength,
  ).toBeLessThanOrEqual(1024 * 1024)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export progress (JSON)' }).click()
  const file = await (await downloaded).path()
  const exported = StateSchema.parse(JSON.parse(await readFile(file!, 'utf8')))
  expect(exported.lab.runs).toEqual(original.lab.runs)
  expect(exported.lab.runs.reduce((count, run) => count + run.events.length, 0)).toBe(6000)
  await page.reload()
  expect((await local(page)).lab.runs).toHaveLength(1)
  expect(await archiveCount(page)).toBe(3)
})
