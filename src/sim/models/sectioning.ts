import { average, clamp, degreesToRadians, micrometersToMillimeters } from '../core/units'
import { MECHANICS as M } from '../params/mechanics'
import { PROCESS as P } from '../params/process'
import type { Section, Twin } from '../specimen/types'
import { createIhcState, createMountingState, createStainingState } from '../specimen/initial'
import { slideAppearance } from '../specimen/appearance'

/** Each cut creates a separate slide. Existing picked-up slides retain their own chemistry. */
export function startNewSlide(t: Twin) {
  const previous = t.block.sections.at(-1)
  if (previous?.pickedUp)
    t.archivedSlides.push({
      id: previous.slideId || previous.id,
      appearance: structuredClone(slideAppearance(t)),
    })
  const { preservation, masking, marker, location } = t.ihc
  t.staining = createStainingState()
  t.ihc = { ...createIhcState(t.scenario), preservation, masking, marker, location }
  t.mounting = createMountingState()
  t.disposition = 'pending'
}

/** Intersection of the cutting plane with independently positioned pieces, not a correct-orientation flag. */
export function representation(t: Twin) {
  if (!t.embedding.pieces.length) return 0
  const cutDepth = micrometersToMillimeters(t.block.trimmed)
  return average(
    t.embedding.pieces.map((piece) => {
      const tilt =
        Math.abs(Math.sin(degreesToRadians(piece.rx))) +
        Math.abs(Math.sin(degreesToRadians(piece.ry)))
      const height = tilt * t.scenario.dimensions[0] + Math.max(0, piece.z)
      return clamp(1 - Math.max(0, height - cutDepth) / Math.max(piece.thickness, Number.EPSILON))
    }),
  )
}

/** Remaining tissue sampled over the mold face. Empty cells are empty paraffin, not hidden tissue. */
export function updateBlockFace(t: Twin) {
  const width = Math.round(Math.sqrt(t.block.face.length))
  const span = Math.max(M['mechanics.mold-span'], t.scenario.dimensions[0])
  const cutDepth = micrometersToMillimeters(t.block.trimmed)
  t.block.face = t.block.face.map((_, index) => {
    const x = ((index % width) / (width - 1) - 0.5) * span
    const y = (Math.floor(index / width) / (width - 1) - 0.5) * span
    return Math.max(
      0,
      ...t.embedding.pieces.map((piece) => {
        const angle = degreesToRadians(piece.rz)
        const dx = x - piece.x,
          dy = y - piece.y
        const u = dx * Math.cos(angle) + dy * Math.sin(angle),
          v = -dx * Math.sin(angle) + dy * Math.cos(angle)
        const length = t.scenario.dimensions[0],
          breadth = Math.max(M['mechanics.minimum-width'], t.scenario.dimensions[1])
        if ((u / (length / 2)) ** 2 + (v / (breadth / 2)) ** 2 > 1) return 0
        const front =
          piece.z +
          u * Math.sin(degreesToRadians(piece.ry)) +
          v * Math.sin(degreesToRadians(piece.rx))
        return Math.max(0, Math.min(piece.thickness, front + piece.thickness - cutDepth)) * 1000
      }),
    )
  })
}
export function trim(t: Twin, microns: number) {
  const used = Math.min(Math.max(0, microns), t.block.remaining)
  t.block.trimmed += used
  t.block.remaining -= used
  updateBlockFace(t)
  t.embedding.representation = representation(t)
}

/** Continuous mechanical teaching model: speed, clamp, temperature, clearance and support interact. */
export function cut(t: Twin, purpose = 'routine', level = 1): Section {
  startNewSlide(t)
  const m = t.instrument
  const referenceTemperature = t.frozen.prepared
    ? t.scenario.family === 'fat'
      ? M['mechanics.fat-frozen-temperature']
      : t.scenario.family === 'neural'
        ? M['mechanics.neural-frozen-temperature']
        : P['frozen.temperature']
    : P['microtomy.block-temperature']
  const warmth =
    Math.max(0, t.block.temperature - referenceTemperature) / P['microtomy.temperature-scale']
  const cold =
    Math.max(
      0,
      referenceTemperature -
        (t.frozen.prepared ? 0 : M['mechanics.cold-margin']) -
        t.block.temperature,
    ) / P['microtomy.temperature-scale']
  const speed = Math.max(0, m.speed - P['microtomy.speed'])
  const angle = Math.abs(m.angle - P['microtomy.angle']) / P['microtomy.angle-scale']
  const support = average(t.regions.map((r) => r.wax))
  const mineral = average(t.regions.map((r) => r.mineral))
  const usedSlot = Math.min(t.block.bladeWear.length - 1, Math.max(0, Math.round(m.bladePosition)))
  const sharpness = clamp(m.sharpness - t.block.bladeWear[usedSlot])
  const compression = clamp(
    warmth * P['microtomy.compression-warmth-weight'] +
      (1 - sharpness) * P['microtomy.compression-dullness-weight'] +
      speed * P['microtomy.compression-speed-weight'],
  )
  const chatter = clamp(
    1 -
      m.clamp +
      t.processing.brittleness *
        (1 - t.block.hydration * M['mechanics.hydration-benefit']) *
        P['microtomy.chatter-brittleness-weight'] +
      cold * P['microtomy.chatter-cold-weight'] +
      angle * P['microtomy.chatter-angle-weight'] +
      speed * P['microtomy.chatter-speed-weight'],
  )
  const damaged = mineral > P['microtomy.nick-mineral'] || sharpness < P['microtomy.nick-sharpness']
  t.block.bladeWear[usedSlot] = clamp(
    t.block.bladeWear[usedSlot] +
      P['microtomy.wear'] +
      (damaged ? P['microtomy.wear'] * P['microtomy.damaged-wear-gain'] : 0),
  )
  const staticRisk = clamp(
    (P['microtomy.static-humidity'] - m.humidity) / M['mechanics.static-scale'],
  )
  const variation = clamp(
    (1 - m.consistency) * M['mechanics.consistency-weight'] +
      (1 - m.clamp) * M['mechanics.clamp-variation'],
  )
  const curling = clamp((staticRisk + warmth) * M['mechanics.curl-weight'])
  const section: Section = {
    id: `${t.scenario.accession}-S${t.block.sections.length + 1}`,
    depth: t.block.trimmed,
    thickness: m.thickness,
    purpose,
    level,
    slideId: '',
    compression,
    chatter,
    curling,
    ribbonContinuity: clamp(1 - compression - curling - variation),
    thicknessVariation: variation,
    thicknessMap: t.block.face.map(
      (_, i) => m.thickness * (1 + variation * Math.sin((i * Math.PI) / 2)),
    ),
    knifeLines: damaged
      ? [
          P['microtomy.first-nick-position'] + usedSlot * P['microtomy.nick-slot-spacing'],
          P['microtomy.second-nick-position'],
        ]
      : [],
    holes: clamp(
      Math.max(0, t.block.hydration - M['mechanics.excess-hydration']) +
        (1 - support) * P['microtomy.hole-support-weight'] +
        mineral * P['microtomy.hole-mineral-weight'] +
        t.embedding.bubbles * P['microtomy.hole-bubble-weight'],
    ),
    folds: 0,
    wrinkles: curling,
    bubbles: 0,
    ice: t.frozen.ice,
    floaters: [],
    adhesion: 0,
    pickedUp: false,
    charged: false,
    labelCorrect: false,
    dried: 0,
  }
  if (t.block.remaining <= 0 || (t.embedding.pieces.length > 0 && t.block.face.every(value => value <= 0))) section.holes = 1
  trim(t, m.thickness)
  t.block.sections.push(section)
  return section
}
export function floatSection(
  t: Twin,
  temperature: number,
  minutes: number,
  clean: boolean,
  gentle: boolean,
) {
  const section = t.block.sections.at(-1)
  if (!section) return
  const tooCool = clamp((P['bath.temperature'] - temperature) / P['bath.temperature-scale'])
  const tooHot = clamp((temperature - P['bath.temperature']) / P['bath.temperature-scale'])
  section.wrinkles = clamp(tooCool + (gentle ? 0 : P['bath.rough-wrinkle']))
  section.folds = clamp(tooCool * P['bath.cold-fold-weight'] + (gentle ? 0 : P['bath.rough-fold']))
  section.holes = clamp(section.holes + (tooHot * Math.max(0, minutes)) / P['bath.expansion-time'])
  if (!clean)
    section.floaters.push({
      accession: 'TRAIN-PREVIOUS-ACCESSION',
      x: P['bath.floater-x'],
      y: P['bath.floater-y'],
    })
}
export function dry(t: Twin, temperature: number, minutes: number) {
  const section = t.block.sections.at(-1)
  if (!section) return
  section.dried = clamp(
    ((Math.max(0, minutes) / P['drying.minutes']) * Math.max(0, temperature)) /
      P['drying.temperature'],
  )
  section.adhesion = clamp(section.dried * (section.charged ? 1 : P['drying.uncharged-adhesion']))
  const overheat = clamp(
    Math.max(0, temperature - P['drying.temperature']) / P['drying.heat-scale'],
  )
  t.ihc.preservation *= 1 - overheat * Math.min(1, Math.max(0, minutes) / P['drying.minutes'])
}
