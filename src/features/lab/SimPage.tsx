import { lazy, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { SIMULATIONS } from '../../content'
import { OBJECTIVE_BY_ID } from '../../content/curriculum'
import { markPlanItem } from '../../store/planActions'
import { recordSim } from '../../store/store'
import { Empty } from '../../ui/components'

const SIMS: Record<string, React.LazyExoticComponent<(p: SimProps) => ReactNode>> = {
  'processing-bench': lazy(() => import('./sims/ProcessingBench')),
  'embedding-studio': lazy(() => import('./sims/EmbeddingStudio')),
  'microtomy-challenge': lazy(() => import('./sims/MicrotomyChallenge')),
  'stain-studio': lazy(() => import('./sims/StainStudio')),
  'lab-math': lazy(() => import('./sims/LabMath')),
  'specimen-journey': lazy(() => import('./sims/SpecimenJourney')),
  'fixation-detective': lazy(() => import('./sims/FixationDetective')),
  'ihc-room': lazy(() => import('./sims/IhcRoom')),
}

export interface SimProps {
  /** Report a finished run: reasoning decisions judged correct out of total. */
  finish: (correct: number, total: number, summary: string) => void
}

export default function SimPage() {
  const { sim = '' } = useParams()
  const [params] = useSearchParams()
  const plan = params.get('plan')
  const meta = SIMULATIONS.find((s) => s.id === sim)
  const Comp = SIMS[sim]
  if (!meta || !Comp || meta.status !== 'ready')
    return <Empty title={meta ? `${meta.title} is in development` : 'Simulation not found'} action={<Link className="btn" to="/lab">Back to the lab</Link>}>{meta?.blurb}</Empty>

  const finish = (correct: number, total: number, summary: string) => {
    recordSim({ sim, correct, total, objectives: meta.objectives, summary })
    markPlanItem(plan, { done: true })
  }
  return (
    <div className="page">
      <p className="small"><Link to="/lab">Virtual Lab</Link> / {meta.title}</p>
      <div className="sim-head">
        <div>
          <h1>{meta.title}</h1>
          <p className="lede" style={{ marginBottom: 6 }}>{meta.blurb}</p>
          <p className="small muted">Objectives: {meta.objectives.map((o) => OBJECTIVE_BY_ID[o]?.title).join('; ')}</p>
        </div>
        {plan && <Link className="btn" to="/today">Back to Today</Link>}
      </div>
      <Comp finish={finish} />
    </div>
  )
}
