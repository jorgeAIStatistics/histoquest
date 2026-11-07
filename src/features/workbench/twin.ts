import { WORKBENCH as W } from '../../sim/params/workbench'
import type { Controls, WorkbenchRun } from './schema'
import { createScenario } from '../../sim/core/scenarios'
import { reduceEvent } from '../../sim/core/replay'
import type { StationId, SimEvent } from '../../sim/core/events'
import { createTwin } from '../../sim/specimen/initial'
import { PROCESS as P } from '../../sim/params/process'
import { PROTOCOL_BY_ID } from '../../content/lab/protocols'
import { PROTOCOL_PARAMETERS } from '../../sim/params/protocols'
import { stationQuality } from '../../sim/scoring/assess'

export type WorkbenchSlide = 'he' | 'special' | 'ihc'
const archetypes = { skin: 'skin-ellipse', colon: 'colon-biopsy', bone: 'bone-core' }
const fragments = { skin: 3, colon: 4, bone: 1 }
export const WORKBENCH_STATIONS: StationId[] = [
  'accessioning',
  'grossing',
  'fixation',
  'processing',
  'embedding',
  'microtomy',
  'he',
  'special',
  'ihc',
  'quality',
]

/** Legacy decisions expand into disclosed synthetic events. Free Lab exposes each operation separately. */
export function workbenchTwin(run: WorkbenchRun, view: WorkbenchSlide = 'he') {
  const c = run.controls
  const scenario = {
    ...createScenario(run.seed, archetypes[run.caseId], 1),
    discrepancy: 'dob-mismatch',
    fragments: fragments[run.caseId],
    request: 'routine' as const,
    faults: ['control-failure'],
    targetPresent: true,
  }
  let t = createTwin(scenario)
  const act = (station: StationId, intent: string, params: SimEvent['params'] = {}) => {
    t = reduceEvent(t, { station, intent, params, sequence: t.events.length, t: t.time })
  }
  if (c.identity === 'hold') {
    act('accessioning', 'identity.hold')
    act('accessioning', 'identity.resolve', {
      authorized: true,
      documentation: 'Curated case: authorized source supplies corrected identifiers.',
    })
    act('accessioning', 'identity.accept')
  }
  if (c.identity === 'accept') act('accessioning', 'identity.accept')
  if (c.identity === 'relabel') act('accessioning', 'identity.relabel')
  if (c.thickness !== null)
    act('grossing', 'gross.sample', {
      thickness: c.thickness,
      fragments: c.fragments ?? 0,
      cassette: 'biopsy',
      extraction: true,
      ink: 'blue',
      key: c.sampling ?? '',
      crowding: 0,
    })
  if (c.fixation)
    act('fixation', 'fixation.run', {
      hours: c.fixation === 'rush' ? W['workbench.rushed-fixation'] : P['fixation.hours'],
      temperature: c.fixation === 'heat' ? W['workbench.excess-heat'] : P['fixation.temperature'],
      ratio: P['fixation.ratio'],
      fixative: 'nbf',
      ischemia: c.fixation === 'heat' ? W['workbench.heat-injury-proxy'] : 0,
    })
  if (run.caseId === 'bone' && c.decalcification)
    act('decalcification', 'decalcification.run', {
      agent:
        c.decalcification === 'edta'
          ? 'edta'
          : c.decalcification === 'acid'
            ? 'strong-acid'
            : 'none',
      hours: c.decalcification === 'edta' ? W['workbench.chelation'] : W['workbench.acid'],
      endpoint: c.decalcification === 'none' ? 'none' : 'radiographic',
    })
  for (const stage of c.sequence ?? [])
    act('processing', 'processing.step', {
      reagent: { dehydrate: 'alcohol', clear: 'clearant', infiltrate: 'paraffin' }[stage],
      minutes:
        c.schedule === 'biopsy' && run.caseId !== 'colon'
          ? W['workbench.rapid-processing']
          : P['processing.minutes'],
      temperature:
        stage === 'infiltrate' ? P['processing.wax-temperature'] : P['fixation.temperature'],
      concentration: 100,
      exhaustion: 0,
      vacuum: true,
    })
  if (c.orientation)
    for (let i = 0; i < t.gross.fragments; i++)
      act('embedding', 'embedding.place', {
        piece: `A1-${i + 1}`,
        x: i * W['workbench.piece-spacing'],
        z: c.sampling === 'random' ? W['workbench.unaligned-depth'] : 0,
        rx:
          c.orientation === (run.caseId === 'bone' ? 'longitudinal' : 'profile')
            ? 0
            : W['workbench.wrong-plane'],
        ry: c.sampling === 'enface' ? W['workbench.enface-tilt'] : 0,
      })
  if (c.section !== null) {
    if (!c.safety) act('microtomy', 'instrument.set', { locked: false, guarded: false })
    act('microtomy', 'instrument.set', {
      thickness: c.section,
      blockTemperature:
        c.block === 'conditioned' ? P['microtomy.block-temperature'] : W['workbench.warm-block'],
      sharpness: c.blade === 'sound' ? 1 : W['workbench.nicked-blade'],
      clamp: 1,
    })
    act('microtomy', 'block.mount')
    act('microtomy', 'instrument.set', { locked: false, guarded: false })
    act('microtomy', 'microtomy.cut')
    act('microtomy', 'instrument.set', { locked: true, guarded: true })
    act('bath', 'bath.float', {
      clean: true,
      gentle: true,
      temperature: P['bath.temperature'],
      minutes: P['bath.minutes'],
    })
    act('bath', 'section.pickup', { charged: true, label: `${scenario.accession}-A1-L1` })
    act('drying', 'drying.run', {
      minutes: P['drying.minutes'],
      temperature: P['drying.temperature'],
    })
  }
  if (c.dewax) {
    act('he', 'stain.step', { reagent: 'dewax', minutes: P['he.dewax-time'] })
    act('he', 'stain.step', { reagent: 'hydrate', minutes: P['he.hydrate-time'] })
  }
  if (view === 'he') {
    for (const reagent of c.nuclei ? ['hematoxylin', 'differentiate', 'blue'] : [])
      act('he', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
    if (c.eosin) act('he', 'stain.step', { reagent: 'eosin', minutes: P['he.eosin-time'] })
  }
  if (view === 'special' && c.stain) {
    const id = { pas: 'pas', alcian: 'alcian-blue', iron: 'prussian-blue', oil: 'oil-red-o' }[
      c.stain
    ]
    const protocol = PROTOCOL_BY_ID[id]
    for (const step of protocol?.steps ?? [])
      act('special', 'special.step', {
        protocol: id,
        step: step.id,
        minutes: PROTOCOL_PARAMETERS.find((p) => p.id === step.durationParam)?.value as number,
        ph: W['workbench.alcian-ph'],
      })
    act('special', 'special.controls', { positive: c.positive === true, negative: true })
  }
  if (view === 'ihc' && c.ihcAction) {
    act('ihc', 'ihc.retrieve', {
      minutes: P['ihc.retrieval-time'],
      temperature: P['ihc.retrieval-temperature'],
      ph: run.caseId === 'colon' ? W['workbench.gut-retrieval-ph'] : P['ihc.retrieval-ph'],
    })
    act('ihc', 'ihc.primary', {
      minutes: P['ihc.primary-minutes'],
      dilution: P['ihc.primary-dilution'],
      blocked: true,
      humid: true,
      washed: true,
    })
    act('ihc', 'ihc.detect', {
      minutes: P['ihc.detect-minutes'],
      chromogenMinutes: P['ihc.chromogen-minutes'],
      compatible: c.ihcAction === 'repeat',
    })
    act('ihc', 'ihc.controls', {
      positive: true,
      lowPositive: true,
      negative: true,
      faultCorrected: c.ihcAction === 'repeat',
    })
    t.ihc.location = c.location ?? scenario.targetLocalization
  }
  if (c.mount) {
    for (const reagent of ['dehydrate', 'clear'])
      act('he', 'stain.step', { reagent, minutes: P[`he.${reagent}-time`] })
    act('coverslip', 'coverslip.apply', {
      medium: 'resinous',
      volume: P['mount.volume'],
      angle: W['workbench.mount-angle'],
    })
  }
  if (c.handoff) act('quality', c.handoff === 'hold' ? 'quality.hold' : 'quality.release')
  return t
}
export function workbenchQuality(run: WorkbenchRun, station: number) {
  const t = workbenchTwin(run, station === 7 ? 'special' : station === 8 ? 'ihc' : 'he')
  const quality = Math.round(stationQuality(t, WORKBENCH_STATIONS[station]) * 100)
  const safety = t.issues.some((i) => i.severity === 'critical') ? 0 : 100
  return { quality, safety }
}
export function idealControls(caseId: WorkbenchRun['caseId']): Controls {
  return {
    identity: 'hold',
    thickness: W['workbench.thickness'],
    fragments: fragments[caseId],
    sampling: 'profile',
    fixation: 'validated',
    decalcification: 'edta',
    schedule: caseId === 'skin' ? 'routine' : caseId === 'colon' ? 'biopsy' : 'bone',
    sequence: ['dehydrate', 'clear', 'infiltrate'],
    orientation: caseId === 'bone' ? 'longitudinal' : 'profile',
    section: 4,
    blade: 'sound',
    block: 'conditioned',
    safety: true,
    dewax: true,
    nuclei: true,
    eosin: true,
    mount: true,
    stain: caseId === 'skin' ? 'pas' : caseId === 'colon' ? 'alcian' : 'iron',
    positive: true,
    ihcAction: 'repeat',
    location: caseId === 'colon' ? 'cytoplasmic' : 'nuclear',
    handoff: 'release',
  }
}
