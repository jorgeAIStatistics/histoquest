import { MECHANICS_PARAMETERS } from './mechanics'
import { CORE_PARAMETERS } from './registry'
import { PROCESS_PARAMETERS } from './process'
import { WORKBENCH_PARAMETERS } from './workbench'
import { ARCHETYPE_PARAMETERS } from './archetypes'
import { PROTOCOL_PARAMETERS } from './protocols'
import { OPTICS_PARAMETERS } from './optics'
import { MOLECULAR_PARAMETERS } from './molecular'
/** Imported only by simulation/review routes; the storage boundary imports no scientific catalog. */
export const MODEL_PARAMETERS = [
  ...CORE_PARAMETERS,
  ...MECHANICS_PARAMETERS,
  ...PROCESS_PARAMETERS,
  ...WORKBENCH_PARAMETERS,
  ...ARCHETYPE_PARAMETERS,
  ...PROTOCOL_PARAMETERS,
  ...OPTICS_PARAMETERS,
  ...MOLECULAR_PARAMETERS,
]
export const MODEL_PARAMETER_BY_ID = Object.fromEntries(MODEL_PARAMETERS.map((p) => [p.id, p]))
