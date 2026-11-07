import { PROCESS as P } from '../params/process'
import { parameterValue } from '../params/registry'
import type { Scenario, Twin } from './types'

export function createStainingState(): Twin['staining'] {
  return {
    protocol: '',
    reactionRetention: 1,
    controls: { positive: null, negative: null, valid: false },
    history: [],
    dewax: 0,
    hydrated: 0,
    hematoxylin: 0,
    eosin: 0,
    bluing: 0,
    differentiated: 0,
    dehydration: 0,
    clearing: 0,
    special: '',
    specialIntensity: 0,
    completedSteps: [],
  }
}

export function createIhcState(scenario: Scenario): Twin['ihc'] {
  return {
    marker: scenario.target,
    preservation: 1,
    masking: 0,
    retrieval: 0,
    damage: 0,
    primary: 0,
    detection: 0,
    dab: 0,
    background: 0,
    edge: 0,
    positive: null,
    lowPositive: null,
    negative: null,
    internal: null,
    location: scenario.targetLocalization,
    valid: false,
  }
}

export function createMountingState(): Twin['mounting'] {
  return { medium: 'none', volume: 0, bubbles: 0, haze: 0, retraction: 0, mounted: false }
}

export function createTwin(scenario: Scenario): Twin {
  const count = P['fixation.field-regions']
  return {
    scenario,
    time: 0,
    station: 'accessioning',
    events: [],
    issues: [],
    documentation: [],
    archivedSlides: [],
    identity: {
      held: false,
      resolved: scenario.discrepancy === 'none',
      accepted: false,
      broken: false,
      custody: [],
    },
    gross: {
      dimensions: [...scenario.dimensions],
      thickness: scenario.dimensions[2],
      fragments: scenario.fragments,
      cassette: 'standard',
      crowding: 0,
      ink: 'none',
      key: '',
      sampled: false,
    },
    fixation: {
      fixative: 'none',
      hours: 0,
      temperature: P['fixation.temperature'],
      ratio: P['fixation.ratio'],
      ischemia: 0,
      crosslink: 0,
      pigment: 0,
    },
    regions: Array.from({ length: count }, (_, i) => ({
      depth: i / (count - 1),
      access: 0,
      fixed: 0,
      mineral: scenario.family === 'bone' ? 1 : 0,
      water: 1,
      alcohol: 0,
      clearant: 0,
      wax: 0,
    })),
    decal: { agent: 'none', hours: 0, endpoint: 'none', damage: 0 },
    processing: { history: [], hardness: 0, brittleness: 0, heatDamage: 0 },
    embedding: {
      pieces: [],
      temperature: P['embedding.wax-temperature'],
      bubbles: 0,
      cooled: false,
      representation: 0,
    },
    block: {
      remaining: parameterValue('section.maximum-depth'),
      trimmed: 0,
      face: Array(P['microtomy.face-cells']).fill(0),
      temperature: P['fixation.temperature'],
      hydration: 0,
      bladeWear: Array(P['microtomy.blade-slots']).fill(0),
      sections: [],
    },
    instrument: {
      locked: true,
      guarded: true,
      thickness: parameterValue('section.thickness'),
      speed: P['microtomy.speed'],
      consistency: 1,
      angle: P['microtomy.angle'],
      clamp: scenario.faults.includes('loose-clamp') ? P['microtomy.fault-clamp'] : 1,
      sharpness: scenario.faults.includes('nick') ? P['microtomy.fault-sharpness'] : 1,
      bladePosition: 0,
      humidity: P['microtomy.initial-humidity'],
    },
    staining: createStainingState(),
    ihc: createIhcState(scenario),
    frozen: {
      temperature: P['frozen.temperature'],
      rate: 0,
      ice: 0,
      biohazardChecked: false,
      prepared: false,
    },
    mounting: createMountingState(),
    disposition: 'pending',
    notes: [],
  }
}
