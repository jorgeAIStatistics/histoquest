import { useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane, Vector3, type Group } from 'three'
import type { Piece } from '../sim/specimen/types'
import type { StationId } from '../sim/core/events'
import type { InstrumentProps, Vec3 } from './types'
import { Bench, Bottle, Box, Cassette, Cylinder, Label, Slide } from './primitives'
import { COLORS } from './palette'
import Microtome from './Microtome'
import { PROCESS } from '../sim/params/process'

function EmbeddingPiece({
  piece,
  onIntent,
  onManipulating,
  temperature,
  bubbles,
}: {
  piece: Piece
  onIntent: InstrumentProps['onIntent']
  onManipulating: InstrumentProps['onManipulating']
  temperature: number
  bubbles: number
}) {
  const group = useRef<Group>(null)
  const moving = useRef(false)
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -0.26), [])
  const hit = useMemo(() => new Vector3(), [])
  const invalidate = useThree((state) => state.invalidate)
  const destination = useRef({ x: piece.x, y: piece.y })
  const rotations: Vec3 = [piece.rx, piece.rz, piece.ry].map(
    (angle) => (angle * Math.PI) / 180,
  ) as Vec3
  return (
    <group
      ref={group}
      position={[piece.x / 15, 0.26 + piece.z / 15, piece.y / 15]}
      rotation={rotations}
      onPointerDown={(event) => {
        event.stopPropagation()
        moving.current = true
        onManipulating(true)
        ;(event.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
          event.pointerId,
        )
      }}
      onPointerMove={(event) => {
        if (!moving.current || !group.current) return
        event.stopPropagation()
        if (event.ray.intersectPlane(plane, hit)) {
          const x = Math.min(0.72, Math.max(-0.72, hit.x))
          const z = Math.min(0.45, Math.max(-0.45, hit.z))
          group.current.position.x = x
          group.current.position.z = z
          destination.current = { x: Math.round(x * 150) / 10, y: Math.round(z * 150) / 10 }
          invalidate()
        }
      }}
      onPointerUp={(event) => {
        if (!moving.current) return
        event.stopPropagation()
        moving.current = false
        onManipulating(false)
        ;(
          event.target as unknown as { releasePointerCapture: (id: number) => void }
        ).releasePointerCapture(event.pointerId)
        onIntent(
          'embedding.place',
          { ...piece, ...destination.current, piece: piece.id, temperature, bubbles },
          'embedding',
        )
      }}
      onPointerCancel={() => {
        moving.current = false
        onManipulating(false)
      }}
    >
      <Box
        size={[0.52, Math.max(0.06, piece.thickness / 15), 0.19]}
        color={COLORS.tissue}
        roughness={0.8}
      />
      <Box
        size={[0.52, 0.016, 0.19]}
        position={[0, Math.max(0.035, piece.thickness / 30), 0]}
        color={COLORS.eosin}
      />
    </group>
  )
}

function Embedding(props: InstrumentProps) {
  const { twin, onIntent, onManipulating } = props
  return (
    <group>
      <Box size={[3.2, 0.18, 1.95]} position={[0, 0.1, -0.12]} color={COLORS.shell} />
      <Box size={[1.8, 0.08, 1.25]} position={[0, 0.22, 0]} color={COLORS.steel} metalness={0.9} />
      <Box size={[1.64, 0.04, 1.05]} position={[0, 0.25, 0]} color={COLORS.wax} roughness={0.2} />
      {([-1, 1] as const).map((side) => (
        <Box
          key={side}
          size={[0.08, 0.15, 1.3]}
          position={[side * 0.91, 0.27, 0]}
          color={COLORS.steel}
          metalness={0.85}
        />
      ))}
      {([-1, 1] as const).map((side) => (
        <Box
          key={side}
          size={[1.9, 0.15, 0.08]}
          position={[0, 0.27, side * 0.64]}
          color={COLORS.steel}
          metalness={0.85}
        />
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
      <Cassette position={[-1.25, 0.28, 0.2]} scale={0.85} />
      <Box
        size={[0.025, 0.025, 0.64]}
        position={[-1.25, 0.26, -0.55]}
        rotation={[0, -0.28, 0]}
        color={COLORS.steel}
        metalness={0.9}
      />
      <Box
        size={[0.025, 0.025, 0.64]}
        position={[-1.16, 0.26, -0.55]}
        rotation={[0, -0.4, 0]}
        color={COLORS.steel}
        metalness={0.9}
      />
      {twin.embedding.pieces.map((piece) => (
        <EmbeddingPiece
          key={piece.id}
          piece={piece}
          onIntent={onIntent}
          onManipulating={onManipulating}
          temperature={twin.embedding.temperature}
          bubbles={twin.embedding.bubbles}
        />
      ))}
      <Label at={[0, 0.12, 0.95]}>
        {twin.embedding.pieces.length
          ? 'Drag pieces in the mold · adjust six axes below'
          : 'Place the first piece using the controls below'}
      </Label>
    </group>
  )
}

function WaterBath({ twin }: InstrumentProps) {
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

function Grossing({ twin }: InstrumentProps) {
  return (
    <group>
      <Box size={[3.4, 0.09, 2]} position={[-0.2, 0.05, 0]} color={COLORS.paper} />
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
      <mesh
        position={[-0.35, 0.24, 0]}
        scale={[0.75, Math.max(0.08, twin.gross.thickness / 25), 0.36]}
      >
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color={COLORS.tissue} roughness={0.8} />
      </mesh>
      {twin.gross.ink !== 'none' && (
        <mesh position={[-0.35, 0.27, 0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.72, 0.18, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshStandardMaterial color={twin.gross.ink.includes('blue') ? '#254677' : '#234d43'} />
        </mesh>
      )}
      <Box
        size={[2.15, 0.025, 0.18]}
        position={[-0.4, 0.12, 0.73]}
        color={COLORS.steel}
        metalness={0.7}
      />
      {Array.from({ length: 22 }, (_, index) => (
        <Box
          key={index}
          size={[0.01, 0.005, index % 5 ? 0.07 : 0.14]}
          position={[-1.4 + index * 0.095, 0.136, 0.73]}
          color={COLORS.dark}
        />
      ))}
      <Bottle position={[-1.7, 0.1, -0.5]} scale={0.6} color={COLORS.ink} />
      <Cassette position={[1.4, 0.15, 0.3]} />
      <Box
        size={[0.12, 0.025, 0.7]}
        position={[0.8, 0.14, -0.1]}
        rotation={[0, 0.5, 0]}
        color={COLORS.steel}
        metalness={0.85}
      />
      <Label at={[0, 1.8, -0.56]}>Local extraction · scope depends on laboratory policy</Label>
      <Label at={[0, 0.12, 1]}>{twin.gross.dimensions.join(' × ')} mm · synthetic geometry</Label>
    </group>
  )
}

function Processor({ twin }: InstrumentProps) {
  const latest = twin.processing.history.at(-1)
  return (
    <group>
      <Box size={[3.2, 1.2, 1.8]} position={[0, 0.6, 0]} color={COLORS.shell} />
      <Box size={[3.3, 0.1, 1.9]} position={[0, 1.25, 0]} color={COLORS.steel} metalness={0.6} />
      <Cylinder radius={0.53} height={0.1} position={[-0.65, 1.34, 0]} color={COLORS.dark} />
      <Cylinder radius={0.43} height={0.08} position={[-0.65, 1.4, 0]} color={COLORS.steel} />
      <Box size={[0.55, 0.08, 0.12]} position={[-0.65, 1.48, 0]} color={COLORS.dark} />
      <Box
        size={[0.9, 0.54, 0.08]}
        position={[0.78, 1.55, -0.52]}
        rotation={[-0.2, 0, 0]}
        color={COLORS.dark}
      />
      <Label at={[0.78, 1.55, -0.4]}>{latest?.reagent ?? 'Program not started'}</Label>
      {Array.from({ length: 6 }, (_, index) => (
        <Bottle
          key={index}
          position={[-1.25 + index * 0.5, 0.08, 0.73]}
          scale={0.64}
          color={index > 3 ? COLORS.wax : COLORS.water}
        />
      ))}
      <Label at={[0, 0.45, 1.16]}>Reagent exchanges: {twin.processing.history.length}</Label>
    </group>
  )
}

function Staining({ twin, immuno = false }: InstrumentProps & { immuno?: boolean }) {
  const colors = ['#7f779d', '#c68aa0', '#5c8d91', '#a8bac2', '#e3c384', '#8d6087']
  const current = twin.staining.history.length % colors.length
  return (
    <group>
      <Box size={[3.9, 0.22, 1.6]} position={[0, 0.12, 0]} color={COLORS.shell} />
      <Box size={[3.9, 1.2, 0.13]} position={[0, 0.85, -0.78]} color={COLORS.shell} />
      <Box
        size={[3.8, 0.09, 0.12]}
        position={[0, 1.45, -0.45]}
        color={COLORS.steel}
        metalness={0.8}
      />
      {colors.map((color, index) => (
        <group key={color} position={[-1.55 + index * 0.62, 0.45, 0.1]}>
          <Box size={[0.49, 0.4, 0.72]} color={color} metalness={0.2} opacity={0.85} />
          <Box size={[0.4, 0.01, 0.6]} position={[0, 0.21, 0]} color={color} roughness={0.15} />
          <Box size={[0.45, 0.08, 0.05]} position={[0, 0.28, 0.28]} color={COLORS.steel} />
        </group>
      ))}
      <group position={[-1.55 + current * 0.62, 0.92, 0.05]}>
        <Box size={[0.05, 0.64, 0.05]} color={COLORS.steel} metalness={0.9} />
        <Box size={[0.48, 0.035, 0.07]} position={[0, -0.26, 0]} color={COLORS.dark} />
        {[0, 1, 2].map((index) => (
          <Slide
            key={index}
            position={[-0.14 + index * 0.14, -0.4, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            stained
          />
        ))}
      </group>
      {immuno && (
        <group position={[1.65, 1.75, -0.55]}>
          <Cylinder radius={0.08} height={0.5} color={COLORS.steel} />
          <Label at={[-1.7, 0.15, 0]}>Retrieval → primary → detection → controls</Label>
        </group>
      )}
      <Label at={[0, 0.12, 1]}>
        {immuno
          ? `${twin.ihc.marker} · ${twin.ihc.valid ? 'controls supported' : 'controls not established'}`
          : (twin.staining.history.at(-1)?.reagent ?? 'Set the first reagent step below')}
      </Label>
    </group>
  )
}

function Drying({ twin }: InstrumentProps) {
  return (
    <group>
      <Box size={[2.7, 1.7, 1.6]} position={[-0.25, 0.86, -0.1]} color={COLORS.shell} />
      <Box size={[2.24, 1.2, 0.025]} position={[-0.25, 0.82, 0.72]} color={COLORS.dark} />
      <Box
        size={[2.12, 0.9, 0.015]}
        position={[-0.25, 0.85, 0.75]}
        color={COLORS.glass}
        opacity={0.22}
      />
      <Box
        size={[0.1, 0.7, 0.12]}
        position={[0.78, 0.8, 0.85]}
        color={COLORS.steel}
        metalness={0.8}
      />
      {[0, 1, 2, 3, 4].map((index) => (
        <Slide key={index} position={[-1 + index * 0.33, 0.55, 0.48]} />
      ))}
      <Label at={[-0.25, 1.57, 0.75]}>Drying oven</Label>
      <Label at={[0, 0.1, 1.05]}>
        Adhesion: {Math.round((twin.block.sections.at(-1)?.adhesion ?? 0) * 100)}% of model scale
      </Label>
    </group>
  )
}

function Frozen(props: InstrumentProps) {
  return (
    <group>
      <Box size={[3.3, 1.1, 2]} position={[0, 0.56, -0.12]} color={COLORS.shell} />
      <Box
        size={[3.05, 0.03, 1.7]}
        position={[0, 1.13, -0.12]}
        color={COLORS.steel}
        metalness={0.7}
      />
      <Box size={[3.25, 0.9, 0.16]} position={[0, 1.55, -1]} color={COLORS.shell} />
      <group position={[0.12, 1.15, -0.2]} scale={0.52}>
        <Microtome {...props} interactionStation="frozen" />
      </group>
      <Cylinder radius={0.28} height={0.04} position={[-1.1, 1.17, 0.3]} color={COLORS.steel} />
      <Cylinder
        radius={0.15}
        height={0.07}
        position={[-1.1, 1.21, 0.3]}
        color={COLORS.paper}
        metalness={0}
      />
      <Label at={[0, 1.8, -0.82]}>Cryostat · {props.twin.frozen.temperature} °C</Label>
      <Label at={[0, 0.5, 1]}>Unfixed tissue · biohazard precautions</Label>
    </group>
  )
}

export default function StationModel(props: InstrumentProps & { station: StationId }) {
  const { twin } = props
  const station = props.station
  let model
  if (station === 'microtomy') model = <Microtome {...props} />
  else if (station === 'embedding') model = <Embedding {...props} />
  else if (station === 'bath') model = <WaterBath {...props} />
  else if (station === 'grossing') model = <Grossing {...props} />
  else if (station === 'processing') model = <Processor {...props} />
  else if (station === 'drying') model = <Drying {...props} />
  else if (station === 'frozen') model = <Frozen {...props} />
  else if (['he', 'special', 'ihc', 'ish'].includes(station))
    model = <Staining {...props} immuno={station === 'ihc' || station === 'ish'} />
  else if (station === 'coverslip' || station === 'quality')
    model = (
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
  else
    model = (
      <group>
        <Bottle position={[-0.8, 0, 0]} scale={1.6} />
        <Bottle
          position={[0.7, 0, -0.2]}
          scale={1.2}
          color={station === 'decalcification' ? COLORS.eosin : COLORS.water}
        />
        <Box size={[1.3, 0.03, 0.8]} position={[0.9, 0.03, 0.8]} color={COLORS.paper} />
        <Label at={[-0.8, 0.67, 0.45]}>{twin.scenario.accession}</Label>
        <Label at={[0, 1.4, 0]}>
          {station === 'accessioning'
            ? 'Synthetic specimen · compare the requisition'
            : station === 'fixation'
              ? `${twin.fixation.hours} hours · ${twin.fixation.fixative}`
              : `${twin.decal.agent} · ${twin.decal.hours} hours`}
        </Label>
        {station === 'fixation' &&
          twin.regions.map((region, index) => (
            <Box
              key={index}
              size={[0.13, 0.08, 0.3]}
              position={[-0.5 + index * 0.13, 0.1, 0.9]}
              color={region.fixed > 0.6 ? COLORS.ink : COLORS.tissue}
            />
          ))}
      </group>
    )
  return (
    <>
      <Bench />
      {model}
    </>
  )
}
