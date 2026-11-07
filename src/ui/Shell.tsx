import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconLearn, IconPractice, IconProgress, IconSettings, IconToday } from '../art/icons'
import { storageError } from '../store/store'
import { Disclaimer } from './components'
import './shell.css'

const JourneyFrame = lazy(() => import('../features/journey/JourneyFrame'))

const PRIMARY = [
  {
    to: '/',
    label: 'Learning path',
    description: 'Begin here. Follow each step.',
    icon: IconToday,
  },
  {
    to: '/practice',
    label: 'Practice',
    description: 'Questions and exam review',
    icon: IconPractice,
  },
  {
    to: '/library',
    label: 'Library',
    description: 'Lessons, labs and references',
    icon: IconLearn,
  },
  { to: '/progress', label: 'Progress', description: 'Your learning record', icon: IconProgress },
]
const SETTINGS = { to: '/settings', label: 'Settings', icon: IconSettings }

function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="2"
        y="9"
        width="28"
        height="14"
        rx="2"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      <rect
        x="2"
        y="9"
        width="9"
        height="14"
        rx="2"
        fill="var(--hema-soft)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      <ellipse cx="20.5" cy="16" rx="5.5" ry="4" fill="var(--eosin)" opacity=".8" />
      <circle cx="19.5" cy="15.5" r="1.6" fill="var(--hema)" />
    </svg>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <p className="muted" role="status">
      {label}…
    </p>
  )
}

export default function Shell({ children }: { children?: ReactNode }) {
  const loc = useLocation()
  const activeSection =
    loc.pathname === '/' || /^\/(pathway|learn)\//.test(loc.pathname)
      ? '/'
      : loc.pathname.startsWith('/practice')
        ? '/practice'
        : loc.pathname === '/progress'
          ? '/progress'
          : loc.pathname === '/settings'
            ? null
            : '/library'
  const currentSection = (to: string) =>
    activeSection === to ? (loc.pathname === to ? 'page' : 'location') : undefined
  const mainRef = useRef<HTMLElement>(null)
  const activityQuery = ['/lab3d', '/practice'].includes(loc.pathname) ? loc.search : ''
  // Move focus to the page on navigation so keyboard and screen-reader users land on new content.
  useEffect(() => {
    const route = loc.pathname.split('/').filter(Boolean)
    const name =
      [...PRIMARY, SETTINGS].find((item) => item.to === `/${route[0] ?? ''}`)?.label ??
      (
        {
          pathway: 'Learning chapter',
          learn: 'Topic lessons',
          lab: 'Concept simulations',
          atlas: 'Reference atlas',
          route2: 'Route 2 tracker',
          workbench: 'Specimen workbench',
          slides: 'Slide library',
          notebook: 'Field notebook',
          today: 'Daily plan',
          career: 'Career practicals',
          shift: 'Simulated shift',
          clinic: 'Troubleshooting clinic',
          lab3d: 'Interactive laboratory',
          review: 'Scientific review',
        } as Record<string, string>
      )[route[0]] ??
      'Study lab'
    document.title = `${name} · HistoQuest`
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [loc.pathname, activityQuery])
  const err = storageError()
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <nav className="rail" aria-label="Primary">
        <NavLink to="/" className="brand">
          <Mark /> HistoQuest
        </NavLink>
        {PRIMARY.map(({ to, label, description, icon: I }) => (
          <Link
            key={to}
            to={to}
            aria-current={currentSection(to)}
            aria-label={label}
            className="nav-link"
          >
            <I />
            <span className="nav-label">
              {label}
              <small>{description}</small>
            </span>
          </Link>
        ))}
        <NavLink to={SETTINGS.to} className="nav-link nav-utility">
          <IconSettings /> {SETTINGS.label}
        </NavLink>
        <div className="rail-foot">
          <Disclaimer />
        </div>
      </nav>
      <div>
        <header className="topbar-mobile">
          <NavLink to="/" className="brand" style={{ padding: 0 }}>
            <Mark /> HistoQuest
          </NavLink>
          <NavLink to={SETTINGS.to} className="icon-btn" aria-label="Settings" title="Settings">
            <IconSettings width={18} height={18} />
          </NavLink>
        </header>
        <main id="main" className="main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
          {err && (
            <p className="notice" role="alert">
              {err}
            </p>
          )}
          <Suspense fallback={<Loading />}>
            {children ??
              (/^\/(pathway\/|learn\/|lab3d|workbench|clinic|shift|practice)/.test(loc.pathname) ? (
                <JourneyFrame>
                  <Outlet />
                </JourneyFrame>
              ) : (
                <Outlet />
              ))}
          </Suspense>
          <div className="page footer-disclaimer" style={{ marginTop: 64 }}>
            <Disclaimer />
          </div>
        </main>
      </div>
      <nav className="tabbar" aria-label="Primary">
        {PRIMARY.map(({ to, label, icon: I }) => (
          <Link key={to} to={to} aria-current={currentSection(to)}>
            <I /> {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
