// Validate one content module in isolation: CONTENT_FILE=src/content/data/x.ts npx vitest run src/content/check-file.test.ts
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AtlasEntrySchema, CardSchema, LessonSchema, QuestionSchema } from './schema'
import { OBJECTIVE_BY_ID } from './curriculum'
import { SOURCE_BY_ID } from './sources'

const file = process.env.CONTENT_FILE

describe.runIf(!!file)(`content file ${file}`, () => {
  it('validates against the schemas and registries', async () => {
    const mod = await import(/* @vite-ignore */ `${process.cwd()}/${file}`)
    const problems: string[] = []
    const check = (name: string, schema: z.ZodTypeAny, items: unknown[] | undefined) => {
      for (const item of items ?? []) {
        const r = schema.safeParse(item)
        const id = (item as { id?: string }).id
        if (!r.success) problems.push(`${name} ${id}: ${r.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}`)
        else {
          const v = r.data as { objective?: string; objectives?: string[]; references: { sourceId: string }[]; answer?: unknown; options?: { id: string }[] }
          for (const o of [v.objective, ...(v.objectives ?? [])].filter(Boolean) as string[])
            if (!OBJECTIVE_BY_ID[o]) problems.push(`${name} ${id}: unknown objective ${o}`)
          for (const ref of v.references) if (!SOURCE_BY_ID[ref.sourceId]) problems.push(`${name} ${id}: unknown source ${ref.sourceId}`)
          if (v.options && !v.options.some((op) => op.id === v.answer)) problems.push(`${name} ${id}: answer not among options`)
        }
      }
    }
    check('question', QuestionSchema, mod.questions)
    check('card', CardSchema, mod.cards)
    check('lesson', LessonSchema, mod.lessons)
    check('atlas', AtlasEntrySchema, mod.atlas)
    expect(problems).toEqual([])
  })
})
