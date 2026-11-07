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
export function recordMetric(values: Partial<RenderMetrics>) {
  Object.assign(counters, values)
}
export function incrementMetric(key: keyof RenderMetrics, amount = 1) {
  counters[key] += amount
}
export function getRenderMetrics(): Readonly<RenderMetrics> {
  return { ...counters }
}
export function exposeRenderMetrics() {
  if (new URLSearchParams(location.search).has('renderDebug')) {
    Object.defineProperty(window, '__histoquestRenderMetrics', {
      configurable: true,
      get: getRenderMetrics,
    })
  }
}
