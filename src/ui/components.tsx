import type { ReactNode } from 'react'
import { SOURCE_BY_ID } from '../content/sources'
import type { Ref } from '../content/schema'

export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Point estimate with a Wilson interval band. */
export function RangeBar({ low, high, p, label, n }: { low: number; high: number; p: number; label: string; n?: number }) {
  if (n === 0) return <div className="range-bar" role="img" aria-label={`${label}: no data yet`} />
  return (
    <div className="range-bar" role="img" aria-label={`${label}: ${Math.round(p * 100)}%, plausible range ${Math.round(low * 100)}–${Math.round(high * 100)}%`}>
      <div className="band" style={{ left: `${low * 100}%`, width: `${(high - low) * 100}%` }} />
      <div className="dot" style={{ left: `${p * 100}%` }} />
    </div>
  )
}

export function References({ refs }: { refs: Ref[] }) {
  return (
    <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
      {refs.map((r, i) => {
        const s = SOURCE_BY_ID[r.sourceId]
        if (!s) return <li key={i} className="muted">Missing source: {r.sourceId}</li>
        return (
          <li key={i}>
            {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
            {s.year ? ` (${s.year})` : ''}
            {r.note ? ` · ${r.note}` : ''}
            {s.access === 'not-accessed' && <span className="muted"> · general reference, not page-checked for this item</span>}
          </li>
        )
      })}
    </ul>
  )
}

export function ReviewBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft: ['Draft', 'tag-amber'],
    'author-checked': ['Author-checked, not expert-reviewed', 'tag'],
    'expert-reviewed': ['Expert-reviewed', 'tag-teal'],
    retired: ['Retired', 'tag-eosin'],
  }
  const [text, cls] = map[status] ?? [status, 'tag']
  return <span className={`tag ${cls}`}>{text}</span>
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="panel" style={{ textAlign: 'left' }}>
      <h3>{title}</h3>
      {children && <div className="muted">{children}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}

export function SimNotice({ children }: { children: ReactNode }) {
  return <p className="notice notice-sim small">{children}</p>
}

export function Disclaimer() {
  return (
    <p className="disclaimer">
      HistoQuest is an independent study tool. It is not affiliated with, endorsed by, or reviewed by the ASCP Board of Certification. Questions are original and do not
      reproduce exam items.
    </p>
  )
}
