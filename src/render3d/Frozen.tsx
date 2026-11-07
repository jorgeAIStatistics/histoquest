import Microtome from './Microtome'
import type { InstrumentProps } from './types'
import { Box, Cylinder, Label } from './primitives'
import { COLORS } from './palette'

export default function Frozen(props: InstrumentProps) {
  return (
    <group>
      <Box size={[3.3, 1.1, 2]} position={[0, 0.56, -0.12]} color={COLORS.shell} />
      <Box
        size={[3.05, 0.03, 1.7]}
        position={[0, 1.13, -0.12]}
        color={COLORS.steel}
        metalness={0.7}
      />
      <Box size={[3.25, 0.9, 0.16]} position={[0, 1.55, -1]} color={COLORS.shell} />
      <group position={[0.12, 1.15, -0.2]} scale={0.52}>
        <Microtome {...props} interactionStation="frozen" />
      </group>
      <Cylinder radius={0.28} height={0.04} position={[-1.1, 1.17, 0.3]} color={COLORS.steel} />
      <Cylinder
        radius={0.15}
        height={0.07}
        position={[-1.1, 1.21, 0.3]}
        color={COLORS.paper}
        metalness={0}
      />
      <Label at={[0, 1.8, -0.82]}>Cryostat · {props.twin.frozen.temperature} °C</Label>
      <Label at={[0, 0.5, 1]}>Unfixed tissue · biohazard precautions</Label>
    </group>
  )
}
