import type { InstrumentProps } from './types'
import { Box, Label, Slide } from './primitives'
import { COLORS } from './palette'

export default function WaterBath({ twin }: InstrumentProps) {
  const section = twin.block.sections.at(-1)
  return (
    <group>
      <Box size={[2.8, 0.5, 2]} position={[0, 0.26, 0]} color={COLORS.shell} />
      <Box size={[2.4, 0.04, 1.65]} position={[0, 0.52, 0]} color={COLORS.dark} />
      <Box
        size={[2.2, 0.015, 1.45]}
        position={[0, 0.55, 0]}
        color={COLORS.water}
        metalness={0.35}
        roughness={0.09}
        opacity={0.85}
      />
      <Box size={[0.65, 0.17, 0.02]} position={[-0.55, 0.27, 1.01]} color={COLORS.dark} />
      <Label at={[-0.55, 0.28, 1.04]}>Flotation bath</Label>
      {section && !section.pickedUp && (
        <group
          position={[0, 0.57, 0]}
          rotation={[section.folds * 0.5, 0.15, section.wrinkles * 0.12]}
        >
          <Box size={[0.56, 0.008, 0.4]} color={COLORS.wax} opacity={0.8} />
          <Box size={[0.3, 0.01, 0.18]} color={COLORS.tissue} />
        </group>
      )}
      {section?.floaters.map((floater, index) => (
        <mesh
          key={`${floater.accession}:${index}`}
          position={[floater.x, 0.57, floater.y]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.06, 0.09, 1]}
        >
          <circleGeometry args={[1, 12]} />
          <meshStandardMaterial color={COLORS.eosin} />
        </mesh>
      ))}
      {[0, 1, 2].map((index) => (
        <Slide
          key={index}
          position={[1.8, 0.04 + index * 0.035, -0.2]}
          tissue={index === 2 && !!section?.pickedUp}
        />
      ))}
      <Label at={[1.8, 0.28, 0.65]}>
        {section?.pickedUp ? section.slideId || 'Unlabeled slide' : 'Slide pickup'}
      </Label>
    </group>
  )
}
