import { useMemo } from 'react'
import { Color } from 'three'
import type { InstrumentProps } from './types'
import { Bottle, Box, Label } from './primitives'
import { COLORS } from './palette'

function DepthField({ twin, kind, x }: InstrumentProps & { kind: 'access' | 'fixed'; x: number }) {
  const colors = useMemo(
    () =>
      twin.regions.map((region) =>
        new Color(COLORS.tissue).lerp(
          new Color(kind === 'access' ? COLORS.water : COLORS.ink),
          region[kind],
        ),
      ),
    [twin.regions, kind],
  )
  return (
    <group position={[x, 0.78, 0.65]}>
      <mesh scale={[0.75, 0.46, 0.1]} position={[0, 0, -0.15]}>
        <sphereGeometry args={[1, 36, 18]} />
        <meshStandardMaterial color={COLORS.tissue} roughness={0.8} />
      </mesh>
      {twin.regions.map((_, index) => (
        <mesh key={index} scale={[0.74, 0.45, 1]}>
          <ringGeometry
            args={[
              Math.max(0, 1 - (index + 1) / twin.regions.length),
              1 - index / twin.regions.length,
              64,
            ]}
          />
          <meshStandardMaterial color={colors[index]} roughness={0.82} />
        </mesh>
      ))}
      <Label at={[0, 0.65, 0]}>{kind === 'access' ? 'Fixative access' : 'Fixation reaction'}</Label>
      <Label at={[0, -0.61, 0]}>
        Center {Math.round((twin.regions.at(-1)?.[kind] ?? 0) * 100)}% · model scale
      </Label>
    </group>
  )
}

export default function Fixation(props: InstrumentProps) {
  return (
    <group>
      <Bottle position={[-1.55, 0, -0.55]} scale={1.45} />
      <Box size={[3.1, 0.08, 1.8]} position={[0.2, 0.08, 0.16]} color={COLORS.paper} />
      <DepthField {...props} x={-0.45} kind="access" />
      <DepthField {...props} x={1.15} kind="fixed" />
      <Label at={[0.45, 2, -0.3]}>
        {props.twin.fixation.hours} hours · {props.twin.fixation.fixative}
      </Label>
    </group>
  )
}
