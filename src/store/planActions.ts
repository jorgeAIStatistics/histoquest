import { addDays, localDate } from '../engine/dates'
import { planFor } from '../features/shared/derived'
import { getState, setState } from './store'

/**
 * Today's plan is generated once per local day and duration, then stored, so leaving and coming
 * back resumes the same plan. Changing the duration regenerates but keeps completed items.
 */
export function ensurePlan(minutes: 10 | 20 | 45, force = false) {
  const s = getState()
  const today = localDate()
  if (!force && s.plan && s.plan.day === today && s.plan.minutes === minutes) return
  const fresh = planFor(s, minutes, today)
  const kept = s.plan?.day === today ? s.plan.items.filter((i) => i.done) : []
  const items = [...kept, ...fresh.filter((f) => !kept.some((k) => k.id === f.id))]
  setState((st) => ({ ...st, plan: { day: today, minutes, items }, settings: { ...st.settings, sessionMinutes: minutes } }))
}

export function markPlanItem(id: string | null | undefined, patch: { done?: boolean; skipped?: boolean }) {
  if (!id) return
  setState((s) => (s.plan && s.plan.day === localDate() ? { ...s, plan: { ...s.plan, items: s.plan.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } } : s))
}

/** "Not today": no penalty, no streak loss beyond the forgiving rule; tomorrow builds a fresh plan. */
export function deferPlan() {
  setState((s) => (s.plan ? { ...s, plan: { ...s.plan, deferredTo: addDays(localDate(), 1) } } : s))
}

export function undeferPlan() {
  setState((s) => (s.plan ? { ...s, plan: { ...s.plan, deferredTo: undefined } } : s))
}
