import { useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane, Vector3, type Group } from 'three'
import type { Piece } from '../sim/specimen/types'
import type { InstrumentProps, Vec3 } from './types'
import { Box, Cassette, Cylinder, Label } from './primitives'
import { COLORS } from './palette'
import { PROCESS } from '../sim/params/process'

const radians = (piece: Piece): Vec3 =>
  [piece.rx, piece.rz, piece.ry].map((v) => (v * Math.PI) / 180) as Vec3
type CaptureTarget = {
  setPointerCapture: (id: number) => void
  releasePointerCapture: (id: number) => void
}

function TissuePiece({
  piece,
  twin,
  onIntent,
  onManipulating,
  embeddingGesture = 'translate',
  selectedPieceId,
  onPieceSelect,
}: InstrumentProps & { piece: Piece }) {
  const group = useRef<Group>(null)
  const drag = useRef<{ x: number; y: number; pose: Piece } | null>(null)
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -(0.32 + piece.z / 15)), [piece.z])
  const hit = useMemo(() => new Vector3(), [])
  const invalidate = useThree((state) => state.invalidate)
  const original = () => {
    group.current?.position.set(piece.x / 15, 0.32 + piece.z / 15, piece.y / 15)
    group.current?.rotation.set(...radians(piece))
    invalidate()
  }
  return (
    <group
      ref={group}
      position={[piece.x / 15, 0.32 + piece.z / 15, piece.y / 15]}
      rotation={radians(piece)}
      onPointerDown={(event) => {
        if (selectedPieceId && selectedPieceId !== piece.id) return
        event.stopPropagation()
        onPieceSelect?.(piece.id)
        drag.current = { x: event.clientX, y: event.clientY, pose: { ...piece } }
        onManipulating(true)
        ;(event.target as unknown as CaptureTarget).setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!drag.current || !group.current) return
        event.stopPropagation()
        const pose = { ...piece }
        if (embeddingGesture === 'translate' && event.ray.intersectPlane(plane, hit)) {
          pose.x = Math.round(Math.min(0.72, Math.max(-0.72, hit.x)) * 150) / 10
          pose.y = Math.round(Math.min(0.45, Math.max(-0.45, hit.z)) * 150) / 10
        } else if (embeddingGesture === 'height') {
          pose.z =
            Math.round(
              Math.max(-2, Math.min(12, piece.z + (drag.current.y - event.clientY) / 25)) * 10,
            ) / 10
        } else if (embeddingGesture !== 'translate') {
          const axis = embeddingGesture as 'rx' | 'ry' | 'rz'
          pose[axis] = Math.round(
            Math.max(-180, Math.min(180, piece[axis] + (event.clientX - drag.current.x))),
          )
        }
        drag.current.pose = pose
        group.current.position.set(pose.x / 15, 0.32 + pose.z / 15, pose.y / 15)
        group.current.rotation.set(...radians(pose))
        invalidate()
      }}
      onPointerUp={(event) => {
        if (!drag.current) return
        event.stopPropagation()
        const pose = drag.current.pose
        drag.current = null
        onManipulating(false)
        ;(event.target as unknown as CaptureTarget).releasePointerCapture(event.pointerId)
        onIntent(
          'embedding.place',
          {
            ...pose,
            piece: piece.id,
            temperature: twin.embedding.temperature,
            bubbles: twin.embedding.bubbles,
          },
          'embedding',
        )
      }}
      onPointerCancel={() => {
        drag.current = null
        onManipulating(false)
        original()
      }}
    >
      <mesh castShadow receiveShadow scale={[0.32, Math.max(0.035, piece.thickness / 30), 0.14]}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshStandardMaterial
          color={COLORS.tissue}
          roughness={0.75}
          transparent
          opacity={!selectedPieceId || selectedPieceId === piece.id ? 1 : 0.45}
        />
      </mesh>
      <Box
        size={[0.42, 0.016, 0.13]}
        position={[0, Math.max(0.035, piece.thickness / 30), 0]}
        color={COLORS.eosin}
      />
      {embeddingGesture.startsWith('r') && (!selectedPieceId || selectedPieceId === piece.id) && (
        <mesh
          rotation={
            embeddingGesture === 'rx'
              ? [0, Math.PI / 2, 0]
              : embeddingGesture === 'rz'
                ? [Math.PI / 2, 0, 0]
                : [0, 0, 0]
          }
        >
          <torusGeometry args={[0.41, 0.014, 8, 48]} />
          <meshStandardMaterial color={COLORS.ink} transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  )
}

function FacePreview({ twin }: InstrumentProps) {
  const side = Math.round(Math.sqrt(twin.block.face.length))
  return (
    <group position={[-1.35, 0.8, 0.42]} rotation={[0, 0.22, 0]}>
      <Box size={[0.9, 0.9, 0.06]} color={COLORS.dark} />
      <Box size={[0.78, 0.78, 0.012]} position={[0, 0, 0.04]} color={COLORS.wax} />
      {twin.block.face.map(
        (remaining, index) =>
          remaining > 0 && (
            <Box
              key={index}
              size={[0.76 / side, 0.76 / side, 0.016]}
              position={[
                (((index % side) - (side - 1) / 2) * 0.76) / side,
                (((side - 1) / 2 - Math.floor(index / side)) * 0.76) / side,
                0.055,
              ]}
              color={COLORS.tissue}
            />
          ),
      )}
      <Label at={[0, 0.62, 0.04]}>Block face · {twin.block.trimmed} µm</Label>
      <Label at={[0, -0.63, 0.04]}>Model tissue map</Label>
    </group>
  )
}

export default function Embedding(props: InstrumentProps) {
  const { twin, onIntent } = props
  return (
    <group>
      <Box size={[3.2, 0.18, 1.95]} position={[0, 0.1, -0.12]} color={COLORS.shell} />
      <Box size={[1.8, 0.08, 1.25]} position={[0, 0.22, 0]} color={COLORS.steel} metalness={0.9} />
      <Box size={[1.64, 0.04, 1.05]} position={[0, 0.25, 0]} color={COLORS.wax} roughness={0.2} />
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <Box
            size={[0.08, 0.15, 1.3]}
            position={[side * 0.91, 0.27, 0]}
            color={COLORS.steel}
            metalness={0.85}
          />
          <Box
            size={[1.9, 0.15, 0.08]}
            position={[0, 0.27, side * 0.64]}
            color={COLORS.steel}
            metalness={0.85}
          />
        </group>
      ))}
      <Box size={[1.3, 1.24, 0.7]} position={[0, 0.8, -1]} color={COLORS.shell} />
      <Box size={[1.45, 0.12, 0.95]} position={[0, 1.45, -0.85]} color={COLORS.trim} />
      <Cylinder radius={0.07} height={0.42} position={[0, 1.16, -0.45]} color={COLORS.steel} />
      <Box size={[0.6, 0.22, 0.03]} position={[0, 1.1, -0.64]} color={COLORS.dark} />
      <Label at={[0, 1.12, -0.6]}>{twin.embedding.temperature} °C</Label>
      <Box
        size={[0.72, 0.07, 1.2]}
        position={[1.22, 0.25, 0]}
        color={COLORS.water}
        metalness={0.25}
        onClick={(event) => {
          event.stopPropagation()
          onIntent(
            'embedding.cool',
            { temperature: PROCESS['microtomy.block-temperature'] },
            'embedding',
          )
        }}
      />
      <Label at={[1.4, 0.52, 0.32]}>Cold plate</Label>
      <Cassette position={[1.25, 0.28, -0.5]} scale={0.85} />
      {twin.embedding.pieces.map((piece) => (
        <TissuePiece key={piece.id} piece={piece} {...props} />
      ))}
      <FacePreview {...props} />
    </group>
  )
}
