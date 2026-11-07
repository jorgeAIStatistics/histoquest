import { expect, it } from 'vitest'
import { SOURCE_BY_ID } from '../../content/sources'
import { REVIEW_ITEMS } from './catalog'
it('keeps every review record addressable and flags the documented claims first', () => {
  expect(new Set(REVIEW_ITEMS.map((i) => i.id)).size).toBe(REVIEW_ITEMS.length)
  expect(REVIEW_ITEMS.filter((i) => i.kind === 'Flagged teaching claim')).toHaveLength(14)
  expect(REVIEW_ITEMS[0].risk).toBe('priority')
  for (const item of REVIEW_ITEMS)
    for (const id of item.sourceIds) expect(SOURCE_BY_ID[id], `${item.id}: ${id}`).toBeDefined()
})
