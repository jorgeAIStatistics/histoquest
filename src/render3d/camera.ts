import type { SceneStation, Vec3 } from './types'

export type ViewPreset = 'front' | 'detail' | 'top' | 'save' | 'restore'
export interface CameraPose {
  position: Vec3
  target: Vec3
}
const memory = new Map<string, CameraPose>()
const key = (station: SceneStation) => `histoquest:camera:v1:${station}`

export function cameraPreset(station: SceneStation, preset: ViewPreset): CameraPose {
  if (station === 'overview')
    return { position: preset === 'top' ? [0, 18, 0.1] : [12, 12, 16], target: [0, 0, 0.5] }
  if (preset === 'top') return { position: [0, 6.3, 0.1], target: [0, 0.4, 0] }
  if (preset === 'detail') return { position: [2.8, 2.7, 3.8], target: [0, 0.8, 0.1] }
  return { position: [4.3, 3, 5.8], target: [0, 0.65, 0] }
}

export function saveCamera(station: SceneStation, pose: CameraPose) {
  memory.set(station, pose)
  // Camera views are tab preferences, not a simulation record or clinical learning evidence.
  try {
    sessionStorage.setItem(key(station), JSON.stringify(pose))
  } catch {
    /* Private browsing or a full store: keep the in-memory view. */
  }
}

export function restoreCamera(station: SceneStation): CameraPose | null {
  try {
    const raw = sessionStorage.getItem(key(station))
    if (raw) {
      const value: unknown = JSON.parse(raw)
      if (
        value &&
        typeof value === 'object' &&
        'position' in value &&
        'target' in value &&
        [value.position, value.target].every(
          (vector) =>
            Array.isArray(vector) &&
            vector.length === 3 &&
            vector.every(
              (number) =>
                typeof number === 'number' && Number.isFinite(number) && Math.abs(number) < 100,
            ),
        )
      )
        return value as CameraPose
    }
  } catch {
    /* Invalid saved views use the current preset. */
  }
  return memory.get(station) ?? null
}
