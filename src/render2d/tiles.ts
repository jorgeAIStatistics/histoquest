import { FIELD_HEIGHT_UM, FIELD_WIDTH_UM } from '../sim/specimen/phenotype'
import { sampleSlide } from './field'
import type { OpticalView, SlideField } from './field'

export const TILE_SIZE = 128
export const TEACHING_OBJECTIVES = [2, 4, 10, 20, 40] as const
export type TeachingObjective = (typeof TEACHING_OBJECTIVES)[number]
export interface Point {
  x: number
  y: number
}
export interface Viewport {
  x: number
  y: number
  width: number
  height: number
}
export interface Tile {
  data: Uint8ClampedArray
  width: number
  height: number
}

export function viewportAt(center: Point, objective: TeachingObjective, aspect: number): Viewport {
  const width = (FIELD_WIDTH_UM * 2) / objective
  const height = width / aspect
  return { x: center.x - width / 2, y: center.y - height / 2, width, height }
}

export function clampCenter(center: Point, objective: TeachingObjective, aspect: number): Point {
  const { width, height } = viewportAt(center, objective, aspect)
  return {
    x:
      width >= FIELD_WIDTH_UM
        ? FIELD_WIDTH_UM / 2
        : Math.max(width / 2, Math.min(FIELD_WIDTH_UM - width / 2, center.x)),
    y:
      height >= FIELD_HEIGHT_UM
        ? FIELD_HEIGHT_UM / 2
        : Math.max(height / 2, Math.min(FIELD_HEIGHT_UM - height / 2, center.y)),
  }
}

export function screenToWorld(
  point: Point,
  viewport: Viewport,
  width: number,
  height: number,
): Point {
  return {
    x: viewport.x + (point.x / width) * viewport.width,
    y: viewport.y + (point.y / height) * viewport.height,
  }
}

export function measureMicrometers(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y)
}

/** Pure tile generation: browser APIs are confined to the presentation layer. */
export function renderTile(
  field: SlideField,
  view: OpticalView,
  tileX: number,
  tileY: number,
  pixelsPerUm: number,
  size = TILE_SIZE,
): Tile {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const worldX = (tileX * size + x + 0.5) / pixelsPerUm
      const worldY = (tileY * size + y + 0.5) / pixelsPerUm
      const color = sampleSlide(field, worldX, worldY, view)
      const index = (y * size + x) * 4
      data[index] = Math.round(color[0] * 255)
      data[index + 1] = Math.round(color[1] * 255)
      data[index + 2] = Math.round(color[2] * 255)
      data[index + 3] = 255
    }
  }
  return { data, width: size, height: size }
}

/** Bounded LRU: 96 RGBA tiles occupy 6 MiB; each viewer releases its own cache. */
export class TileCache {
  private entries = new Map<string, Tile>()
  readonly limit: number
  constructor(limit = 96) {
    this.limit = limit
  }

  get size(): number {
    return this.entries.size
  }

  get(
    field: SlideField,
    view: OpticalView,
    tileX: number,
    tileY: number,
    pixelsPerUm: number,
  ): Tile {
    const key = `${field.key}:${JSON.stringify(view)}:${pixelsPerUm}:${tileX}:${tileY}`
    const cached = this.entries.get(key)
    if (cached) {
      this.entries.delete(key)
      this.entries.set(key, cached)
      return cached
    }
    const tile = renderTile(field, view, tileX, tileY, pixelsPerUm)
    this.entries.set(key, tile)
    while (this.entries.size > this.limit) this.entries.delete(this.entries.keys().next().value!)
    return tile
  }

  clear() {
    this.entries.clear()
  }
}

export async function paintTiles(
  canvas: HTMLCanvasElement,
  field: SlideField,
  view: OpticalView,
  viewport: Viewport,
  cache: TileCache,
  signal: AbortSignal,
): Promise<boolean> {
  const context = canvas.getContext('2d')
  if (!context) return false
  const scale = canvas.width / viewport.width
  const left = Math.floor((viewport.x * scale) / TILE_SIZE)
  const top = Math.floor((viewport.y * scale) / TILE_SIZE)
  const right = Math.ceil(((viewport.x + viewport.width) * scale) / TILE_SIZE)
  const bottom = Math.ceil(((viewport.y + viewport.height) * scale) / TILE_SIZE)
  let count = 0
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (signal.aborted) return false
      const tile = cache.get(field, view, x, y, scale)
      const pixels = new ImageData(new Uint8ClampedArray(tile.data), tile.width, tile.height)
      context.putImageData(
        pixels,
        Math.floor(x * TILE_SIZE - viewport.x * scale),
        Math.floor(y * TILE_SIZE - viewport.y * scale),
      )
      count++
      if (count % 2 === 0)
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  }
  return !signal.aborted
}
