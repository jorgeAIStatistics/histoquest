import type { InstrumentProps } from './types'
import { Bottle, Box, Label } from './primitives'
import { COLORS } from './palette'

export default function Decalcification({ twin }: InstrumentProps) {
  return (
    <group>
      <Bottle position={[-0.8, 0, 0]} scale={1.6} />
      <Bottle position={[0.7, 0, -0.2]} scale={1.2} color={COLORS.eosin} />
      <Box size={[1.3, 0.03, 0.8]} position={[0.9, 0.03, 0.8]} color={COLORS.paper} />
      <Label at={[-0.8, 0.67, 0.45]}>{twin.scenario.accession}</Label>
      <Label at={[0, 1.4, 0]}>
        {twin.decal.agent} · {twin.decal.hours} hours
      </Label>
    </group>
  )
}
