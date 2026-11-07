import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Mesh, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { LabSceneProps, SceneQuality, SceneStation, Vec3 } from './types'
import { STATION_NAMES } from './types'
import { cameraPreset, restoreCamera, saveCamera, type CameraPose, type ViewPreset } from './camera'
import { exposeRenderMetrics, getRenderMetrics, incrementMetric, recordMetric } from './metrics'
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
}: {
  quality: SceneQuality
  onFallback: LabSceneProps['onFallback']
}) {
  const { gl, scene, invalidate, setFrameloop, setDpr } = useThree()
  const slow = useRef({ elapsed: 0, frames: 0, tier: 1.35 })
  const tracked = useRef(new WeakSet<object>())
  useEffect(() => {
    const canvas = gl.domElement
    const viewport = canvas.closest('.lab-scene-viewport')
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
    const skip = (event: Event) => {
      visible = !(event as Event & { skipped: boolean }).skipped
      reconcile()
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
    viewport?.addEventListener('contentvisibilityautostatechange', skip)
    exposeRenderMetrics()
    incrementMetric('mounts')
    incrementMetric('activeCanvases')
    canvas.setAttribute('data-render-state', 'ready')
    reconcile()
    return () => {
      observer?.disconnect()
      canvas.removeEventListener('webglcontextlost', lose)
      document.removeEventListener('visibilitychange', reconcile)
      viewport?.removeEventListener('contentvisibilityautostatechange', skip)
      incrementMetric('unmounts')
      incrementMetric('activeCanvases', -1)
      if (getRenderMetrics().activeCanvases === 0)
        recordMetric({ geometries: 0, textures: 0, programs: 0 })
      // R3F owns this Canvas renderer and recursively disposes declarative resources on unmount.
    }
  }, [gl, invalidate, onFallback, setFrameloop])
  useEffect(() => {
    const maximum =
      quality === 'low' ? 1 : quality === 'high' ? 1.75 : quality === 'medium' ? 1.4 : 1.35
    slow.current = { elapsed: 0, frames: 0, tier: maximum }
    setDpr(Math.min(window.devicePixelRatio || 1, maximum))
  }, [quality, setDpr])
  useFrame((_, delta) => {
    incrementMetric('frames')
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
          setDpr(Math.min(window.devicePixelRatio || 1, slow.current.tier))
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
      <div className="lab-scene-viewport" aria-label={`${title}, interactive 3D teaching model`}>
        <SceneBoundary onFallback={stableFallback}>
          <Canvas
            frameloop="demand"
            shadows={quality === 'low' ? false : 'percentage'}
            dpr={1.25}
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
            <RendererLifecycle quality={quality} onFallback={stableFallback} />
            {station === 'overview' ? (
              <Overview onStationSelect={onStationSelect} />
            ) : (
              <StationModel {...props} station={station} onManipulating={setManipulating} />
            )}
          </Canvas>
        </SceneBoundary>
      </div>
      <div className="scene-caption">
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
