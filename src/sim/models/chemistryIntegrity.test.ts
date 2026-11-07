import { expect, it } from 'vitest'
import { referenceTwin } from '../core/reference'
import { createScenario } from '../core/scenarios'
import { createTwin } from '../specimen/initial'
import { slideAppearance } from '../specimen/appearance'
import { PROCESS as P } from '../params/process'
import { primary, retrieve, detect, evaluateControls } from './ihc'
import { hybridize, ishControls, stringencyWash } from './ish'
import { targetIntegrity } from './targetIntegrity'
import { runSpecialExperiment, prepareSpecialSection } from './specialExperiments'
import { specialStep, specialControls } from './special'
import {
  defaultCondition,
  runIhcExperiment,
  runIshExperiment,
  multiplexAppearance,
} from './ihcExperiments'
import { sampleSlide, createSlideField, DEFAULT_OPTICAL_VIEW } from '../../render2d/field'

const base = () =>
  referenceTwin({
    ...createScenario('CHEMISTRY-INTEGRITY', 'liver-core', 1),
    faults: [],
    targetPresent: true,
    discrepancy: 'none',
  })
const pixels = (
  appearance: ReturnType<typeof slideAppearance>,
  channel: 'composite' | 'probe' | 'nuclear' = 'composite',
) => {
  const field = createSlideField(appearance)
  return Array.from({ length: 300 }, (_, i) =>
    sampleSlide(field, 650 + (i % 20) * 30, 450 + Math.floor(i / 20) * 30, {
      ...DEFAULT_OPTICAL_VIEW,
      fluorescenceChannel: channel,
    }),
  )
}
it('cannot bind primary through residual paraffin and invalidates controls after further chemistry', () => {
  const t = createTwin(createScenario('NO-ACCESS', 'skin-ellipse'))
  primary(t, 100, 30, true, true, true, 0)
  expect(t.ihc.primary).toBe(0)
  detect(t, 20, 5, true)
  evaluateControls(t, true, true, true, false)
  expect(t.ihc.valid).toBe(false)
  const r = runIhcExperiment(base(), defaultCondition()).twin
  expect(r.ihc.valid).toBe(true)
  retrieve(r, 0, 95, 6)
  expect(r.ihc.valid).toBe(false)
  const retained = r.block.sections.at(-1)!.adhesion
  retrieve(r, 0, 95, 6)
  expect(r.block.sections.at(-1)!.adhesion).toBe(retained)
})
it('preserves irreversible target-class loss while separating it from retrieval access', () => {
  const t = base()
  t.ihc.preservation = 0.4
  const before = ['protein', 'rna', 'dna'].map((k) =>
    targetIntegrity(t, k as 'protein' | 'rna' | 'dna'),
  )
  retrieve(t, 20, 95, 6)
  expect(
    ['protein', 'rna', 'dna'].map((k) => targetIntegrity(t, k as 'protein' | 'rna' | 'dna')),
  ).toEqual(before)
  expect(before.every((v) => v > 0 && v <= 0.4)).toBe(true)
  t.ihc.preservation = 0
  expect(targetIntegrity(t, 'rna')).toBe(0)
})
it('separates FISH emission from DAB and shows independent nuclear/probe channels', () => {
  const a = runIshExperiment(base(), 'EBER', 1, true, true, true, 'FISH')
  const b = runIshExperiment(base(), 'EBER', 1, true, true, true, 'CISH')
  expect(a.passed).toBe(true)
  expect(a.appearance.dab).toBe(0)
  expect(a.appearance.fluorescence!.signal).toBeGreaterThan(0)
  expect(b.appearance.fluorescence).toBeUndefined()
  expect(b.appearance.dab).toBeGreaterThan(0)
  expect(pixels(a.appearance, 'probe')).not.toEqual(pixels(a.appearance, 'nuclear'))
  expect(sampleSlide(createSlideField(a.appearance), -1, -1)).toEqual([0, 0, 0])
  const noTarget = {
    ...a.appearance,
    targetPresent: false,
    fluorescence: { ...a.appearance.fluorescence!, background: 0 },
  }
  expect(
    pixels(noTarget, 'probe')
      .flat()
      .every((x) => x === 0),
  ).toBe(true)
  expect(
    pixels(noTarget, 'nuclear')
      .flat()
      .some((x) => x > 0),
  ).toBe(true)
})
it('requires DNA denaturation, checks sample integrity independently, and retains stringency signal loss', () => {
  expect(runIshExperiment(base(), 'generic DNA', 1, true, true, true, 'FISH').passed).toBe(false)
  expect(runIshExperiment(base(), 'generic DNA', 1, true, true, true, 'FISH', true).passed).toBe(
    true,
  )
  const t = base()
  t.ihc.preservation = 0
  hybridize(t, 'EBER', 30, 40, 1, 'FISH')
  stringencyWash(t, 1)
  ishControls(t, true, true, true)
  expect(t.ihc.positive).toBeGreaterThan(0)
  expect(t.ihc.internal).toBe(0)
  expect(t.ihc.valid).toBe(false)
  const bad = runIshExperiment(base(), 'EBER', 6, true, true, true, 'FISH')
  expect(bad.passed).toBe(false)
})
it('renders PAS digestion loss while preserving non-glycogen reaction and detects inactive enzyme', () => {
  const source = base(),
    snapshot = structuredClone(source)
  const pas = runSpecialExperiment(source, 'pas')
  const digested = runSpecialExperiment(source, 'pas-d')
  const inactive = runSpecialExperiment(source, 'pas-d', 'inactive-diastase')
  expect(source).toEqual(snapshot)
  expect(pas.twin.staining.controls.valid).toBe(true)
  expect(digested.twin.staining.controls.valid).toBe(true)
  expect(digested.twin.staining.specialGlycogen).toBeLessThan(pas.twin.staining.specialGlycogen!)
  expect(inactive.twin.staining.specialGlycogen).toBe(1)
  expect(inactive.twin.staining.controls.valid).toBe(false)
  expect(pixels(digested.appearance)).not.toEqual(pixels(pas.appearance))
  expect(digested.appearance.specialIntensity).toBeGreaterThan(0)
  expect(runSpecialExperiment(source, 'pas', 'omit-oxidation').twin.staining.controls.valid).toBe(
    false,
  )
})
it('does not erase a stained section when switching protocols and requires paired PAS-D control evidence', () => {
  const t = runSpecialExperiment(base(), 'pas-d').twin
  specialControls(t, true, true)
  expect(t.staining.controls.valid).toBe(false)
  const history = structuredClone(t.staining)
  specialStep(t, 'congo-red', 'dewax', 5, 2.5)
  expect(t.staining).toEqual(history)
  const remaining = t.block.remaining
  expect(prepareSpecialSection(t)).toBe(true)
  expect(t.block.remaining).toBeLessThan(remaining)
  expect(t.staining.protocol).toBe('')
  expect(Number.isFinite(t.time)).toBe(true)
  expect(t.archivedSlides.at(-1)!.appearance.special).toBe('pas-d')
})
it('distinguishes excessive silver background and wrong Alcian pH from a valid reaction', () => {
  expect(
    runSpecialExperiment(base(), 'gms', 'overdevelop').twin.staining.specialBackground,
  ).toBeGreaterThan(P['ihc.background-max'])
  expect(runSpecialExperiment(base(), 'alcian-blue', 'wrong-ph').twin.staining.controls.valid).toBe(
    false,
  )
  expect(
    runSpecialExperiment(base(), 'alcian-blue-1', 'wrong-ph').twin.staining.controls.valid,
  ).toBe(false)
})
it('retains mixed-compartment markers and composes two different predicted targets without mutation', () => {
  const a = runIhcExperiment(base(), { ...defaultCondition(), marker: 's100' })
  const b = runIhcExperiment(base(), { ...defaultCondition(), marker: 'cd3' })
  expect(a.appearance.localizations).toEqual(expect.arrayContaining(['nuclear', 'cytoplasmic']))
  const overlay = multiplexAppearance(a, b, true)
  expect(overlay.fluorescence!.secondary!.localizations).toContain('membranous')
  expect(a.appearance.fluorescence).toBeUndefined()
  expect(multiplexAppearance(a, b, false).secondaryChromogen).toBeDefined()
})

it('requires a section-specific molecular handoff record and never accepts stained material or complete target loss', async () => {
  const { releaseProblems } = await import('../scoring/assess')
  const { adjacentSection } = await import('./ihcExperiments')
  const t = base()
  t.scenario.request = 'molecular'
  adjacentSection(t)
  expect(releaseProblems(t).join(' ')).not.toContain('not mounted')
  expect(releaseProblems(t).join(' ')).toContain('Document the RNA/DNA request')
  t.events.push({
    sequence: t.events.length,
    t: t.time,
    station: 'quality',
    intent: 'practice.evidence',
    params: {
      checkId: 'molecular-preparation',
      sectionId: t.block.sections.at(-1)!.id,
      targetClass: 'rna',
      protocolReviewed: true,
      contaminationPlan: true,
      receivingReview: true,
      limitationsCommunicated: true,
    },
  })
  expect(releaseProblems(t)).toEqual([])
  t.staining.hematoxylin = 1
  expect(releaseProblems(t).join(' ')).toContain('unstained')
  t.staining.hematoxylin = 0
  t.ihc.preservation = 0
  expect(releaseProblems(t).join(' ')).toContain('Modeled target is lost')
})
it('does not restore an extracted lipid target by freezing a previously processed block', async () => {
  const { reduceEvent } = await import('../core/replay')
  const scenario = createScenario('LIPID-HISTORY', 'fatty-tissue', 1)
  const frozen = reduceEvent(createTwin(scenario), {
    sequence: 0,
    t: 0,
    station: 'frozen',
    intent: 'frozen.freeze',
    params: { temperature: P['frozen.temperature'], rate: P['frozen.rate'], biohazard: true },
  })
  expect(runSpecialExperiment(frozen, 'oil-red-o').twin.staining.controls.valid).toBe(true)
  frozen.processing.history.push({
    reagent: 'clearant',
    minutes: 60,
    temperature: 22,
    concentration: 100,
    exhaustion: 0,
  })
  expect(runSpecialExperiment(frozen, 'oil-red-o').twin.staining.specialIntensity).toBe(0)
})
it('cannot relabel existing DAB as a different marker or move its compartment', async () => {
  const { reduceEvent } = await import('../core/replay')
  const t = runIhcExperiment(base(), { ...defaultCondition(), marker: 'sox10' }).twin
  const change = {
    sequence: t.events.length,
    t: t.time,
    station: 'ihc' as const,
    intent: 'ihc.marker',
    params: { marker: 'cd3' },
  }
  const refused = reduceEvent(t, change)
  expect(refused.ihc.marker).toBe(t.ihc.marker)
  expect(refused.ihc.locations).toEqual(t.ihc.locations)
  expect(refused.ihc.dab).toBe(t.ihc.dab)
  expect(refused.notes.at(-1)).toContain('adjacent unstained section')
  const fresh = reduceEvent(refused, {
    ...change,
    sequence: refused.events.length,
    intent: 'ihc.prepare',
    params: {},
  })
  const selected = reduceEvent(fresh, { ...change, sequence: fresh.events.length })
  expect(selected.ihc.marker).toBe('CD3')
  expect(selected.ihc.locations).toContain('membranous')
  expect(selected.ihc.dab).toBe(0)
  expect(selected.archivedSlides.at(-1)!.appearance.target).toBe(t.ihc.marker)
})

it('refuses later retrieval, primary or shorter detection that would rewrite developed DAB or background', () => {
  const t = runIhcExperiment(base(), { ...defaultCondition(), blocked: false, humid: false }).twin
  const before = {
    dab: t.ihc.dab,
    background: t.ihc.background,
    edge: t.ihc.edge,
    primary: t.ihc.primary,
    damage: t.ihc.damage,
    adhesion: t.block.sections.at(-1)!.adhesion,
  }
  expect(before.dab).toBeGreaterThan(0)
  expect(before.background).toBeGreaterThan(0)
  expect(before.edge).toBeGreaterThan(0)
  detect(t, 0, 0, false)
  primary(t, 10000, 0, true, true, true, 0)
  retrieve(t, 0, 0, 6)
  expect({
    dab: t.ihc.dab,
    background: t.ihc.background,
    edge: t.ihc.edge,
    primary: t.ihc.primary,
    damage: t.ihc.damage,
    adhesion: t.block.sections.at(-1)!.adhesion,
  }).toEqual(before)
  expect(t.ihc.valid).toBe(false)
  expect(t.notes.slice(-3).every((note) => note.includes('adjacent unstained section'))).toBe(true)
})
it('retains prior unblocked binding and dry-edge history before development while permitting a real post-primary wash', () => {
  const dirty = runIhcExperiment(base(), defaultCondition(), [
    'select-block',
    'dewax',
    'hydrate',
  ]).twin
  primary(dirty, 100, 30, false, false, true, 0)
  const background = dirty.ihc.background,
    edge = dirty.ihc.edge
  primary(dirty, 100, 30, true, true, true, 0)
  expect(dirty.ihc.background).toBe(background)
  expect(dirty.ihc.edge).toBe(edge)
  const clean = runIhcExperiment(base(), defaultCondition(), [
    'select-block',
    'dewax',
    'hydrate',
  ]).twin
  primary(clean, 100, 30, true, true, false, 0)
  const unwashed = clean.ihc.background
  primary(clean, 100, 30, true, true, true, 0)
  expect(clean.ihc.background).toBeLessThan(unwashed)
  expect(clean.ihc.background).toBe(0)
})
it('requires a new section even after a failed zero-signal detection attempt', () => {
  const failed = runIhcExperiment(base(), { ...defaultCondition(), compatible: false }).twin
  expect(failed.ihc.dab).toBe(0)
  expect(failed.ihc.detectionApplied).toBe(true)
  detect(failed, 20, 5, true)
  expect(failed.ihc.dab).toBe(0)
  const repeat = runIhcExperiment(failed, defaultCondition())
  expect(repeat.twin.ihc.dab).toBeGreaterThan(0)
  expect(repeat.metrics.acceptable).toBe(true)
})
