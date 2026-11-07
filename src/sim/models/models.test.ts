import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { LabRecord } from '../../store/labSchema'
import { SOURCE_BY_ID } from '../../content/sources'
import { nominalEvent, reduceEvent, replayRun } from '../core/replay'
import { createScenario } from '../core/scenarios'
import { referenceTwin } from '../core/reference'
import { average } from '../core/units'
import { PROCESS as P, PROCESS_PARAMETERS } from '../params/process'
import { createTwin } from '../specimen/initial'
import { slideAppearance } from '../specimen/appearance'
import { assessTwin, releaseProblems } from '../scoring/assess'
import type { Twin } from '../specimen/types'
import { decalcify, fix, updateIntegrity } from './preservation'
import { processStep } from './processing'
import { cut, dry, floatSection, representation, trim } from './sectioning'
import { detect, evaluateControls, primary, retrieve } from './ihc'
import { stainStep } from './staining'
import { specialControls, specialStep } from './special'
import { PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { PROTOCOL_PARAMETERS } from '../params/protocols'

const checkOptions = { numRuns: 60, seed: 20261107 }
const finite = (min: number, max: number) =>
  fc.double({ min, max, noNaN: true, noDefaultInfinity: true })
const makeScenario = (archetype = 'skin-ellipse') => ({
  ...createScenario('MODEL-TEST', archetype),
  faults: [],
  discrepancy: 'none',
  request: 'routine' as const,
})
const make = (archetype = 'skin-ellipse') => createTwin(makeScenario(archetype))
const fixedMean = (t: Twin) => average(t.regions.map((region) => region.fixed))

function supportedBlock(): Twin {
  const t = make()
  t.gross.thickness = P['reference.gross-thickness']
  t.regions.forEach((region) => {
    region.fixed = 1
    region.water = 0
    region.wax = 1
  })
  t.embedding.pieces = [
    { id: 'A1', x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, thickness: t.gross.thickness },
  ]
  t.embedding.representation = 1
  t.block.temperature = P['microtomy.block-temperature']
  return t
}

describe('illustrative parameter registry', () => {
  it('names every registered coefficient with units, provenance and limits', () => {
    expect(new Set(PROCESS_PARAMETERS.map((parameter) => parameter.id)).size).toBe(
      PROCESS_PARAMETERS.length,
    )
    for (const parameter of PROCESS_PARAMETERS) {
      expect(Number.isFinite(parameter.value)).toBe(true)
      expect(parameter.unit.length).toBeGreaterThan(0)
      expect(parameter.illustrative).toBe(true)
      expect(parameter.accessStatus).toBe('illustrative')
      expect(parameter.note).toContain('not a validated laboratory SOP')
      for (const id of parameter.sourceIds) expect(SOURCE_BY_ID[id]).toBeDefined()
    }
    expect(
      ['quality', 'process', 'safety', 'documentation', 'efficiency'].reduce(
        (sum, key) => sum + P[`quality.weight-${key}`],
        0,
      ),
    ).toBeCloseTo(1)
  })
})

describe('fixation and preservation', () => {
  it('never fixes less tissue when exposure increases at unchanged conditions', () => {
    fc.assert(
      fc.property(finite(0, 36), finite(0, 36), finite(0.2, 12), (first, additional, thickness) => {
        const short = make()
        const long = make()
        short.gross.thickness = thickness
        long.gross.thickness = thickness
        fix(short, first, P['fixation.temperature'], P['fixation.ratio'], 'nbf', 0)
        fix(long, first + additional, P['fixation.temperature'], P['fixation.ratio'], 'nbf', 0)
        short.regions.forEach((region, i) =>
          expect(long.regions[i].fixed + Number.EPSILON).toBeGreaterThanOrEqual(region.fixed),
        )
        expect(long.regions.at(-1)!.fixed).toBeLessThanOrEqual(long.regions[0].fixed)
      }),
      checkOptions,
    )
  })

  it('thicker specimens do not gain a fixation advantage and access precedes stabilization', () => {
    fc.assert(
      fc.property(finite(0.1, 30), finite(0.2, 5), finite(0, 7), (hours, thickness, extra) => {
        const thin = make()
        const thick = make()
        thin.gross.thickness = thickness
        thick.gross.thickness = thickness + extra
        fix(thin, hours, 22, 15, 'nbf', 0)
        fix(thick, hours, 22, 15, 'nbf', 0)
        expect(fixedMean(thin) + Number.EPSILON).toBeGreaterThanOrEqual(fixedMean(thick))
        for (const region of thin.regions)
          expect(region.fixed).toBeLessThanOrEqual(region.access + Number.EPSILON)
      }),
      checkOptions,
    )
  })

  it('cannot undo ischemic, acid, or drying injury with a later exposure', () => {
    const t = supportedBlock()
    fix(t, 12, 22, 15, 'nbf', 6)
    const ischemic = t.ihc.preservation
    fix(t, 1, 22, 15, 'nbf', 0)
    expect(t.ihc.preservation).toBeLessThanOrEqual(ischemic)
    decalcify(t, 'strong-acid', 10, 'chemical')
    const damage = t.decal.damage
    decalcify(t, 'strong-acid', -10, 'chemical')
    expect(t.decal.damage).toBe(damage)
    cut(t)
    t.block.sections.at(-1)!.charged = true
    dry(t, 90, 20)
    const afterDrying = t.ihc.preservation
    updateIntegrity(t)
    expect(t.ihc.preservation).toBeLessThanOrEqual(afterDrying)
  })

  it('removes mineral monotonically but strong acid can sacrifice target preservation', () => {
    const edta = make('bone-core')
    const acid = make('bone-core')
    decalcify(edta, 'edta', 20, 'radiographic')
    decalcify(acid, 'strong-acid', 20, 'radiographic')
    expect(average(acid.regions.map((region) => region.mineral))).toBeLessThan(
      average(edta.regions.map((region) => region.mineral)),
    )
    expect(acid.ihc.preservation).toBeLessThan(edta.ihc.preservation)
    const residual = edta.regions.map((region) => region.mineral)
    decalcify(edta, 'edta', 20, 'radiographic')
    edta.regions.forEach((region, i) => expect(region.mineral).toBeLessThanOrEqual(residual[i]))
  })
})

describe('processing composition and order', () => {
  it('conserves each compartment total across arbitrary valid processing sequences', () => {
    const step = fc.record({
      reagent: fc.constantFrom('alcohol', 'clearant', 'paraffin', 'unknown'),
      minutes: finite(0, 200),
      temperature: finite(15, 85),
      concentration: finite(0, 100),
      exhaustion: finite(0, 1),
      vacuum: fc.boolean(),
    })
    fc.assert(
      fc.property(fc.array(step, { minLength: 1, maxLength: 16 }), (steps) => {
        const t = make()
        for (const entry of steps) {
          processStep(
            t,
            entry.reagent,
            entry.minutes,
            entry.temperature,
            entry.concentration,
            entry.exhaustion,
            entry.vacuum,
          )
          for (const region of t.regions) {
            const values = [region.water, region.alcohol, region.clearant, region.wax]
            expect(values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12)
            for (const value of values) {
              expect(value).toBeGreaterThanOrEqual(0)
              expect(value).toBeLessThanOrEqual(1)
            }
          }
        }
      }),
      checkOptions,
    )
  })

  it('requires compatible replacement fluid and sufficient reagent activity', () => {
    const wrong = make()
    const good = make()
    const exhausted = make()
    for (const reagent of ['paraffin', 'clearant', 'alcohol'])
      processStep(wrong, reagent, 45, 60, 100, 0, true)
    for (const reagent of ['alcohol', 'clearant', 'paraffin']) {
      processStep(good, reagent, 45, 60, 100, 0, true)
      processStep(exhausted, reagent, 45, 60, 100, 1, true)
    }
    expect(average(wrong.regions.map((region) => region.wax))).toBe(0)
    expect(average(exhausted.regions.map((region) => region.wax))).toBe(0)
    expect(average(good.regions.map((region) => region.wax))).toBeGreaterThan(
      P['quality.preservation-min'],
    )
    good.processing.heatDamage = 0.5
    const injury = good.processing.heatDamage
    processStep(good, 'paraffin', -200, 100, 100, 0, true)
    expect(good.processing.heatDamage).toBeGreaterThanOrEqual(injury)
  })
})

describe('mechanical sections and slide boundaries', () => {
  it('propagates warmth/dullness into compression and instability into chatter', () => {
    const baseline = supportedBlock()
    const warm = supportedBlock()
    const loose = supportedBlock()
    warm.block.temperature += 20
    warm.instrument.sharpness = 0.25
    loose.instrument.clamp = 0.2
    loose.instrument.angle += 5
    const reference = cut(baseline)
    expect(cut(warm).compression).toBeGreaterThan(reference.compression)
    expect(cut(loose).chatter).toBeGreaterThan(reference.chatter)
    expect(warm.block.sections.at(-1)!.knifeLines.length).toBeGreaterThan(0)
  })

  it('conserves available tissue, tracks edge wear locally and retains foreign accession', () => {
    fc.assert(
      fc.property(finite(0, 6000), (amount) => {
        const t = supportedBlock()
        const before = t.block.remaining
        trim(t, amount)
        expect(t.block.remaining + t.block.trimmed).toBeCloseTo(before, 10)
        expect(t.block.remaining).toBeGreaterThanOrEqual(0)
      }),
      checkOptions,
    )
    const t = supportedBlock()
    t.instrument.bladePosition = 2
    cut(t)
    expect(t.block.bladeWear[2]).toBeGreaterThan(0)
    expect(t.block.bladeWear[1]).toBe(0)
    floatSection(t, 30, 2, false, false)
    expect(t.block.sections.at(-1)!.floaters[0].accession).toBe('TRAIN-PREVIOUS-ACCESSION')
    expect(t.block.sections.at(-1)!.folds).toBeGreaterThan(0)
  })

  it('responds to embedding plane and consumes tissue without reversing depth', () => {
    const t = supportedBlock()
    expect(representation(t)).toBe(1)
    t.embedding.pieces[0].rx = 60
    expect(representation(t)).toBeLessThan(1)
    const before = t.block.trimmed
    trim(t, -500)
    expect(t.block.trimmed).toBe(before)
  })

  it('archives an H&E section before a clean new slide instead of overlaying chemistry', () => {
    const t = referenceTwin(makeScenario())
    const appearance = structuredClone(slideAppearance(t))
    const preservation = t.ihc.preservation
    const masking = t.ihc.masking
    const id = t.block.sections.at(-1)!.slideId
    expect(t.staining.hematoxylin).toBeGreaterThan(0)
    cut(t, 'ihc')
    expect(t.archivedSlides).toEqual([{ id, appearance }])
    expect(t.staining.hematoxylin).toBe(0)
    expect(t.staining.history).toEqual([])
    expect(t.staining.controls.valid).toBe(false)
    expect(t.ihc.dab).toBe(0)
    expect(t.ihc.preservation).toBe(preservation)
    expect(t.ihc.masking).toBe(masking)
    expect(t.mounting.mounted).toBe(false)
    stainStep(t, 'hematoxylin', 10)
    expect(t.archivedSlides[0].appearance).toEqual(appearance)
    cut(t)
    expect(t.archivedSlides).toHaveLength(1)
  })
})

describe('stain access and IHC controls', () => {
  it('retains excessive special-stain exposure and wrong pH after later washes', () => {
    const durations = Object.fromEntries(
      PROTOCOL_PARAMETERS.map((parameter) => [parameter.id, parameter.value as number]),
    )
    for (const [id, wrongPH, excessive] of [
      ['pas', false, true],
      ['alcian-blue', true, false],
    ] as const) {
      const protocol = PROTOCOL_BY_ID[id]
      expect(protocol).toBeDefined()
      const t = supportedBlock()
      cut(t)
      t.block.sections.at(-1)!.pickedUp = true
      for (const step of protocol.steps) {
        const wrong = step.action === 'stain'
        specialStep(
          t,
          id,
          step.id,
          durations[step.durationParam] * (wrong && excessive ? 6 : 1),
          wrong && wrongPH ? 7 : P['special.alcian-standard-ph'],
        )
      }
      specialControls(t, true, true)
      expect(t.staining.reactionRetention).toBeLessThan(0.1)
      expect(t.staining.specialIntensity).toBeLessThan(P['special.control-minimum'])
      expect(t.staining.controls.valid).toBe(false)
    }
  })
  it('does not stain inaccessible paraffin tissue and responds to differentiation', () => {
    const t = make()
    stainStep(t, 'hematoxylin', 100)
    expect(t.staining.hematoxylin).toBe(0)
    stainStep(t, 'dewax', 6)
    stainStep(t, 'hydrate', 3)
    stainStep(t, 'hematoxylin', 5)
    const before = t.staining.hematoxylin
    expect(before).toBeGreaterThan(0)
    stainStep(t, 'differentiate', 1)
    expect(t.staining.hematoxylin).toBeLessThan(before)
  })

  it('saturates chromogen monotonically rather than growing without bound', () => {
    fc.assert(
      fc.property(finite(0, 40), finite(0, 100), (minutes, more) => {
        const short = make()
        const long = make()
        primary(short, 100, 30, true, true, true, 0)
        primary(long, 100, 30, true, true, true, 0)
        detect(short, 20, minutes, true)
        detect(long, 20, minutes + more, true)
        expect(long.ihc.dab + Number.EPSILON).toBeGreaterThanOrEqual(short.ihc.dab)
        expect(long.ihc.dab).toBeLessThanOrEqual(P['ihc.od-saturation'])
      }),
      checkOptions,
    )
  })

  it('cannot undo retrieval damage or restore lost antigen by a second retrieval', () => {
    const t = supportedBlock()
    cut(t)
    t.block.sections.at(-1)!.adhesion = 1
    retrieve(t, 80, 95, 6)
    const damage = t.ihc.damage
    const adhesion = t.block.sections.at(-1)!.adhesion
    retrieve(t, 0, 95, 6)
    expect(t.ihc.damage).toBeGreaterThanOrEqual(damage)
    expect(t.block.sections.at(-1)!.adhesion).toBeLessThanOrEqual(adhesion)
    primary(t, 1, 100, true, true, true, 0)
    expect(t.ihc.primary).toBeLessThanOrEqual(1 - damage)
    t.ihc.preservation = 0
    retrieve(t, 20, 95, 6)
    primary(t, 1, 100, true, true, true, 0)
    expect(t.ihc.primary).toBe(0)
  })

  it('requires positive, low-positive and negative controls and rejects reagent failure/background', () => {
    const t = make()
    primary(t, 100, 30, true, true, true, 0)
    detect(t, 20, 5, true)
    evaluateControls(t, true, true, true, false)
    expect(t.ihc.valid).toBe(true)
    evaluateControls(t, true, false, true, false)
    expect(t.ihc.valid).toBe(false)
    t.scenario.faults.push('control-failure')
    evaluateControls(t, true, true, true, false)
    expect(t.ihc.positive).toBe(0)
    expect(t.ihc.valid).toBe(false)
    primary(t, 1, 30, false, false, false, 0)
    detect(t, 20, 5, true)
    evaluateControls(t, true, true, true, true)
    expect(t.ihc.valid).toBe(false)
    expect(t.ihc.negative).toBeGreaterThan(P['ihc.background-max'])
  })
})

describe('event history, release and reproducibility', () => {
  it('keeps seeded scenarios and every replay prefix deterministic without mutation', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (seed) => {
        const scenario = createScenario(seed, 'skin-ellipse', 3)
        expect(createScenario(seed, 'skin-ellipse', 3)).toEqual(scenario)
        const t = createTwin(scenario)
        const before = structuredClone(t)
        const event = nominalEvent('fixation', 'fixation.run', { hours: 12, fixative: 'nbf' })
        const record: LabRecord = {
          id: 'test',
          version: 1,
          seed,
          archetype: scenario.archetype,
          difficulty: 3,
          mode: 'free',
          startedAt: 'not-read-by-replay',
          title: 'Synthetic test',
          events: [event],
        }
        expect(replayRun(record)).toEqual(replayRun(structuredClone(record)))
        expect(replayRun(record, 0)).toEqual(t)
        reduceEvent(t, event)
        expect(t).toEqual(before)
      }),
      checkOptions,
    )
  })

  it('retains critical history even after a safe action or a hold', () => {
    let t = make()
    t = reduceEvent(
      t,
      nominalEvent('microtomy', 'instrument.set', { locked: false, guarded: false }, 0, 0),
    )
    t = reduceEvent(t, nominalEvent('microtomy', 'block.mount', {}, 0, 1))
    t = reduceEvent(
      t,
      nominalEvent('microtomy', 'instrument.set', { locked: true, guarded: true }, 0, 2),
    )
    t = reduceEvent(t, nominalEvent('quality', 'quality.hold', {}, 0, 3))
    expect(t.issues.some((issue) => issue.id === 'unsafe-sharps')).toBe(true)
    t.issues[0].resolved = true
    expect(assessTwin(t).critical).toHaveLength(1)
    expect(assessTwin(t).passed).toBe(false)
  })

  it('does not release zero-thickness or wholly missing tissue by averaging other features', () => {
    const t = referenceTwin(makeScenario())
    t.block.sections.at(-1)!.thickness = 0
    expect(releaseProblems(t)).toContain('No usable tissue section')
    t.block.sections.at(-1)!.thickness = 4
    t.block.sections.at(-1)!.holes = 1
    expect(releaseProblems(t)).toContain('No usable tissue section')
  })
})
