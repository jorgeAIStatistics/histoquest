import type { ChoiceQuestion, NumericQuestion } from '../content/schema'
import { hashString, shuffle } from './random'

/** Option order for a question in a given session. Stable for the same seed so refresh keeps the order. */
export function optionOrder(q: ChoiceQuestion, sessionSeed: string): string[] {
  return shuffle(
    q.options.map((o) => o.id),
    hashString(`${sessionSeed}:${q.id}`),
  )
}

export function gradeChoice(q: ChoiceQuestion, selected: string | undefined): boolean {
  return selected !== undefined && selected === q.answer
}

export interface NumericResult {
  correct: boolean
  valueOk: boolean
  unitOk: boolean
  parsed?: number
  feedback: string
}

const normUnit = (u: string) =>
  u
    .trim()
    .toLowerCase()
    .replace(/μ/g, 'µ')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')

/**
 * Grade a numeric answer: both the value (within tolerance) and the unit must be right.
 * Accepts "350", "350 mL", "3.5e2". A unit may be typed with the number or in the unit field.
 */
export function gradeNumeric(q: NumericQuestion, rawValue: string, rawUnit = ''): NumericResult {
  const m = rawValue.trim().replace(/,/g, '').match(/^(-?\d*\.?\d+(?:e-?\d+)?)\s*(.*)$/i)
  if (!m) return { correct: false, valueOk: false, unitOk: false, feedback: 'Enter a number, for example 12.5.' }
  const parsed = Number(m[1])
  const unit = normUnit(rawUnit || m[2] || '')
  const accepted = [q.unit, ...q.unitAliases].map(normUnit)
  const valueOk = Math.abs(parsed - q.answer) <= q.tolerance + 1e-9
  const unitOk = accepted.includes(unit)
  let feedback: string
  if (valueOk && unitOk) feedback = `Correct: ${q.answer} ${q.unit}.`
  else if (valueOk && !unit) feedback = `The number is right, but the unit is missing. Expected ${q.unit}.`
  else if (valueOk) feedback = `The number is right, but "${unit}" is not the expected unit (${q.unit}).`
  else {
    const known = q.commonErrors.find((e) => Math.abs(e.value - parsed) <= Math.max(q.tolerance, 1e-9))
    feedback = known ? known.why : `Not quite. The expected answer is ${q.answer} ${q.unit}.`
  }
  return { correct: valueOk && unitOk, valueOk, unitOk, parsed, feedback }
}
