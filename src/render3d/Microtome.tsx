import { useEffect, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { Box, Cassette, Cylinder, Label } from './primitives'
import { COLORS } from './palette'
import type { InstrumentProps } from './types'
import type { StationId } from '../sim/core/events'
import { PROCESS } from '../sim/params/process'

const TAU = Math.PI * 2
type CaptureTarget = {
  setPointerCapture: (id: number) => void
  releasePointerCapture: (id: number) => void
}

export default function Microtome({
  twin,
  onIntent,
  reducedMotion,
  onManipulating,
  interactionStation = 'microtomy',
}: InstrumentProps & { interactionStation?: StationId }) {
  const wheel = useRef<Group>(null)
  const head = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const drag = useRef<{ y: number; time: number; accumulated: number; turns: number } | null>(null)
  const angle = useRef(0)
  const lastSection = twin.block.sections.at(-1)
  const count = twin.block.sections.length
  const target = (count + twin.block.trimmed / 20) * TAU

  useEffect(() => {
    invalidate()
  }, [target, invalidate])
  useEffect(() => () => onManipulating(false), [onManipulating])
  useFrame((_, delta) => {
    angle.current = reducedMotion
      ? target
      : angle.current + (target - angle.current) * Math.min(1, delta * 7)
    if (wheel.current) wheel.current.rotation.x = angle.current
    if (head.current)
      head.current.position.y = 1.14 + (reducedMotion ? 0 : Math.sin(angle.current) * 0.11)
    if (Math.abs(target - angle.current) > 0.002) invalidate()
  })

  function startWheel(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    ;(event.target as unknown as CaptureTarget).setPointerCapture(event.pointerId)
    drag.current = { y: event.clientY, time: event.timeStamp, accumulated: 0, turns: 0 }
    onManipulating(true)
  }
  function turnWheel(event: ThreeEvent<PointerEvent>) {
    if (!drag.current) return
    event.stopPropagation()
    const change = Math.abs(event.clientY - drag.current.y)
    drag.current.accumulated += change
    const elapsed = Math.max(16, event.timeStamp - drag.current.time)
    if (drag.current.accumulated >= 48) {
      const speed = Math.round(Math.min(3, Math.max(0.2, (change / elapsed) * 2)) * 10) / 10
      onIntent('instrument.set', { speed }, interactionStation)
      onIntent('microtomy.cut', {}, interactionStation)
      drag.current.accumulated = 0
      drag.current.turns += 1
    }
    drag.current.y = event.clientY
    drag.current.time = event.timeStamp
  }
  function endWheel(event: ThreeEvent<PointerEvent>) {
    if (!drag.current) return
    event.stopPropagation()
    if (drag.current.turns === 0) onIntent('microtomy.cut', {}, interactionStation)
    drag.current = null
    ;(event.target as unknown as CaptureTarget).releasePointerCapture(event.pointerId)
    onManipulating(false)
  }

  return (
    <group position={[-0.45, 0, -0.1]}>
      <Box size={[2.15, 0.2, 2]} position={[0, 0.12, 0]} color={COLORS.shell} />
      <Box size={[1.25, 1.55, 0.82]} position={[0, 0.98, -0.5]} color={COLORS.shell} />
      <Box size={[1.32, 0.15, 0.88]} position={[0, 1.8, -0.5]} color={COLORS.trim} />
      <Box
        size={[0.86, 1.12, 0.06]}
        position={[0, 1.05, -0.05]}
        color={COLORS.steel}
        metalness={0.75}
      />
      <Cylinder radius={0.1} height={0.8} position={[0, 1.05, 0.04]} color={COLORS.dark} />
      <group ref={head} position={[0, 1.14, 0.22]}>
        <Cylinder
          radius={0.25}
          height={0.25}
          rotation={[Math.PI / 2, 0, 0]}
          color={COLORS.steel}
          metalness={0.85}
        />
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.22]}>
          <Cassette scale={0.9} />
          <Box
            size={[0.54, 0.23, 0.4]}
            position={[0, 0.14, 0]}
            color={COLORS.wax}
            roughness={0.32}
          />
          <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.16, 0.1, 1]}>
            <circleGeometry args={[1, 24]} />
            <meshStandardMaterial color={COLORS.tissue} roughness={0.9} />
          </mesh>
        </group>
        <Cylinder
          radius={0.07}
          height={0.43}
          position={[0.42, 0, 0.03]}
          rotation={[0, 0, Math.PI / 2]}
          color={COLORS.dark}
        />
      </group>
      <Box size={[1.4, 0.22, 0.62]} position={[0, 0.57, 0.62]} color={COLORS.dark} />
      <group rotation={[(-twin.instrument.angle * Math.PI) / 180, 0, 0]} position={[0, 0.72, 0.62]}>
        <Box size={[1.28, 0.16, 0.22]} color={COLORS.steel} metalness={0.8} />
        <Box
          size={[1.24, 0.012, 0.12]}
          position={[twin.instrument.bladePosition * 0.03, 0.09, -0.04]}
          color="#d6e2e2"
          metalness={1}
          roughness={0.16}
        />
      </group>
      <Box
        size={[1.4, 0.05, 0.15]}
        position={[0, twin.instrument.guarded ? 0.86 : 0.52, twin.instrument.guarded ? 0.58 : 0.96]}
        color={COLORS.safety}
        onClick={(event) => {
          event.stopPropagation()
          onIntent('instrument.set', { guarded: !twin.instrument.guarded }, interactionStation)
        }}
      />
      <Cylinder
        radius={0.06}
        height={0.38}
        rotation={[0, 0, Math.PI / 2]}
        position={[0.85, 0.6, 0.62]}
        color={COLORS.dark}
      />
      <Box
        size={[1.8, 0.035, 0.73]}
        position={[0, 0.26, 0.56]}
        color={COLORS.steel}
        metalness={0.45}
      />
      <group position={[1.04, 1.05, -0.38]}>
        <Cylinder radius={0.49} height={0.12} rotation={[0, 0, Math.PI / 2]} color={COLORS.dark} />
        <group
          ref={wheel}
          onPointerDown={startWheel}
          onPointerMove={turnWheel}
          onPointerUp={endWheel}
          onPointerCancel={() => {
            drag.current = null
            onManipulating(false)
          }}
        >
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.44, 0.07, 12, 48]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.8} roughness={0.25} />
          </mesh>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              size={[0.07, 0.85, 0.06]}
              rotation={[(index * TAU) / 3, 0, 0]}
              position={[0.08, 0, 0]}
              color={COLORS.shell}
            />
          ))}
          <Cylinder
            radius={0.075}
            height={0.27}
            position={[0.18, -0.32, 0.26]}
            rotation={[0, 0, Math.PI / 2]}
            color={COLORS.dark}
          />
        </group>
        <Cylinder
          radius={0.1}
          height={0.17}
          position={[0.25, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          color={twin.instrument.locked ? COLORS.safety : COLORS.trim}
          onClick={(event) => {
            event.stopPropagation()
            onIntent('instrument.set', { locked: !twin.instrument.locked }, interactionStation)
          }}
        />
      </group>
      <Cylinder
        radius={0.22}
        height={0.12}
        rotation={[0, 0, Math.PI / 2]}
        position={[-0.72, 1.28, -0.5]}
        color={COLORS.dark}
        onClick={(event) => {
          event.stopPropagation()
          onIntent('microtomy.trim', { microns: PROCESS['microtomy.trim'] }, interactionStation)
        }}
      />
      <Box size={[0.52, 0.25, 0.04]} position={[0, 1.54, -0.04]} color={COLORS.dark} />
      <Label at={[0, 2, 0.005]}>{twin.instrument.thickness} µm</Label>
      <Label at={[1.3, 1.72, -0.35]}>Drag or tap handwheel</Label>
      <Label at={[-0.74, 0.85, 0.65]}>
        {twin.instrument.guarded ? 'Guard on' : 'Blade exposed'}
      </Label>
      <Label at={[1.2, 0.45, -0.3]}>{twin.instrument.locked ? 'Locked' : 'Unlocked'}</Label>
      {Array.from({ length: Math.min(count, 8) }, (_, index) => {
        const section = twin.block.sections[count - 1 - index]
        const width = 0.48 * (1 - section.compression * 0.4)
        return (
          <group
            key={section.id}
            position={[0, 0.81 - index * 0.065, 0.66 + index * 0.15]}
            rotation={[Math.sin(index * 0.8) * 0.24, 0, section.folds * 0.3]}
          >
            <Box size={[width, 0.009, 0.16]} color={COLORS.wax} opacity={0.87} />
            <Box size={[width * 0.6, 0.012, 0.08]} color={COLORS.tissue} />
            {section.chatter > 0.15 &&
              [0, 1, 2].map((band) => (
                <Box
                  key={band}
                  size={[width * 0.6, 0.014, 0.008]}
                  position={[0, 0.002, -0.03 + band * 0.025]}
                  color={COLORS.eosin}
                />
              ))}
          </group>
        )
      })}
      {lastSection && (
        <Label at={[0, 0.18, 1.5]}>
          Ribbon · {count} {count === 1 ? 'section' : 'sections'}
        </Label>
      )}
    </group>
  )
}
