import { Suspense, useEffect, useRef, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconAtlas, IconLab, IconLearn, IconPractice, IconProgress, IconRoute, IconSettings, IconToday } from '../art/icons'
import { storageError } from '../store/store'
import { Disclaimer } from './components'

const PRIMARY = [
  { to: '/', label: 'Today', icon: IconToday, end: true },
  { to: '/learn', label: 'Learn', icon: IconLearn },
  { to: '/lab', label: 'Virtual Lab', short: 'Lab', icon: IconLab },
  { to: '/practice', label: 'Practice', icon: IconPractice },
  { to: '/progress', label: 'Progress', icon: IconProgress },
]
const SECONDARY = [
  { to: '/atlas', label: 'Reference atlas', icon: IconAtlas },
  { to: '/route2', label: 'Route 2 tracker', icon: IconRoute },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="9" width="28" height="14" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="2" y="9" width="9" height="14" rx="2" fill="var(--hema-soft)" stroke="var(--ink)" strokeWidth="1.5" />
      <ellipse cx="20.5" cy="16" rx="5.5" ry="4" fill="var(--eosin)" opacity=".8" />
      <circle cx="19.5" cy="15.5" r="1.6" fill="var(--hema)" />
    </svg>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <p className="muted" role="status">{label}…</p>
}

export default function Shell({ children }: { children?: ReactNode }) {
  const loc = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // Move focus to the page on navigation so keyboard and screen-reader users land on new content.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [loc.pathname])
  const err = storageError()
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <nav className="rail" aria-label="Primary">
        <NavLink to="/" className="brand"><Mark /> HistoQuest</NavLink>
        {PRIMARY.map(({ to, label, icon: I, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link"><I /> {label}</NavLink>
        ))}
        <div className="rail-sep" role="separator" />
        {SECONDARY.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} className="nav-link"><I /> {label}</NavLink>
        ))}
        <div className="rail-foot"><Disclaimer /></div>
      </nav>
      <div>
        <header className="topbar-mobile">
          <NavLink to="/" className="brand" style={{ padding: 0 }}><Mark /> HistoQuest</NavLink>
          <div className="row" style={{ gap: 4 }}>
            {SECONDARY.map(({ to, label, icon: I }) => (
              <NavLink key={to} to={to} className="icon-btn" aria-label={label} title={label}><I width={18} height={18} /></NavLink>
            ))}
          </div>
        </header>
        <main id="main" className="main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
          {err && <p className="notice" role="alert">{err}</p>}
          <Suspense fallback={<Loading />}>{children ?? <Outlet />}</Suspense>
          <div className="page footer-disclaimer" style={{ marginTop: 64 }}><Disclaimer /></div>
        </main>
      </div>
      <nav className="tabbar" aria-label="Primary">
        {PRIMARY.map(({ to, label, short, icon: I, end }) => (
          <NavLink key={to} to={to} end={end}><I /> {short ?? label}</NavLink>
        ))}
      </nav>
    </div>
  )
}
