// Format exemplar for content authors. Not loaded by the app.
import type { z } from 'zod'
import type { CardSchema, QuestionSchema } from '../schema'

type Q = z.input<typeof QuestionSchema>
type C = z.input<typeof CardSchema>

const draft = { status: 'author-checked', verification: 'Consistent with standard histotechnology teaching; not checked against cited text pages.' } as const

export const questions: Q[] = [
  {
    id: 'Q-STAIN-900', version: 1, domain: 'STAIN', objective: 'STAIN-02', difficulty: 2, kind: 'application', format: 'choice',
    stem: 'A liver section shows magenta cytoplasmic granules with PAS. On the serial section pretreated with diastase, the granules are absent. What does this indicate about the granules?',
    options: [
      { id: 'a', text: 'They are glycogen', rationale: 'Correct: diastase (amylase) hydrolyzes glycogen, so PAS positivity that disappears after digestion indicates glycogen.' },
      { id: 'b', text: 'They are neutral mucin', rationale: 'Neutral mucins are PAS-positive but diastase-resistant; they would persist after digestion.' },
      { id: 'c', text: 'They are fungal cell walls', rationale: 'Fungal walls are PAS-positive and diastase-resistant, which is why PAS-D is used for fungi.' },
      { id: 'd', text: 'The Schiff reagent has deteriorated', rationale: 'A failed Schiff reagent would weaken staining on both sections, including the undigested slide that stained well.' },
    ],
    answer: 'a',
    explanation: 'PAS oxidizes 1,2-glycols to aldehydes that react with Schiff reagent. Diastase removes glycogen only; loss of staining after digestion identifies glycogen.',
    references: [{ sourceId: 'bancroft-8', note: 'Carbohydrate histochemistry chapter (not page-verified)' }],
    review: draft,
  },
  {
    id: 'Q-OPS-900', version: 1, domain: 'OPS', objective: 'OPS-03', difficulty: 1, kind: 'calculation', format: 'numeric',
    stem: 'How many mL of 100% ethanol are needed to prepare 500 mL of 70% ethanol?',
    answer: 350, unit: 'mL', unitAliases: ['ml', 'milliliters'], tolerance: 0.5,
    steps: ['C1V1 = C2V2', '100% × V1 = 70% × 500 mL', 'V1 = 350 mL; bring to 500 mL with water'],
    explanation: 'Dilution conserves the amount of solute.',
    commonErrors: [{ value: 150, why: 'That is the volume of water added, not ethanol.' }],
    references: [{ sourceId: 'hq-original' }],
    review: draft,
  },
]

export const cards: C[] = [
  { id: 'C-STAIN-900', objective: 'STAIN-02', front: 'Why does diastase remove PAS staining from glycogen but not from fungal walls?', back: 'Diastase is an amylase that hydrolyzes the α-1,4 glucose linkages of glycogen; fungal wall polysaccharides and neutral mucins are not its substrate, so they stay PAS-positive.', references: [{ sourceId: 'bancroft-8' }], review: draft },
]
