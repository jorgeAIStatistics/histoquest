import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { OBJECTIVE_BY_ID } from '../../content/curriculum'
import { ATLAS } from '../../content'
import type { Question } from '../../content/schema'
import { gradeNumeric, optionOrder } from '../../engine/grading'
import type { Confidence } from '../../engine/srs'
import { Schematic } from '../../art/schematics'
import { References, ReviewBadge } from '../../ui/components'
import { chime, useReducedMotion } from '../../ui/prefs'
import { useAppState } from '../../store/store'
import Calculator from './Calculator'
import { isCorrect, type Answer } from './answers'

const LETTERS = 'ABCDE'

/**
 * One question. In study mode it locks and explains after "Check answer".
 * In exam mode it only records the selection; explanations wait for submission.
 */
export default function QuestionView({
  q,
  seed,
  mode,
  answer,
  revealed,
  onAnswer,
  onCheck,
  number,
}: {
  q: Question
  seed: string
  mode: 'study' | 'exam' | 'review-results'
  answer?: Answer
  revealed: boolean
  onAnswer: (a: Answer) => void
  onCheck?: (a: Answer) => void
  number?: string
}) {
  const reduced = useReducedMotion()
  const sound = useAppState((s) => s.settings.sound)
  const [hints, setHints] = useState(0)
  const order = useMemo(() => (q.format === 'choice' ? optionOrder(q, seed) : []), [q, seed])
  const locked = revealed || mode === 'review-results'
  const confidence = (answer?.confidence ?? 0) as Confidence | 0
  const correct = isCorrect(q, answer)
  const objective = OBJECTIVE_BY_ID[q.objective]
  const related = ATLAS.filter((a) => a.objectives.includes(q.objective)).slice(0, 3)

  const set = (patch: Partial<Answer>) =>
    onAnswer({
      value: answer?.value ?? '',
      unit: answer?.unit,
      confidence: answer?.confidence ?? 0,
      ...patch,
    })

  // Structured hints (no AI): 1) which objective, 2) eliminate one distractor, 3) principle.
  const eliminated =
    q.format === 'choice' && hints >= 2
      ? order.find((id) => id !== q.answer && id !== answer?.value)
      : undefined

  return (
    <article aria-labelledby={`stem-${q.id}`}>
      <div className="row small muted" style={{ marginBottom: 10 }}>
        {number && <span>{number}</span>}
        <span className="tag">{objective?.title ?? q.objective}</span>
        {mode !== 'exam' && (
          <span className="tag">Difficulty {q.difficulty}/3 (author estimate)</span>
        )}
      </div>
      <h2
        id={`stem-${q.id}`}
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 'var(--t-2)',
          lineHeight: 1.45,
        }}
      >
        {q.stem}
      </h2>
      {q.image && (
        <figure style={{ margin: '16px 0', maxWidth: 520 }}>
          <Schematic name={q.image.schematic} />
          <figcaption className="small muted">
            Schematic illustration ({q.image.license}). Not a photomicrograph.
          </figcaption>
        </figure>
      )}

      {q.format === 'choice' ? (
        <ul className="options" role="list">
          {order.map((id, i) => {
            const opt = q.options.find((o) => o.id === id)!
            const selected = answer?.value === id
            const cls = locked ? (id === q.answer ? 'is-correct' : selected ? 'is-wrong' : '') : ''
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`option ${cls}`}
                  aria-pressed={selected}
                  disabled={locked || id === eliminated}
                  style={
                    id === eliminated && !locked
                      ? { opacity: 0.45, textDecoration: 'line-through' }
                      : undefined
                  }
                  onClick={() => set({ value: id })}
                >
                  <span className="key" aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                  <span>
                    <span className="sr-only">Option {LETTERS[i]}: </span>
                    {opt.text}
                    {locked && (
                      <span className="rationale" style={{ display: 'block' }}>
                        {opt.rationale}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="row" style={{ margin: '18px 0', alignItems: 'end' }}>
          <div className="field" style={{ flex: '1 1 160px' }}>
            <label htmlFor={`v-${q.id}`}>Your answer</label>
            <input
              id={`v-${q.id}`}
              className="input"
              inputMode="decimal"
              value={answer?.value ?? ''}
              disabled={locked}
              onChange={(e) => set({ value: e.target.value })}
            />
          </div>
          <div className="field" style={{ flex: '0 1 140px' }}>
            <label htmlFor={`u-${q.id}`}>Unit</label>
            <input
              id={`u-${q.id}`}
              className="input"
              value={answer?.unit ?? ''}
              disabled={locked}
              placeholder="e.g. mL"
              onChange={(e) => set({ unit: e.target.value })}
            />
          </div>
          {!locked && <Calculator />}
        </div>
      )}

      {!locked && (
        <fieldset className="confidence" style={{ border: 0, padding: 0, margin: '6px 0 16px' }}>
          <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
            How sure are you?
          </legend>
          {(
            [
              [1, 'Guessing'],
              [2, 'Unsure'],
              [3, 'Sure'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className="chip-btn"
              style={{ minHeight: 40, padding: '6px 14px' }}
              aria-pressed={confidence === v}
              onClick={() => set({ confidence: v })}
            >
              {label}
            </button>
          ))}
        </fieldset>
      )}

      {mode === 'study' && !locked && (
        <div className="row">
          <button
            className="btn btn-primary"
            disabled={!answer?.value || !answer.confidence}
            onClick={() => {
              if (answer) {
                if (isCorrect(q, answer)) chime(sound)
                onCheck?.(answer)
              }
            }}
          >
            Check answer
          </button>
          {!answer?.confidence && answer?.value && (
            <span className="small muted">
              Pick a confidence level first. It helps schedule reviews.
            </span>
          )}
          {hints < 3 && (
            <button className="btn btn-quiet" type="button" onClick={() => setHints((h) => h + 1)}>
              {hints === 0 ? 'Give me a hint' : 'Another hint'}
            </button>
          )}
        </div>
      )}
      {mode === 'study' && !locked && hints > 0 && (
        <div className="inset small" style={{ marginTop: 12 }} aria-live="polite">
          <p style={{ margin: 0 }}>
            <strong>Hint 1.</strong> This tests: {objective?.title}.
          </p>
          {hints >= 2 && q.format === 'choice' && (
            <p style={{ margin: '6px 0 0' }}>
              <strong>Hint 2.</strong> One option has been ruled out.
            </p>
          )}
          {hints >= 2 && q.format === 'numeric' && (
            <p style={{ margin: '6px 0 0' }}>
              <strong>Hint 2.</strong> Start with: {q.steps[0]}
            </p>
          )}
          {hints >= 3 && related[0] && (
            <p style={{ margin: '6px 0 0' }}>
              <strong>Hint 3.</strong> Look at the principle in the atlas:{' '}
              <Link to={`/atlas/${related[0].id}`} target="_blank">
                {related[0].name}
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {locked && (
        <motion.div
          className={`feedback ${correct ? 'ok' : 'no'}`}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
        >
          <p style={{ fontWeight: 700, marginBottom: 6 }}>
            {answer?.value ? (correct ? 'Correct.' : 'Not this time.') : 'Not answered.'}
            {answer?.confidence === 3 &&
              !correct &&
              ' You were sure, so this goes to the front of your review queue.'}
            {answer?.confidence === 1 && correct && ' A correct guess still gets reviewed soon.'}
          </p>
          {q.format === 'numeric' && (
            <>
              <p>{answer ? gradeNumeric(q, answer.value, answer.unit).feedback : ''}</p>
              <ol className="small" style={{ paddingLeft: 20 }}>
                {q.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </>
          )}
          <p style={{ marginBottom: 10 }}>{q.explanation}</p>
          <details>
            <summary className="small" style={{ cursor: 'pointer' }}>
              Sources and review status
            </summary>
            <div style={{ marginTop: 8 }}>
              <ReviewBadge status={q.review.status} />{' '}
              <span className="small muted">
                {q.id} v{q.version}
              </span>
              <References refs={q.references} />
            </div>
          </details>
          {related.length > 0 && (
            <p className="small" style={{ margin: '10px 0 0' }}>
              Related in the atlas:{' '}
              {related.map((r, i) => (
                <span key={r.id}>
                  {i ? ', ' : ''}
                  <Link to={`/atlas/${r.id}`}>{r.name}</Link>
                </span>
              ))}
            </p>
          )}
        </motion.div>
      )}
    </article>
  )
}
