/** Stable, non-cryptographic random streams. No wall clock is consulted by models. */
export { hashString, rng, shuffle } from '../../engine/random'
import { hashString, rng } from '../../engine/random'
export const randomStream = (seed: string, scope = '') => rng(hashString(`${seed}:${scope}`))
export function choose<T>(items: readonly T[], random: () => number): T {
  if (!items.length) throw new Error('A scenario needs at least one candidate')
  return items[Math.floor(random() * items.length)]
}
