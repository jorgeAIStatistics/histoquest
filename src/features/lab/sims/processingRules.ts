/**
 * Processing bench rules: qualitative, documented principles (not a numerical model).
 * 1. Fixation precedes dehydration.
 * 2. Dehydration runs through graded alcohols to absolute alcohol, removing water.
 * 3. Clearing agent (xylene) follows absolute alcohol: xylene is not miscible with water,
 *    so it can only replace alcohol once water is gone.
 * 4. Paraffin follows the clearing agent: paraffin is miscible with xylene but not with alcohol or water.
 */
export type StationKind = 'fix' | 'alc70' | 'alc95' | 'alc100' | 'xylene' | 'paraffin'

export interface Station {
  id: string
  kind: StationKind
  label: string
}

export const STATIONS: Station[] = [
  { id: 's1', kind: 'fix', label: '10% neutral buffered formalin' },
  { id: 's2', kind: 'alc70', label: '70% ethanol' },
  { id: 's3', kind: 'alc95', label: '95% ethanol' },
  { id: 's4', kind: 'alc100', label: '100% ethanol' },
  { id: 's5', kind: 'alc100', label: '100% ethanol' },
  { id: 's6', kind: 'xylene', label: 'Xylene' },
  { id: 's7', kind: 'xylene', label: 'Xylene' },
  { id: 's8', kind: 'paraffin', label: 'Paraffin wax' },
  { id: 's9', kind: 'paraffin', label: 'Paraffin wax' },
]

const RANK: Record<StationKind, number> = { fix: 0, alc70: 1, alc95: 2, alc100: 3, xylene: 4, paraffin: 5 }

export interface Finding {
  index: number // position of the first problematic station
  severity: 'error' | 'warning'
  problem: string
  consequence: string
  principle: string
}

export function evaluateSequence(order: Station[]): Finding[] {
  const out: Finding[] = []
  const kinds = order.map((s) => s.kind)
  const firstOf = (k: StationKind) => kinds.indexOf(k)
  const lastOf = (k: StationKind) => kinds.lastIndexOf(k)

  if (kinds[0] !== 'fix') {
    out.push({ index: 0, severity: 'error', problem: 'Fixation is not first.', consequence: 'Unfixed tissue meets alcohol and solvents. Autolysis and uneven, alcohol-type coagulation follow, and later stains and IHC become unreliable.', principle: 'Fix completely before any processing reagent.' })
  }
  const lastAlcohol = Math.max(lastOf('alc70'), lastOf('alc95'), lastOf('alc100'))
  if (firstOf('xylene') !== -1 && firstOf('xylene') < lastAlcohol) {
    out.push({ index: firstOf('xylene'), severity: 'error', problem: 'Xylene comes before dehydration is complete.', consequence: 'Water left in the tissue does not mix with xylene. The clearing agent turns milky, tissue stays opaque, and paraffin cannot infiltrate. Blocks are soft or mushy and sections crumble.', principle: 'Xylene is immiscible with water. Every trace of water must be removed by absolute alcohol first.' })
  }
  const firstWax = firstOf('paraffin')
  if (firstWax !== -1 && (firstOf('xylene') === -1 || firstOf('xylene') > firstWax)) {
    out.push({ index: firstWax, severity: 'error', problem: 'Paraffin follows alcohol with no clearing step.', consequence: 'Paraffin does not mix with alcohol, so wax cannot replace it. Infiltration is incomplete and the tissue falls out of or crumbles in the block.', principle: 'A clearing agent must be miscible with both the dehydrant and the wax. It is the bridge between them.' })
  }
  if (lastOf('xylene') > firstWax && firstWax !== -1) {
    out.push({ index: lastOf('xylene'), severity: 'error', problem: 'Clearing agent appears after wax infiltration began.', consequence: 'Solvent dilutes the wax and leaves it soft. Sections can be hard to ribbon.', principle: 'Once in wax, stay in wax. Carryover of solvent softens paraffin.' })
  }
  const alcohols = order.map((s, i) => ({ r: RANK[s.kind], i })).filter((x) => x.r >= 1 && x.r <= 3)
  for (let k = 1; k < alcohols.length; k++) {
    if (alcohols[k].r < alcohols[k - 1].r) {
      out.push({ index: alcohols[k].i, severity: 'error', problem: 'Alcohol concentration goes down during dehydration.', consequence: 'Water is added back after it was removed. Dehydration ends incomplete, with the same downstream problems as skipping it.', principle: 'Dehydration moves only upward in alcohol concentration and ends in absolute alcohol.' })
      break
    }
  }
  if (kinds[1] === 'alc100' && kinds.includes('alc70')) {
    // ordering error is caught above; nothing extra
  } else if (kinds[0] === 'fix' && kinds[1] === 'alc100') {
    out.push({ index: 1, severity: 'warning', problem: 'Straight from aqueous fixative to absolute alcohol.', consequence: 'Abrupt change can cause shrinkage and distortion, especially in delicate tissues. Many labs use graded alcohols for this reason.', principle: 'Graded alcohols reduce osmotic and diffusion stress (practice varies by tissue and protocol).' })
  }
  if (lastAlcohol !== -1 && kinds[lastAlcohol] !== 'alc100') {
    out.push({ index: lastAlcohol, severity: 'error', problem: 'Dehydration does not end in absolute alcohol.', consequence: '95% ethanol still carries water into the clearing agent, giving cloudy xylene and poor infiltration.', principle: 'The final dehydrant must be absolute (water-free) alcohol.' })
  }
  return out.sort((a, b) => a.index - b.index)
}
