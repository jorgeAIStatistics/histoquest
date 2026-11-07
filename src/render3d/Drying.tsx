import type { InstrumentProps } from './types'
import { Box, Label, Slide } from './primitives'
import { COLORS } from './palette'

export default function Drying({ twin }: InstrumentProps) {
  return (
    <group>
      <Box size={[2.7, 1.7, 1.6]} position={[-0.25, 0.86, -0.1]} color={COLORS.shell} />
      <Box size={[2.24, 1.2, 0.025]} position={[-0.25, 0.82, 0.72]} color={COLORS.dark} />
      <Box
        size={[2.12, 0.9, 0.015]}
        position={[-0.25, 0.85, 0.75]}
        color={COLORS.glass}
        opacity={0.22}
      />
      <Box
        size={[0.1, 0.7, 0.12]}
        position={[0.78, 0.8, 0.85]}
        color={COLORS.steel}
        metalness={0.8}
      />
      {[0, 1, 2, 3, 4].map((index) => (
        <Slide key={index} position={[-1 + index * 0.33, 0.55, 0.48]} />
      ))}
      <Label at={[-0.25, 1.57, 0.75]}>Drying oven</Label>
      <Label at={[0, 0.1, 1.05]}>
        Adhesion: {Math.round((twin.block.sections.at(-1)?.adhesion ?? 0) * 100)}% of model scale
      </Label>
    </group>
  )
}
