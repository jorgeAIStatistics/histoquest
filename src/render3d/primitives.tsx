import type { ReactNode } from 'react'
import ProjectedHtml from './ProjectedHtml'
import type { ThreeElements } from '@react-three/fiber'
import type { Vec3 } from './types'
import { COLORS } from './palette'

type BoxProps = Omit<ThreeElements['mesh'], 'scale'> & {
  size: Vec3
  color?: string
  metalness?: number
  roughness?: number
  opacity?: number
}
export function Box({
  size,
  color = COLORS.shell,
  metalness = 0,
  roughness = 0.55,
  opacity = 1,
  ...props
}: BoxProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

type CylinderProps = Omit<ThreeElements['mesh'], 'scale'> & {
  radius: number
  height: number
  color?: string
  metalness?: number
  opacity?: number
}
export function Cylinder({
  radius,
  height,
  color = COLORS.steel,
  metalness = 0.55,
  opacity = 1,
  ...props
}: CylinderProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={0.35}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

export function Label({
  at,
  children,
  compact = false,
}: {
  at: Vec3
  children: ReactNode
  compact?: boolean
}) {
  return (
    <ProjectedHtml position={at}>
      <span className={`scene-label${compact ? ' scene-label--compact' : ''}`}>{children}</span>
    </ProjectedHtml>
  )
}

export function Bench({ width = 5, depth = 2.6 }: { width?: number; depth?: number }) {
  return (
    <group>
      <Box
        size={[width, 0.15, depth]}
        position={[0, -0.08, 0]}
        color={COLORS.dark}
        roughness={0.82}
      />
      <Box size={[width - 0.12, 0.22, depth - 0.1]} position={[0, -0.25, 0]} color={COLORS.shell} />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <Box
            key={`${x}:${z}`}
            size={[0.12, 1.25, 0.12]}
            position={[x * (width / 2 - 0.25), -0.97, z * (depth / 2 - 0.2)]}
            color={COLORS.steel}
            metalness={0.75}
          />
        )),
      )}
    </group>
  )
}

export function Cassette({
  position = [0, 0, 0],
  scale = 1,
  color = COLORS.ink,
}: {
  position?: Vec3
  scale?: number
  color?: string
}) {
  return (
    <group position={position} scale={scale}>
      <Box size={[0.72, 0.11, 0.5]} color={color} />
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          size={[0.06, 0.012, 0.32]}
          position={[-0.22 + i * 0.14, 0.061, 0]}
          color={COLORS.dark}
        />
      ))}
      <Box
        size={[0.67, 0.1, 0.15]}
        position={[0, 0.03, 0.28]}
        rotation={[0.3, 0, 0]}
        color={COLORS.paper}
      />
    </group>
  )
}

export function Slide({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  stained = false,
  tissue = true,
}: {
  position?: Vec3
  rotation?: Vec3
  stained?: boolean
  tissue?: boolean
}) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.29, 0.016, 0.82]} color={COLORS.glass} opacity={0.75} roughness={0.1} />
      <Box size={[0.29, 0.02, 0.2]} position={[0, 0.006, 0.3]} color={COLORS.paper} />
      {tissue && (
        <mesh position={[0, 0.012, -0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.09, 0.16, 1]}>
          <circleGeometry args={[1, 16]} />
          <meshStandardMaterial color={stained ? COLORS.eosin : COLORS.wax} roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}

export function Bottle({
  position = [0, 0, 0],
  color = COLORS.water,
  scale = 1,
  filled = true,
}: {
  position?: Vec3
  color?: string
  scale?: number
  filled?: boolean
}) {
  return (
    <group position={position} scale={scale}>
      <Cylinder
        radius={0.26}
        height={0.64}
        position={[0, 0.32, 0]}
        color={COLORS.glass}
        opacity={0.32}
        metalness={0.1}
      />
      {filled && (
        <Cylinder
          radius={0.23}
          height={0.36}
          position={[0, 0.2, 0]}
          color={color}
          opacity={0.65}
          metalness={0}
        />
      )}
      <Cylinder
        radius={0.27}
        height={0.09}
        position={[0, 0.68, 0]}
        color={COLORS.trim}
        metalness={0}
      />
      <Box size={[0.3, 0.26, 0.02]} position={[0, 0.35, 0.25]} color={COLORS.paper} />
      <Box size={[0.18, 0.025, 0.005]} position={[0, 0.37, 0.265]} color={COLORS.ink} />
      <Box size={[0.18, 0.025, 0.005]} position={[0, 0.31, 0.265]} color={COLORS.ink} />
    </group>
  )
}
