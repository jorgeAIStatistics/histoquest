import type { DomainId, GuidelineVersion } from '../content/curriculum'
import { hashString, shuffle } from './random'

interface Item {
  id: string
  domain: DomainId
}

/**
 * Allocate `total` questions across domains. Start from each range's midpoint, normalise to
 * `total`, then clamp to each domain's [min, max] share (rounded) and to what the pool holds.
 * Largest-remainder rounding keeps the sum exact when the pool allows it.
 */
export function allocate(g: GuidelineVersion, total: number, available: Record<DomainId, number>): Record<DomainId, number> {
  const mids = g.domains.map((d) => ({ id: d.id, mid: (d.min + d.max) / 2, min: d.min, max: d.max }))
  const sum = mids.reduce((a, d) => a + d.mid, 0)
  const raw = mids.map((d) => ({ ...d, exact: (d.mid / sum) * total }))
  const out = Object.fromEntries(raw.map((d) => [d.id, Math.floor(d.exact)])) as Record<DomainId, number>
  let left = total - Object.values(out).reduce((a, b) => a + b, 0)
  for (const d of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break
    out[d.id]++
    left--
  }
  // Respect pool size; redistribute any shortfall to domains with spare questions, within their max share.
  let shortfall = 0
  for (const d of raw) {
    if (out[d.id] > available[d.id]) {
      shortfall += out[d.id] - available[d.id]
      out[d.id] = available[d.id]
    }
  }
  for (const d of [...raw].sort((a, b) => b.mid - a.mid)) {
    if (shortfall <= 0) break
    const cap = Math.min(available[d.id], Math.ceil((d.max / 100) * total))
    const add = Math.max(0, Math.min(shortfall, cap - out[d.id]))
    out[d.id] += add
    shortfall -= add
  }
  return out
}

/** Build a fixed form: blueprint-weighted, unique ids, deterministic for a seed. Prefers unseen items. */
export function buildForm<T extends Item>(
  g: GuidelineVersion,
  pool: T[],
  total: number,
  seed: string,
  seen: Set<string> = new Set(),
): { ids: string[]; allocation: Record<DomainId, number>; shortBy: number } {
  const unique = [...new Map(pool.map((q) => [q.id, q])).values()]
  const byDomain = (d: DomainId) => unique.filter((q) => q.domain === d)
  const available = Object.fromEntries(g.domains.map((d) => [d.id, byDomain(d.id).length])) as Record<DomainId, number>
  const allocation = allocate(g, total, available)
  const ids: string[] = []
  for (const d of g.domains) {
    const items = shuffle(byDomain(d.id), hashString(`${seed}:${d.id}`))
    items.sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id))) // stable: unseen first
    ids.push(...items.slice(0, allocation[d.id]).map((q) => q.id))
  }
  return { ids: shuffle(ids, hashString(`${seed}:order`)), allocation, shortBy: total - ids.length }
}
