import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SOURCE_BY_ID } from '../../content/sources'
import { localDate } from '../../engine/dates'
import { setState, useAppState } from '../../store/store'
import { REVIEW_ITEMS, REVIEW_KINDS } from './catalog'
import './review.css'

export default function ReviewPage() {
  const records = useAppState((s) => s.lab.reviewRecords)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [priority, setPriority] = useState('all')
  const [pendingOnly, setPendingOnly] = useState(false)
  const [selected, setSelected] = useState(REVIEW_ITEMS[0].id)
  const [message, setMessage] = useState('')
  const latest = useMemo(() => new Map(records.map((r) => [r.itemId, r])), [records])
  const filtered = REVIEW_ITEMS.filter(
    (i) =>
      (kind === 'all' || i.kind === kind) &&
      (priority === 'all' || i.risk === priority) &&
      (!pendingOnly || latest.get(i.id)?.disposition !== 'review-recorded') &&
      `${i.id} ${i.title} ${i.reason}`.toLowerCase().includes(query.toLowerCase()),
  )
  const item = filtered.find((i) => i.id === selected) ?? filtered[0]
  const history = item ? records.filter((r) => r.itemId === item.id).toReversed() : []
  return (
    <div className="page review-page">
      <header>
        <Link to="/settings">Settings and complete data export</Link>
        <h1>Scientific review desk</h1>
        <p className="lede">
          Review the claims, assumptions and teaching material behind HistoQuest.
        </p>
        <p>
          Start with the flagged claims and model parameters. All published content remains
          author-checked. A local review note records its scope and author; it does not
          automatically confer expert-reviewed status or clinical validation.
        </p>
      </header>
      <div className="review-layout">
        <aside aria-label="Review queue filters">
          <label>
            Search the queue
            <input
              className="input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Item type
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">All types</option>
              {REVIEW_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Review priority
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="priority">Priority review</option>
              <option value="standard">Standard review</option>
            </select>
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
            />
            Without a recorded review
          </label>
          <p aria-live="polite">{filtered.length} matching items</p>
          <label>
            Choose an item
            <select
              className="input"
              size={12}
              value={item?.id ?? ''}
              onChange={(e) => {
                setSelected(e.target.value)
                setMessage('')
              }}
            >
              {filtered.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </label>
        </aside>
        {item ? (
          <article>
            <span className="eyebrow">
              {item.kind} · {item.risk === 'priority' ? 'Priority review' : 'Standard review'}
            </span>
            <h2>{item.title}</h2>
            <p className="small muted">{item.id}</p>
            <p className="notice">{item.reason}</p>
            {item.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {item.href && <Link to={item.href}>Open the published teaching material</Link>}
            <h3>Source access</h3>
            <ul>
              {item.sourceIds.map((id) => {
                const s = SOURCE_BY_ID[id]
                return (
                  <li key={id}>
                    {s?.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    ) : (
                      (s?.title ?? id)
                    )}
                    <span className="small muted">
                      {' '}
                      ·{' '}
                      {s?.access === 'read'
                        ? 'Read within the recorded scope'
                        : 'Not accessed; no page verification claimed'}
                    </span>
                  </li>
                )
              })}
            </ul>
            <form
              key={item.id}
              className="review-form"
              onSubmit={(e) => {
                e.preventDefault()
                const d = new FormData(e.currentTarget)
                if (
                  String(d.get('reviewer')).trim().length < 2 ||
                  String(d.get('notes')).trim().length < 10
                ) {
                  setMessage('Enter a reviewer name and a substantive review note before saving.')
                  return
                }
                setState((s) => ({
                  ...s,
                  lab: {
                    ...s.lab,
                    reviewRecords: [
                      ...s.lab.reviewRecords,
                      {
                        itemId: item.id,
                        reviewer: String(d.get('reviewer')).trim(),
                        date: String(d.get('date')),
                        notes: String(d.get('notes')).trim(),
                        disposition: d.get('disposition') as
                          'needs-review' | 'correction-proposed' | 'review-recorded',
                      },
                    ],
                  },
                }))
                e.currentTarget.reset()
                setMessage('Review note saved locally and included in complete data exports.')
              }}
            >
              <h3>Record your review</h3>
              <label>
                Reviewer name and relevant qualification
                <input className="input" name="reviewer" required maxLength={180} />
              </label>
              <div className="grid-2">
                <label>
                  Review date
                  <input
                    className="input"
                    name="date"
                    type="date"
                    defaultValue={localDate()}
                    required
                  />
                </label>
                <label>
                  Disposition
                  <select className="input" name="disposition">
                    <option value="needs-review">Needs review</option>
                    <option value="correction-proposed">Correction proposed</option>
                    <option value="review-recorded">Review recorded</option>
                  </select>
                </label>
              </div>
              <label>
                Evidence, scope and proposed correction
                <textarea
                  className="input"
                  name="notes"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                />
              </label>
              <button className="btn btn-primary">Save review note</button>
              <p role="status">{message}</p>
            </form>
            <h3>Review history for this item</h3>
            {history.length ? (
              <ol>
                {history.map((r, i) => (
                  <li key={`${r.date}-${i}`}>
                    <strong>{r.disposition}</strong>
                    <p>{r.notes}</p>
                    <small>
                      {r.reviewer} · {r.date.slice(0, 10)}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No review has been recorded for this item.</p>
            )}
          </article>
        ) : (
          <p role="status">No items match these filters. Broaden the search or item type.</p>
        )}
      </div>
    </div>
  )
}
