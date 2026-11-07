import type { SimEvent, StationId } from './events'
import { reduceEvent } from './replay'
import { createTwin } from '../specimen/initial'
import type { Scenario, Twin } from '../specimen/types'
import { PROCESS as P } from '../params/process'

/** Reference is a replay of disclosed synthetic settings, not a clinical protocol or guaranteed normal specimen. */
export function referenceTwin(scenario: Scenario): Twin {
  let twin = createTwin(scenario)
  const act = (station: StationId, intent: string, params: SimEvent['params'] = {}) => {
    twin = reduceEvent(twin, {
      station,
      intent,
      params,
      t: twin.time,
      sequence: twin.events.length,
    })
  }
  act('accessioning', 'identity.hold')
  act('accessioning', 'identity.resolve', {
    authorized: true,
    documentation: 'Synthetic submitting team reconciled the source record.',
  })
  act('accessioning', 'identity.accept')
  act('grossing', 'gross.sample', {
    thickness: P['reference.gross-thickness'],
    fragments: scenario.fragments,
    cassette: 'biopsy',
    crowding: 0,
    key: 'A1: all submitted material in the requested plane',
    ink: 'blue',
    extraction: true,
  })
  act('fixation', 'fixation.run', {
    hours: P['fixation.hours'],
    temperature: P['fixation.temperature'],
    ratio: P['fixation.ratio'],
    fixative: 'nbf',
  })
  if (scenario.family === 'bone')
    act('decalcification', 'decalcification.run', {
      agent: 'edta',
      hours: P['reference.decalc-hours'],
      endpoint: 'radiographic',
    })
  for (const reagent of ['alcohol', 'clearant', 'paraffin'])
    act('processing', 'processing.step', {
      reagent,
      minutes: P['processing.minutes'],
      temperature:
        reagent === 'paraffin' ? P['processing.wax-temperature'] : P['fixation.temperature'],
      concentration: 100,
      exhaustion: 0,
      vacuum: true,
    })
  for (let i = 0; i < scenario.fragments; i++)
    act('embedding', 'embedding.place', {
      piece: `A1-${i + 1}`,
      x: i * P['reference.piece-spacing'],
      y: 0,
      z: 0,
      rx: 0,
      ry: 0,
      rz: 0,
    })
  act('embedding', 'embedding.cool', { temperature: P['microtomy.block-temperature'] })
  act('microtomy', 'instrument.set', {
    clamp: 1,
    sharpness: 1,
    angle: P['microtomy.angle'],
    locked: true,
    guarded: true,
  })
  act('microtomy', 'block.mount')
  act('microtomy', 'instrument.set', { locked: false, guarded: false })
  act('microtomy', 'microtomy.cut', { purpose: 'routine', level: 1 })
  act('microtomy', 'instrument.set', { locked: true, guarded: true })
  act('bath', 'bath.float', {
    temperature: P['bath.temperature'],
    minutes: P['bath.minutes'],
    clean: true,
    gentle: true,
  })
  act('bath', 'section.pickup', { label: `${scenario.accession}-A1-L1`, charged: true })
  act('drying', 'drying.run', {
    temperature: P['drying.temperature'],
    minutes: P['drying.minutes'],
  })
  for (const [reagent, param] of [
    ['dewax', 'dewax'],
    ['hydrate', 'hydrate'],
    ['hematoxylin', 'hematoxylin'],
    ['differentiate', 'differentiate'],
    ['blue', 'blue'],
    ['eosin', 'eosin'],
    ['dehydrate', 'dehydrate'],
    ['clear', 'clear'],
  ])
    act('he', 'stain.step', { reagent, minutes: P[`he.${param}-time`], freshness: 1 })
  act('coverslip', 'coverslip.apply', {
    medium: 'resinous',
    volume: P['mount.volume'],
    angle: P['mount.angle'],
    delay: 0,
  })
  for (const station of [...new Set(twin.events.map((e) => e.station))])
    act(station, 'document', {
      text: 'Reference teaching run: settings, identity and outcome recorded.',
    })
  return twin
}
