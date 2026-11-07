import type { StationId } from '../sim/core/events'
import type { Twin } from '../sim/specimen/types'

export type SceneQuality = 'auto' | 'low' | 'medium' | 'high'
export type SceneStation = StationId | 'overview'
export type SceneIntent = (
  intent: string,
  params: Record<string, string | number | boolean | null>,
  station?: StationId,
) => void
export interface LabSceneProps {
  twin: Twin
  station: SceneStation
  onIntent: SceneIntent
  quality: SceneQuality
  reducedMotion: boolean
  onFallback: (reason: string) => void
  onStationSelect: (id: StationId) => void
}
export interface InstrumentProps {
  twin: Twin
  onIntent: SceneIntent
  reducedMotion: boolean
  onManipulating: (active: boolean) => void
}
export type Vec3 = [number, number, number]

export const STATION_NAMES: Record<StationId, string> = {
  accessioning: 'Accessioning',
  grossing: 'Grossing',
  fixation: 'Fixation',
  decalcification: 'Decalcification',
  processing: 'Processing',
  embedding: 'Embedding',
  microtomy: 'Microtomy',
  bath: 'Water bath',
  drying: 'Drying',
  he: 'H&E staining',
  special: 'Special stains',
  ihc: 'Immunohistochemistry',
  ish: 'In situ hybridization',
  coverslip: 'Coverslipping',
  frozen: 'Frozen section',
  quality: 'Quality review',
}
