import { useMemo, useRef, useState } from 'react'
import { Plane, Vector3 } from 'three'
import type { InstrumentProps } from './types'
import { Bottle, Box, Cassette, Label } from './primitives'
import { COLORS } from './palette'

type CaptureTarget = {
  setPointerCapture: (id: number) => void
  releasePointerCapture: (id: number) => void
}
const INK: Record<string, string> = {
  blue: '#254677',
  black: '#252c2f',
  'blue deep / black lateral': '#254677',
}

export default function Grossing({ twin, onIntent, onManipulating }: InstrumentProps) {
  const lastSample = twin.events.findLast((event) => event.intent === 'gross.sample')
  const allowed = lastSample?.params.extraction === true
  const [preview, setPreview] = useState<number | null>(null)
  const moving = useRef(false)
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -0.4), [])
  const hit = useMemo(() => new Vector3(), [])
  const thickness = preview ?? twin.gross.thickness
  const maximum = Math.max(0.1, Math.min(20, twin.scenario.dimensions[0]))
  const guide = -1.15 + Math.min(1, thickness / maximum) * 2
  const ink = INK[twin.gross.ink] ?? COLORS.tissue
  return (
    <group>
      <Box size={[3.7, 0.09, 2]} position={[0, 0.05, 0]} color={COLORS.paper} />
      <Box
        size={[3.8, 1.8, 0.12]}
        position={[0, 0.9, -1.1]}
        color={COLORS.steel}
        metalness={0.55}
      />
      <Box size={[3.8, 0.18, 0.6]} position={[0, 1.9, -0.9]} color={COLORS.shell} />
      {Array.from({ length: 12 }, (_, index) => (
        <Box
          key={index}
          size={[0.08, 0.25, 0.02]}
          position={[-1.6 + index * 0.28, 0.35, -1.02]}
          color={COLORS.dark}
        />
      ))}
      <group position={[-0.15, 0.27, 0]}>
        <mesh scale={[1, Math.max(0.1, twin.gross.thickness / 25), 0.36]} castShadow receiveShadow>
          <sphereGeometry args={[1, 48, 20]} />
          <meshStandardMaterial color={COLORS.tissue} roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.98, 0.33, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshStandardMaterial color={COLORS.eosin} roughness={0.68} />
        </mesh>
        {twin.gross.ink !== 'none' && (
          <>
            <mesh position={[0, 0.005, 0.28]} scale={[0.95, 0.085, 0.08]}>
              <sphereGeometry args={[1, 32, 12]} />
              <meshStandardMaterial color={ink} roughness={0.9} />
            </mesh>
            {twin.gross.ink.includes('lateral') && (
              <Box size={[0.08, 0.12, 0.35]} position={[0.85, 0.03, 0]} color={INK.black} />
            )}
          </>
        )}
      </group>
      <Box
        size={[2.2, 0.025, 0.2]}
        position={[-0.15, 0.12, 0.7]}
        color={COLORS.steel}
        metalness={0.7}
      />
      {Array.from({ length: 21 }, (_, index) => (
        <Box
          key={index}
          size={[0.008, 0.005, index % 5 ? 0.07 : 0.15]}
          position={[-1.15 + index * 0.1, 0.136, 0.7]}
          color={COLORS.dark}
        />
      ))}
      <group position={[guide, 0.43, 0]}>
        <Box size={[0.018, 0.012, 0.96]} color={allowed ? COLORS.ink : COLORS.steel} />
        <Box
          size={[0.1, 0.22, 0.26]}
          position={[0, 0.18, -0.38]}
          color={COLORS.steel}
          metalness={0.85}
          onPointerDown={(event) => {
            event.stopPropagation()
            if (!allowed) return
            moving.current = true
            setPreview(twin.gross.thickness)
            onManipulating(true)
            ;(event.target as unknown as CaptureTarget).setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!moving.current) return
            event.stopPropagation()
            if (event.ray.intersectPlane(plane, hit))
              setPreview(
                Math.round(Math.max(0.1, Math.min(maximum, ((hit.x + 1.15) / 2) * maximum)) * 10) /
                  10,
              )
          }}
          onPointerUp={(event) => {
            if (!moving.current) return
            event.stopPropagation()
            moving.current = false
            onManipulating(false)
            ;(event.target as unknown as CaptureTarget).releasePointerCapture(event.pointerId)
            onIntent(
              'gross.sample',
              {
                ...lastSample!.params,
                thickness,
                fragments: twin.gross.fragments,
                cassette: twin.gross.cassette,
                ink: twin.gross.ink,
                key: twin.gross.key,
                crowding: twin.gross.crowding,
              },
              'grossing',
            )
            setPreview(null)
          }}
          onPointerCancel={() => {
            moving.current = false
            setPreview(null)
            onManipulating(false)
          }}
        />
        <Box size={[0.14, 0.08, 0.24]} position={[0, 0.34, -0.38]} color={COLORS.dark} />
      </group>
      <Bottle position={[-1.65, 0.1, -0.5]} scale={0.6} color={ink} />
      <Cassette position={[1.45, 0.15, 0.3]} />
      {twin.gross.sampled &&
        [0, 1, 2]
          .slice(0, Math.min(3, twin.gross.fragments))
          .map((i) => (
            <Box
              key={i}
              size={[0.12, 0.06, 0.26]}
              position={[1.25 + i * 0.18, 0.24, 0.3]}
              color={COLORS.tissue}
            />
          ))}
      <Label at={[0, 1.8, -0.56]}>
        Local extraction · {allowed ? 'recorded check' : 'check before sampling'}
      </Label>
      <Label at={[-0.15, 0.1, 1.08]}>
        {twin.gross.dimensions.join(' × ')} mm · {thickness} mm cut
      </Label>
      <Label at={[0.25, 1.07, 0.15]}>
        {allowed
          ? 'Drag the blade guide along the ruler'
          : 'Record a cassette plan and extraction check below'}
      </Label>
    </group>
  )
}
