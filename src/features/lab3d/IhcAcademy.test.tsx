// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { referenceTwin } from '../../sim/core/reference'
import { createScenario } from '../../sim/core/scenarios'
import { RUN_LABELS, RUN_STEPS } from '../../sim/models/ihcExperiments'
import IhcAcademy from './IhcAcademy'
vi.mock('../../render2d/Microscope', () => ({
  default: () => <div>Shared simulated microscope</div>,
}))
vi.mock('./IhcMoleculeScene', () => ({ default: () => <div>Text-equivalent molecular scene</div> }))
vi.mock('../../render2d/tiles', () => ({
  paintTiles: async () => true,
  TileCache: class {
    clear() {}
  },
  viewportAt: () => ({}),
}))
afterEach(cleanup)
function setup() {
  const act = vi.fn()
  const twin = referenceTwin({
    ...createScenario('ACADEMY-UI', 'skin-ellipse'),
    faults: [],
    discrepancy: 'none',
  })
  render(<IhcAcademy twin={twin} act={act} />)
  return act
}
function choose(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}
function lastEvidence(act: ReturnType<typeof vi.fn>, id: string) {
  return act.mock.calls
    .filter((call) => call[0] === 'practice.evidence' && call[1].checkId === id)
    .at(-1)?.[1]
}

it('requires structured validation decisions rather than a populated notes box', async () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Validation planning', exact: true }))
  fireEvent.change(
    screen.getByLabelText('Plan notes for future qualified review (not automatically graded)'),
    { target: { value: 'Everything looks good.' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save and review plan' }))
  expect(lastEvidence(act, 'ihc-validation')?.passed).toBe(false)
  choose('Intended use and preparation', 'defined')
  choose('Case-set design', 'range')
  choose('Comparison method', 'validated')
  choose('Acceptance criteria', 'prespecified')
  choose('Unexpected results', 'investigate')
  choose('Clinical introduction', 'review')
  fireEvent.click(screen.getByRole('button', { name: 'Save and review plan' }))
  expect(lastEvidence(act, 'ihc-validation')?.passed).toBe(true)
  await waitFor(() => expect(screen.getByText('Exercise evidence recorded.')).toBeTruthy())
})
it('will not complete a control strategy without the low-expression control', async () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Controls strategy', exact: true }))
  fireEvent.click(screen.getByLabelText('Include strong positive'))
  fireEvent.click(screen.getByLabelText('Include negative reagent comparison'))
  choose('Low-expression external tissue', 'sensitivity')
  choose('Represented internal positive element', 'preanalytic')
  choose('Negative reagent comparison', 'background')
  choose('Clearly marked on-slide control', 'delivery')
  choose('Characterized tissue microarray', 'range')
  fireEvent.click(screen.getByRole('button', { name: 'Run and assess control strategy' }))
  expect(lastEvidence(act, 'ihc-controls')?.passed).toBe(false)
  fireEvent.click(screen.getByLabelText('Include low-expression positive'))
  fireEvent.click(screen.getByRole('button', { name: 'Run and assess control strategy' }))
  expect(lastEvidence(act, 'ihc-controls')?.passed).toBe(true)
  await waitFor(() => expect(screen.getByText('Shared simulated microscope')).toBeTruthy())
})
it('records manual completion only after the observable program is performed', async () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Manual run', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate completed manual run' }))
  expect(lastEvidence(act, 'ihc-manual')?.passed).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Start a fresh practice run' }))
  fireEvent.click(
    screen.getByLabelText('Block identity, requested marker and tissue selection reconciled'),
  )
  for (const step of RUN_STEPS) {
    choose('Next manual action', step)
    fireEvent.click(screen.getByRole('button', { name: 'Perform action', exact: true }))
  }
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate completed manual run' }))
  expect(lastEvidence(act, 'ihc-manual')?.passed).toBe(true)
  expect(act.mock.calls.filter((call) => call[1]?.checkId === 'ihc-manual-action')).toHaveLength(
    RUN_STEPS.length,
  )
  expect(lastEvidence(act, 'ihc-manual')?.program).toContain('primary > wash > detect')
  await waitFor(() => expect(screen.getByText('Shared simulated microscope')).toBeTruthy())
  expect(RUN_LABELS['select-block']).toContain('adjacent')
})
it('does not accept a target-positive ISH run without specimen-integrity evidence', async () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'ISH workflows', exact: true }))
  for (const step of ['prepare', 'pretreat', 'hybridize', 'stringency', 'detect', 'controls']) {
    choose('Next workflow action', step)
    fireEvent.click(screen.getByRole('button', { name: 'Perform action', exact: true }))
  }
  fireEvent.click(screen.getByLabelText('Known target-positive control'))
  fireEvent.click(screen.getByLabelText('Negative probe / background control'))
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate ISH workflow' }))
  expect(lastEvidence(act, 'ihc-ish')?.passed).toBe(false)
  fireEvent.click(screen.getByLabelText('Specimen RNA integrity control'))
  fireEvent.click(screen.getByRole('button', { name: 'Evaluate ISH workflow' }))
  expect(lastEvidence(act, 'ihc-ish')?.passed).toBe(true)
  await waitFor(() => expect(screen.getByText('Shared simulated microscope')).toBeTruthy())
})

it('requires molecular-stage exploration as well as correct mechanism choices', () => {
  const act = setup()
  choose('Can retrieval repair an irreversibly lost target?', 'no')
  choose('What does a biotin-free polymer avoid?', 'biotin')
  choose('AEC finishing decision', 'aqueous')
  fireEvent.click(screen.getByRole('button', { name: 'Check molecular reasoning' }))
  expect(lastEvidence(act, 'ihc-theory')?.passed).toBe(false)
  for (const button of screen
    .getAllByRole('button')
    .filter((b) => /^[1-5]\. /.test(b.textContent ?? '')))
    fireEvent.click(button)
  fireEvent.click(screen.getByRole('button', { name: 'Check molecular reasoning' }))
  expect(lastEvidence(act, 'ihc-theory')?.passed).toBe(true)
})
it('rejects the disordered automated program, then accepts corrected order and reagent loading', () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Automated run', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Execute and evaluate automated run' }))
  expect(lastEvidence(act, 'ihc-automated')?.passed).toBe(false)
  fireEvent.click(
    screen.getByLabelText('Block identity, requested marker and tissue selection reconciled'),
  )
  fireEvent.click(screen.getByLabelText('Reagent identity and lot registered against the program'))
  RUN_STEPS.forEach((step, i) => choose(`Step ${i + 1}`, step))
  fireEvent.click(screen.getByRole('button', { name: 'Execute and evaluate automated run' }))
  expect(lastEvidence(act, 'ihc-automated')?.passed).toBe(true)
})
it.each([
  ['Retrieval optimization', 'ihc-retrieval'],
  ['Checkerboard titration', 'ihc-checkerboard'],
])('records a measured condition for %s rather than passing an untouched grid', (label, id) => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: label, exact: true }))
  expect(lastEvidence(act, id)).toBeUndefined()
  fireEvent.click(screen.getByRole('button', { name: 'Run comparison grid' }))
  const acceptable = screen
    .getAllByRole('button')
    .filter(
      (b) =>
        b.className.includes('ihc-grid-cell') && b.textContent?.includes('within exercise rubric'),
    )
  const ranked = acceptable
    .map((button) => ({
      button,
      utility: Number(button.textContent!.match(/utility ([\d.]+)/)?.[1]),
    }))
    .sort((a, b) => b.utility - a.utility)
  expect(ranked.length).toBeGreaterThan(0)
  fireEvent.click(ranked[0].button)
  fireEvent.click(screen.getByRole('button', { name: 'Defend selected condition' }))
  expect(lastEvidence(act, id)?.passed).toBe(true)
  expect(lastEvidence(act, id)?.signal).toBeGreaterThan(0)
})
it('requires a changed preanalytic history and a bounded interpretation', () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Preanalytic sensitivity', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Run matched comparison' }))
  choose('What does this comparison establish?', 'bounded')
  fireEvent.click(screen.getByRole('button', { name: 'Record interpretation' }))
  expect(lastEvidence(act, 'ihc-preanalytic')?.passed).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Load aged section' }))
  fireEvent.click(screen.getByRole('button', { name: 'Run matched comparison' }))
  choose('What does this comparison establish?', 'bounded')
  fireEvent.click(screen.getByRole('button', { name: 'Record interpretation' }))
  expect(lastEvidence(act, 'ihc-preanalytic')?.passed).toBe(true)
  expect(lastEvidence(act, 'ihc-preanalytic')?.changedSignal).toBeLessThan(
    lastEvidence(act, 'ihc-preanalytic')?.referenceSignal,
  )
})
it('requires host separation and single-target controls before a multiplex composite', () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Double & multiplex', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Challenge the channel design' }))
  expect(lastEvidence(act, 'ihc-multiplex')?.passed).toBe(false)
  choose('Primary B host', 'rabbit')
  fireEvent.click(screen.getByLabelText('Single-target controls included'))
  fireEvent.click(
    screen.getByLabelText('Distinct chromogens or validated fluorescence channel separation'),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Challenge the channel design' }))
  expect(lastEvidence(act, 'ihc-multiplex')?.passed).toBe(true)
})
it('requires an inspected discriminating test before the supported single change and valid repeat', () => {
  const act = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Troubleshooting', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Repeat and verify' }))
  expect(lastEvidence(act, 'ihc-investigation')?.passed).toBe(false)
  choose('First discriminating investigation', 'compatibility')
  choose('One supported change or comparison', 'compatible')
  fireEvent.click(screen.getByRole('button', { name: 'Repeat and verify' }))
  expect(lastEvidence(act, 'ihc-investigation')?.passed).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Inspect investigation result' }))
  fireEvent.click(screen.getByRole('button', { name: 'Repeat and verify' }))
  expect(lastEvidence(act, 'ihc-investigation')?.passed).toBe(true)
  expect(lastEvidence(act, 'ihc-investigation')?.repeatControls).toBe(true)
})
