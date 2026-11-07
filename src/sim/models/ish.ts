import { MOLECULAR as P } from '../params/molecular'
import type { Twin } from '../specimen/types'
import { targetIntegrity } from './targetIntegrity'

export function ishSignal(t: Twin) {
  return t.ihc.ish?.signal ?? t.ihc.dab
}
export function hybridize(
  t: Twin,
  probe: string,
  minutes: number,
  temperature: number,
  protease: number,
  modality = 'CISH',
  denatured = false,
) {
  const targetType = /DNA/i.test(probe) ? 'dna' : 'rna'
  const access =
    Math.exp(-((protease - P['ish.protease']) ** 2)) *
    (t.frozen.prepared ? 1 : t.staining.dewax * t.staining.hydrated)
  const thermal = Math.exp(
    -(((temperature - P['ish.temperature']) / P['ish.temperature-width']) ** 2),
  )
  const exposure = 1 - Math.exp(-Math.max(0, minutes) / P['ish.hybridization-time'])
  t.ihc.marker = probe
  t.ihc.location = probe === 'EBER' || targetType === 'dna' ? 'nuclear' : 'cytoplasmic'
  t.ihc.locations = [t.ihc.location]
  const reactionSignal =
    exposure * access * thermal * P['ish.signal'] * (targetType === 'dna' && !denatured ? 0 : 1)
  t.ihc.primary = (reactionSignal / P['ish.signal']) * targetIntegrity(t, targetType)
  const signal = t.ihc.primary * P['ish.signal']
  t.ihc.ish = {
    modality: modality === 'FISH' ? 'FISH' : 'CISH',
    targetType,
    reactionSignal,
    signal,
    background: P['ish.background'],
    integritySignal: null,
  }
  t.ihc.dab = modality === 'FISH' ? 0 : signal
  t.ihc.background = modality === 'FISH' ? 0 : P['ish.background']
  t.ihc.valid = false
}
export function stringencyWash(t: Twin, stringency: number) {
  const exposure = Math.max(0, stringency)
  const backgroundRetention = Math.exp(-exposure / P['ish.stringency'])
  const targetRetention = Math.exp(-Math.max(0, exposure - P['ish.stringency']))
  t.ihc.background *= backgroundRetention
  t.ihc.dab *= targetRetention
  if (t.ihc.ish) {
    t.ihc.ish.background *= backgroundRetention
    t.ihc.ish.signal *= targetRetention
    t.ihc.ish.reactionSignal *= targetRetention
    t.ihc.ish.integritySignal = null
  }
  t.ihc.valid = false
}
/** Assay-positive, negative-probe and specimen-integrity controls are separate
 * requirements in this teaching policy; none is a substitute for another.
 * Signals are qualitative proxies, not a vendor score or quantitative assay. */
export function ishControls(t: Twin, positive: boolean, negative: boolean, integrity = false) {
  const signal = ishSignal(t)
  const background = t.ihc.ish?.background ?? t.ihc.background
  t.ihc.positive = positive ? (t.ihc.ish?.reactionSignal ?? signal) : null
  t.ihc.negative = negative ? background : null
  t.ihc.internal = integrity ? signal : null
  if (t.ihc.ish) t.ihc.ish.integritySignal = t.ihc.internal
  t.ihc.valid =
    positive &&
    negative &&
    integrity &&
    (t.ihc.positive ?? 0) >= P['ish.positive-min'] &&
    signal >= P['ish.positive-min'] &&
    background <= P['ish.background-max']
}
