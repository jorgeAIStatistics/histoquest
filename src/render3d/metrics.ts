/** Local opt-in test instrumentation only. No requests, tracking identifiers or analytics. */
const counters = {
  mounts: 0,
  unmounts: 0,
  activeCanvases: 0,
  frames: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  contextLosses: 0,
  disposedResources: 0,
}
export type RenderMetrics = typeof counters
let frameSample: number[] | null = null
let discardFirstFrame = false
export function recordFrameInterval(milliseconds: number) {
  if (!frameSample) return
  // A demand-rendered first frame can follow a long idle interval. Subsequent intervals retain stalls.
  if (discardFirstFrame) {
    discardFirstFrame = false
    return
  }
  if (frameSample.length < 2000) frameSample.push(milliseconds)
}
let readLiveResources:
  (() => Pick<RenderMetrics, 'geometries' | 'textures' | 'programs'>) | undefined
export function bindResourceReader(reader: NonNullable<typeof readLiveResources>) {
  readLiveResources = reader
  return () => {
    if (readLiveResources === reader) readLiveResources = undefined
  }
}
export function recordMetric(values: Partial<RenderMetrics>) {
  Object.assign(counters, values)
}
export function incrementMetric(key: keyof RenderMetrics, amount = 1) {
  counters[key] += amount
}
export function getRenderMetrics(): Readonly<RenderMetrics> {
  return { ...counters, ...(readLiveResources?.() ?? {}) }
}
export function exposeRenderMetrics() {
  if (new URLSearchParams(location.search).has('renderDebug')) {
    Object.defineProperty(window, '__histoquestRenderMetrics', {
      configurable: true,
      get: getRenderMetrics,
    })
    Object.defineProperty(window, '__histoquestFrameCapture', {
      configurable: true,
      value: {
        begin: () => {
          frameSample = []
          discardFirstFrame = true
        },
        end: () => {
          const result = frameSample ?? []
          frameSample = null
          return result
        },
      },
    })
  }
}
