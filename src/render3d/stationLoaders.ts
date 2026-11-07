import type { ComponentType } from 'react'
import type { StationId } from '../sim/core/events'
import type { InstrumentProps } from './types'

export type StationProps = InstrumentProps & { station: StationId }
type StationModule = { default: ComponentType<StationProps> }

/** Dynamic boundaries keep detailed instrument geometry out of the first room/station request. */
export const stationLoaders: Record<StationId, () => Promise<StationModule>> = {
  accessioning: () => import('./SpecimenReceipt'),
  grossing: () => import('./Grossing'),
  fixation: () => import('./Fixation'),
  decalcification: () => import('./Decalcification'),
  processing: () => import('./Processor'),
  embedding: () => import('./Embedding'),
  microtomy: () => import('./Microtome'),
  bath: () => import('./WaterBath'),
  drying: () => import('./Drying'),
  he: () => import('./Staining'),
  special: () => import('./Staining'),
  ihc: () => import('./Staining'),
  ish: () => import('./Staining'),
  coverslip: () => import('./SlideReview'),
  frozen: () => import('./Frozen'),
  quality: () => import('./SlideReview'),
}

/** Prefetch one next station, not the whole lab; conserve data and avoid background downloads. */
export function prefetchStationWhenIdle(station: StationId): () => void {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  if (document.hidden || connection?.saveData || connection?.effectiveType?.includes('2g'))
    return () => {}
  const load = () => {
    if (!document.hidden) void stationLoaders[station]().catch(() => {})
  }
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(load, { timeout: 2000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = globalThis.setTimeout(load, 750)
  return () => globalThis.clearTimeout(id)
}
