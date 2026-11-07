import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import type { Group } from 'three'
class MoleculeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <p>
        3D unavailable. The labeled stage description below presents the same molecular sequence.
      </p>
    ) : (
      this.props.children
    )
  }
}
function TransitionGroup({
  shown,
  animate,
  children,
}: {
  shown: boolean
  animate: boolean
  children: ReactNode
}) {
  const group = useRef<Group>(null)
  const target = shown ? 1 : 0
  useEffect(() => {
    if (group.current && !animate) {
      group.current.scale.setScalar(target)
      group.current.position.y = (1 - target) * 0.6
    }
  }, [target, animate])
  useFrame((_, delta) => {
    if (!group.current || !animate) return
    const next =
      group.current.scale.x + (target - group.current.scale.x) * (1 - Math.exp(-delta * 4))
    group.current.scale.setScalar(next)
    group.current.position.y = (1 - next) * 0.6
  })
  return <group ref={group}>{children}</group>
}
function Assembly({ stage, animate }: { stage: number; animate: boolean }) {
  const group = useRef<Group>(null)
  useFrame((_, delta) => {
    if (animate && group.current) group.current.rotation.y += delta * 0.18
  })
  return (
    <group ref={group}>
      <mesh position={[0, -0.9, 0]}>
        <boxGeometry args={[4, 0.15, 1.5]} />
        <meshStandardMaterial color="#bbb2bf" />
      </mesh>
      {[-1, 0, 1].map((x, i) => (
        <mesh key={x} position={[x, -0.2, (i % 2) * 0.3]}>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#9972a8" />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]}>
        <octahedronGeometry args={[0.17]} />
        <meshStandardMaterial color="#e8b65f" />
      </mesh>
      <TransitionGroup shown={stage === 0} animate={animate}>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.25, 0.05]} rotation={[0, 0, x > 0 ? -0.55 : 0.55]}>
            <cylinderGeometry args={[0.045, 0.045, 1.3, 6]} />
            <meshStandardMaterial color="#cd6b78" />
          </mesh>
        ))}
      </TransitionGroup>
      <TransitionGroup shown={stage >= 2} animate={animate}>
        <group position={[0, 0.82, 0]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.18, 0.16, 0]} rotation={[0, 0, -side * 0.65]}>
              <cylinderGeometry args={[0.07, 0.07, 0.55, 6]} />
              <meshStandardMaterial color="#3e7e89" />
            </mesh>
          ))}
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.42, 6]} />
            <meshStandardMaterial color="#3e7e89" />
          </mesh>
        </group>
      </TransitionGroup>
      <TransitionGroup shown={stage >= 3} animate={animate}>
        {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
          <mesh key={x} position={[x, 1.35, Math.sin(i) * 0.2]}>
            <icosahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color="#d69e51" />
          </mesh>
        ))}
      </TransitionGroup>
      <TransitionGroup shown={stage >= 4} animate={animate}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            position={[((i % 4) - 0.5) * 0.17 - 0.2, -0.4 + Math.floor(i / 4) * 0.12, 0.4]}
          >
            <sphereGeometry args={[0.065, 6, 4]} />
            <meshStandardMaterial color="#6a442d" />
          </mesh>
        ))}
      </TransitionGroup>
    </group>
  )
}
export default function IhcMoleculeScene({ stage }: { stage: number }) {
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const change = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <div className="ihc-molecule">
      <div
        role="img"
        aria-label="Stylized 3D molecular teaching scene. Violet antigen, gold epitope, pink masking links, teal primary, gold detection polymer, brown precipitate."
        className="ihc-molecule-canvas"
      >
        <MoleculeBoundary>
          <Canvas
            frameloop={playing && visible && !reduced ? 'always' : 'demand'}
            camera={{ position: [4, 2.3, 5], fov: 40 }}
            dpr={[1, 1.5]}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[3, 5, 4]} intensity={2} />
            <Assembly stage={stage} animate={playing && visible && !reduced} />
            <OrbitControls enablePan={false} enableZoom={false} />
          </Canvas>
        </MoleculeBoundary>
      </div>
      <button className="btn btn-quiet" onClick={() => setPlaying(!playing)} disabled={reduced}>
        {reduced
          ? 'Reduced-motion still scene'
          : playing
            ? 'Pause animation'
            : 'Animate stage transitions'}
      </button>
      <p className="small">
        Stylized geometry; no molecular distances or chemical mechanism are calibrated. Drag to
        rotate. Enable animation, then change the stage to watch masking links withdraw, binding
        appear and reporter accumulate. Text below is the equivalent explanation.
      </p>
    </div>
  )
}
