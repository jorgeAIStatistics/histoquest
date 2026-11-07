import { Link } from 'react-router-dom'
import { ACTIVE_GUIDELINE, OBJECTIVES } from '../../content/curriculum'
import { LESSONS, OBJECTIVE_TITLES, QUESTIONS, SIMULATIONS } from '../../content'
import { localDate } from '../../engine/dates'
import { masteryBand, wilson } from '../../engine/readiness'
import { isDue } from '../../engine/srs'
import { weakObjectives } from '../../engine/planner'
import { useAppState } from '../../store/store'
import { Meter, RangeBar } from '../../ui/components'
import { badges } from '../shared/badges'
import { evidence, forgivingStreak, readinessOf, totalXp } from '../shared/derived'

const pct = (x: number) => `${Math.round(x * 100)}%`

export default function ProgressPage() {
  const s = useAppState((x) => x)
  const ev = evidence(s)
  const r = readinessOf(s)
  const g = ACTIVE_GUIDELINE
  const today = localDate()
  const lessonsDone = Object.values(s.lessons).filter((l) => l.completedAt).length
  const immediate = Object.values(ev).reduce(
    (a, e) => ({ n: a.n + e.immediate.n, c: a.c + e.immediate.correct }),
    { n: 0, c: 0 },
  )
  const simAgg = s.sims.reduce((a, x) => ({ n: a.n + x.total, c: a.c + x.correct }), { n: 0, c: 0 })
  const b = badges(s)
  const weak = weakObjectives(ev).slice(0, 3)
  const streak = forgivingStreak(s.activeDays)

  const recommendation = (id: string) => {
    const e = ev[id]
    const missed =
      e.fresh.n +
      e.delayed.n +
      e.immediate.n -
      (e.fresh.correct + e.delayed.correct + e.immediate.correct)
    const dueHere = QUESTIONS.filter(
      (q) => q.objective === id && isDue(s.srs[`q:${q.id}`], today),
    ).length
    return `Review "${OBJECTIVE_TITLES[id]}" because you missed ${missed} ${missed === 1 ? 'question' : 'questions'}${e.recentMisses ? ` (${e.recentMisses} in the last two weeks)` : ''}${dueHere ? ` and ${dueHere} ${dueHere === 1 ? 'is' : 'are'} due for review today` : ''}.`
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Progress</h1>
          <p className="lede">
            A study-readiness summary from first-attempt answers and delayed recall. It is not a
            pass probability, and it does not convert to an ASCP scaled score.
          </p>
        </div>
      </div>

      <section className="panel" aria-labelledby="ready-h">
        <h2 id="ready-h" style={{ fontSize: 'var(--t-3)' }}>
          Study readiness
        </h2>
        <p className="small muted">{r.sampleNote}</p>
        <div className="grid-3" style={{ marginTop: 16 }}>
          <div>
            <p style={{ marginBottom: 6 }}>
              <strong>Coverage</strong> · {pct(r.coverage)}
            </p>
            <Meter value={r.coverage} label="Objectives with first-attempt evidence" />
            <p className="small muted" style={{ marginTop: 6 }}>
              {OBJECTIVES.filter((o) => ev[o.id].fresh.n > 0).length} of {OBJECTIVES.length}{' '}
              objectives tested at least once on fresh questions.
            </p>
          </div>
          <div>
            <p style={{ marginBottom: 6 }}>
              <strong>Fresh-question accuracy</strong> ·{' '}
              {r.freshAccuracy.n ? pct(r.freshAccuracy.p) : 'none yet'}
            </p>
            <RangeBar {...r.freshAccuracy} label="First-attempt accuracy" />
            <p className="small muted" style={{ marginTop: 6 }}>
              {r.freshAccuracy.n
                ? `Plausible range ${pct(r.freshAccuracy.low)}–${pct(r.freshAccuracy.high)} (95% Wilson interval, n = ${r.freshAccuracy.n}).`
                : 'Answer unseen questions to build this.'}{' '}
              Repeats don’t count here.
            </p>
          </div>
          <div>
            <p style={{ marginBottom: 6 }}>
              <strong>Retention</strong> · {r.retention.n ? pct(r.retention.p) : 'none yet'}
            </p>
            <RangeBar {...r.retention} label="Delayed recall accuracy" />
            <p className="small muted" style={{ marginTop: 6 }}>
              {r.retention.n
                ? `Recall after at least a day, n = ${r.retention.n}.`
                : 'Measured when items come back after a day or more.'}
            </p>
          </div>
        </div>
        <div className="table-scroll" style={{ marginTop: 24 }}>
          <table className="simple">
            <thead>
              <tr>
                <th>Content area</th>
                <th>Exam weight</th>
                <th>Fresh answers</th>
                <th>Accuracy (range)</th>
              </tr>
            </thead>
            <tbody>
              {r.domainRows.map((d, i) => (
                <tr key={d.domain}>
                  <td>{d.domain}</td>
                  <td>
                    {g.domains[i].min}–{g.domains[i].max}%
                  </td>
                  <td>{d.fresh.n}</td>
                  <td>
                    {d.fresh.n
                      ? `${pct(d.fresh.p)} (${pct(d.fresh.low)}–${pct(d.fresh.high)})`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {weak.length > 0 && (
        <section style={{ marginTop: 28 }} aria-labelledby="rec-h">
          <h2 id="rec-h" style={{ fontSize: 'var(--t-3)' }}>
            What to work on next
          </h2>
          <ul className="list">
            {weak.map((w) => (
              <li key={w.id}>
                <div className="list-row">
                  <span>{recommendation(w.id)}</span>
                  <Link className="btn" to={`/practice/run?objective=${w.id}&n=5`}>
                    Practise 5
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginTop: 32 }} aria-labelledby="map-h">
        <h2 id="map-h" style={{ fontSize: 'var(--t-3)' }}>
          Lab progression map
        </h2>
        <p className="small muted">
          Each station fills as its objectives move from no evidence, to learning, developing and
          secure. Reading alone never fills a station.
        </p>
        <ol
          className="grid-3"
          style={{
            listStyle: 'none',
            padding: 0,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          {g.domains.map((d) => {
            const objs = OBJECTIVES.filter((o) => o.domain === d.id)
            const bands = objs.map((o) => masteryBand(ev[o.id]))
            const score =
              bands.reduce(
                (a, x) => a + { 'not-started': 0, learning: 1, developing: 2, secure: 3 }[x],
                0,
              ) /
              (objs.length * 3)
            return (
              <li key={d.id} className="panel" style={{ padding: 18 }}>
                <svg viewBox="0 0 120 60" width="100%" aria-hidden="true">
                  <rect
                    x="4"
                    y="30"
                    width="112"
                    height="26"
                    rx="4"
                    fill="var(--vellum)"
                    stroke="var(--rule)"
                  />
                  <rect
                    x="4"
                    y="30"
                    width={112 * score}
                    height="26"
                    rx="4"
                    fill="var(--teal)"
                    opacity="0.7"
                  />
                  <path d="M20 30V14h80v16" fill="none" stroke="var(--ink-3)" />
                </svg>
                <strong>{d.name}</strong>
                <p className="small muted" style={{ margin: 0 }}>
                  {bands.filter((x) => x === 'secure').length} secure ·{' '}
                  {bands.filter((x) => x === 'developing').length} developing ·{' '}
                  {bands.filter((x) => x === 'not-started').length} untested
                </p>
              </li>
            )
          })}
        </ol>
      </section>

      <section style={{ marginTop: 32 }} aria-labelledby="streams-h">
        <h2 id="streams-h" style={{ fontSize: 'var(--t-3)' }}>
          Evidence, kept separate
        </h2>
        <div className="table-scroll">
          <table className="simple">
            <thead>
              <tr>
                <th>Record</th>
                <th>Count</th>
                <th>Result</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lesson completion</td>
                <td>
                  {lessonsDone} / {LESSONS.length}
                </td>
                <td>—</td>
                <td>You worked through the lesson. It is not evidence of mastery.</td>
              </tr>
              <tr>
                <td>Unseen-question performance</td>
                <td>{r.freshAccuracy.n}</td>
                <td>{r.freshAccuracy.n ? pct(r.freshAccuracy.p) : '—'}</td>
                <td>First time you saw each question. The best signal of transfer.</td>
              </tr>
              <tr>
                <td>Immediate practice</td>
                <td>{immediate.n}</td>
                <td>{immediate.n ? pct(immediate.c / immediate.n) : '—'}</td>
                <td>Repeats within a day. Usually inflated by familiarity.</td>
              </tr>
              <tr>
                <td>Delayed retention</td>
                <td>{r.retention.n}</td>
                <td>{r.retention.n ? pct(r.retention.p) : '—'}</td>
                <td>Questions and cards recalled after at least a day.</td>
              </tr>
              <tr>
                <td>Simulation reasoning</td>
                <td>{s.sims.length} runs</td>
                <td>{simAgg.n ? pct(simAgg.c / simAgg.n) : '—'}</td>
                <td>
                  Decisions in the Virtual Lab (
                  {SIMULATIONS.filter((x) => x.status === 'ready').length} stations). Never counts
                  as clinical experience.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <details style={{ marginTop: 14 }}>
          <summary
            className="small"
            style={{ cursor: 'pointer', color: 'var(--hema)', fontWeight: 600 }}
          >
            How the evidence bands work, and their limits
          </summary>
          <div className="small" style={{ marginTop: 8 }}>
            <p>
              <strong>Secure</strong>: at least 4 first-attempt answers on the objective with a 95%
              Wilson lower bound of 60% or more, and at least 2 delayed recalls at 75% or better.{' '}
              <strong>Developing</strong>: 3 or more fresh or delayed answers at 60% or better.{' '}
              <strong>Learning</strong>: some evidence, below that.
            </p>
            <p>
              This is a heuristic HistoQuest uses to choose what to review. It hasn’t been validated
              against exam outcomes. The bank is small ({QUESTIONS.length} questions), objectives
              have only a few questions each, and the questions are HistoQuest’s own, not ASCP
              items. Treat bands as a study guide, not a forecast.
            </p>
            <p>
              Example: 9 of 10 fresh answers correct gives a plausible range of{' '}
              {(() => {
                const w = wilson(9, 10)
                return `${pct(w.low)}–${pct(w.high)}`
              })()}
              . That's why small samples show wide bars.
            </p>
          </div>
        </details>
      </section>

      <section style={{ marginTop: 32 }} aria-labelledby="badges-h">
        <h2 id="badges-h" style={{ fontSize: 'var(--t-3)' }}>
          Skill badges
        </h2>
        <p className="small muted">
          {totalXp(s)} XP total. XP is a record of effort (first-try correct answers, finished
          lessons, reasoned lab runs). It never affects readiness.
          {s.settings.streaks && streak.length ? ` Study rhythm: ${streak.length} days.` : ''}
        </p>
        <ul className="grid-3" style={{ listStyle: 'none', padding: 0 }}>
          {b.map((x) => (
            <li
              key={x.id}
              className="panel"
              style={{ padding: 16, borderColor: x.earned ? 'var(--teal)' : undefined }}
            >
              <strong>{x.title}</strong>{' '}
              {x.earned ? (
                <span className="tag tag-teal">Earned</span>
              ) : (
                <span className="tag">Not yet</span>
              )}
              <p className="small muted" style={{ margin: '6px 0 0' }}>
                {x.criterion}
              </p>
            </li>
          ))}
        </ul>
        <p className="small muted">
          Earned badges unlock accent colours in <Link to="/settings">Settings</Link>.
        </p>
      </section>
    </div>
  )
}
