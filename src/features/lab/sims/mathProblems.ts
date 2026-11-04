import { rng } from '../../../engine/random'
import type { NumericQuestion } from '../../../content/schema'

/**
 * Parameterised lab-math problems. Each returns a NumericQuestion-shaped object, so it is graded
 * by the same tested gradeNumeric() as the bank. Arithmetic is computed, never hand-typed.
 */
export type MathKind = 'dilution' | 'percent-wv' | 'molarity' | 'antibody' | 'serial' | 'convert'

const round = (x: number, dp = 4) => Number(x.toFixed(dp))
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)]

const SOLUTES = [
  { name: 'sodium chloride (NaCl)', mw: 58.44 },
  { name: 'sodium hydroxide (NaOH)', mw: 40.0 },
  { name: 'potassium chloride (KCl)', mw: 74.55 },
  { name: 'sodium bicarbonate (NaHCO₃)', mw: 84.01 },
]

function base(id: string, objective: 'OPS-03' | 'OPS-04'): Omit<NumericQuestion, 'stem' | 'answer' | 'unit' | 'unitAliases' | 'tolerance' | 'steps' | 'explanation' | 'commonErrors'> {
  return { id, version: 1, domain: 'OPS', objective, difficulty: 2, kind: 'calculation', format: 'numeric', references: [{ sourceId: 'hq-original' }], review: { status: 'author-checked', verification: 'Generated; arithmetic computed and unit-tested.' }, tags: ['generated'] }
}

export function generate(kind: MathKind, seed: number): NumericQuestion {
  const r = rng(seed)
  const id = `Q-GEN-${String(seed % 1000).padStart(3, '0')}`
  switch (kind) {
    case 'dilution': {
      const c1 = pick(r, [100, 95])
      const c2 = pick(r, [70, 80, 50])
      const v2 = pick(r, [250, 500, 1000])
      const v1 = round((c2 * v2) / c1, 2)
      return { ...base(id, 'OPS-03'), stem: `You need ${v2} mL of ${c2}% ethanol. Your stock is ${c1}% ethanol. How much stock do you measure?`, answer: v1, unit: 'mL', unitAliases: ['ml', 'milliliters', 'millilitres'], tolerance: 0.5,
        steps: ['C₁V₁ = C₂V₂', `${c1}% × V₁ = ${c2}% × ${v2} mL`, `V₁ = (${c2} × ${v2}) ÷ ${c1} = ${v1} mL`, `Bring to ${v2} mL with water: add about ${round(v2 - v1, 2)} mL.`],
        explanation: 'The amount of ethanol stays the same; only the total volume changes.',
        commonErrors: [{ value: round(v2 - v1, 2), why: 'That is the volume of water added, not the stock volume.' }, { value: round((c1 * v2) / c2, 2), why: 'The concentrations are inverted. Stock goes on the side with V₁.' }] }
    }
    case 'percent-wv': {
      const pct = pick(r, [0.5, 1, 2, 3, 5])
      const vol = pick(r, [100, 250, 500])
      const g = round((pct * vol) / 100, 3)
      return { ...base(id, 'OPS-03'), stem: `How many grams of solute make ${vol} mL of a ${pct}% (w/v) aqueous solution?`, answer: g, unit: 'g', unitAliases: ['grams', 'gram', 'gm'], tolerance: Math.max(0.001, g * 0.005),
        steps: ['% w/v means grams per 100 mL.', `${pct} g per 100 mL × ${vol} mL ÷ 100 mL`, `= ${g} g, dissolved and brought to ${vol} mL`],
        explanation: 'Weight/volume percent is grams of solute per 100 mL of final solution.',
        commonErrors: [{ value: round(pct * vol, 3), why: 'Divide by 100: percent means per 100 mL.' }] }
    }
    case 'molarity': {
      const s = pick(r, SOLUTES)
      const m = pick(r, [0.1, 0.5, 1, 2])
      const l = pick(r, [0.25, 0.5, 1])
      const g = round(m * l * s.mw, 3)
      return { ...base(id, 'OPS-04'), stem: `How many grams of ${s.name} (molecular weight ${s.mw} g/mol) make ${l * 1000} mL of a ${m} M solution?`, answer: g, unit: 'g', unitAliases: ['grams', 'gram'], tolerance: Math.max(0.01, g * 0.002),
        steps: ['grams = molarity (mol/L) × volume (L) × molecular weight (g/mol)', `= ${m} × ${l} × ${s.mw}`, `= ${g} g`],
        explanation: 'Convert mL to L first. Molarity is moles per litre of final solution.',
        commonErrors: [{ value: round(m * l * 1000 * s.mw, 3), why: 'Volume must be in litres, not millilitres.' }, { value: round((m * s.mw) / l, 3), why: 'Multiply by the volume in litres; don’t divide.' }] }
    }
    case 'antibody': {
      const ratio = pick(r, [50, 100, 200, 400])
      const total = pick(r, [1000, 2000, 5000])
      const conc = round(total / ratio, 3)
      return { ...base(id, 'OPS-03'), stem: `Prepare ${total} µL of primary antibody at 1:${ratio} (1 part concentrate in ${ratio} parts total). How many µL of concentrate?`, answer: conc, unit: 'µL', unitAliases: ['ul', 'uL', 'microliters', 'μl', 'µl'], tolerance: Math.max(0.01, conc * 0.002),
        steps: [`1:${ratio} means concentrate is 1/${ratio} of the total volume.`, `${total} µL ÷ ${ratio} = ${conc} µL concentrate`, `Diluent = ${total} − ${conc} = ${round(total - conc, 3)} µL`],
        explanation: 'Ratio dilutions in IHC are usually stated as parts of the final total volume. Confirm your lab’s convention.',
        commonErrors: [{ value: round(total / (ratio + 1), 3), why: 'That treats 1:ratio as 1 part plus ratio parts diluent. Here the stem defines ratio as parts of the total.' }] }
    }
    case 'serial': {
      const start = pick(r, [100, 200, 500])
      const f = pick(r, [2, 5, 10])
      const n = pick(r, [2, 3, 4])
      const end = round(start / f ** n, 6)
      return { ...base(id, 'OPS-03'), stem: `A ${start} µg/mL stock is diluted 1:${f}, then that is diluted 1:${f} again, for ${n} sequential 1:${f} steps in total. What is the final concentration?`, answer: end, unit: 'µg/mL', unitAliases: ['ug/ml', 'ug/mL', 'μg/mL', 'µg/ml', 'micrograms/mL'], tolerance: Math.max(1e-6, end * 0.005),
        steps: [`Total dilution factor = ${f}^${n} = ${f ** n}`, `${start} ÷ ${f ** n} = ${end} µg/mL`],
        explanation: 'Sequential dilution factors multiply.',
        commonErrors: [{ value: round(start / (f * n), 6), why: 'Factors multiply (f × f × …), they do not add up to f × n.' }] }
    }
    case 'convert': {
      const ml = pick(r, [0.025, 0.25, 1.5, 0.005])
      const ul = round(ml * 1000, 3)
      return { ...base(id, 'OPS-03'), stem: `Convert ${ml} mL to microlitres.`, answer: ul, unit: 'µL', unitAliases: ['ul', 'uL', 'microliters', 'μl', 'µl'], tolerance: Math.max(0.001, ul * 0.001),
        steps: ['1 mL = 1000 µL', `${ml} × 1000 = ${ul} µL`],
        explanation: 'Moving to a smaller unit makes the number larger.',
        commonErrors: [{ value: round(ml / 1000, 6), why: 'Multiply by 1000 when going from mL to the smaller unit µL.' }] }
    }
  }
}

export const MATH_KINDS: { kind: MathKind; label: string }[] = [
  { kind: 'dilution', label: 'C₁V₁ = C₂V₂ dilutions' },
  { kind: 'percent-wv', label: 'Percent (w/v) solutions' },
  { kind: 'molarity', label: 'Molar solutions' },
  { kind: 'antibody', label: 'Antibody ratio dilutions' },
  { kind: 'serial', label: 'Serial dilutions' },
  { kind: 'convert', label: 'Unit conversions' },
]
