import type { InstrumentProps } from './types'
import { Bottle, Box, Label } from './primitives'
import { COLORS } from './palette'

export default function SpecimenReceipt({ twin, bottleRotation = 0 }: InstrumentProps) {
  const discrepancy =
    twin.scenario.discrepancy === 'none'
      ? 'Compare both identifiers and source'
      : `Teaching discrepancy: ${twin.scenario.discrepancy.replaceAll('-', ' ')}`
  return (
    <group>
      <group position={[-0.55, 0, 0]} rotation={[0, bottleRotation, 0]}>
        <Bottle scale={2.1} />
        <mesh position={[0, 0.26, 0]} scale={[0.23, 0.1, 0.15]}>
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial color={COLORS.tissue} roughness={0.8} />
        </mesh>
        <Label at={[0, 0.72, 0.58]}>{twin.scenario.accession}</Label>
      </group>
      <Box size={[1.5, 0.05, 1.3]} position={[1.05, 0.05, 0.3]} color={COLORS.paper} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          size={[1.1, 0.004, 0.025]}
          position={[1.05, 0.08, -0.1 + i * 0.14]}
          color={i ? '#b8b4a7' : COLORS.ink}
        />
      ))}
      <Label at={[1.05, 0.5, 0.3]}>Requisition below</Label>
      <Label at={[0, 1.95, 0]}>{discrepancy}</Label>
      <Label at={[0, 0.2, 1.15]}>Rotation changes the view · identity decisions remain yours</Label>
    </group>
  )
}
