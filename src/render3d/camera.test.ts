// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cameraPreset, restoreCamera, saveCamera } from './camera'

afterEach(() => sessionStorage.clear())
describe('camera view persistence', () => {
  it('preserves station-specific views without modifying specimen state', () => {
    const pose = {
      position: [2, 3, 4] as [number, number, number],
      target: [0, 1, 0] as [number, number, number],
    }
    saveCamera('embedding', pose)
    expect(restoreCamera('embedding')).toEqual(pose)
    expect(restoreCamera('fixation')).toBeNull()
  })
  it('ignores malformed or non-finite browser storage', () => {
    sessionStorage.setItem('histoquest:camera:v1:bath', '{bad')
    expect(restoreCamera('bath')).toBeNull()
    sessionStorage.setItem('histoquest:camera:v1:bath', '{"position":[1e999,2,3],"target":[0,0,0]}')
    expect(restoreCamera('bath')).toBeNull()
    sessionStorage.setItem('histoquest:camera:v1:bath', '{"position":[1,2],"target":[0,0,0]}')
    expect(restoreCamera('bath')).toBeNull()
  })
  it('provides finite viewpoints for overview and instrument detail', () => {
    for (const station of ['overview', 'microtomy', 'frozen'] as const)
      for (const preset of ['front', 'detail', 'top'] as const) {
        const pose = cameraPreset(station, preset)
        expect([...pose.position, ...pose.target].every(Number.isFinite)).toBe(true)
        expect(pose.position[1]).toBeGreaterThan(pose.target[1])
      }
  })
})
