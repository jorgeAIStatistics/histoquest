import type { StationId } from '../sim/core/events'
import type { InstrumentProps } from './types'
import { Bottle, Box, Label, Slide } from './primitives'
import { COLORS } from './palette'

export default function SlideReview({ twin, station }: InstrumentProps & { station: StationId }) {
  return (
    <group>
      <Box size={[2.5, 0.05, 1.5]} position={[0, 0.03, 0]} color={COLORS.paper} />
      {[0, 1, 2, 3].map((index) => (
        <Slide
          key={index}
          position={[-0.75 + index * 0.5, 0.08, 0]}
          stained
          tissue={!!twin.block.sections.length}
        />
      ))}
      <Bottle position={[1.7, 0, -0.3]} scale={0.7} color={COLORS.wax} />
      <Label at={[0, 0.4, 0.9]}>
        {station === 'quality'
          ? 'Identity, section, staining and control review'
          : 'Mounting medium and coverslip'}
      </Label>
    </group>
  )
}
