import LabRecommendations from './LabRecommendations'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ACTIVE_GUIDELINE, guidelineForExamDate } from '../../content/curriculum'
import { contentProblems, LESSONS, QUESTIONS } from '../../content'
import { localDate } from '../../engine/dates'
import { deferPlan, ensurePlan, markPlanItem, undeferPlan } from '../../store/planActions'
import { setState, useAppState } from '../../store/store'
import type { PlanItem } from '../../store/state'
import { Segmented } from '../../ui/components'
import { useReducedMotion } from '../../ui/prefs'
import { forgivingStreak, totalXp } from '../shared/derived'

const KIND_LABEL: Record<PlanItem['kind'], string> = {
  review: 'Review',
  weak: 'Weak spot',
  new: 'New lesson',
  challenge: 'Apply it',
}
const KIND_TISSUE: Record<PlanItem['kind'], string> = {
  review: 'var(--hema)',
  weak: 'var(--eosin)',
  new: 'var(--amber)',
  challenge: 'var(--teal)',
}

const withPlan = (item: PlanItem) =>
  `${item.href}${item.href.includes('?') ? '&' : '?'}plan=${encodeURIComponent(item.id)}`

function GlassSlide({ item, index, reduced }: { item: PlanItem; index: number; reduced: boolean }) {
  const today = localDate().slice(5).replace('-', '/')
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: reduced ? 0 : 0.06 * index, duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      style={{ listStyle: 'none' }}
    >
      <Link
        to={withPlan(item)}
        className={`glass ${item.done ? 'done' : ''} ${item.skipped ? 'skipped' : ''}`}
        aria-describedby={`why-${item.id}`}
      >
        <span className="glass-label">
          <b>{KIND_LABEL[item.kind]}</b>
          <span>HQ · {today}</span>
          <span>{item.minutes} min</span>
        </span>
        <span className="glass-body">
          <span style={{ fontWeight: 700, paddingRight: 70 }}>{item.title}</span>
          <span id={`why-${item.id}`} className="small muted" style={{ paddingRight: 70 }}>
            {item.done ? 'Done' : item.skipped ? 'Skipped for today' : item.why}
          </span>
          <svg className="tissue" viewBox="0 0 56 40" aria-hidden="true">
            <path
              d="M8 20c2-12 20-16 32-10s10 20-4 24-30 2-28-14z"
              fill={KIND_TISSUE[item.kind]}
              opacity={item.done ? 0.65 : 0.18}
              stroke="var(--ink-3)"
              strokeWidth="0.8"
              strokeDasharray={item.done ? undefined : '3 2'}
            />
            {item.done && (
              <path
                d="M18 21l6 6 13-13"
                stroke="var(--paper)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </svg>
        </span>
      </Link>
      {!item.done && (
        <div className="row" style={{ justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
          <button
            className="btn btn-quiet small"
            style={{ minHeight: 32 }}
            onClick={() => markPlanItem(item.id, { skipped: !item.skipped })}
          >
            {item.skipped ? 'Restore' : 'Skip'}
          </button>
        </div>
      )}
    </motion.li>
  )
}

function ExamDatePrompt() {
  const [date, setDate] = useState('')
  const g = date ? guidelineForExamDate(date) : undefined
  return (
    <form
      className="inset row"
      style={{ marginTop: 28, alignItems: 'end' }}
      onSubmit={(e) => {
        e.preventDefault()
        setState((s) => ({ ...s, onboarded: true, profile: { ...s.profile, examDate: date } }))
      }}
    >
      <div className="field" style={{ flex: '1 1 220px' }}>
        <label htmlFor="examdate">When do you expect to test? (optional)</label>
        <input
          id="examdate"
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <span className="small muted">
          {g
            ? `This date uses the guideline revised ${g.revised}.`
            : 'HistoQuest uses the guideline for tests from Nov 1, 2026 unless you pick an earlier date.'}
        </span>
      </div>
      <button className="btn" type="submit">
        Save
      </button>
      <button
        className="btn btn-quiet"
        type="button"
        onClick={() => setState((s) => ({ ...s, onboarded: true }))}
      >
        Not sure yet
      </button>
    </form>
  )
}

export default function TodayPage() {
  const [dateLabel] = useState(() =>
    new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
  )
  const nav = useNavigate()
  const reduced = useReducedMotion()
  const minutes = useAppState((s) => s.settings.sessionMinutes)
  const plan = useAppState((s) => s.plan)
  const onboarded = useAppState((s) => s.onboarded)
  const examDate = useAppState((s) => s.profile.examDate)
  const streaksOn = useAppState((s) => s.settings.streaks)
  const activeDays = useAppState((s) => s.activeDays)
  const xp = useAppState(totalXp)
  const activeSession = useAppState((s) =>
    s.sessions.find((x) => x.id === s.activeSessionId && !x.submittedAt),
  )

  useEffect(() => ensurePlan(minutes), [minutes])

  const today = localDate()
  const items = plan?.day === today ? plan.items : []
  const open = items.filter((i) => !i.done && !i.skipped)
  const doneCount = items.filter((i) => i.done).length
  const est = open.reduce((a, i) => a + i.minutes, 0)
  const deferred = plan?.deferredTo && plan.day === today
  const streak = forgivingStreak(activeDays)
  const g = examDate ? guidelineForExamDate(examDate) : ACTIVE_GUIDELINE
  const allDone = items.length > 0 && open.length === 0

  const heading = allDone
    ? "Today's session is complete"
    : doneCount
      ? 'Pick up where you left off'
      : 'Your study session'
  const why =
    items.length === 0
      ? ''
      : items.some((i) => i.kind === 'review')
        ? 'Reviews come first because they are due, then a weak spot, new material, and one application challenge.'
        : 'Nothing is due for review yet, so today starts with new material and ends with an application challenge.'

  return (
    <div className="page">
      {examDate && g && g.id !== ACTIVE_GUIDELINE.id && (
        <p className="notice" role="note">
          Your exam date ({examDate}) falls under the older guideline. HistoQuest's question mapping
          follows the guideline for tests from {ACTIVE_GUIDELINE.validFrom}. Check differences on
          the official site.
        </p>
      )}
      {contentProblems.length > 0 && (
        <p className="notice">
          {contentProblems.length} content items failed validation and are hidden.
        </p>
      )}
      <LabRecommendations />
      <div className="today-grid">
        <section aria-labelledby="today-h">
          <p className="muted" style={{ marginBottom: 6 }}>
            {dateLabel}
          </p>
          <h1 id="today-h" style={{ fontSize: 'var(--t-6)' }}>
            {heading}
          </h1>
          <p className="lede">
            {allDone
              ? 'Everything planned for today is done or skipped. Extra practice is always open, and it does not change tomorrow’s plan much.'
              : deferred
                ? 'You moved today to tomorrow. Nothing is lost: due items will simply be first in line.'
                : 'Choose how long you have. The plan below adjusts to fit.'}
          </p>
          <div className="row" style={{ margin: '22px 0' }}>
            <Segmented
              label="Session length"
              value={minutes}
              options={[
                { value: 10, label: '10 min' },
                { value: 20, label: '20 min' },
                { value: 45, label: '45 min' },
              ]}
              onChange={(m) =>
                setState((s) => ({ ...s, settings: { ...s.settings, sessionMinutes: m } }))
              }
            />
          </div>
          {!allDone && !deferred && open[0] && (
            <div className="stack">
              <button className="btn btn-primary btn-big" onClick={() => nav(withPlan(open[0]))}>
                {doneCount ? 'Resume today’s session' : 'Start today’s session'}
              </button>
              <p className="small muted" style={{ margin: 0 }}>
                About {est} minutes · {open.length} {open.length === 1 ? 'activity' : 'activities'}{' '}
                left · first: {open[0].title}
              </p>
            </div>
          )}
          {deferred && (
            <button className="btn" onClick={undeferPlan}>
              Study today after all
            </button>
          )}
          {why && !deferred && (
            <p style={{ marginTop: 22 }}>
              <strong>Why these?</strong> {why}
            </p>
          )}
          {!allDone && !deferred && (
            <div className="row">
              <button className="btn btn-quiet" onClick={deferPlan}>
                Move today to tomorrow
              </button>
              <button className="btn btn-quiet" onClick={() => ensurePlan(minutes, true)}>
                Rebuild plan
              </button>
            </div>
          )}
          {activeSession && (
            <p className="inset" style={{ marginTop: 18 }}>
              You have an unfinished practice set: <strong>{activeSession.title}</strong>.{' '}
              <Link to={`/practice/session/${activeSession.id}`}>Resume it</Link>
            </p>
          )}
        </section>

        <section aria-labelledby="rack-h">
          <h2 id="rack-h" className="sr-only">
            Today's plan
          </h2>
          <div className="rack">
            <ol className="rack-slots" style={{ padding: 0, margin: 0 }}>
              {items.map((item, i) => (
                <GlassSlide key={item.id} item={item} index={i} reduced={reduced} />
              ))}
            </ol>
          </div>
          <div
            className="row small muted"
            style={{ marginTop: 16, justifyContent: 'space-between' }}
          >
            <span>{xp} XP from first-try answers, finished lessons and lab reasoning</span>
            {streaksOn && streak.length > 0 && (
              <span>
                {streak.length}-day rhythm{streak.graceUsed ? ' (one rest day forgiven)' : ''}
              </span>
            )}
          </div>
          <p className="small muted" style={{ marginTop: 18 }}>
            {LESSONS.length} lessons and {QUESTIONS.length} questions mapped to the{' '}
            {ACTIVE_GUIDELINE.domains.length} HTL content areas.{' '}
            <Link to="/learn">Browse the curriculum</Link>
          </p>
        </section>
      </div>
      {!onboarded && <ExamDatePrompt />}
    </div>
  )
}
