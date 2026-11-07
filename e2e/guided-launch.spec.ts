import { expect, test } from '@playwright/test'
import { initialState } from '../src/store/state'
import { createPracticalRecord } from '../src/sim/scoring/practicals'

test('a guided practical has one launch and can open free setup while another draft exists', async ({
  page,
}) => {
  const state = initialState()
  state.lab.view = '2d'
  state.lab.draft = createPracticalRecord('orientation-practical')
  await page.addInitScript((saved) => {
    if (!localStorage.getItem('histoquest:state'))
      localStorage.setItem('histoquest:state', JSON.stringify(saved))
  }, state)
  await page.goto('lab3d?practical=assistant-practical')
  await expect(
    page.getByRole('heading', { name: 'Your guided practical', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Start assessed practical', exact: true }),
  ).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Set up your bench', exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Begin at specimen receipt', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Explore the free laboratory', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Set up your bench', exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Resume current specimen', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft.id),
  ).toBe(state.lab.draft.id)
})

test('a saved practical link presents its replay rather than starting a competing assessment', async ({
  page,
}) => {
  const state = initialState()
  state.lab.view = '2d'
  state.lab.draft = createPracticalRecord('orientation-practical')
  await page.addInitScript((saved) => {
    if (!localStorage.getItem('histoquest:state'))
      localStorage.setItem('histoquest:state', JSON.stringify(saved))
  }, state)
  await page.goto(
    `lab3d?practical=orientation-practical&replay=${encodeURIComponent(state.lab.draft.id)}`,
  )
  await expect(
    page.getByRole('heading', { name: 'Resume your laboratory case', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open saved run', exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Start assessed practical', exact: true }),
  ).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Set up your bench', exact: true })).toHaveCount(0)
})
