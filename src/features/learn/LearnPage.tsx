import { Link } from 'react-router-dom'
import { ACTIVE_GUIDELINE, OBJECTIVES } from '../../content/curriculum'
import { LESSONS, QUESTIONS } from '../../content'
import { masteryBand } from '../../engine/readiness'
import { useAppState } from '../../store/store'
import { evidence } from '../shared/derived'

const BAND_LABEL = { 'not-started': 'No evidence yet', learning: 'Learning', developing: 'Developing', secure: 'Secure' }
const BAND_CLASS = { 'not-started': 'tag', learning: 'tag-amber', developing: 'tag-hema', secure: 'tag-teal' }

export default function LearnPage() {
  const state = useAppState((s) => s)
  const ev = evidence(state)
  const g = ACTIVE_GUIDELINE
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p className="lede">
            {LESSONS.length} lessons across the five content areas of the guideline for tests from {g.validFrom}. Each lesson starts with a bench question and ends with a troubleshooting problem.
          </p>
        </div>
        <a className="btn btn-quiet" href={g.url} target="_blank" rel="noreferrer">Official content guideline (PDF)</a>
      </div>

      {g.domains.map((d) => {
        const lessons = LESSONS.filter((l) => l.domain === d.id)
        const objectives = OBJECTIVES.filter((o) => o.domain === d.id)
        return (
          <section key={d.id} style={{ marginBottom: 44 }} aria-labelledby={`d-${d.id}`}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 id={`d-${d.id}`}>{d.name}</h2>
              <span className="muted small">{d.min}–{d.max}% of the exam</span>
            </div>
            <ol className="list">
              {lessons.map((l) => {
                const p = state.lessons[l.id]
                const locked = l.prerequisites.filter((x) => !state.lessons[x]?.completedAt)
                return (
                  <li key={l.id}>
                    <Link className="list-row" to={`/learn/${l.id}`}>
                      <span>
                        <strong>{l.title}</strong>
                        <br />
                        <span className="small muted">
                          {l.minutes} min{l.simulation ? ' · has a Virtual Lab activity' : ''}
                          {locked.length ? ` · suggested first: ${locked.join(', ')}` : ''}
                        </span>
                      </span>
                      <span className="meta">
                        {p?.completedAt ? <span className="tag tag-teal">Read</span> : p ? <span className="tag tag-hema">In progress</span> : null}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
            <details style={{ marginTop: 12 }}>
              <summary className="small" style={{ cursor: 'pointer', color: 'var(--hema)', fontWeight: 600 }}>Learning objectives and evidence ({objectives.length})</summary>
              <div className="table-scroll">
                <table className="simple" style={{ marginTop: 10 }}>
                  <thead><tr><th>Objective</th><th>Guideline codes</th><th>Questions</th><th>Evidence</th></tr></thead>
                  <tbody>
                    {objectives.map((o) => {
                      const band = masteryBand(ev[o.id])
                      return (
                        <tr key={o.id}>
                          <td>{o.title}{o.htlOnly && <span className="tag tag-eosin" style={{ marginLeft: 6 }}>HTL only</span>}</td>
                          <td className="muted">{o.codes.join(', ')}</td>
                          <td>{QUESTIONS.filter((q) => q.objective === o.id).length}</td>
                          <td><span className={`tag ${BAND_CLASS[band]}`}>{BAND_LABEL[band]}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="small muted">"Read" means you finished the lesson. Evidence bands come only from questions and retention checks, never from reading. See Progress for how they are calculated.</p>
            </details>
          </section>
        )
      })}
    </div>
  )
}
