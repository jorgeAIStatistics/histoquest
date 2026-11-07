import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Mesh, PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { InstrumentProps, LabSceneProps, SceneQuality, SceneStation, Vec3 } from './types'
import { STATION_NAMES } from './types'
import { cameraPreset, restoreCamera, saveCamera, type CameraPose, type ViewPreset } from './camera'
import {
  bindResourceReader,
  exposeRenderMetrics,
  getRenderMetrics,
  incrementMetric,
  recordFrameInterval,
  recordMetric,
} from './metrics'
import Overview from './Overview'
import StationModel from './Stations'
import './scene.css'

type CameraAction = { preset: ViewPreset; sequence: number }

class SceneBoundary extends Component<
  { children: ReactNode; onFallback: LabSceneProps['onFallback'] },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFallback(
      'The 3D renderer could not start. The same simulation remains available in the 2D view.',
    )
  }
  render() {
    return this.state.failed ? (
      <p role="status">3D is unavailable. Use the equivalent 2D controls.</p>
    ) : (
      this.props.children
    )
  }
}

function CameraRig({
  station,
  action,
  reducedMotion,
  manipulating,
  onSaved,
}: {
  station: SceneStation
  action: CameraAction
  reducedMotion: boolean
  manipulating: boolean
  onSaved: (text: string) => void
}) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const width = useThree((state) => state.size.width)
  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      const fov = width < 420 ? 52 : 42
      camera.setFocalLength(camera.getFilmHeight() / (2 * Math.tan((fov * Math.PI) / 360)))
      invalidate()
    }
  }, [camera, width, invalidate])
  const goal = useRef<CameraPose | null>(null)
  const previousStation = useRef(station)
  const destination = useRef(new Vector3())
  const target = useRef(new Vector3())
  useEffect(() => {
    const current = controls.current
    if (!current) return
    if (previousStation.current !== station) {
      previousStation.current = station
      goal.current = restoreCamera(station) ?? cameraPreset(station, 'front')
      onSaved('')
      invalidate()
      return
    }
    if (action.preset === 'save') {
      saveCamera(station, {
        position: camera.position.toArray() as Vec3,
        target: current.target.toArray() as Vec3,
      })
      onSaved('Camera view saved for this station in this tab.')
      return
    }
    const saved = action.preset === 'restore' ? restoreCamera(station) : null
    goal.current = saved ?? cameraPreset(station, action.preset)
    onSaved(
      action.preset === 'restore' && !saved ? 'No saved view yet; showing the front view.' : '',
    )
    invalidate()
  }, [action, station, camera, invalidate, onSaved])
  useFrame((_, delta) => {
    if (!goal.current || !controls.current) return
    destination.current.fromArray(goal.current.position)
    target.current.fromArray(goal.current.target)
    const amount = reducedMotion ? 1 : 1 - Math.exp(-delta * 8)
    camera.position.lerp(destination.current, amount)
    controls.current.target.lerp(target.current, amount)
    controls.current.update()
    if (
      camera.position.distanceTo(destination.current) < 0.005 &&
      controls.current.target.distanceTo(target.current) < 0.005
    )
      goal.current = null
    else invalidate()
  })
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!manipulating}
      enableDamping={!reducedMotion}
      dampingFactor={0.12}
      minDistance={station === 'overview' ? 9 : 2.3}
      maxDistance={station === 'overview' ? 30 : 12}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minPolarAngle={0.02}
      regress
      onStart={() => {
        goal.current = null
      }}
    />
  )
}

function RendererLifecycle({
  quality,
  onFallback,
  onAdaptiveDpr,
}: {
  quality: SceneQuality
  onFallback: LabSceneProps['onFallback']
  onAdaptiveDpr: (dpr: number) => void
}) {
  const { gl, scene, invalidate, setFrameloop } = useThree()
  const slow = useRef({ elapsed: 0, frames: 0, tier: 1.35 })
  const tracked = useRef(new WeakSet<object>())
  useEffect(() => {
    const canvas = gl.domElement
    let visible = true
    const reconcile = () => {
      setFrameloop(document.hidden || !visible ? 'never' : 'demand')
      if (!document.hidden && visible) invalidate()
    }
    const lose = (event: Event) => {
      event.preventDefault()
      incrementMetric('contextLosses')
      onFallback(
        'The graphics context was lost. Your specimen is preserved; continue in 2D or reopen 3D.',
      )
    }
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true
              reconcile()
            },
            { rootMargin: '150px' },
          )
        : null
    observer?.observe(canvas)
    canvas.addEventListener('webglcontextlost', lose)
    document.addEventListener('visibilitychange', reconcile)
    exposeRenderMetrics()
    const unbindResources = bindResourceReader(() => ({
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    }))
    incrementMetric('mounts')
    incrementMetric('activeCanvases')
    canvas.setAttribute('data-render-state', 'ready')
    reconcile()
    return () => {
      unbindResources()
      observer?.disconnect()
      canvas.removeEventListener('webglcontextlost', lose)
      document.removeEventListener('visibilitychange', reconcile)
      incrementMetric('unmounts')
      incrementMetric('activeCanvases', -1)
      if (getRenderMetrics().activeCanvases === 0)
        recordMetric({ geometries: 0, textures: 0, programs: 0 })
      // R3F owns this Canvas renderer and recursively disposes declarative resources on unmount.
    }
  }, [gl, invalidate, onFallback, setFrameloop])
  useEffect(() => {
    slow.current = { elapsed: 0, frames: 0, tier: 1.35 }
    if (quality === 'auto') onAdaptiveDpr(1.35)
  }, [quality, onAdaptiveDpr])
  useFrame((_, delta) => {
    incrementMetric('frames')
    recordFrameInterval(delta * 1000)
    recordMetric({
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    })
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      const resources = [
        object.geometry,
        ...(Array.isArray(object.material) ? object.material : [object.material]),
      ]
      resources.forEach((resource) => {
        if (tracked.current.has(resource)) return
        tracked.current.add(resource)
        resource.addEventListener('dispose', () => incrementMetric('disposedResources'))
      })
    })
    // Sample only consecutive active frames: idle demand-render gaps are not low FPS.
    if (quality === 'auto' && delta > 0 && delta < 0.15) {
      slow.current.elapsed += delta
      slow.current.frames += 1
      if (slow.current.frames >= 45) {
        if (slow.current.elapsed / slow.current.frames > 1 / 38 && slow.current.tier > 0.85) {
          slow.current.tier = Math.max(0.85, slow.current.tier - 0.2)
          onAdaptiveDpr(slow.current.tier)
        }
        slow.current.elapsed = 0
        slow.current.frames = 0
      }
    }
  })
  return null
}

export default function LabScene(props: LabSceneProps) {
  const { station, quality, reducedMotion, onFallback, onStationSelect } = props
  const [action, setAction] = useState<CameraAction>({ preset: 'front', sequence: 0 })
  const [manipulating, setManipulating] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('')
  const [embeddingGesture, setEmbeddingGesture] =
    useState<InstrumentProps['embeddingGesture']>('translate')
  const [bottleRotation, setBottleRotation] = useState(0)
  const [selectedPieceId, setSelectedPieceId] = useState('')
  const [adaptiveDpr, setAdaptiveDpr] = useState(1.35)
  const dprCap =
    quality === 'low' ? 1 : quality === 'medium' ? 1.4 : quality === 'high' ? 1.75 : adaptiveDpr
  const activePieceId = props.twin.embedding.pieces.some((piece) => piece.id === selectedPieceId)
    ? selectedPieceId
    : props.twin.embedding.pieces[0]?.id
  const fallbackRef = useRef(onFallback)
  useEffect(() => {
    fallbackRef.current = onFallback
  }, [onFallback])
  const stableFallback = useCallback((reason: string) => fallbackRef.current(reason), [])
  const title = station === 'overview' ? 'Virtual histology laboratory' : STATION_NAMES[station]
  return (
    <div className="lab-scene" data-scene-station={station}>
      <div className="scene-toolbar" role="group" aria-label="3D camera views">
        <span className="scene-render-label">3D teaching model</span>
        {(['front', 'detail', 'top', 'save', 'restore'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            className="scene-camera-button"
            onClick={() => setAction((previous) => ({ preset, sequence: previous.sequence + 1 }))}
          >
            {
              {
                front: 'Front',
                detail: 'Detail',
                top: 'Top',
                save: 'Save view',
                restore: 'Restore view',
              }[preset]
            }
          </button>
        ))}
      </div>
      {station === 'embedding' && (
        <div className="scene-task-tools" role="group" aria-label="Tissue manipulation mode">
          {!!props.twin.embedding.pieces.length && (
            <label className="scene-piece-picker">
              Piece{' '}
              <select
                aria-label="Selected tissue piece"
                value={activePieceId}
                onChange={(event) => setSelectedPieceId(event.target.value)}
              >
                {props.twin.embedding.pieces.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span>Drag tissue to</span>
          {(
            [
              ['translate', 'Move X/Y'],
              ['height', 'Move Z'],
              ['rx', 'Rotate X'],
              ['ry', 'Rotate Y'],
              ['rz', 'Rotate Z'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className="scene-camera-button"
              aria-pressed={embeddingGesture === mode}
              onClick={() => setEmbeddingGesture(mode)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {station === 'accessioning' && (
        <div className="scene-task-tools">
          <button
            type="button"
            className="scene-camera-button"
            onClick={() => setBottleRotation((angle) => angle + Math.PI / 2)}
          >
            Rotate specimen bottle
          </button>
          <span>View only · compare the label with the requisition below.</span>
        </div>
      )}
      <div className="lab-scene-viewport" aria-label={`${title}, interactive 3D teaching model`}>
        <SceneBoundary onFallback={stableFallback}>
          <Canvas
            frameloop="demand"
            shadows={quality === 'low' ? false : 'percentage'}
            dpr={Math.min(window.devicePixelRatio || 1, dprCap)}
            camera={{
              position: station === 'overview' ? [12, 12, 16] : [4.3, 3, 5.8],
              fov: 42,
              near: 0.1,
              far: 70,
            }}
            gl={{ antialias: quality !== 'low', powerPreference: 'default', alpha: false }}
            fallback={<p>Your browser could not display the canvas. Use the equivalent 2D view.</p>}
            aria-label={`${title}. Use the camera buttons and the equivalent controls below for keyboard operation.`}
          >
            <color attach="background" args={['#e4e5df']} />
            <hemisphereLight args={['#fff8e9', '#5c7379', 2]} />
            <directionalLight
              position={[3, 7, 4]}
              intensity={2.4}
              castShadow={quality !== 'low'}
              shadow-mapSize={[quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024]}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[-4, 3, -2]} intensity={0.9} color="#d5e2ec" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.68, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#d4d5ce" roughness={0.95} />
            </mesh>
            <CameraRig
              station={station}
              action={action}
              reducedMotion={reducedMotion}
              manipulating={manipulating}
              onSaved={setCameraStatus}
            />
            <RendererLifecycle
              quality={quality}
              onFallback={stableFallback}
              onAdaptiveDpr={setAdaptiveDpr}
            />
            {station === 'overview' ? (
              <Overview onStationSelect={onStationSelect} />
            ) : (
              <StationModel
                {...props}
                station={station}
                onManipulating={setManipulating}
                embeddingGesture={embeddingGesture}
                selectedPieceId={activePieceId}
                onPieceSelect={setSelectedPieceId}
                bottleRotation={bottleRotation}
              />
            )}
          </Canvas>
        </SceneBoundary>
      </div>
      <div className="scene-caption">
        {station === 'embedding' && (
          <p>
            Choose a piece and a manipulation mode, then drag that tissue. Use the six numerical
            controls below to set its pose with the keyboard.
          </p>
        )}
        {station === 'fixation' && (
          <p>
            Colored cutaways show separate model fields from the surface toward the center. Fixative
            access does not imply a completed fixation reaction.
          </p>
        )}
        <p>
          {station === 'overview'
            ? 'Select a station to enter. Each scene shares its specimen with the procedure controls.'
            : 'Drag the background to orbit; pinch or scroll to zoom. Camera views and procedure controls provide the keyboard path.'}
        </p>
        <span role="status" aria-live="polite">
          {cameraStatus}
        </span>
      </div>
    </div>
  )
}
