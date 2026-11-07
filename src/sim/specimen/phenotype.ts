import { hashString } from '../../engine/random'
import type { TissueFamily } from './types'

/** Model coordinates, not a calibration of a photographed specimen. */
export const FIELD_WIDTH_UM = 2000
export const FIELD_HEIGHT_UM = 1500

export interface Phenotype {
  seed: number
  family: TissueFamily
  archetype: string
  phase: number
}

/** Unitless compartment densities. The optics layer supplies stains separately. */
export interface TissueSample {
  tissue: number
  nucleus: number
  cytoplasm: number
  membrane: number
  collagen: number
  mucin: number
  rbc: number
  mineral: number
  reticulin: number
  amyloid: number
  organism: number
  pigment: number
  target: number
}

export const FAMILY_FEATURES: Record<TissueFamily, string> = {
  skin: 'Undulating keratinized epidermis, basal nuclei, dermal collagen bundles, and a hair-follicle profile.',
  gut: 'Repeated crypt profiles with open lumina, a basal nuclear rim, pale goblet-cell mucin, and intervening lamina propria.',
  gland:
    'Lobular groups of acini with lumina and epithelial rims, separated by branching connective-tissue septa.',
  lymphoid:
    'Pale germinal centers, darker mantle zones, and a densely cellular interfollicular compartment.',
  bone: 'Interconnected trabeculae containing small osteocyte lacunae, with cellular marrow and fat spaces between them.',
  fat: 'A mosaic of polygonal adipocyte spaces, fine septa, and flattened peripheral nuclei.',
  neural:
    'Neuropil, large neuronal cell bodies with prominent nuclei, small glial nuclei, and wavy axon bundles.',
  muscle:
    'Parallel muscle fibers with a fine periodic striation pattern, peripheral nuclei, and collagenous septa.',
  placenta:
    'Branching villous profiles, peripheral trophoblast nuclei, stromal cores and capillaries, separated by intervillous space.',
  renal:
    'Closely packed tubules, round glomerular capillary tufts, a clear Bowman space, and a thin surrounding capsule.',
  hepatic:
    'Radiating hepatocyte cords separated by narrow sinusoids, with a central venous profile in each lobular field.',
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function smoothstep(a: number, b: number, value: number): number {
  const t = clamp01((value - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Integer hashing is stable across browsers and independent of render traversal. */
export function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ seed
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

export function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const tx = fx * fx * (3 - 2 * fx)
  const ty = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy, seed)
  const b = hash2(ix + 1, iy, seed)
  const c = hash2(ix, iy + 1, seed)
  const d = hash2(ix + 1, iy + 1, seed)
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty
}

export function createPhenotype(
  family: TissueFamily,
  seed: string,
  archetype: string = family,
): Phenotype {
  const seedNumber = hashString(`${seed}:${family}:${archetype}`)
  return { family, seed: seedNumber, archetype, phase: (seedNumber % 6283) / 1000 }
}

interface Cell {
  x: number
  y: number
  id: number
  radius: number
  edge: number
}

/** Jittered Voronoi cells avoid a repeated grid of identical circular objects. */
function voronoi(x: number, y: number, scale: number, seed: number): Cell {
  const gx = x / scale
  const gy = y / scale
  const ix = Math.floor(gx)
  const iy = Math.floor(gy)
  let first = Infinity
  let second = Infinity
  let cx = 0
  let cy = 0
  let id = 0
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const xx = ix + i
      const yy = iy + j
      const dx = gx - xx - 0.15 - hash2(xx, yy, seed) * 0.7
      const dy = gy - yy - 0.15 - hash2(xx, yy, seed + 17) * 0.7
      const distance = dx * dx + dy * dy
      if (distance < first) {
        second = first
        first = distance
        cx = dx * scale
        cy = dy * scale
        id = hash2(xx, yy, seed + 73)
      } else if (distance < second) {
        second = distance
      }
    }
  }
  return {
    x: cx,
    y: cy,
    id,
    radius: Math.sqrt(first) * scale,
    edge: ((second - first) / (2 * Math.sqrt(second) + 0.0001)) * scale,
  }
}

function nucleus(cell: Cell, radius: number, elongation = 1): number {
  const a = cell.id * Math.PI * 2
  const dx = cell.x * Math.cos(a) - cell.y * Math.sin(a)
  const dy = cell.x * Math.sin(a) + cell.y * Math.cos(a)
  const d = Math.hypot(dx / elongation, dy * elongation)
  return 1 - smoothstep(radius * 0.74, radius, d)
}

function emptySample(): TissueSample {
  return {
    tissue: 0,
    nucleus: 0,
    cytoplasm: 0,
    membrane: 0,
    collagen: 0,
    mucin: 0,
    rbc: 0,
    mineral: 0,
    reticulin: 0,
    amyloid: 0,
    organism: 0,
    pigment: 0,
    target: 0,
  }
}

function crypt(x: number, y: number, seed: number, gland: boolean) {
  const cell = voronoi(x, y, gland ? 108 : 143, seed)
  const tilt = (cell.id - 0.5) * 0.9
  const xx = cell.x * Math.cos(tilt) - cell.y * Math.sin(tilt)
  const yy = cell.x * Math.sin(tilt) + cell.y * Math.cos(tilt)
  const r = Math.hypot(xx / (gland ? 39 : 43), yy / (gland ? 33 : 62))
  const angle = Math.atan2(yy / 62, xx / 43)
  const waviness = Math.sin(angle * 5 + cell.id * 6) * 0.035
  const profile = 1 - smoothstep(1.13 + waviness, 1.2 + waviness, r)
  const lumen = 1 - smoothstep(gland ? 0.25 : 0.44, gland ? 0.36 : 0.54, r + waviness)
  const rim = smoothstep(0.74, 0.81, r) * (1 - smoothstep(1.01, 1.08, r))
  const radialNuclei =
    smoothstep(0.25, 0.6, Math.sin(angle * (gland ? 18 : 25) + cell.id * 20)) * rim
  const goblet = !gland
    ? smoothstep(0.65, 0.9, Math.sin(angle * 13 + cell.id * 10)) *
      smoothstep(0.5, 0.62, r) *
      (1 - smoothstep(0.77, 0.85, r))
    : 0
  return { profile, lumen, radialNuclei, goblet, cell, r }
}

/**
 * An analytic, multiscale tissue field. Geometry is educational, not a diagnostic
 * tissue generator: dimensions are authored model units and all anatomy is synthetic.
 * Sampling a coordinate yields the same material regardless of zoom or tile order.
 */
export function samplePhenotype(phenotype: Phenotype, x: number, y: number): TissueSample {
  const { seed, family, phase } = phenotype
  const sample = emptySample()
  const edgeWobble = 0.025 * Math.sin(x / 61 + phase) + 0.02 * Math.sin(y / 39 + phase)
  const contour = Math.hypot((x - 1000) / 890, (y - 750) / 635)
  sample.tissue = 1 - smoothstep(0.96 + edgeWobble, 1 + edgeWobble, contour)
  if (sample.tissue < 0.001) return sample

  const fine = noise(x / 2.4, y / 2.4, seed + 11)
  const coarse = noise(x / 67, y / 67, seed + 23)
  const cells = voronoi(x, y, 13.5, seed + 91)
  const cellNucleus = nucleus(cells, 3.1 + cells.id * 0.8, 1.15)
  const chromatin = 0.72 + fine * 0.42 + (noise(x / 0.75, y / 0.75, seed + 31) > 0.77 ? 0.3 : 0)
  sample.cytoplasm = 0.15
  sample.nucleus = cellNucleus * 0.25
  sample.membrane = (1 - smoothstep(0.25, 0.9, cells.edge)) * 0.2

  switch (family) {
    case 'skin': {
      const surface = 350 + 32 * Math.sin(x / 90 + phase) + 50 * Math.sin(x / 197)
      const rete = 40 * Math.pow((1 + Math.sin(x / 59 + phase)) / 2, 3)
      const depth = y - surface
      if (depth < -28) {
        sample.tissue = 0
        return sample
      }
      const epidermis = 1 - smoothstep(106 + rete, 119 + rete, depth)
      const keratin = 1 - smoothstep(-8, 22, depth)
      const basal = Math.exp(-Math.pow((depth - 105 - rete) / 9, 2))
      const bundleMix = noise(x / 150, y / 150, seed + 202)
      const bundleA = noise((x + y * 0.7) / 90, (y - x * 0.45) / 5, seed + 200)
      const bundleB = noise((x - y * 0.5) / 75, (y + x * 0.4) / 6, seed + 201)
      const collagenFiber = bundleA * bundleMix + bundleB * (1 - bundleMix)
      const fibroblast = nucleus(voronoi(x, y, 32, seed + 29), 3.4, 2.8)
      sample.nucleus =
        cellNucleus * epidermis * (1 - keratin) * 1.1 +
        fibroblast * (1 - epidermis) * 0.65 +
        basal * cellNucleus * 0.8
      sample.cytoplasm = epidermis * (0.5 + keratin * 0.6)
      sample.collagen = (1 - epidermis) * (0.38 + 0.54 * collagenFiber)
      sample.membrane = epidermis * (1 - keratin) * (1 - smoothstep(0.3, 1.3, cells.edge))
      // Oblique follicle: nested epithelial/root-sheath profiles inside the dermis.
      const follicle = Math.hypot((x - 1100 - (y - 790) * 0.3) / 67, (y - 790) / 270)
      if (follicle < 1.2 && depth > 130) {
        sample.collagen *= smoothstep(1, 1.2, follicle)
        sample.cytoplasm = 0.5 + (1 - smoothstep(0.28, 0.4, follicle)) * 0.9
        sample.nucleus = cellNucleus * smoothstep(0.45, 0.6, follicle)
        sample.membrane = Math.exp(-Math.pow((follicle - 0.9) * 20, 2))
        sample.pigment = (1 - smoothstep(0.2, 0.35, follicle)) * 0.4
      }
      sample.target = epidermis * (1 - keratin)
      break
    }
    case 'gut':
    case 'gland': {
      const gland = family === 'gland'
      const c = crypt(x + 8 * Math.sin(y / 70), y, seed + 121, gland)
      const epithelial = c.profile * (1 - c.lumen)
      const septum = gland ? 1 - smoothstep(3, 12, voronoi(x, y, 370, seed + 51).edge) : 0
      sample.tissue *= 1 - c.lumen * 0.98
      sample.nucleus = c.radialNuclei * 1.1 + cellNucleus * (1 - c.profile) * 0.67
      sample.cytoplasm = epithelial * (0.58 - c.goblet * 0.5) + (1 - c.profile) * 0.13
      sample.collagen = (1 - c.profile) * (0.16 + septum * 0.65)
      sample.mucin = c.goblet + c.lumen * 0.12
      sample.membrane = c.profile * (1 - smoothstep(0.3, 1.4, cells.edge))
      sample.reticulin = Math.exp(-Math.pow((c.r - 1.16) * 30, 2))
      sample.target = epithelial
      sample.organism = c.r < 0.58 && c.r > 0.38 && fine > 0.74 ? 0.9 : 0
      break
    }
    case 'fat': {
      const fat = voronoi(x, y, 75, seed + 313)
      const wall = 1 - smoothstep(0.7, 2.2, fat.edge)
      const nucleusAtEdge =
        (1 - smoothstep(2.3, 5.4, fat.edge)) *
        smoothstep(0.7, 1.3, fat.edge) *
        (fat.x > 15 ? 1 : 0) *
        Math.exp(-Math.pow((fat.y + fat.id * 22 - 11) / 5, 2))
      sample.cytoplasm = wall * 0.38
      sample.collagen = wall * (0.2 + coarse * 0.25)
      sample.nucleus = nucleusAtEdge * 1.1
      sample.membrane = wall
      sample.target = wall
      break
    }
    case 'bone': {
      const network =
        Math.sin(x / 121 + phase) + 0.8 * Math.sin(y / 103) + 0.65 * Math.sin((x + y) / 87 + phase)
      const trabecula = 1 - smoothstep(0.31, 0.5, Math.abs(network))
      const lamella = 0.84 + 0.16 * Math.sin(network * 55 + fine)
      const lacuna = nucleus(voronoi(x, y, 31, seed + 9), 3.2, 1.8)
      const fat = voronoi(x, y, 59, seed + 41)
      const fatSpace = (1 - smoothstep(17, 24, fat.radius)) * (fat.id > 0.48 ? 1 : 0)
      sample.nucleus =
        trabecula * lacuna * 0.9 + (1 - trabecula) * cellNucleus * (1 - fatSpace) * 1.15
      sample.cytoplasm = (1 - trabecula) * (1 - fatSpace) * 0.36
      sample.collagen = trabecula * lamella * (1 - lacuna * 0.7)
      sample.mineral = trabecula
      sample.reticulin = (1 - trabecula) * (1 - smoothstep(0.2, 0.65, cells.edge)) * 0.4
      sample.target = 1 - trabecula
      sample.rbc = (1 - trabecula) * (1 - fatSpace) * (cells.id > 0.78 ? nucleus(cells, 4.8) : 0)
      break
    }
    case 'lymphoid': {
      const follicle = voronoi(x, y, 340, seed + 65)
      const radius = Math.hypot(follicle.x / 140, follicle.y / 125)
      const center = 1 - smoothstep(0.58, 0.71, radius)
      const mantle = smoothstep(0.63, 0.74, radius) * (1 - smoothstep(0.95, 1.09, radius))
      const lymphocytes = voronoi(x, y, center > 0.5 ? 12 : 8.8, seed + 91)
      sample.nucleus = nucleus(lymphocytes, center > 0.5 ? 3.2 : 3.1) * (0.78 + mantle * 0.47)
      sample.cytoplasm = 0.13 + center * 0.08
      sample.collagen = Math.exp(-Math.pow((radius - 1.1) * 30, 2)) * 0.28
      sample.reticulin = (1 - smoothstep(0.15, 0.5, cells.edge)) * 0.8
      sample.membrane = 1 - smoothstep(0.2, 0.8, lymphocytes.edge)
      sample.target = 0.25 + center * 0.75
      break
    }
    case 'muscle': {
      const fiberY = y + 10 * Math.sin(x / 170 + phase)
      const period = ((fiberY % 48) + 48) % 48
      const septum = 1 - smoothstep(1, 4, Math.min(period, 48 - period))
      const striation = 0.77 + 0.23 * Math.sin((x * Math.PI) / 2.5 + fine * 0.3)
      sample.cytoplasm = (1 - septum) * striation
      sample.collagen = septum * 0.6
      sample.nucleus = cellNucleus * smoothstep(16, 22, Math.abs(period - 24))
      sample.membrane = septum
      sample.target = 1 - septum
      break
    }
    case 'neural': {
      const neurons = voronoi(x, y, 95, seed + 22)
      const body = 1 - smoothstep(14, 22, Math.hypot(neurons.x, neurons.y * 1.4))
      const neuronalNucleus = 1 - smoothstep(5, 8, neurons.radius)
      const nucleolus = 1 - smoothstep(1.4, 2.2, Math.hypot(neurons.x - 2, neurons.y))
      const axon = Math.pow(0.5 + Math.sin(y / 3 + Math.sin(x / 55) * 3) * 0.5, 7)
      sample.nucleus = cellNucleus * 0.5 * (1 - body) + neuronalNucleus * 0.37 + nucleolus * 0.95
      sample.cytoplasm = 0.12 + body * (1 - neuronalNucleus) * (0.4 + fine * 0.3) + axon * 0.12
      sample.membrane = body * (1 - smoothstep(0.25, 1.3, cells.edge))
      sample.target = body
      break
    }
    case 'placenta': {
      const villus = voronoi(x + Math.sin(y / 45) * 16, y, 155, seed + 21)
      const radius = Math.hypot(villus.x / (46 + villus.id * 22), villus.y / 48)
      const inside = 1 - smoothstep(0.94, 1.05, radius)
      const outer = smoothstep(0.77, 0.89, radius) * inside
      sample.tissue *= inside
      sample.nucleus = cellNucleus * (0.3 + outer * 1.1)
      sample.cytoplasm = 0.18 + outer * 0.4
      sample.collagen = inside * (1 - outer) * 0.18
      sample.membrane = outer
      sample.target = outer
      break
    }
    case 'renal': {
      const tubule = crypt(x, y, seed + 710, true)
      const tubuleCell = tubule.profile * (1 - tubule.lumen)
      sample.tissue *= 1 - tubule.lumen * 0.95
      sample.nucleus = tubule.radialNuclei + cellNucleus * (1 - tubule.profile) * 0.3
      sample.cytoplasm = tubuleCell * 0.7
      sample.membrane = tubuleCell * (1 - smoothstep(0.4, 1.2, cells.edge))
      sample.collagen = (1 - tubule.profile) * 0.12
      sample.target = tubuleCell
      const glomerulus = voronoi(x, y, 360, seed + 620)
      const radius = Math.hypot(glomerulus.x / 71, glomerulus.y / 66)
      if (radius < 1.15) {
        const tuft = 1 - smoothstep(0.7, 0.83, radius)
        const capsule = Math.exp(-Math.pow((radius - 1.04) * 25, 2))
        const loops = 0.5 + 0.5 * Math.sin(glomerulus.x / 4 + Math.sin(glomerulus.y / 8) * 2)
        sample.tissue = Math.max(tuft, capsule)
        sample.nucleus = cellNucleus * tuft * 1.3
        sample.cytoplasm = tuft * (0.15 + loops * 0.2)
        sample.collagen = capsule * 0.5
        sample.reticulin = tuft * loops * 0.55 + capsule
        sample.rbc = tuft * (cells.id > 0.7 ? nucleus(cells, 4.5) : 0) * 0.8
        sample.target = tuft
      }
      break
    }
    case 'hepatic': {
      const lobule = voronoi(x, y, 420, seed + 540)
      const angle = Math.atan2(lobule.y, lobule.x)
      const cordWave = Math.sin(angle * 22 + lobule.radius / 37 + coarse * 1.4)
      const sinusoid = smoothstep(0.5, 0.82, cordWave)
      const hepatocytes = voronoi(x, y, 22, seed + 91)
      const vein = 1 - smoothstep(21, 28, Math.hypot(lobule.x, lobule.y * 1.3))
      sample.tissue *= 1 - vein
      sample.cytoplasm = (1 - sinusoid) * 0.64
      sample.nucleus = nucleus(hepatocytes, 3.8) * (1 - sinusoid) + cellNucleus * sinusoid * 0.25
      sample.membrane = (1 - smoothstep(0.3, 1.2, hepatocytes.edge)) * (1 - sinusoid)
      sample.collagen = Math.exp(-Math.pow((lobule.radius - 27) / 3, 2)) * 0.25
      sample.reticulin = smoothstep(0.5, 0.68, cordWave) * (1 - smoothstep(0.8, 0.94, cordWave))
      sample.rbc = sinusoid * (cells.id > 0.7 ? nucleus(cells, 3) : 0) * 0.8
      sample.target = 1 - sinusoid
      sample.pigment = (cells.id > 0.88 ? 0.2 : 0) * (1 - sinusoid)
      break
    }
  }

  // Small vessel profiles recur across families; no clinical target is inferred here.
  if (family !== 'fat' && family !== 'muscle') {
    const vessel = voronoi(x, y, 245, seed + 791)
    const vr = Math.hypot(vessel.x / 18, vessel.y / 12)
    if (vr < 1.35 && vessel.id > 0.6) {
      const wall = smoothstep(0.82, 1, vr)
      sample.collagen = wall * 0.55
      sample.nucleus = cellNucleus * wall
      sample.cytoplasm = wall * 0.3
      sample.rbc = (1 - wall) * nucleus(voronoi(x, y, 7.6, seed + 2), 3.2)
      sample.membrane = wall
    }
  }
  sample.amyloid = sample.collagen * smoothstep(0.5, 0.72, coarse)
  sample.nucleus *= chromatin
  sample.cytoplasm *= 0.88 + fine * 0.24
  return sample
}
