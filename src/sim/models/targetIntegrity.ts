import type { Twin } from '../specimen/types'
import { clamp } from '../core/units'
import { MOLECULAR as P } from '../params/molecular'

export type TargetClass = 'protein' | 'rna' | 'dna'
/** Authored target-class susceptibility of the irreversible preservation field.
 * Not a measured hierarchy between every protein, RNA or DNA assay.
 * The upstream factor already includes delay, heat and acid; do not apply acid twice.
 * Retrieval changes access, never this integrity. Markers share the protein class
 * until clone- and method-specific evidence supports a finer model.
 */
export function targetIntegrity(t: Twin, target: TargetClass): number {
  return clamp(t.ihc.preservation) ** P[`integrity.${target}-susceptibility`]
}
