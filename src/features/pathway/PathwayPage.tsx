import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LESSON_BY_ID, QUESTION_BY_ID } from '../../content'
import { ACTIVE_GUIDELINE } from '../../content/curriculum'
import { PATHWAY, STAIN_COMPARISONS, type Chapter } from '../../content/pathway'
import { recordAttempt, setState, useAppState } from '../../store/store'
import { References } from '../../ui/components'
import QuestionView from '../practice/QuestionView'
import { isCorrect, type Answer } from '../practice/answers'
import type { Confidence } from '../../engine/srs'
import TeachingFigure, { JourneyOverview } from './Figures'

export default function PathwayPage() {
  const learning = useAppState((s) => s.pathway)
  const run = useAppState((s) => s.workbench)
  const next = PATHWAY.find((c) => !learning.completed.includes(c.id)) ?? PATHWAY[0]
  const [filter, setFilter] = useState('')
  const q = filter.trim().toLowerCase()
  const filtered = PATHWAY.filter((c) =>
    [c.title, c.purpose, c.short, c.tier, ...c.sections.map((s) => s.text)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
  return (
    <div className="page pathway-home">
      <div className="studio-top">
        <span>Histology, understood step by step.</span>
        <Link to="/today">Your daily practice plan</Link>
      </div>
      <section className="pathway-intro">
        <div>
          <h1>
            From specimen <br />
            to understanding.
          </h1>
          <p className="lede">
            Follow a specimen from the bottle to the slide. Learn the science, rehearse the
            decisions, and understand what every step changes.
          </p>
          <div className="row">
            <Link className="btn btn-primary" to={`/pathway/${next.id}`}>
              {learning.completed.length ? 'Continue the pathway' : 'Begin the pathway'}
            </Link>
            <Link className="btn" to="/workbench">
              {run && run.station < 10 ? 'Resume your specimen' : 'Enter the specimen workbench'}
            </Link>
          </div>
          <p className="pathway-progress">
            {learning.completed.filter((id) => PATHWAY.some((c) => c.id === id)).length} of{' '}
            {PATHWAY.length} chapters completed · explore any chapter at any time
          </p>
        </div>
        <div className="specimen-story">
          <JourneyOverview />
          <p>
            One identity. A series of transformations.
            <br />
            <strong>A readable, representative slide.</strong>
          </p>
        </div>
      </section>
      <section className="panel" aria-labelledby="lab-launch-title">
        <h2 id="lab-launch-title">HistoQuest Lab</h2>
        <p>
          Rehearse the full specimen journey in an interactive laboratory, build evidence through
          seven practical levels, and manage a simulated shift.
        </p>
        <div className="row">
          <Link className="btn btn-primary" to="/lab3d">
            Enter the 3D laboratory
          </Link>
          <Link className="btn" to="/career">
            Explore L0–L6 practicals
          </Link>
          <Link className="btn" to="/shift">
            Start a simulated shift
          </Link>
          <Link className="btn" to="/clinic">
            Investigate a problem slide
          </Link>
        </div>
      </section>
      <div className="learning-promise">
        <p>
          <strong>Built for the bridge between theory and the bench.</strong> Start with tissue
          architecture, connect it to the workflow, then investigate failures. Each chapter includes
          a visual model, bench reasoning, two checkpoints, and a place to record questions for
          supervised training.
        </p>
        <Link to="/slides">Explore real micrographs</Link>
      </div>
      <div className="pathway-layout">
        <section aria-labelledby="pathway-title">
          <div className="page-head">
            <h2 id="pathway-title">Your learning pathway</h2>
            <span className="small muted">12 chapters · three levels</span>
          </div>
          <label className="sr-only" htmlFor="pathway-search">
            Find a chapter or concept
          </label>
          <input
            id="pathway-search"
            className="input pathway-search"
            type="search"
            placeholder="Find a step, concept, or technique…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {(['Foundations', 'At the bench', 'Advanced reasoning'] as const).map((tier, t) => {
            const chapters = filtered.filter((c) => c.tier === tier)
            return chapters.length ? (
              <section className="pathway-tier" key={tier} aria-labelledby={`tier-${t}`}>
                <div className="tier-heading">
                  <h3 id={`tier-${t}`}>{tier}</h3>
                  <span>
                    {
                      [
                        'See the tissue. Protect its story.',
                        'Understand every transformation.',
                        'Investigate, interpret, and explain.',
                      ][t]
                    }
                  </span>
                </div>
                <ol className="chapter-list" start={PATHWAY.indexOf(chapters[0]) + 1}>
                  {chapters.map((c) => {
                    const done = learning.completed.includes(c.id)
                    return (
                      <li key={c.id} value={PATHWAY.indexOf(c) + 1}>
                        <Link to={`/pathway/${c.id}`} className="chapter-link">
                          <span className={`chapter-number ${done ? 'complete' : ''}`}>
                            {String(PATHWAY.indexOf(c) + 1).padStart(2, '0')}
                          </span>
                          <span>
                            <strong>{c.title}</strong>
                            <span className="chapter-purpose">{c.purpose}</span>
                          </span>
                          <span className="chapter-meta">
                            {done ? 'Completed' : `${c.minutes} min`}
                            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                              <path
                                d="M5 12h14m-6-6 6 6-6 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ) : null
          })}
          {!filtered.length && (
            <p role="status">No chapter matches. Try “fixation”, “margin”, or “control”.</p>
          )}
        </section>
        <aside className="study-companion">
          <h2>Learn it. Try it. Explain it.</h2>
          <ol>
            <li>
              <strong>Understand the mechanism</strong>
              <p>Use the chapter’s figure and explanation to connect biology to preparation.</p>
            </li>
            <li>
              <strong>Change a decision</strong>
              <p>Work through three specimens and see what carries forward to the slide.</p>
            </li>
            <li>
              <strong>Retrieve and reflect</strong>
              <p>
                Answer checkpoints, revisit weak areas, and bring a specific question to your
                supervisor.
              </p>
            </li>
          </ol>
          <Link className="btn" to="/notebook">
            Open your field notebook
          </Link>
          <div className="companion-section">
            <h3>HTL preparation</h3>
            <p className="small">
              The pathway complements the {ACTIVE_GUIDELINE.domains.length}-area exam bank and the
              existing topic lessons.
            </p>
            <Link to="/learn">Browse all topic lessons</Link>
            <br />
            <Link to="/practice">Quiz and exam practice</Link>
          </div>
          <div className="companion-section">
            <h3>Keep your evidence separate</h3>
            <p className="small muted">
              Simulated reasoning is study evidence. Supervised skills and documented clinical
              experience belong in your professional training record.
            </p>
            <Link to="/route2">Review Route 2 requirements</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Checkpoint({ id }: { id: string }) {
  const q = QUESTION_BY_ID[id]
  const [answer, setAnswer] = useState<Answer>()
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="chapter-checkpoint">
      <QuestionView
        q={q}
        seed={`pathway-${id}`}
        mode="study"
        answer={answer}
        onAnswer={setAnswer}
        revealed={revealed}
        onCheck={(a) => {
          if (revealed) return
          recordAttempt(q.id, q.version, isCorrect(q, a), a.confidence as Confidence, 'lesson')
          setRevealed(true)
        }}
      />
    </div>
  )
}

function ChapterContent({ chapter }: { chapter: Chapter }) {
  const navigate = useNavigate()
  const state = useAppState((s) => s)
  const note = state.pathway.notes[chapter.id] ?? ''
  const completed = state.pathway.completed.includes(chapter.id)
  const checked = chapter.checks.every((id) => state.attempts.some((a) => a.qid === id))
  const index = PATHWAY.indexOf(chapter)
  useEffect(() => {
    setState((s) => ({ ...s, pathway: { ...s.pathway, lastChapter: chapter.id } }))
  }, [chapter.id])
  const complete = () => {
    setState((s) => ({
      ...s,
      pathway: { ...s.pathway, completed: [...new Set([...s.pathway.completed, chapter.id])] },
    }))
    navigate('/')
  }
  return (
    <>
      <div className="chapter-header">
        <p>
          <Link to="/">Learning path</Link> / {chapter.tier} / Chapter {index + 1}
        </p>
        <h1>{chapter.title}</h1>
        <p className="lede">{chapter.purpose}</p>
        <div className="row small muted">
          <span>{chapter.minutes} min</span>
          <span>Two retrieval checkpoints</span>
          <span>Author-checked · not expert-reviewed</span>
        </div>
      </div>
      <div className="chapter-layout">
        <nav className="chapter-outline" aria-label="In this chapter">
          <Link to="/">View learning path</Link>
          <a href="#chapter-read">
            <span>1</span>Read and explore
          </a>
          <a href="#chapter-check">
            <span>2</span>Check understanding
          </a>
          <a href="#chapter-finish">
            <span>3</span>Complete and continue
          </a>
        </nav>
        <article className="chapter-body">
          <section id="chapter-read">
            <h2>{chapter.sections[0].title}</h2>
            <p>{chapter.sections[0].text}</p>
          </section>
          <TeachingFigure kind={chapter.figure} />
          {chapter.sections.slice(1).map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
          <section className="bench-reasoning">
            <h2>Think it through at the bench</h2>
            <ol>
              {chapter.bench.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p>
              <strong>What carries forward:</strong> {chapter.downstream}
            </p>
          </section>
          <section>
            <h2>A misconception to catch</h2>
            <p>{chapter.misconception}</p>
            <details className="deeper">
              <summary>Go deeper: scientist-level reasoning</summary>
              <p>{chapter.deeper}</p>
            </details>
          </section>
          {chapter.figure === 'special' && (
            <section>
              <h2>Choose by target, then verify</h2>
              <div className="table-scroll">
                <table className="simple stain-table">
                  <caption>
                    Comparing common methods; consult the validated procedure for exact
                    formulations.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Method</th>
                      <th scope="col">Target</th>
                      <th scope="col">Expected result</th>
                      <th scope="col">Control</th>
                      <th scope="col">Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAIN_COMPARISONS.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) =>
                          i === 0 ? (
                            <th scope="row" key={i}>
                              {cell}
                            </th>
                          ) : (
                            <td key={i}>{cell}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <details className="deeper">
            <summary>Optional practice for this chapter</summary>
            <p>Explore these activities now or follow the practicals in your learning path.</p>
            <div className="row">
              <Link className="btn" to={`/lab/${chapter.sim}`}>
                Open the focused lab
              </Link>
              <Link className="btn" to="/workbench">
                Specimen workbench
              </Link>
              {['tissue', 'he', 'ihc'].includes(chapter.figure) && (
                <Link className="btn" to="/slides">
                  Inspect real slides
                </Link>
              )}
            </div>
          </details>
          <section id="chapter-check">
            <h2>Check your understanding</h2>
            <p className="muted">
              Explain your choice before revealing the answer. These original questions also enter
              your spaced review queue.
            </p>
            {chapter.checks.map((id) => (
              <Checkpoint key={id} id={id} />
            ))}
          </section>
          <details className="chapter-notes deeper">
            <summary>Your field notes (optional)</summary>
            <label htmlFor="chapter-notes">
              What would you check, and what still needs supervised practice?
            </label>
            <textarea
              id="chapter-notes"
              className="input"
              value={note}
              placeholder="I predict… because… I would check… My question for a supervisor is…"
              onChange={(e) => {
                const value = e.target.value
                setState((s) => ({
                  ...s,
                  pathway: { ...s.pathway, notes: { ...s.pathway.notes, [chapter.id]: value } },
                }))
              }}
            />
            <p className="small muted">
              Saved on this browser and included in Settings → Export. Use fictional examples; do
              not enter patient information.
            </p>
          </details>
          <details className="deeper">
            <summary>Related lessons and sources</summary>
            <ul>
              {chapter.lessons.map((id) => (
                <li key={id}>
                  <Link to={`/learn/${id}`}>{LESSON_BY_ID[id]?.title ?? id}</Link>
                </li>
              ))}
            </ul>
            <References refs={chapter.sources.map((sourceId) => ({ sourceId }))} />
          </details>
          <div className="chapter-finish" id="chapter-finish">
            <h2>{completed ? 'Chapter completed' : 'Finish this chapter'}</h2>
            <p className="small muted">
              Chapter completion records study, not bench competency. Review both checkpoints to
              complete the chapter.
            </p>
            <div className="row">
              {completed ? (
                <Link className="btn btn-primary" to="/">
                  Continue learning path
                </Link>
              ) : (
                <button className="btn btn-primary" disabled={!checked} onClick={complete}>
                  Complete chapter and continue
                </button>
              )}
            </div>
            {!checked && (
              <p className="small">Answer and review both checkpoints above to continue.</p>
            )}
          </div>
        </article>
      </div>
    </>
  )
}

export function ChapterPage() {
  const { id } = useParams()
  const chapter = PATHWAY.find((c) => c.id === id)
  return (
    <div className="page">
      {chapter ? (
        <ChapterContent key={chapter.id} chapter={chapter} />
      ) : (
        <>
          <h1>Chapter not found</h1>
          <Link to="/">Return to the learning pathway</Link>
        </>
      )}
    </div>
  )
}

export function NotebookPage() {
  const learning = useAppState((s) => s.pathway)
  const sims = useAppState((s) => s.sims)
  const [copied, setCopied] = useState('')
  const notes = PATHWAY.filter((c) => learning.notes[c.id]?.trim())
  const text = notes.map((c) => `## ${c.title}\n\n${learning.notes[c.id]}`).join('\n\n')
  function download() {
    const url = URL.createObjectURL(
      new Blob([`# HistoQuest field notebook\n\n${text || 'No notes yet.'}\n`], {
        type: 'text/markdown',
      }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'histoquest-field-notebook.md'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setCopied('Notebook downloaded.')
  }
  return (
    <div className="page-narrow">
      <p>
        <Link to="/">Learning pathway</Link> / Notebook
      </p>
      <h1>Your field notebook</h1>
      <p className="lede">Turn a prediction into a question you can bring to the bench.</p>
      <div className="row">
        <button className="btn" onClick={download}>
          Download notes
        </button>
        <Link className="btn" to="/settings">
          Back up all study data
        </Link>
      </div>
      <p role="status" className="small">
        {copied}
      </p>
      {notes.length ? (
        notes.map((c) => (
          <article className="notebook-entry" key={c.id}>
            <h2>
              <Link to={`/pathway/${c.id}`}>{c.short}</Link>
            </h2>
            <p className="note-text">{learning.notes[c.id]}</p>
          </article>
        ))
      ) : (
        <div className="empty-notebook">
          <h2>Your first note starts with a prediction</h2>
          <p>
            At the end of a chapter, record what you expect, why, what you would check, and what
            needs supervised practice.
          </p>
          <Link className="btn btn-primary" to={`/pathway/${learning.lastChapter}`}>
            Open your current chapter
          </Link>
        </div>
      )}
      <section className="companion-section">
        <h2>Specimen workbench history</h2>
        {sims.filter((s) => s.sim === 'specimen-workbench').length ? (
          <ul className="list">
            {sims
              .filter((s) => s.sim === 'specimen-workbench')
              .slice(-10)
              .reverse()
              .map((s, i) => (
                <li className="list-row" key={`${s.at}-${i}`}>
                  <span>
                    <strong>{s.summary}</strong>
                    <br />
                    <span className="small muted">
                      {s.day} · {s.correct}/{s.total} modeled decisions
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <p>
            No recorded specimen runs yet. <Link to="/workbench">Start a case</Link>.
          </p>
        )}
        <p className="small muted">
          Simulation history is separate from supervised clinical experience and professional
          eligibility.
        </p>
      </section>
    </div>
  )
}
