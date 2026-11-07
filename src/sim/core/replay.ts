import { MARKERS } from '../../content/lab/markers'
import { hybridize, stringencyWash, ishControls } from '../models/ish'
import type { LabRecord } from '../../store/labSchema'
import { EventLogSchema, type SimEvent, type StationId } from './events'
import { createScenario, CURATED_SCENARIOS } from './scenarios'
import { average, clamp } from './units'
import { createTwin } from '../specimen/initial'
import type { ModelIssue, Twin } from '../specimen/types'
import { fix, decalcify } from '../models/preservation'
import { processStep } from '../models/processing'
import { cut, dry, floatSection, representation, trim } from '../models/sectioning'
import { specialStep, specialControls } from '../models/special'
import { stainStep, mount } from '../models/staining'
import { retrieve, primary, detect, evaluateControls } from '../models/ihc'
import { releaseProblems } from '../scoring/assess'
import { PROCESS as P } from '../params/process'

function number(e: SimEvent, key: string, fallback: number) {
  const value = e.params[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
function text(e: SimEvent, key: string, fallback = '') {
  return typeof e.params[key] === 'string' ? (e.params[key] as string) : fallback
}
function yes(e: SimEvent, key: string) {
  return e.params[key] === true
}
function issue(t: Twin, e: SimEvent, input: Omit<ModelIssue, 'station' | 'event' | 'resolved'>) {
  if (t.issues.some((i) => i.id === input.id && !i.resolved)) return
  t.issues.push({ ...input, station: e.station, event: e.sequence, resolved: false })
}
function sharps(t: Twin, e: SimEvent) {
  if (!t.instrument.locked || !t.instrument.guarded)
    issue(t, e, {
      id: 'unsafe-sharps',
      severity: 'critical',
      title: 'Unprotected blade-area adjustment',
      cause: 'Hands or an adjustment entered the blade area without both lock and guard.',
      effect: 'Safety is a critical practical criterion even when a section looks intact.',
      remedy: 'Stop and apply the instrument-specific lock, guard and safe handling procedure.',
      lesson: '/learn/L-18',
    })
}

/** Pure event reducer. All clocks, geometry, rendering and input devices remain outside this boundary. */
export function reduceEvent(previous: Twin, event: SimEvent): Twin {
  const t: Twin = structuredClone({ ...previous, events: [] })
  t.events = [...previous.events, event]
  t.station = event.station
  t.time = Math.max(previous.time, event.t)
  const n = (key: string, fallback = 0) => number(event, key, fallback)
  const s = (key: string, fallback = '') => text(event, key, fallback)
  const b = (key: string) => yes(event, key)
  switch (event.intent) {
    case 'document':
      if (s('text').trim())
        t.documentation.push({ station: event.station, text: s('text').trim(), t: t.time })
      break
    case 'identity.hold':
      t.identity.held = true
      t.identity.custody.push('Discrepancy placed on hold')
      break
    case 'identity.resolve':
      if (t.identity.held && s('documentation').trim().length >= 8 && b('authorized')) {
        t.identity.resolved = true
        t.identity.held = false
        t.identity.custody.push(`Authorized resolution: ${s('documentation')}`)
      } else
        t.notes.push(
          'Resolve through the authorized submitting team and document the correction after placing the discrepancy on hold.',
        )
      break
    case 'identity.accept':
      t.identity.accepted = true
      if (!t.identity.resolved) {
        t.identity.broken = true
        issue(t, event, {
          id: 'identity-break',
          severity: 'critical',
          title: 'Unresolved specimen identity',
          cause: 'The specimen was accepted with an unresolved discrepancy.',
          effect: 'Every downstream block and slide inherits uncertain identity.',
          remedy:
            'Hold and resolve through the authorized source; never infer or overwrite patient identity.',
          lesson: '/pathway/accessioning',
        })
      }
      t.identity.custody.push('Accession accepted')
      break
    case 'identity.relabel':
      t.identity.broken = true
      issue(t, event, {
        id: 'unauthorized-relabel',
        severity: 'critical',
        title: 'Unauthorized relabeling',
        cause: 'The container was rewritten without an authorized correction.',
        effect: 'A readable label cannot establish the specimen’s true identity.',
        remedy: 'Quarantine and investigate the identity chain with the submitting team.',
        lesson: '/pathway/accessioning',
      })
      break
    case 'gross.sample':
      Object.assign(t.gross, {
        thickness: clamp(n('thickness', t.gross.thickness), 0.1, 20),
        fragments: Math.round(clamp(n('fragments', t.scenario.fragments), 0, 30)),
        cassette: s('cassette', 'standard'),
        crowding: clamp(n('crowding')),
        ink: s('ink', 'none'),
        key: s('key'),
        sampled: true,
      })
      if (t.scenario.family === 'gut' && t.gross.cassette === 'standard')
        t.gross.fragments = Math.max(0, t.gross.fragments - 1)
      if (!b('extraction'))
        issue(t, event, {
          id: 'gross-extraction',
          severity: 'major',
          title: 'Extraction not established',
          cause: 'Grossing proceeded without checking local extraction.',
          effect: 'Engineering controls are part of chemical-exposure prevention.',
          remedy: 'Follow the laboratory exposure-control procedure before proceeding.',
          lesson: '/learn/L-18',
        })
      break
    case 'gross.measure':
      t.gross.dimensions = [n('length'), n('width'), n('depth')]
      break
    case 'fixation.run':
      fix(
        t,
        n('hours', P['fixation.hours']),
        n('temperature', P['fixation.temperature']),
        n('ratio', P['fixation.ratio']),
        s('fixative', 'nbf'),
        n('ischemia'),
      )
      t.time += Math.max(0, n('hours', P['fixation.hours'])) * 60
      break
    case 'decalcification.run':
      decalcify(t, s('agent', 'edta'), n('hours'), s('endpoint', 'none'))
      t.time += Math.max(0, n('hours')) * 60
      break
    case 'processing.step':
      processStep(
        t,
        s('reagent'),
        Math.max(0, n('minutes')),
        n('temperature', 22),
        n('concentration', 100),
        n('exhaustion'),
        b('vacuum'),
      )
      t.time += Math.max(0, n('minutes'))
      break
    case 'embedding.place': {
      const id = s('piece', 'A1-1')
      const piece = {
        id,
        x: n('x'),
        y: n('y'),
        z: n('z'),
        rx: n('rx'),
        ry: n('ry'),
        rz: n('rz'),
        thickness: t.gross.thickness,
      }
      t.embedding.pieces = [...t.embedding.pieces.filter((p) => p.id !== id), piece]
      t.embedding.bubbles = clamp(n('bubbles'))
      t.embedding.temperature = n('temperature', P['embedding.wax-temperature'])
      t.embedding.representation = representation(t)
      break
    }
    case 'embedding.cool':
      t.embedding.cooled = true
      t.block.temperature = n('temperature', P['microtomy.block-temperature'])
      break
    case 'block.mount':
      sharps(t, event)
      break
    case 'instrument.set': {
      if (['angle', 'clamp', 'sharpness', 'bladePosition'].some((k) => k in event.params))
        sharps(t, event)
      for (const key of [
        'thickness',
        'speed',
        'angle',
        'clamp',
        'sharpness',
        'bladePosition',
        'humidity',
      ] as const) {
        if (key in event.params)
          t.instrument[key] = clamp(
            n(key, t.instrument[key]),
            0,
            key === 'humidity' ? 100 : key === 'clamp' || key === 'sharpness' ? 1 : 50,
          )
      }
      if ('locked' in event.params) t.instrument.locked = b('locked')
      if ('guarded' in event.params) t.instrument.guarded = b('guarded')
      if ('blockTemperature' in event.params) t.block.temperature = n('blockTemperature')
      if ('hydration' in event.params) t.block.hydration = clamp(n('hydration'))
      break
    }
    case 'microtomy.trim':
    case 'microtomy.cut':
      if (t.instrument.locked || t.instrument.guarded) {
        t.notes.push(
          'The cutting mechanism is locked or guarded. Prepare the instrument for cutting while keeping hands clear.',
        )
        break
      }
      if (event.intent === 'microtomy.trim') trim(t, n('microns', P['microtomy.trim']))
      else cut(t, s('purpose', 'routine'), Math.max(1, Math.round(n('level', 1))))
      t.time += 0.25
      break
    case 'bath.float':
      floatSection(
        t,
        n('temperature', P['bath.temperature']),
        n('minutes', P['bath.minutes']),
        b('clean'),
        b('gentle'),
      )
      if (!b('clean'))
        issue(t, event, {
          id: 'floater',
          severity: 'critical',
          title: 'Foreign tissue in the flotation bath',
          cause: 'A previous accession remained in the bath.',
          effect: 'The carried fragment retains its foreign accession on the slide.',
          remedy:
            'Stop, investigate the contamination and repeat from controlled material using a cleaned bath.',
          lesson: '/learn/L-10',
        })
      t.time += Math.max(0, n('minutes', P['bath.minutes']))
      break
    case 'section.pickup': {
      const section = t.block.sections.at(-1)
      if (section) {
        section.pickedUp = true
        section.charged = b('charged')
        section.slideId = s('label')
        section.labelCorrect = s('label').startsWith(t.scenario.accession)
        section.bubbles = clamp(n('bubbles'))
      }
      if (section && !section.labelCorrect) {
        t.identity.broken = true
        issue(t, event, {
          id: 'wrong-slide',
          severity: 'critical',
          title: 'Slide identity mismatch',
          cause: 'The pickup label does not match the synthetic accession.',
          effect: 'The section cannot be safely attributed to the case.',
          remedy:
            'Hold and reconcile the block/slide chain using the laboratory’s correction policy.',
          lesson: '/pathway/accessioning',
        })
      }
      break
    }
    case 'drying.run':
      dry(t, n('temperature', P['drying.temperature']), n('minutes', P['drying.minutes']))
      t.time += Math.max(0, n('minutes', P['drying.minutes']))
      break
    case 'stain.step':
      stainStep(t, s('reagent'), n('minutes'), n('freshness', 1), s('lot', 'TRAIN-LOT'))
      t.time += Math.max(0, n('minutes'))
      break
    case 'special.step':
      specialStep(t, s('protocol'), s('step'), n('minutes'), n('ph', 2.5))
      t.time += Math.max(0, n('minutes'))
      break
    case 'special.controls':
      specialControls(t, b('positive'), b('negative'))
      break
    case 'ihc.marker': {
      const marker = MARKERS.find(m => m.id === s('marker'))
      if (marker) { t.ihc.marker = marker.label; t.ihc.location = marker.localization.includes('nuclear') ? 'nuclear' : marker.localization.includes('membranous') ? 'membranous' : 'cytoplasmic'; t.ihc.valid = false }
      break
    }
    case 'ish.hybridize': hybridize(t, s('probe'), n('minutes'), n('temperature'), n('protease')); t.time += Math.max(0,n('minutes')); break
    case 'ish.wash': stringencyWash(t, n('stringency')); break
    case 'ish.controls': ishControls(t, b('positive'), b('negative')); break
    case 'ihc.retrieve':
      retrieve(
        t,
        n('minutes', P['ihc.retrieval-time']),
        n('temperature', P['ihc.retrieval-temperature']),
        n('ph', P['ihc.retrieval-ph']),
        s('method', 'hier'),
      )
      t.time += Math.max(0, n('minutes'))
      break
    case 'ihc.primary':
      primary(
        t,
        n('dilution', P['ihc.primary-dilution']),
        n('minutes', P['ihc.primary-minutes']),
        b('blocked'),
        b('humid'),
        b('washed'),
        n('sectionAge'),
      )
      t.time += Math.max(0, n('minutes'))
      break
    case 'ihc.detect':
      detect(
        t,
        n('minutes', P['ihc.detect-minutes']),
        n('chromogenMinutes', P['ihc.chromogen-minutes']),
        b('compatible'),
      )
      t.time += Math.max(0, n('minutes')) + Math.max(0, n('chromogenMinutes'))
      break
    case 'ihc.controls':
      evaluateControls(t, b('positive'), b('lowPositive'), b('negative'), b('faultCorrected'))
      break
    case 'coverslip.apply':
      mount(t, s('medium', 'resinous'), n('volume', P['mount.volume']), n('angle', 30), n('delay'))
      break
    case 'frozen.freeze':
      t.frozen = {
        temperature: n('temperature', P['frozen.temperature']),
        rate: n('rate', P['frozen.rate']),
        ice: clamp(1 - n('rate') / P['frozen.rate']),
        biohazardChecked: b('biohazard'),
        prepared: true,
      }
      t.embedding.representation = 1
      t.regions.forEach((r) => {
        r.wax = 1
        r.fixed = 1
        r.water = 0
        r.alcohol = 0
        r.clearant = 0
      })
      t.block.temperature = n('temperature', P['frozen.temperature'])
      if (!b('biohazard'))
        issue(t, event, {
          id: 'frozen-biohazard',
          severity: 'critical',
          title: 'Unfixed tissue precautions omitted',
          cause: 'Frozen preparation began without the biohazard check.',
          effect: 'Frozen material is not sterilized by the cryostat.',
          remedy: 'Follow local containment, PPE and decontamination procedures.',
          lesson: '/learn/L-10',
        })
      t.time += 2
      break
    case 'quality.hold':
      t.disposition = 'hold'
      break
    case 'quality.release':
      t.disposition = 'release'
      if (releaseProblems(t).length)
        issue(t, event, {
          id: 'invalid-release',
          severity: 'critical',
          title: 'Invalid technical release',
          cause: 'The identity or analytical-control chain was unresolved at handoff.',
          effect: 'An attractive slide cannot make an invalid result interpretable.',
          remedy: 'Hold the case and document corrective action before technical release.',
          lesson: '/pathway/quality-handoff',
        })
      break
    default:
      t.notes.push(`Unrecognized intent ${event.intent}; no physical operation was performed.`)
  }
  return t
}
export function replayRun(record: LabRecord, until = record.events.length): Twin {
  const events = EventLogSchema.parse(record.events).slice(0, until)
  const curated = CURATED_SCENARIOS.find((s) => s.seed === record.seed)
  const scenario = curated ?? createScenario(record.seed, record.archetype, record.difficulty)
  return events.reduce(reduceEvent, createTwin(scenario))
}
export function nominalEvent(
  station: StationId,
  intent: string,
  params: SimEvent['params'],
  t = 0,
  sequence = 0,
): SimEvent {
  return { station, intent, params, t, sequence }
}
export const meanPreservation = (t: Twin) => average(t.regions.map((r) => r.fixed))
