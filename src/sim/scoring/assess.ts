import type { StationId } from '../core/events'
import { average, clamp } from '../core/units'
import { PROCESS as P } from '../params/process'
import { parameterValue } from '../params/registry'
import { slideAppearance } from '../specimen/appearance'
import type { ModelIssue, Twin } from '../specimen/types'
import { targetIntegrity } from '../models/targetIntegrity'

export interface StationScore {
  station: StationId
  quality: number
  process: number
  safety: number
  documentation: number
  efficiency: number
  total: number
}
export interface Assessment {
  stations: StationScore[]
  total: number
  passed: boolean
  critical: ModelIssue[]
  issues: ModelIssue[]
}
const percent = (x: number) => Math.round(clamp(x) * 100)
const thicknessQuality = (value: number) =>
  clamp(
    1 -
      Math.max(
        0,
        Math.abs(value - parameterValue('section.thickness')) - P['quality.thickness-tolerance'],
      ) /
        P['quality.thickness-falloff'],
  )

/** Quality is measured from the twin. Process, safety and records are independently visible. */
export function stationQuality(t: Twin, station: StationId): number {
  const a = slideAppearance(t)
  const last = t.block.sections.at(-1)
  switch (station) {
    case 'accessioning':
      return Number(t.identity.accepted && t.identity.resolved && !t.identity.broken)
    case 'grossing':
      return average([
        Number(t.gross.sampled),
        clamp(t.gross.fragments / t.scenario.fragments),
        1 - t.gross.crowding,
      ])
    case 'fixation':
      return average(t.regions.map((r) => r.fixed)) * t.ihc.preservation
    case 'decalcification':
      return average(t.regions.map((r) => 1 - r.mineral)) * (1 - t.decal.damage)
    case 'processing':
      return average(t.regions.map((r) => r.wax)) * (1 - t.processing.brittleness)
    case 'embedding':
      return t.embedding.representation * (1 - t.embedding.bubbles)
    case 'microtomy':
      return last
        ? average([
            thicknessQuality(last.thickness),
            1 - last.compression,
            1 - last.chatter,
            1 - last.holes,
            last.knifeLines.length ? 0 : 1,
          ])
        : 0
    case 'bath':
      return last
        ? average([
            1 - last.folds,
            1 - last.wrinkles,
            1 - last.bubbles,
            last.floaters.length ? 0 : 1,
            Number(last.pickedUp && last.labelCorrect),
          ])
        : 0
    case 'drying':
      return last?.adhesion ?? 0
    case 'he':
      return average([
        t.staining.dewax,
        t.staining.hydrated,
        clamp(t.staining.hematoxylin / P['quality.he-nuclear-min']),
        clamp(t.staining.eosin / P['quality.he-eosin-min']),
        t.staining.bluing,
      ])
    case 'special':
      return t.staining.controls.valid ? clamp(t.staining.specialIntensity) : 0
    case 'ihc':
      return t.ihc.valid
        ? average([clamp(t.ihc.dab), 1 - t.ihc.background, 1 - t.ihc.edge, 1 - t.ihc.damage])
        : 0
    case 'ish':
      return t.ihc.valid ? t.ihc.preservation * (1 - t.ihc.background) : 0
    case 'coverslip':
      return Number(a.mounted) * average([1 - a.bubbles, 1 - a.haze, 1 - a.retraction])
    case 'frozen':
      return Number(t.frozen.prepared) * (1 - t.frozen.ice)
    case 'quality':
      return t.disposition === 'hold'
        ? 1
        : Number(t.disposition === 'release' && releaseProblems(t).length === 0)
  }
}

/** A technically unusable or analytically invalid preparation cannot be released by averaging it away. */
export function releaseProblems(t: Twin): string[] {
  const problems: string[] = []
  const last = t.block.sections.at(-1)
  if (!t.identity.accepted || !t.identity.resolved || t.identity.broken)
    problems.push('Unresolved identity chain')
  if (!last?.pickedUp || !last.labelCorrect) problems.push('No correctly identified section')
  if (last && (last.thickness <= 0 || last.holes >= 1)) problems.push('No usable tissue section')
  if (last?.floaters.length) problems.push('Foreign tissue contamination')
  if (t.scenario.request !== 'molecular' && !t.mounting.mounted)
    problems.push('Preparation is not mounted')
  if (t.scenario.request === 'molecular') {
    if (
      t.staining.hematoxylin > 0 ||
      t.staining.eosin > 0 ||
      t.ihc.dab > 0 ||
      t.staining.special ||
      t.ihc.ish ||
      t.mounting.mounted
    )
      problems.push('Molecular-preparation exercise requires an unstained, uncovered section')
    const record = t.events.findLast(
      (e) =>
        e.intent === 'practice.evidence' &&
        e.params.checkId === 'molecular-preparation' &&
        e.params.sectionId === last?.id,
    )
    const target = record?.params.targetClass
    if (
      (target !== 'rna' && target !== 'dna') ||
      !record?.params.protocolReviewed ||
      !record.params.contaminationPlan ||
      !record.params.receivingReview
    )
      problems.push(
        'Document the RNA/DNA request, assay-specific preparation instructions, contamination precautions and receiving-laboratory review for this section',
      )
    else if (targetIntegrity(t, target) <= 0)
      problems.push('Modeled target is lost; hold for qualified review and an alternative specimen')
    else if (targetIntegrity(t, target) < 1 && !record.params.limitationsCommunicated)
      problems.push('Communicate the retained preanalytic damage before this teaching handoff')
  }
  if (t.embedding.representation < P['quality.preservation-min'])
    problems.push('Insufficient tissue representation')
  if (stationQuality(t, 'microtomy') < P['quality.preservation-min'])
    problems.push('Section quality below the scenario threshold')
  if (t.scenario.request === 'ihc' && !t.ihc.valid)
    problems.push('IHC controls do not support interpretation')
  if (
    t.scenario.request === 'special' &&
    (!t.staining.controls.valid || t.staining.specialIntensity < P['quality.preservation-min'])
  )
    problems.push('Special stain is inadequate')
  if (
    ['routine', 'levels', 'frozen'].includes(t.scenario.request) &&
    stationQuality(t, 'he') < P['quality.preservation-min']
  )
    problems.push('Routine stain is inadequate')
  return problems
}

export function assessTwin(t: Twin, required?: StationId[]): Assessment {
  const active = required ?? [...new Set(t.events.map((e) => e.station))]
  const critical = t.issues.filter((i) => i.severity === 'critical')
  const stations = active.map((station) => {
    const issues = t.issues.filter((i) => i.station === station && !i.resolved)
    const quality = percent(stationQuality(t, station))
    const process = percent(
      issues.some((i) => i.severity !== 'minor')
        ? P['quality.process-major']
        : issues.length
          ? P['quality.process-minor']
          : 1,
    )
    const safety = issues.some((i) =>
      ['unsafe-sharps', 'gross-extraction', 'frozen-biohazard'].includes(i.id),
    )
      ? 0
      : 100
    const documentation = t.documentation.some((d) => d.station === station) ? 100 : 0
    const efficiency = percent(
      t.block.remaining <= 0
        ? 0
        : 1 -
            clamp(t.block.trimmed / parameterValue('section.maximum-depth')) *
              P['quality.consumption-penalty'],
    )
    const total = Math.round(
      quality * P['quality.weight-quality'] +
        process * P['quality.weight-process'] +
        safety * P['quality.weight-safety'] +
        documentation * P['quality.weight-documentation'] +
        efficiency * P['quality.weight-efficiency'],
    )
    return { station, quality, process, safety, documentation, efficiency, total }
  })
  const total = Math.round(average(stations.map((s) => s.total)))
  return {
    stations,
    total,
    critical,
    issues: t.issues,
    passed:
      active.length > 0 && !critical.length && total >= parameterValue('quality.pass-threshold'),
  }
}
