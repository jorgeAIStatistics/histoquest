import { PROTOCOLS } from '../../content/lab/protocols'
import type { ProtocolAction } from '../../content/lab/schemas'
import type { ModelParameter } from './registry'

/** Uniform time scales are deliberate simulation assumptions, not extracted clinical protocols. */
const teachingMinutes: Record<ProtocolAction, number> = {
  dewax: 5,
  hydrate: 3,
  oxidize: 5,
  digest: 10,
  stain: 8,
  differentiate: 1,
  blue: 1,
  reduce: 2,
  tone: 2,
  wash: 1,
  dehydrate: 3,
  clear: 3,
  mount: 1,
  sensitize: 3,
  block: 5,
  retrieve: 10,
  hybridize: 15,
}
export const PROTOCOL_PARAMETERS: ModelParameter[] = PROTOCOLS.flatMap((protocol) =>
  protocol.steps.map((step) => ({
    id: step.durationParam,
    value: teachingMinutes[step.action],
    unit: 'simulation minute',
    scope: `${protocol.label}: ${step.label}`,
    sourceIds: ['hq-original'],
    accessStatus: 'illustrative',
    illustrative: true,
    note: 'A synthetic reaction time scale used for the exercise. It is not a bench incubation, validated endpoint, or a duration copied from the historical reference. The listed source for the graph supports chemical sequence only.',
  })),
)
