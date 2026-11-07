import { clamp } from '../core/units'
import { MOLECULAR as P } from '../params/molecular'
import type { Twin } from '../specimen/types'
/** Shared chromogen channels carry the ISH output. Nucleic-acid integrity is a qualitative preanalytic proxy. */
export function hybridize(t: Twin, probe: string, minutes: number, temperature: number, protease: number) {
  const access = Math.exp(-((protease - P['ish.protease']) ** 2)) * (t.frozen.prepared ? 1 : t.staining.dewax)
  const thermal = Math.exp(-(((temperature - P['ish.temperature']) / P['ish.temperature-width']) ** 2))
  const exposure = 1 - Math.exp(-Math.max(0, minutes) / P['ish.hybridization-time'])
  t.ihc.marker = probe
  t.ihc.location = probe === 'EBER' ? 'nuclear' : 'cytoplasmic'
  t.ihc.primary = exposure * access * thermal * t.ihc.preservation * (1 - t.decal.damage)
  t.ihc.dab = t.ihc.primary * P['ish.signal']
  t.ihc.background = P['ish.background']
  t.ihc.valid = false
}
export function stringencyWash(t: Twin, stringency: number) {
  const exposure = Math.max(0,stringency)
  t.ihc.background *= Math.exp(-exposure / P['ish.stringency'])
  t.ihc.dab *= Math.exp(-Math.max(0,exposure - P['ish.stringency']))
  t.ihc.valid = false
}
export function ishControls(t: Twin, positive: boolean, negative: boolean) {
  t.ihc.positive = positive ? t.ihc.dab : null
  t.ihc.negative = negative ? t.ihc.background : null
  t.ihc.internal = clamp(t.ihc.preservation) * t.ihc.dab
  t.ihc.valid = positive && negative && t.ihc.dab >= P['ish.positive-min'] && t.ihc.background <= P['ish.background-max']
}
