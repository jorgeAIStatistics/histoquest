import { useEffect, useLayoutEffect, useState } from 'react'
import { useAppState } from '../store/store'

/** Apply stored preferences before painting a route, avoiding a mixed-theme first frame. */
export function useApplyPrefs() {
  const settings = useAppState((s) => s.settings)
  useLayoutEffect(() => {
    const el = document.documentElement
    if (settings.theme === 'system') el.removeAttribute('data-theme')
    else el.setAttribute('data-theme', settings.theme)
    el.setAttribute('data-accent', settings.accent)
    if (settings.motion === 'system') el.removeAttribute('data-motion')
    else el.setAttribute('data-motion', settings.motion)
  }, [settings.theme, settings.accent, settings.motion])
}

function useMediaQuery(q: string) {
  const [match, setMatch] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia(q).matches,
  )
  useEffect(() => {
    const m = matchMedia(q)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return match
}

/** True when animations should be skipped: the app setting wins over the OS setting. */
export function useReducedMotion() {
  const pref = useAppState((s) => s.settings.motion)
  const os = useMediaQuery('(prefers-reduced-motion: reduce)')
  return pref === 'reduced' || (pref === 'system' && os)
}

let ctx: AudioContext | undefined
/** Optional, off by default. A soft two-note tone; never used for errors so it can't feel punitive. */
export function chime(enabled: boolean) {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime
    for (const [i, f] of [523.25, 659.25].entries()) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      o.type = 'sine'
      g.gain.setValueAtTime(0.0001, t + i * 0.09)
      g.gain.exponentialRampToValueAtTime(0.06, t + i * 0.09 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.35)
      o.connect(g).connect(ctx.destination)
      o.start(t + i * 0.09)
      o.stop(t + i * 0.09 + 0.4)
    }
  } catch {
    /* audio unavailable: silently skip */
  }
}
