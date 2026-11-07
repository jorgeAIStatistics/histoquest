import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { initialState, type AppState } from '../src/store/state'

async function seed(page: Page, state = initialState()) {
  state.settings.theme = state.settings.theme === 'dark' ? 'dark' : 'light'
  state.settings.motion = 'reduced'
  await page.addInitScript((progress) => {
    // Reload must exercise persisted progress, not replace it with the initial fixture.
    if (!localStorage.getItem('histoquest:state')) {
      localStorage.setItem('histoquest:state', JSON.stringify(progress))
    }
  }, state)
}

async function savedState(page: Page): Promise<AppState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('histoquest:state')!))
}

async function checkLayoutAndAccess(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
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

test('a new learner starts at the beginning, completes the checks and resumes the next activity', async ({
  page,
}) => {
  await seed(page)
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Your histology learning path' })).toBeVisible()
  await expect(page.locator('main .btn-primary')).toHaveCount(1)
  const start = page.getByRole('link', { name: 'Start from the beginning', exact: true })
  await expect(start).toHaveAttribute('href', /\/pathway\/tissue-language$/)
  await start.click()
  await expect(
    page.getByRole('heading', { name: 'Learn to read the tissue', exact: true }),
  ).toBeVisible()

  const finish = page.getByRole('button', { name: 'Complete chapter and continue', exact: true })
  await expect(finish).toBeDisabled()
  const firstCheck = page.getByRole('article', { name: /The same tube appears circular/ })
  await firstCheck.getByRole('button', { name: /Section plane/ }).click()
  await firstCheck.getByRole('button', { name: 'Sure', exact: true }).click()
  await firstCheck.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(firstCheck.getByRole('status')).toContainText('Correct.')
  await expect(finish).toBeDisabled()

  const secondCheck = page.getByRole('article', { name: /Increasing digital zoom/ })
  await secondCheck.getByRole('button', { name: /Resolution in the original image/ }).click()
  await secondCheck.getByRole('button', { name: 'Sure', exact: true }).click()
  await secondCheck.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(secondCheck.getByRole('status')).toContainText('Correct.')
  await expect(finish).toBeEnabled()
  await finish.click()

  await expect(page.getByRole('heading', { name: 'Your histology learning path' })).toBeVisible()
  const next = page.locator('.journey-next')
  await expect(
    next.getByRole('heading', { name: 'Safety and exposure limits in the histology lab' }),
  ).toBeVisible()
  await expect(next.getByRole('link', { name: 'Continue learning', exact: true })).toHaveAttribute(
    'href',
    /\/learn\/L-18$/,
  )
  await expect(
    page.getByRole('progressbar', { name: 'Course activities recorded' }),
  ).toHaveAttribute('value', '1')
  await expect
    .poll(async () => (await savedState(page)).pathway.completed)
    .toContain('tissue-language')
  const attempts = (await savedState(page)).attempts
  expect(attempts.map((attempt) => attempt.qid)).toEqual(
    expect.arrayContaining(['Q-STAIN-201', 'Q-STAIN-202']),
  )

  await page.reload()
  await expect(
    next.getByRole('heading', { name: 'Safety and exposure limits in the histology lab' }),
  ).toBeVisible()
  await next.getByRole('link', { name: 'Continue learning', exact: true }).click()
  await expect(
    page.getByRole('heading', {
      name: 'Safety and exposure limits in the histology lab',
      exact: true,
    }),
  ).toBeVisible()
  expect((await savedState(page)).pathway.completed).toContain('tissue-language')
})

test('existing study carries forward and previewing later stages does not change the next activity', async ({
  page,
}) => {
  const state = initialState()
  state.pathway.completed = ['tissue-language']
  state.pathway.notes = { 'tissue-language': 'Keep this observation when reorganizing my course.' }
  state.lessons['L-18'] = {
    startedAt: '2026-11-01T12:00:00.000Z',
    completedAt: '2026-11-01T12:10:00.000Z',
    step: 3,
  }
  state.lab.passedPracticals = ['orientation-practical']
  await seed(page, state)
  await page.goto('./')

  const next = page.locator('.journey-next')
  await expect(next).toContainText('Stage 2 of 8')
  await expect(
    next.getByRole('heading', { name: 'Give every fragment a traceable identity' }),
  ).toBeVisible()
  await expect(next.getByRole('link', { name: 'Continue learning', exact: true })).toHaveAttribute(
    'href',
    /\/pathway\/accessioning$/,
  )
  await expect(
    page.getByRole('progressbar', { name: 'Course activities recorded' }),
  ).toHaveAttribute('value', '3')

  const lastStage = page.locator('#stage-exam-review > details')
  await lastStage.locator(':scope > summary').click()
  await expect(
    lastStage.getByRole('link', { name: 'Complete a full-length practice exam', exact: true }),
  ).toBeVisible()
  await expect(next.getByRole('link', { name: 'Continue learning', exact: true })).toHaveAttribute(
    'href',
    /\/pathway\/accessioning$/,
  )
  expect((await savedState(page)).pathway.notes).toEqual(state.pathway.notes)

  await page.reload()
  await expect(
    next.getByRole('heading', { name: 'Give every fragment a traceable identity' }),
  ).toBeVisible()
  await next.getByRole('link', { name: 'Review from the beginning', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Chapter completed', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Continue learning path', exact: true }).click()
  await expect(next).toContainText('Stage 2 of 8')
  const saved = await savedState(page)
  expect(saved.pathway.completed).toEqual(['tissue-language'])
  expect(saved.lessons['L-18'].completedAt).toBe(state.lessons['L-18'].completedAt)
  expect(saved.lab.passedPracticals).toEqual(['orientation-practical'])
})

test('phone navigation separates the course from optional resources without hiding the tools', async ({
  page,
}) => {
  await seed(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  const navigation = page.locator('.tabbar')
  await expect(navigation.getByRole('link')).toHaveText([
    'Learning path',
    'Practice',
    'Library',
    'Progress',
  ])
  await navigation.getByRole('link', { name: 'Library', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible()
  for (const title of [
    'Free laboratory',
    'Practical milestones',
    'Specimen workbench',
    'Concept simulations',
    'Simulated shift',
    'Troubleshooting clinic',
    'Slide library',
    'Reference atlas',
    'Field notebook',
  ]) {
    await expect(
      page.locator('main').getByRole('link', { name: new RegExp(`^${title}`) }),
    ).toBeVisible()
  }
  await checkLayoutAndAccess(page)
  await navigation.getByRole('link', { name: 'Learning path', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Start from the beginning', exact: true }),
  ).toBeVisible()
  expect((await savedState(page)).pathway.completed).toEqual([])
})

for (const variant of [
  { name: 'desktop', width: 1280, height: 900, theme: 'light' as const },
  { name: 'phone', width: 390, height: 844, theme: 'light' as const },
  { name: 'dark-phone', width: 390, height: 844, theme: 'dark' as const },
]) {
  test(`the fresh ${variant.name} learning path has a visible beginning and accessible course map`, async ({
    page,
  }, testInfo) => {
    const state = initialState()
    state.settings.theme = variant.theme
    await seed(page, state)
    await page.setViewportSize({ width: variant.width, height: variant.height })
    await page.goto('./')
    await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme)
    await expect(page.getByRole('heading', { name: 'Your histology learning path' })).toBeVisible()
    const start = page.getByRole('link', { name: 'Start from the beginning', exact: true })
    await expect(start).toBeVisible()
    const box = await start.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeLessThan(variant.height - (variant.width < 860 ? 70 : 0))
    await expect(page.locator('.journey-stages > li')).toHaveCount(8)
    await expect(
      page.getByRole('heading', { name: 'A clear finish, and a way to keep improving' }),
    ).toBeVisible()
    await checkLayoutAndAccess(page)
    if (process.env.CAPTURE_SCREENS && testInfo.project.name === 'chromium') {
      await page.screenshot({ path: `docs/screens/journey-${variant.name}.png`, fullPage: true })
      if (variant.name === 'desktop') {
        await page.screenshot({ path: 'docs/screens/journey-start.png', fullPage: false })
      }
    }
  })
}

test('finishing a lesson advances to the practical and changing lessons restores the correct step', async ({
  page,
}) => {
  const state = initialState()
  state.pathway.completed = ['tissue-language']
  await seed(page, state)
  await page.goto('./')
  await page
    .locator('.journey-next')
    .getByRole('link', { name: 'Continue learning', exact: true })
    .click()
  await expect(
    page.getByRole('heading', {
      name: 'Safety and exposure limits in the histology lab',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bench question', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to explanation', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Explanation', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to demonstration', exact: true }).click()
  await page.getByRole('button', { name: 'Next step', exact: true }).click()
  await expect(page.getByRole('img', { name: 'Step 2 of 6: Alert and secure' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to predict', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, the action level', exact: true }).click()
  await page.getByRole('button', { name: 'Commit and reveal', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your prediction holds.')
  await page.getByRole('button', { name: 'Continue to worked example', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Worked example', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to retrieval', exact: true }).click()

  const retrievalAnswers = [
    /At or above the 0.5 ppm action level but below the 0.75 ppm PEL/,
    /Section 8, Exposure controls\/personal protection/,
    /Take the coworker to the eyewash and flush the eye at once/,
    /Option [A-D]: Class B$/,
  ]
  for (const [index, answer] of retrievalAnswers.entries()) {
    const question = page.getByRole('article')
    await question.getByRole('button', { name: answer }).click()
    await question.getByRole('button', { name: 'Sure', exact: true }).click()
    await question.getByRole('button', { name: 'Check answer', exact: true }).click()
    await expect(question.getByRole('status')).toContainText('Correct.')
    if (index < retrievalAnswers.length - 1) {
      await page.getByRole('button', { name: 'Next retrieval question', exact: true }).click()
    }
  }
  await page.getByRole('button', { name: 'Continue to troubleshoot', exact: true }).click()
  await page
    .getByRole('button', { name: /^Treat it as an exposure problem and improve controls/ })
    .click()
  await page.getByRole('button', { name: 'Commit and reveal', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your prediction holds.')
  await page.getByRole('button', { name: 'Continue to takeaway', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Takeaway', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Finish lesson and continue', exact: true }).click()
  const next = page.locator('.journey-next')
  await expect(
    next.getByRole('heading', { name: 'Prepare, inspect, explain', exact: true }),
  ).toBeVisible()
  await expect(next.getByRole('link', { name: 'Continue learning', exact: true })).toHaveAttribute(
    'href',
    /practical=orientation-practical/,
  )
  await expect.poll(async () => !!(await savedState(page)).lessons['L-18']?.completedAt).toBe(true)
  const saved = await savedState(page)
  expect(saved.lessons['L-18'].predictionCorrect).toBe(true)
  expect(saved.attempts.map((attempt) => attempt.qid)).toEqual(
    expect.arrayContaining(['Q-OPS-011', 'Q-OPS-012', 'Q-OPS-013', 'Q-OPS-014']),
  )
  await page.reload()
  await expect(
    next.getByRole('heading', { name: 'Prepare, inspect, explain', exact: true }),
  ).toBeVisible()

  // A real prerequisite link changes /learn/:id within the same mounted route.
  // The second lesson must not inherit the first lesson's local Takeaway step.
  await page.goto('learn/L-06')
  await page
    .getByRole('navigation', { name: 'Lesson steps' })
    .getByRole('button', { name: '8. Takeaway', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Takeaway', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Dehydration, clearing, infiltration', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Dehydration, clearing, infiltration', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bench question', exact: true })).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Lesson steps' })
      .getByRole('button', { name: '1. Bench question', exact: true }),
  ).toHaveAttribute('aria-current', 'step')
  expect((await savedState(page)).lessons['L-06'].step).toBe(7)
  expect((await savedState(page)).lessons['L-18'].completedAt).toBe(
    saved.lessons['L-18'].completedAt,
  )
})

for (const course of ['mixed', 'exam'] as const) {
  test(`the guided ${course} launcher creates and resumes the correct full session with course context`, async ({
    page,
  }) => {
    await seed(page)
    await page.goto(`practice?course=${course}`)
    const exam = course === 'exam'
    const count = exam ? 100 : 25
    await expect(
      page.getByRole('heading', {
        name: exam ? 'Your full-length practice exam' : 'Your mixed review session',
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.locator('.journey-frame')).toContainText('Stage 8 of 8')
    await expect(page.locator('main .btn-primary')).toHaveCount(1)
    await page
      .getByRole('button', {
        name: exam ? 'Start full exam (100 questions)' : 'Start mixed review (25 questions)',
        exact: true,
      })
      .click()
    await expect(page).toHaveURL(new RegExp(`/practice/session/[^?]+\\?course=${course}$`))
    await expect(page.locator('.exam-bar')).toContainText(`Question 1 of ${count}`)
    await expect(page.locator('.journey-frame')).toContainText('Stage 8 of 8')
    const sessionUrl = page.url()
    const created = (await savedState(page)).sessions[0]
    expect(created.kind).toBe(course)
    expect(created.mode).toBe(exam ? 'exam' : 'study')
    expect(created.questionIds).toHaveLength(count)
    expect(new Set(created.questionIds).size).toBe(count)
    if (exam) {
      expect(Date.parse(created.deadline!) - Date.parse(created.startedAt)).toBe(150 * 60_000)
      await expect(page.locator('.timer')).toBeVisible()
    } else {
      expect(created.deadline).toBeUndefined()
    }
    const question = page.getByRole('article')
    const options = question.getByRole('button', { name: /^Option / })
    if (await options.count()) await options.first().click()
    else await question.getByRole('textbox', { name: 'Your answer', exact: true }).fill('1')
    await question.getByRole('button', { name: 'Sure', exact: true }).click()
    if (!exam) await question.getByRole('button', { name: 'Check answer', exact: true }).click()
    const recorded = (await savedState(page)).sessions.find((session) => session.id === created.id)!
    expect(recorded.answers[created.questionIds[0]].value).not.toBe('')

    await page.getByRole('link', { name: 'Back to learning path', exact: true }).click()
    await expect(page.locator('#stage-exam-review > details')).toHaveAttribute('open', '')
    await page.goto(`practice?course=${course}`)
    await expect(page.locator('main .btn-primary')).toHaveCount(1)
    await page.getByRole('link', { name: 'Resume this session', exact: true }).click()
    await expect(page).toHaveURL(sessionUrl)
    await expect(page.locator('.journey-frame')).toContainText('Stage 8 of 8')
    await page.reload()
    await expect(page.locator('.exam-bar')).toContainText(`Question 1 of ${count}`)
    const resumed = (await savedState(page)).sessions
    expect(resumed).toHaveLength(1)
    expect(resumed[0].answers).toEqual(recorded.answers)
    expect(resumed[0].questionIds).toEqual(created.questionIds)
    expect(resumed[0].deadline).toBe(created.deadline)
  })
}
