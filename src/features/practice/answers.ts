import type { Question } from '../../content/schema'
import { gradeChoice, gradeNumeric } from '../../engine/grading'

export interface Answer {
  value: string
  unit?: string
  confidence: number
}

export function isCorrect(q: Question, a: Answer | undefined) {
  if (!a) return false
  return q.format === 'choice'
    ? gradeChoice(q, a.value)
    : gradeNumeric(q, a.value, a.unit ?? '').correct
}
