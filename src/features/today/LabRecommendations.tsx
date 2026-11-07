import { Link } from 'react-router-dom'
import { setState, useAppState } from '../../store/store'
export default function LabRecommendations() {
  const entries = useAppState((s) => s.lab.remediation)
    .filter((r) => !r.dismissed)
    .slice(0, 3)
  if (!entries.length) return null
  return (
    <section className="panel" style={{ marginTop: 28 }} aria-labelledby="lab-remediation-h">
      <h2 id="lab-remediation-h">Practice from your laboratory runs</h2>
      <p>
        These recommendations come from simulated decisions and section quality. They are separate
        from your exam-readiness evidence. Related retrieval cards have been added to the review
        queue.
      </p>
      <ul className="list">
        {entries.map((r) => (
          <li key={r.runId} className="stack" style={{ paddingBlock: 16 }}>
            <strong>{r.title}</strong>
            <span>
              {r.critical
                ? 'Revisit a critical safety, identity or release decision.'
                : `Revisit ${r.stations.join(', ')}.`}
            </span>
            <div className="row">
              <Link to={`/lab3d?replay=${encodeURIComponent(r.runId)}`}>
                Review the event history
              </Link>
              <Link to={r.lessons[0]}>Study the underlying technique</Link>
              <Link to="/practice/review?limit=6">Review related cards</Link>
              <button
                className="btn btn-quiet"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    lab: {
                      ...s.lab,
                      remediation: s.lab.remediation.map((item) =>
                        item.runId === r.runId ? { ...item, dismissed: true } : item,
                      ),
                    },
                  }))
                }
              >
                Dismiss recommendation
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
