import type { ModelParameter } from './registry'

/** Fictitious gross specimens: sizes drive the teaching mesh, not sampling instructions. */
const dimensions: Record<string, [number, number, number]> = {
  'skin-ellipse': [18, 9, 3],
  'skin-punch': [4, 4, 3],
  'skin-shave': [8, 6, 1],
  'colon-biopsy': [3, 2, 1],
  'stomach-biopsy': [3, 2, 1],
  'duodenum-biopsy': [3, 2, 1],
  'esophagus-biopsy': [3, 2, 1],
  'prostate-core': [15, 1, 1],
  'breast-core': [15, 2, 2],
  'lymph-node': [14, 10, 3],
  endometrium: [4, 3, 2],
  cervix: [12, 8, 3],
  placenta: [18, 12, 3],
  'fatty-tissue': [18, 14, 3],
  'bone-core': [12, 3, 3],
  'marrow-trephine': [16, 2, 2],
  brain: [14, 12, 3],
  'kidney-core': [12, 1, 1],
  'liver-core': [16, 1, 1],
  'muscle-biopsy': [10, 5, 3],
  'frozen-consult': [10, 8, 3],
}
export const ARCHETYPE_PARAMETERS: ModelParameter[] = Object.entries(dimensions).flatMap(
  ([id, values]) =>
    values.map((value, axis) => ({
      id: `archetype.${id}.${['length', 'width', 'depth'][axis]}`,
      value,
      unit: 'mm',
      scope: 'Fictitious specimen geometry',
      sourceIds: ['hq-original'],
      accessStatus: 'illustrative',
      illustrative: true,
      note: 'Chosen for a readable teaching mesh. This is not a recommended specimen size or grossing instruction.',
    })),
)
