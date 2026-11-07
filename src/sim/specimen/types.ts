import type { SimEvent, StationId } from '../core/events'

export type TissueFamily =
  | 'skin'
  | 'gut'
  | 'gland'
  | 'lymphoid'
  | 'bone'
  | 'fat'
  | 'neural'
  | 'muscle'
  | 'placenta'
  | 'renal'
  | 'hepatic'
export type Severity = 'critical' | 'major' | 'minor'
export interface ModelIssue {
  id: string
  station: StationId
  severity: Severity
  title: string
  cause: string
  effect: string
  remedy: string
  event: number
  resolved: boolean
  lesson: string
}
export interface Scenario {
  seed: string
  archetype: string
  family: TissueFamily
  title: string
  difficulty: 1 | 2 | 3
  accession: string
  identifiers: [string, string]
  dimensions: [number, number, number]
  fragments: number
  discrepancy: string
  request: 'routine' | 'levels' | 'ihc' | 'special' | 'molecular' | 'frozen'
  faults: string[]
  target: string
  targetLocalization: 'nuclear' | 'cytoplasmic' | 'membranous'
  targetPresent: boolean
  tat: number
}
export interface Region {
  depth: number
  access: number
  fixed: number
  mineral: number
  water: number
  alcohol: number
  clearant: number
  wax: number
}
export interface Piece {
  id: string
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  thickness: number
}
export interface Section {
  id: string
  depth: number
  thickness: number
  purpose: string
  level: number
  slideId: string
  compression: number
  chatter: number
  ribbonContinuity?: number
  curling?: number
  thicknessVariation?: number
  thicknessMap?: number[]
  knifeLines: number[]
  holes: number
  folds: number
  wrinkles: number
  bubbles: number
  ice: number
  floaters: { accession: string; x: number; y: number }[]
  adhesion: number
  pickedUp: boolean
  charged: boolean
  labelCorrect: boolean
  dried: number
}
/** Renderer input is derived from the complete twin; no choices or grading live in graphics. */
export interface SlideAppearance {
  seed: string
  family: TissueFamily
  archetype: string
  target: string
  targetPresent: boolean
  hematoxylin: number
  eosin: number
  dab: number
  background: number
  bluing: number
  special: string
  specialIntensity: number
  localization: 'nuclear' | 'cytoplasmic' | 'membranous'
  thickness: number
  preservation: number
  centerPreservation: number
  masking: number
  representation: number
  compression: number
  chatter: number
  knifeLines: number[]
  holes: number
  folds: number
  wrinkles: number
  bubbles: number
  ice: number
  dewax: number
  haze: number
  edge: number
  lifting: number
  pigment: number
  retraction: number
  floaters: { accession: string; x: number; y: number }[]
  mounted: boolean
}
export interface Twin {
  scenario: Scenario
  time: number
  station: StationId
  events: SimEvent[]
  issues: ModelIssue[]
  documentation: { station: StationId; text: string; t: number }[]
  archivedSlides: { id: string; appearance: SlideAppearance }[]
  identity: {
    held: boolean
    resolved: boolean
    accepted: boolean
    broken: boolean
    custody: string[]
  }
  gross: {
    dimensions: [number, number, number]
    thickness: number
    fragments: number
    cassette: string
    crowding: number
    ink: string
    key: string
    sampled: boolean
  }
  fixation: {
    fixative: string
    hours: number
    temperature: number
    ratio: number
    ischemia: number
    crosslink: number
    pigment: number
  }
  regions: Region[]
  decal: { agent: string; hours: number; endpoint: string; damage: number }
  processing: {
    history: {
      reagent: string
      minutes: number
      temperature: number
      concentration: number
      exhaustion: number
    }[]
    hardness: number
    brittleness: number
    heatDamage: number
  }
  embedding: {
    pieces: Piece[]
    temperature: number
    bubbles: number
    cooled: boolean
    representation: number
  }
  block: {
    remaining: number
    trimmed: number
    face: number[]
    temperature: number
    hydration: number
    bladeWear: number[]
    sections: Section[]
  }
  instrument: {
    locked: boolean
    guarded: boolean
    thickness: number
    speed: number
    consistency: number
    angle: number
    clamp: number
    sharpness: number
    bladePosition: number
    humidity: number
  }
  staining: {
    protocol: string
    reactionRetention: number
    controls: { positive: number | null; negative: number | null; valid: boolean }
    history: { reagent: string; minutes: number; lot: string }[]
    dewax: number
    hydrated: number
    hematoxylin: number
    eosin: number
    bluing: number
    differentiated: number
    dehydration: number
    clearing: number
    special: string
    specialIntensity: number
    completedSteps: string[]
  }
  ihc: {
    marker: string
    preservation: number
    masking: number
    retrieval: number
    damage: number
    primary: number
    detection: number
    dab: number
    background: number
    edge: number
    positive: number | null
    lowPositive: number | null
    negative: number | null
    internal: number | null
    location: 'nuclear' | 'cytoplasmic' | 'membranous'
    valid: boolean
  }
  frozen: {
    temperature: number
    rate: number
    ice: number
    biohazardChecked: boolean
    prepared: boolean
  }
  mounting: {
    medium: string
    volume: number
    bubbles: number
    haze: number
    retraction: number
    mounted: boolean
  }
  disposition: 'pending' | 'hold' | 'release'
  notes: string[]
}
