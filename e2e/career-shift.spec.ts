import { expect, test, type Page } from '@playwright/test'
import { v3Progress } from './fixtures'
import { replayRun } from '../src/sim/core/replay'
import { assessShift, createShiftCase, shiftRecordIdentity } from '../src/sim/core/shifts'
import { gradePractical } from '../src/sim/scoring/practicals'
import { PROCESS as P } from '../src/sim/params/process'
import { PROTOCOL_BY_ID } from '../src/content/lab/protocols'
import type { LabRecord } from '../src/store/labSchema'

const note =
  'Synthetic case: identity, preparation quality and controls were checked; the remaining limitations and technical disposition were recorded.'
async function seedProgress(page: Page, records: LabRecord[] = []) {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('histoquest:state'))
        localStorage.setItem('histoquest:state', JSON.stringify(state))
    },
    {
      ...v3Progress,
      version: 4,
      lab: {
        runs: records,
        view: '2d',
        quality: 'low',
        passedPracticals: [],
        tutorials: [],
        reviewRecords: [],
      },
    },
  )
}
async function record(page: Page): Promise<LabRecord> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!).lab.draft)
}
async function station(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Lab stations' })
    .getByRole('button', { name: new RegExp(name) })
    .click()
}
async function documentStation(page: Page) {
  await page.getByRole('textbox', { name: 'Technical record — fictional exercise only' }).fill(note)
  await page.getByRole('button', { name: 'Save station note', exact: true }).click()
}
async function openShiftCase(page: Page, seed: string, id: string) {
  await page.goto(`shift?seed=${seed}`)
  const item = page.locator('.shift-case').filter({ has: page.locator(`a[href*="case=${id}&"]`) })
  await item.locator('a.btn-primary').click()
  await page.getByRole('button', { name: 'Open shift case', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Lab stations' })).toBeVisible()
}
async function receipt(page: Page) {
  await station(page, 'Receipt & LIS')
  await page.getByRole('button', { name: 'Accept accession', exact: true }).click()
  await documentStation(page)
}
async function section(page: Page, level = 1, depth = 0) {
  await station(page, 'Microtomy')
  await page.getByRole('button', { name: 'Lock and guard', exact: true }).click()
  await page.getByRole('button', { name: 'Mount / align block', exact: true }).click()
  await page.getByRole('button', { name: 'Prepare to cut — hands clear' }).click()
  if (depth) {
    await page.getByRole('spinbutton', { name: /Tissue consumed/ }).fill(String(depth))
    await page.getByRole('button', { name: 'Advance block face' }).click()
  }
  await page.getByRole('spinbutton', { name: /Level number/ }).fill(String(level))
  await page.getByRole('button', { name: 'Turn handwheel — take section' }).click()
  await page.getByRole('button', { name: 'Lock and guard', exact: true }).click()
  await documentStation(page)
  await station(page, 'Float & pick up')
  await page
    .getByRole('checkbox', { name: 'Bath inspected and cleared of previous tissue' })
    .check()
  await page.getByRole('checkbox', { name: 'Gentle section handling' }).check()
  await page.getByRole('button', { name: 'Float section', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Charged slide selected' }).check()
  await page.getByRole('button', { name: 'Pick up section', exact: true }).click()
  await documentStation(page)
  await station(page, 'Drying')
  await page.getByRole('button', { name: 'Run drying', exact: true }).click()
  await documentStation(page)
}
async function stainSteps(page: Page, steps: string[]) {
  await station(page, 'H&E')
  for (const reagent of steps) {
    await page.getByRole('combobox', { name: 'Reagent', exact: true }).selectOption(reagent)
    await page.getByRole('spinbutton', { name: /Exposure/ }).fill(String(P[`he.${reagent}-time`]))
    await page.getByRole('button', { name: 'Apply reagent step' }).click()
  }
  await documentStation(page)
}
async function mount(page: Page) {
  await station(page, 'Coverslipping')
  await page.getByRole('button', { name: 'Apply coverslip' }).click()
  await documentStation(page)
}
async function he(page: Page) {
  await stainSteps(page, [
    'dewax',
    'hydrate',
    'hematoxylin',
    'differentiate',
    'blue',
    'eosin',
    'dehydrate',
    'clear',
  ])
  await mount(page)
}
async function ihc(page: Page, corrected: boolean) {
  await stainSteps(page, ['dewax', 'hydrate'])
  await station(page, 'IHC')
  await page.getByRole('button', { name: 'Apply retrieval', exact: true }).click()
  for (const label of [
    'Appropriate endogenous / nonspecific blocking',
    'Humid chamber maintained',
    'Method-specified washes completed',
  ])
    await page.getByRole('checkbox', { name: label, exact: true }).check()
  await page.getByRole('button', { name: 'Apply primary antibody', exact: true }).click()
  await page
    .getByRole('checkbox', {
      name: 'Detection system matches the primary and chromogen',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Develop chromogen', exact: true }).click()
  for (const label of [
    'External positive control',
    'Low-expression positive control',
    'Negative reagent control',
  ])
    await page.getByRole('checkbox', { name: label, exact: true }).check()
  if (corrected)
    await page
      .getByRole('checkbox', {
        name: 'Documented reagent fault corrected before this repeat',
        exact: true,
      })
      .check()
  await page.getByRole('button', { name: 'Read IHC controls', exact: true }).click()
  expect(replayRun(await record(page)).ihc.valid).toBe(corrected)
  await documentStation(page)
  await stainSteps(page, ['dehydrate', 'clear'])
  await mount(page)
}
async function saveCase(page: Page, seed: string, id: string) {
  await station(page, 'Technical handoff')
  await documentStation(page)
  await page.getByRole('button', { name: 'Release for pathologist review', exact: true }).click()
  await page.getByRole('button', { name: 'Save & debrief', exact: true }).click()
  const saved = await record(page)
  const assessed = assessShift(seed, [saved]).cases.find((entry) => entry.case.id === id)!
  expect(assessed.critical).toEqual([])
  expect(assessed.checks.filter((check) => !check.passed)).toEqual([])
  expect(assessed.passed).toBe(true)
  return saved
}

async function preparePracticalBlock(page: Page) {
  await station(page, 'Receipt & LIS')
  await page.getByRole('button', { name: 'Place discrepancy on hold', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Resolution record' })
    .fill(
      'The fictional submitting team reconciled both identifiers, the specimen site and the source documentation.',
    )
  await page
    .getByRole('checkbox', { name: 'Submitting source supplied and authorized the correction' })
    .check()
  await page.getByRole('button', { name: 'Record source-authorized correction' }).click()
  await page.getByRole('button', { name: 'Accept accession', exact: true }).click()
  await documentStation(page)
  await station(page, 'Grossing')
  await page.getByRole('button', { name: 'Record dimensions', exact: true }).click()
  await page
    .getByRole('spinbutton', { name: /Maximum piece thickness/ })
    .fill(String(P['reference.gross-thickness']))
  await page.getByRole('combobox', { name: 'Containment', exact: true }).selectOption('biopsy')
  await page
    .getByRole('combobox', { name: 'Ink convention (scenario-specific)' })
    .selectOption('blue')
  await page
    .getByRole('textbox', { name: 'Cassette key and orientation record' })
    .fill(
      'A1: all submitted pieces reconciled; intended plane faces the cutting surface, with the documented blue ink orientation.',
    )
  await page.getByRole('checkbox', { name: 'Local fume extraction checked' }).check()
  await page.getByRole('button', { name: 'Sample into cassette', exact: true }).click()
  await documentStation(page)
  await station(page, 'Fixation')
  await page.getByRole('button', { name: 'Run fixation exposure' }).click()
  await documentStation(page)
  await station(page, 'Processing')
  for (const reagent of ['alcohol', 'clearant', 'paraffin']) {
    await page.getByRole('combobox', { name: 'Reagent', exact: true }).selectOption(reagent)
    await page
      .getByRole('spinbutton', { name: /^Temperature/ })
      .fill(
        String(
          reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature'],
        ),
      )
    await page.getByRole('checkbox', { name: 'Vacuum enabled in this scenario' }).check()
    await page.getByRole('button', { name: 'Append program step' }).click()
  }
  await page.getByRole('button', { name: 'Run programmed exchange' }).click()
  await documentStation(page)
  await station(page, 'Embedding')
  const pieces = replayRun(await record(page)).gross.fragments
  for (let index = 0; index < pieces; index++) {
    await page.getByRole('textbox', { name: 'Piece identifier' }).fill(`A1-${index + 1}`)
    await page
      .getByRole('spinbutton', { name: /X position/ })
      .fill(String(index * P['reference.piece-spacing']))
    await page.getByRole('button', { name: 'Place / update piece' }).click()
  }
  await page.getByRole('button', { name: 'Cool block', exact: true }).click()
  await documentStation(page)
  expect(replayRun(await record(page)).embedding.pieces).toHaveLength(pieces)
}

async function savePractical(page: Page, id: string) {
  await page.getByRole('button', { name: 'Save & debrief' }).click()
  const saved = await record(page)
  const grade = gradePractical(replayRun(saved), id)
  expect(grade.critical).toEqual([])
  expect(grade.checks.filter((check) => !check.passed)).toEqual([])
  expect(grade.passed).toBe(true)
  expect(saved.events.some((event) => event.params.origin === 'scenario-setup')).toBe(false)
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.passedPracticals,
    ),
  ).toContain(id)
  return saved
}

async function evidence(page: Page, title: string) {
  const group = page.getByRole('group', { name: title, exact: true })
  await group
    .getByRole('textbox', { name: 'Record observations, reasoning and limitations' })
    .fill(note)
  await group.getByRole('button', { name: 'Record this evidence' }).click()
}
async function pas(page: Page, omitOxidation: boolean) {
  await station(page, 'Special stains')
  await page.getByRole('combobox', { name: 'Protocol graph', exact: true }).selectOption('pas')
  const steps = PROTOCOL_BY_ID.pas.steps
  for (let index = 0; index < steps.length; index++) {
    if (omitOxidation && steps[index].id === 'oxidize') continue
    await page
      .locator('.protocol-graph > li')
      .nth(index)
      .getByRole('button', { name: `Run ${steps[index].label.toLowerCase()}`, exact: true })
      .click()
  }
  await page
    .getByRole('checkbox', { name: 'Known target-positive control included', exact: true })
    .check()
  await page
    .getByRole('checkbox', {
      name: 'Appropriate negative / comparison control included',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Evaluate special-stain controls', exact: true }).click()
  expect(replayRun(await record(page)).staining.controls.valid).toBe(!omitOxidation)
  await documentStation(page)
}

test('L0 through L3 completes through real specimen actions, failed-control recovery and persisted prerequisites', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await seedProgress(page)
  await page.goto('lab3d?practical=assistant-practical')
  await expect(page.getByRole('button', { name: 'Start assessed practical' })).toBeDisabled()
  await expect(page.getByText(/Complete L0:/)).toBeVisible()
  await page.goto('lab3d?practical=orientation-practical')
  await page.getByRole('button', { name: 'Start assessed practical' }).click()
  const safety = page.getByRole('group', { name: 'Safety observation', exact: true })
  for (const checkbox of await safety.getByRole('checkbox').all()) await checkbox.check()
  await safety.getByRole('textbox').fill(note)
  await safety.getByRole('button', { name: 'Record this evidence' }).click()
  await page.getByRole('button', { name: 'Apply handwheel lock and blade guard' }).click()
  const microscopy = page.getByRole('group', { name: 'Microscope observation', exact: true })
  await microscopy.getByRole('combobox', { name: 'Overview setting' }).selectOption('2')
  await microscopy.getByRole('combobox', { name: 'Detail setting' }).selectOption('20')
  for (const checkbox of await microscopy.getByRole('checkbox').all()) await checkbox.check()
  await microscopy
    .getByRole('textbox')
    .fill(
      'Synthetic epidermis at the surface and deeper collagen are distinguishable; focus and illumination alter contrast, with no diagnostic interpretation implied.',
    )
  await microscopy.getByRole('button', { name: 'Record this evidence' }).click()
  await page.getByRole('button', { name: 'Save & debrief' }).click()
  const saved = await record(page)
  expect(gradePractical(replayRun(saved), 'orientation-practical').passed).toBe(true)
  await page.goto('career')
  await expect(page.getByRole('heading', { name: /^L1:/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Continue with L1:/ })).toBeVisible()
  await page.reload()
  await page.getByRole('link', { name: /^Continue with L1:/ }).click()
  await expect(page.getByRole('button', { name: 'Start assessed practical' })).toBeEnabled()
  await page.getByRole('button', { name: 'Start assessed practical' }).click()
  await preparePracticalBlock(page)
  const l1 = await savePractical(page, 'assistant-practical')
  await page.goto('career')
  await page.getByRole('link', { name: /^Continue with L2:/ }).click()
  await page.getByRole('button', { name: 'Start assessed practical' }).click()
  await preparePracticalBlock(page)
  await section(page)
  await he(page)
  await evidence(page, 'H&E reference comparison')
  await station(page, 'Technical handoff')
  await documentStation(page)
  await page.getByRole('button', { name: 'Release for pathologist review', exact: true }).click()
  const l2 = await savePractical(page, 'routine-practical')
  await page.goto('career')
  await page.getByRole('link', { name: /^Continue with L3:/ }).click()
  await page.getByRole('button', { name: 'Start assessed practical' }).click()
  await preparePracticalBlock(page)
  await section(page)
  await pas(page, true)
  await station(page, 'Technical handoff')
  await page.getByRole('button', { name: 'Hold for corrective action', exact: true }).click()
  await documentStation(page)
  await section(page, 2, P['practical.level-gap'])
  await pas(page, false)
  await mount(page)
  const interruption = page.getByRole('group', {
    name: 'Separate-case interruption plan',
    exact: true,
  })
  await interruption
    .getByRole('textbox', { name: 'Separate synthetic frozen accession' })
    .fill('TRAIN-SEPARATE-FROZEN')
  for (const checkbox of await interruption.getByRole('checkbox').all()) await checkbox.check()
  await interruption
    .getByRole('textbox', { name: 'Record observations, reasoning and limitations' })
    .fill(note)
  await interruption.getByRole('button', { name: 'Record this evidence' }).click()
  await evidence(page, 'Cause, correction and technical disposition')
  await station(page, 'Technical handoff')
  await page.getByRole('button', { name: 'Hold for corrective action', exact: true }).click()
  await documentStation(page)
  const l3 = await savePractical(page, 'ht-practical')
  expect(replayRun(l3).block.sections).toHaveLength(2)
  expect(l3.events.filter((event) => event.intent === 'special.controls')).toHaveLength(2)
  expect(replayRun(l3).archivedSlides).toHaveLength(1)
  await page.reload()
  const completed = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.runs,
  )) as LabRecord[]
  for (const expected of [saved, l1, l2, l3])
    expect(completed.find((run) => run.id === expected.id)?.events).toEqual(expected.events)
  await page.goto('career')
  await expect(page.getByRole('heading', { name: /^L4:/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Continue with L4:/ })).toBeVisible()
})

test('a queue query resumes the newest attempt even when the recent cache is newest first', async ({
  page,
}) => {
  const old = {
    ...createShiftCase('LATEST-BROWSER', 'routine'),
    id: 'older-attempt',
    startedAt: '2026-01-01T00:00:00Z',
  }
  const recent = {
    ...createShiftCase('LATEST-BROWSER', 'routine'),
    id: 'newer-attempt',
    startedAt: '2026-01-02T00:00:00Z',
  }
  await seedProgress(page, [recent, old])
  await page.goto('lab3d?shift=LATEST-BROWSER&case=routine')
  await page.getByRole('button', { name: 'Open shift case' }).click()
  expect((await record(page)).id).toBe(recent.id)
  expect((await record(page)).events.at(-1)?.intent).toBe('shift.resume')
})

test('complete five-case shift retains a safely interrupted case, corrective IHC history and actual technical releases', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const seed = 'FULL-BROWSER-SHIFT'
  await seedProgress(page)
  await openShiftCase(page, seed, 'routine')
  await receipt(page)
  await section(page)
  const interrupted = await record(page)
  await openShiftCase(page, seed, 'frozen')
  const frozen = await record(page)
  expect(frozen.id).not.toBe(interrupted.id)
  expect(replayRun(frozen).scenario.accession).not.toBe(replayRun(interrupted).scenario.accession)
  const paused = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.runs[0],
  )) as LabRecord
  expect(paused.id).toBe(interrupted.id)
  expect(paused.events.at(-1)?.intent).toBe('shift.pause')
  expect(replayRun(paused).issues.filter((issue) => issue.severity === 'critical')).toEqual([])
  await receipt(page)
  await station(page, 'Grossing')
  await page
    .getByRole('spinbutton', { name: /Maximum piece thickness/ })
    .fill(String(P['reference.gross-thickness']))
  await page
    .getByRole('textbox', { name: 'Cassette key and orientation record' })
    .fill('A1: separate unfixed frozen specimen, oriented and accounted for.')
  await page.getByRole('combobox', { name: 'Containment', exact: true }).selectOption('biopsy')
  await page.getByRole('checkbox', { name: 'Local fume extraction checked' }).check()
  await page.getByRole('button', { name: 'Sample into cassette', exact: true }).click()
  await documentStation(page)
  await station(page, 'Frozen section')
  await page
    .getByRole('checkbox', { name: 'Unfixed tissue precautions and decontamination plan checked' })
    .check()
  await page.getByRole('button', { name: 'Prepare frozen block' }).click()
  await documentStation(page)
  await section(page)
  await he(page)
  await saveCase(page, seed, 'frozen')

  await openShiftCase(page, seed, 'routine')
  const resumed = await record(page)
  expect(resumed.id).toBe(interrupted.id)
  expect(resumed.events.slice(0, interrupted.events.length)).toEqual(interrupted.events)
  expect(resumed.events.at(-1)?.intent).toBe('shift.resume')
  expect(replayRun(resumed).block.sections).toEqual(replayRun(interrupted).block.sections)
  await he(page)
  await saveCase(page, seed, 'routine')

  await openShiftCase(page, seed, 'processor')
  await receipt(page)
  await station(page, 'Technical handoff')
  await page.getByRole('button', { name: 'Hold for corrective action' }).click()
  await station(page, 'Processing')
  for (const reagent of ['alcohol', 'clearant', 'paraffin']) {
    await page.getByRole('combobox', { name: 'Reagent', exact: true }).selectOption(reagent)
    await page
      .getByRole('spinbutton', { name: /^Temperature/ })
      .fill(
        String(
          reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature'],
        ),
      )
    await page.getByRole('checkbox', { name: 'Vacuum enabled in this scenario' }).check()
    await page.getByRole('button', { name: 'Append program step' }).click()
  }
  await page.getByRole('button', { name: 'Run programmed exchange' }).click()
  await documentStation(page)
  await station(page, 'Embedding')
  for (let i = 0; i < replayRun(await record(page)).scenario.fragments; i++) {
    await page.getByRole('textbox', { name: 'Piece identifier' }).fill(`A1-${i + 1}`)
    await page
      .getByRole('spinbutton', { name: /X position/ })
      .fill(String(i * P['reference.piece-spacing']))
    await page.getByRole('button', { name: 'Place / update piece' }).click()
  }
  await page.getByRole('button', { name: 'Cool block', exact: true }).click()
  await documentStation(page)
  await section(page)
  await he(page)
  await saveCase(page, seed, 'processor')

  await openShiftCase(page, seed, 'controls')
  await receipt(page)
  await section(page)
  await ihc(page, false)
  await station(page, 'Technical handoff')
  await page.getByRole('button', { name: 'Hold for corrective action' }).click()
  await section(page, 2)
  await ihc(page, true)
  const controls = await saveCase(page, seed, 'controls')
  expect(controls.events.filter((event) => event.intent === 'ihc.controls')).toHaveLength(2)
  expect(replayRun(controls).archivedSlides).toHaveLength(1)

  await openShiftCase(page, seed, 'levels')
  await receipt(page)
  await section(page)
  await section(page, 2, P['practical.level-gap'])
  await he(page)
  await saveCase(page, seed, 'levels')
  await page.goto(`shift?seed=${seed}`)
  await expect(
    page.locator('.shift-status').filter({ hasText: 'Technical criteria met' }),
  ).toHaveCount(5)
  const runs = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.runs,
  )) as LabRecord[]
  expect(new Set(runs.map((run) => shiftRecordIdentity(run)?.caseId)).size).toBe(5)
  expect(assessShift(seed, runs).complete).toBe(true)
  expect(assessShift(seed, runs).critical).toEqual([])
  const beforeReload = assessShift(seed, runs)
  await page.reload()
  await expect(
    page.locator('.shift-status').filter({ hasText: 'Technical criteria met' }),
  ).toHaveCount(5)
  const restored = (await page.evaluate(
    () => JSON.parse(localStorage.getItem('histoquest:state')!).lab.runs,
  )) as LabRecord[]
  expect(assessShift(seed, restored).score).toBe(beforeReload.score)
})
