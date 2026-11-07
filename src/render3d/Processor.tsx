import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, type Group } from 'three'
import type { InstrumentProps } from './types'
import { Bottle, Box, Cassette, Cylinder, Label } from './primitives'
import { COLORS } from './palette'

const REAGENT_COLOR: Record<string, string> = {
  alcohol: '#8faeb7',
  clearant: '#c7c7a7',
  paraffin: COLORS.wax,
}
export default function Processor({ twin, reducedMotion }: InstrumentProps) {
  const latest = twin.processing.history.at(-1)
  const shown = twin.processing.history.slice(-6)
  const rack = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const destination = Math.max(0, shown.length - 1)
  useFrame((_, delta) => {
    if (!rack.current) return
    const target = -1.25 + destination * 0.5
    const next = reducedMotion
      ? target
      : rack.current.position.x + (target - rack.current.position.x) * (1 - Math.exp(-8 * delta))
    rack.current.position.x = next
    if (Math.abs(next - target) > 0.002) invalidate()
  })
  return (
    <group>
      <Box size={[3.4, 1.2, 1.8]} position={[0, 0.6, 0]} color={COLORS.shell} />
      <Box size={[3.5, 0.1, 1.9]} position={[0, 1.25, 0]} color={COLORS.steel} metalness={0.6} />
      <Cylinder radius={0.46} height={0.1} position={[-0.8, 1.34, -0.22]} color={COLORS.dark} />
      <Cylinder radius={0.36} height={0.08} position={[-0.8, 1.4, -0.22]} color={COLORS.steel} />
      <Box size={[0.55, 0.08, 0.12]} position={[-0.8, 1.48, -0.22]} color={COLORS.dark} />
      <Box
        size={[1.1, 0.64, 0.08]}
        position={[0.7, 1.55, -0.52]}
        rotation={[-0.2, 0, 0]}
        color={COLORS.dark}
      />
      <Label at={[0.7, 1.62, -0.4]}>
        {latest ? `${latest.reagent} · ${latest.minutes} min` : 'No exchanges executed'}
      </Label>
      {Array.from({ length: 6 }, (_, index) => {
        const step = shown[index]
        return (
          <group key={index} position={[-1.25 + index * 0.5, 0.08, 1.12]}>
            <Bottle
              scale={0.66}
              filled={!!step}
              color={
                step
                  ? new Color(REAGENT_COLOR[step.reagent] ?? COLORS.water)
                      .lerp(new Color('#796d62'), Math.max(0, Math.min(1, step.exhaustion)))
                      .getStyle()
                  : COLORS.glass
              }
            />
            {step && (
              <Box
                size={[0.35, 0.025, 0.36]}
                position={[0, 0, 0]}
                color={index === shown.length - 1 ? COLORS.ink : COLORS.steel}
              />
            )}
          </group>
        )
      })}
      <group ref={rack} position={[-1.25, 0.77, 1.12]}>
        <Cassette scale={0.55} />
        <Box
          size={[0.025, 0.24, 0.025]}
          position={[0, 0.17, 0]}
          color={COLORS.steel}
          metalness={0.8}
        />
      </group>
      <Label at={[0, 0.25, 1.35]}>
        Last {shown.length} executed exchanges · {twin.processing.history.length} total
      </Label>
      <Label at={[-0.75, 1.82, 0.4]}>
        Center wax {Math.round((twin.regions.at(-1)?.wax ?? 0) * 100)}%
      </Label>
    </group>
  )
}
