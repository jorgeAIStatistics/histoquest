import { describe, expect, it } from 'vitest'
import { LESSONS, QUESTIONS } from '..'
import { OBJECTIVE_BY_ID } from '../curriculum'
import { LessonSchema, QuestionSchema } from '../schema'
import { SOURCES } from '../sources'
import { LAB_LESSONS, LAB_QUESTIONS } from './education'
import { LAB_SOURCES } from './sources'

const labIds = new Set(LAB_QUESTIONS.map((question) => question.id))
const allQuestions = [...QUESTIONS.filter((question) => !labIds.has(question.id)), ...LAB_QUESTIONS]
const allLessons = [
  ...LESSONS.filter((lesson) => !LAB_LESSONS.some((added) => added.id === lesson.id)),
  ...LAB_LESSONS,
]
const sourceIds = new Set([...SOURCES, ...LAB_SOURCES].map((source) => source.id))

describe('original laboratory education expansion', () => {
  it('adds at least 136 original questions and reaches the 300-question release target', () => {
    expect(LAB_QUESTIONS.length).toBeGreaterThanOrEqual(136)
    expect(allQuestions.length).toBeGreaterThanOrEqual(300)
    expect(new Set(allQuestions.map((question) => question.id)).size).toBe(allQuestions.length)
    for (const question of LAB_QUESTIONS) {
      expect(QuestionSchema.safeParse(question).success, question.id).toBe(true)
      expect(OBJECTIVE_BY_ID[question.objective]?.domain).toBe(question.domain)
      expect(question.review.status).toBe('author-checked')
      expect(question.review.verification).toContain('qualified histotechnology review')
      for (const ref of question.references)
        expect(sourceIds.has(ref.sourceId), `${question.id}: ${ref.sourceId}`).toBe(true)
      expect(question.options.some((option) => option.id === question.answer)).toBe(true)
      expect(new Set(question.options.map((option) => option.text.toLowerCase())).size).toBe(
        question.options.length,
      )
    }
  })
  it('balances answer positions without changing the underlying correct rationale', () => {
    const counts = ['a', 'b', 'c', 'd'].map(
      (key) => LAB_QUESTIONS.filter((question) => question.answer === key).length,
    )
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
    for (const question of LAB_QUESTIONS)
      expect(question.options.find((option) => option.id === question.answer)?.rationale).toBe(
        question.explanation,
      )
  })
  it('does not add near-duplicate stems to the existing bank', () => {
    const words = (text: string) =>
      new Set(
        text
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ')
          .split(/\s+/)
          .filter((word) => word.length > 3),
      )
    const sets = allQuestions.map((question) => ({ id: question.id, words: words(question.stem) }))
    const duplicates: string[] = []
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        if (!labIds.has(sets[i].id) && !labIds.has(sets[j].id)) continue
        const a = sets[i].words,
          b = sets[j].words
        const overlap = [...a].filter((word) => b.has(word)).length
        if (overlap / (a.size + b.size - overlap) >= 0.8)
          duplicates.push(`${sets[i].id} ~ ${sets[j].id}`)
      }
    }
    expect(duplicates).toEqual([])
  })
  it('fills the four requested lesson gaps with valid retrieval and prerequisites', () => {
    expect(LAB_LESSONS).toHaveLength(4)
    for (const objective of ['STAIN-11', 'STAIN-12', 'STAIN-13', 'STAIN-14'])
      expect(
        LAB_LESSONS.some((lesson) => lesson.objectives.includes(objective)),
        objective,
      ).toBe(true)
    for (const lesson of LAB_LESSONS) {
      expect(LessonSchema.safeParse(lesson).success, lesson.id).toBe(true)
      for (const id of lesson.retrieval)
        expect(
          allQuestions.some((question) => question.id === id),
          `${lesson.id}: ${id}`,
        ).toBe(true)
      for (const id of lesson.prerequisites)
        expect(
          allLessons.some((candidate) => candidate.id === id),
          `${lesson.id}: ${id}`,
        ).toBe(true)
      for (const ref of lesson.references)
        expect(sourceIds.has(ref.sourceId), `${lesson.id}: ${ref.sourceId}`).toBe(true)
      expect(lesson.demo.steps.length).toBeGreaterThanOrEqual(3)
    }
  })
})
