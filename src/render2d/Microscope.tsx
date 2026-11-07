import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { SlideAppearance } from '../sim/specimen/types'
import { FIELD_HEIGHT_UM, FIELD_WIDTH_UM } from '../sim/specimen/phenotype'
import { OPTICS_PROVENANCE } from '../sim/models/optics'
import { createSlideField, describeSlide } from './field'
import type { OpticalView } from './field'
import { createWebGLPresenter, present2D } from './presenter'
import type { Presenter } from './presenter'
import {
  clampCenter,
  measureMicrometers,
  paintTiles,
  screenToWorld,
  TEACHING_OBJECTIVES,
  TileCache,
  viewportAt,
} from './tiles'
import type { Point, TeachingObjective } from './tiles'
import './microscope.css'

export interface MicroscopeAnnotation {
  id: string
  seed: string
  point: Point
  text: string
}
export interface MicroscopeMeasurement {
  id: string
  seed: string
  start: Point
  end: Point
}
export interface MicroscopeProps {
  appearance: SlideAppearance
  ideal?: SlideAppearance
  /** Useful for low-power devices and fallback verification; does not change the model. */
  force2D?: boolean
  initialCompare?: boolean
}
type Tool = 'pan' | 'measure' | 'annotate'
const ASPECT = 1.6

function Arrow({ direction }: { direction: 'up' | 'right' | 'down' | 'left' }) {
  const rotate = { up: 0, right: 90, down: 180, left: 270 }[direction]
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M10 16V4m-5 5 5-5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface PanelProps {
  appearance: SlideAppearance
  title: string
  center: Point
  objective: TeachingObjective
  optical: OpticalView
  focus: number
  force2D: boolean
  annotations: MicroscopeAnnotation[]
  measurements: MicroscopeMeasurement[]
  pending: Point | null
  tool: Tool
  onMove: (point: Point) => void
  onMark: (point: Point) => void
}

function SlidePanel({
  appearance,
  title,
  center,
  objective,
  optical,
  focus,
  force2D,
  annotations,
  measurements,
  pending,
  tool,
  onMove,
  onMark,
}: PanelProps) {
  const panel = useRef<HTMLDivElement>(null)
  const gpu = useRef<HTMLCanvasElement>(null)
  const cpu = useRef<HTMLCanvasElement>(null)
  const presenter = useRef<Presenter | null>(null)
  const source = useRef<HTMLCanvasElement | null>(null)
  const focusValue = useRef(focus)
  const [cache] = useState(() => new TileCache())
  const [width, setWidth] = useState(800)
  const [backend, setBackend] = useState<'webgl2' | '2d'>('2d')
  const [completion, setCompletion] = useState<{ key: string; status: 'ready' | 'unavailable' }>({
    key: '',
    status: 'ready',
  })
  const [fallbackReason, setFallbackReason] = useState('')
  const appearanceKey = JSON.stringify(appearance)
  const opticalKey = JSON.stringify(optical)
  const field = useMemo(
    () => createSlideField(JSON.parse(appearanceKey) as SlideAppearance),
    [appearanceKey],
  )
  const view = useMemo(() => JSON.parse(opticalKey) as OpticalView, [opticalKey])
  const viewport = useMemo(() => viewportAt(center, objective, ASPECT), [center, objective])
  const resolution = Math.max(
    240,
    Math.round(Math.min(force2D || backend === '2d' ? 640 : 1100, width)),
  )
  const resolutionHeight = Math.round(resolution / ASPECT)
  const renderKey = `${appearanceKey}:${opticalKey}:${JSON.stringify(viewport)}:${resolution}`
  const status = completion.key === renderKey ? completion.status : 'rendering'
  const drag = useRef<{ pointerId: number; x: number; y: number; center: Point } | null>(null)
  const descriptionId = useId()

  useEffect(() => {
    if (!panel.current) return
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.round(entries[0].contentRect.width)),
    )
    observer.observe(panel.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = gpu.current
    if (!canvas || force2D) {
      setBackend('2d')
      setFallbackReason(force2D ? 'Compatible 2D mode selected.' : 'WebGL2 is unavailable.')
      return
    }
    const install = () => {
      presenter.current = createWebGLPresenter(canvas)
      setBackend(presenter.current ? 'webgl2' : '2d')
      setFallbackReason(
        presenter.current
          ? ''
          : 'WebGL2 is unavailable; the same tissue field is rendered at a lower resolution.',
      )
      if (presenter.current && source.current)
        presenter.current.draw(source.current, focusValue.current)
    }
    const lost = (event: Event) => {
      event.preventDefault()
      presenter.current?.dispose()
      presenter.current = null
      setBackend('2d')
      setFallbackReason('The graphics context was lost. The compatible 2D view remains available.')
      if (source.current && cpu.current) present2D(cpu.current, source.current, focusValue.current)
    }
    install()
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', install)
    return () => {
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', install)
      presenter.current?.dispose()
      presenter.current = null
    }
  }, [force2D])

  useEffect(() => {
    const controller = new AbortController()
    const next = document.createElement('canvas')
    next.width = resolution
    next.height = resolutionHeight
    void paintTiles(next, field, view, viewport, cache, controller.signal)
      .then((finished) => {
        if (controller.signal.aborted) return
        if (!finished) {
          setCompletion({ key: renderKey, status: 'unavailable' })
          return
        }
        source.current = next
        if (cpu.current) present2D(cpu.current, next, focusValue.current)
        presenter.current?.draw(next, focusValue.current)
        setCompletion({ key: renderKey, status: 'ready' })
      })
      .catch(() => {
        if (!controller.signal.aborted) setCompletion({ key: renderKey, status: 'unavailable' })
      })
    return () => controller.abort()
  }, [field, view, viewport, cache, resolution, resolutionHeight, renderKey])

  useEffect(() => {
    focusValue.current = focus
    if (!source.current) return
    if (cpu.current) present2D(cpu.current, source.current, focus)
    presenter.current?.draw(source.current, focus)
  }, [focus])

  useEffect(
    () => () => {
      cache.clear()
      source.current = null
    },
    [cache],
  )

  const pointAt = (event: PointerEvent<HTMLDivElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return screenToWorld(
      { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      viewport,
      bounds.width,
      bounds.height,
    )
  }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (tool !== 'pan') {
      onMark(pointAt(event))
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, center }
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    const bounds = event.currentTarget.getBoundingClientRect()
    onMove({
      x: active.center.x - ((event.clientX - active.x) / bounds.width) * viewport.width,
      y: active.center.y - ((event.clientY - active.y) / bounds.height) * viewport.height,
    })
  }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = viewport.width * (event.shiftKey ? 0.25 : 0.08)
    const directions: Record<string, Point> = {
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
    }
    if (directions[event.key]) {
      event.preventDefault()
      onMove({ x: center.x + directions[event.key].x, y: center.y + directions[event.key].y })
    }
    if ((event.key === 'Enter' || event.key === ' ') && tool !== 'pan') {
      event.preventDefault()
      onMark(center)
    }
  }
  const relative = (point: Point) => ({
    x: ((point.x - viewport.x) / viewport.width) * 1000,
    y: ((point.y - viewport.y) / viewport.height) * 625,
  })
  const markScale = Math.max(1, 1000 / width)
  const scaleUm = objective <= 4 ? 200 : objective <= 10 ? 50 : objective <= 20 ? 20 : 10
  const scalePercent = (scaleUm / viewport.width) * 100
  return (
    <section
      className="microscope-panel"
      data-render-state={status}
      data-renderer={backend}
      aria-label={`${title}, simulated ${appearance.family} slide`}
    >
      <div className="microscope-panel-heading">
        <strong>{title}</strong>
        <span>
          {status === 'rendering'
            ? 'Rendering tissue…'
            : status === 'unavailable'
              ? 'Image unavailable'
              : `${objective}× teaching view`}
        </span>
      </div>
      <div
        className={`microscope-field microscope-tool-${tool}`}
        ref={panel}
        role="img"
        tabIndex={0}
        aria-label={`Simulated slide: ${appearance.family}. ${title}. ${objective} times teaching magnification.`}
        aria-describedby={descriptionId}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
        onKeyDown={keyDown}
      >
        <canvas
          ref={gpu}
          width={resolution}
          height={resolutionHeight}
          hidden={backend !== 'webgl2'}
          aria-hidden="true"
        />
        <canvas
          ref={cpu}
          width={resolution}
          height={resolutionHeight}
          hidden={backend !== '2d'}
          aria-hidden="true"
        />
        <svg
          className="microscope-marks"
          viewBox="0 0 1000 625"
          aria-hidden="true"
          style={{ fontSize: `${13 * markScale}px` }}
        >
          <path className="microscope-crosshair" d="M488 312.5h24m-12-12v24" />
          {measurements.map((measurement, index) => {
            const a = relative(measurement.start)
            const b = relative(measurement.end)
            return (
              <g key={measurement.id}>
                <path className="microscope-measure-line" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} />
                <circle cx={a.x} cy={a.y} r="3" />
                <circle cx={b.x} cy={b.y} r="3" />
                <text x={(a.x + b.x) / 2 + 6} y={(a.y + b.y) / 2 - 8}>
                  {index + 1}: {measureMicrometers(measurement.start, measurement.end).toFixed(1)}{' '}
                  µm
                </text>
              </g>
            )
          })}
          {annotations.map((annotation, index) => {
            const p = relative(annotation.point)
            return (
              <g key={annotation.id}>
                <circle
                  className="microscope-annotation-dot"
                  cx={p.x}
                  cy={p.y}
                  r={11 * markScale}
                />
                <text className="microscope-annotation-number" x={p.x} y={p.y + 4 * markScale}>
                  {index + 1}
                </text>
              </g>
            )
          })}
          {pending && (
            <circle
              className="microscope-pending"
              cx={relative(pending).x}
              cy={relative(pending).y}
              r="7"
            />
          )}
        </svg>
        <div className="microscope-scale" style={{ width: `${scalePercent}%` }}>
          <span>{scaleUm} µm</span>
        </div>
        {status === 'unavailable' && (
          <p className="microscope-image-error">
            This device could not draw the field. The complete slide description is available below.
          </p>
        )}
      </div>
      <p className="microscope-field-caption" id={descriptionId}>
        Simulated slide · scale in authored model micrometers. Arrow keys pan; Shift moves farther.{' '}
        {tool !== 'pan' ? 'Enter marks the center.' : 'Drag to explore.'}
      </p>
      {fallbackReason && <p className="microscope-backend-note">{fallbackReason}</p>}
    </section>
  )
}

/** Lazy-load from consuming routes: no graphics dependency enters the app shell. */
export default function Microscope({
  appearance,
  ideal,
  force2D = false,
  initialCompare = false,
}: MicroscopeProps) {
  const id = useId()
  const [objective, setObjective] = useState<TeachingObjective>(2)
  const [center, setCenter] = useState<Point>({ x: 1000, y: 750 })
  const [focus, setFocus] = useState(0)
  const [illumination, setIllumination] = useState(1)
  const [condenser, setCondenser] = useState(0.8)
  const [polarization, setPolarization] = useState(0)
  const [fluorescenceChannel, setFluorescenceChannel] =
    useState<NonNullable<OpticalView['fluorescenceChannel']>>('composite')
  const [compare, setCompare] = useState(initialCompare)
  const [compatible, setCompatible] = useState(force2D)
  const [tool, setTool] = useState<Tool>('pan')
  const [label, setLabel] = useState('')
  const [annotations, setAnnotations] = useState<MicroscopeAnnotation[]>([])
  const [measurements, setMeasurements] = useState<MicroscopeMeasurement[]>([])
  const [pending, setPending] = useState<{ seed: string; point: Point } | null>(null)
  const [markStatus, setMarkStatus] = useState('')
  const annotationsForSlide = annotations.filter((entry) => entry.seed === appearance.seed)
  const measurementsForSlide = measurements.filter((entry) => entry.seed === appearance.seed)
  const pendingPoint = pending?.seed === appearance.seed ? pending.point : null
  const optical = useMemo(
    () => ({ illumination, condenser, polarization, fluorescenceChannel }),
    [illumination, condenser, polarization, fluorescenceChannel],
  )
  const viewport = viewportAt(center, objective, ASPECT)
  const move = (next: Point) => setCenter(clampCenter(next, objective, ASPECT))
  const zoom = (next: TeachingObjective) => {
    setObjective(next)
    setCenter((old) => clampCenter(old, next, ASPECT))
  }
  const mark = (point: Point) => {
    if (point.x < 0 || point.x > FIELD_WIDTH_UM || point.y < 0 || point.y > FIELD_HEIGHT_UM) {
      setMarkStatus('Move into the synthetic field before placing a mark.')
      return
    }
    if (tool === 'measure') {
      if (!pendingPoint) {
        setPending({ seed: appearance.seed, point })
        setMarkStatus('First endpoint placed. Pan or click to place the second endpoint.')
      } else {
        const distance = measureMicrometers(pendingPoint, point)
        setMeasurements((old) => [
          ...old,
          { id: crypto.randomUUID(), seed: appearance.seed, start: pendingPoint, end: point },
        ])
        setPending(null)
        setMarkStatus(`Measured ${distance.toFixed(1)} model micrometers.`)
      }
    }
    if (tool === 'annotate') {
      if (!label.trim()) {
        setMarkStatus('Enter an annotation label before placing its mark.')
        return
      }
      setAnnotations((old) => [
        ...old,
        { id: crypto.randomUUID(), seed: appearance.seed, point, text: label.trim().slice(0, 160) },
      ])
      setMarkStatus(`Placed annotation: ${label.trim()}`)
      setLabel('')
    }
  }
  const pan = (dx: number, dy: number) =>
    move({ x: center.x + dx * viewport.width * 0.12, y: center.y + dy * viewport.height * 0.12 })
  const clearMarks = () => {
    setAnnotations((old) => old.filter((entry) => entry.seed !== appearance.seed))
    setMeasurements((old) => old.filter((entry) => entry.seed !== appearance.seed))
    setPending(null)
    setMarkStatus('Marks cleared for this slide.')
  }
  return (
    <section className="microscope" aria-labelledby={`${id}-title`}>
      <header className="microscope-heading">
        <div>
          <h3 id={`${id}-title`}>Simulated slide</h3>
          <p>
            {appearance.fluorescence
              ? 'Synthetic fluorescence · additive pseudocolor, not measured photon counts.'
              : 'Explore the tissue your decisions produced.'}
          </p>
        </div>
        <span className="microscope-family">{appearance.family} · procedural teaching field</span>
      </header>
      <div className="microscope-toolbar">
        {appearance.fluorescence && (
          <label>
            Fluorescence channel
            <select
              className="input"
              value={fluorescenceChannel}
              onChange={(e) =>
                setFluorescenceChannel(
                  e.target.value as NonNullable<OpticalView['fluorescenceChannel']>,
                )
              }
            >
              <option value="composite">Composite</option>
              <option value="probe">Probe only · green</option>
              <option value="nuclear">Nuclear counterstain only · blue</option>
              {appearance.fluorescence.secondary && (
                <>
                  <option value="primary">Target A only · green</option>
                  <option value="secondary">Target B only · red</option>
                </>
              )}
            </select>
          </label>
        )}
        <fieldset className="microscope-objectives">
          <legend>Teaching magnification</legend>
          <div>
            {TEACHING_OBJECTIVES.map((value) => (
              <label key={value} className={objective === value ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name={`${id}-objective`}
                  value={value}
                  checked={objective === value}
                  onChange={() => zoom(value)}
                />
                {value}×
              </label>
            ))}
          </div>
        </fieldset>
        <div className="microscope-pan" role="group" aria-label="Move the field">
          <button type="button" onClick={() => pan(0, -1)} aria-label="Pan up">
            <Arrow direction="up" />
          </button>
          <button type="button" onClick={() => pan(-1, 0)} aria-label="Pan left">
            <Arrow direction="left" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCenter({ x: 1000, y: 750 })
              setObjective(2)
              setFocus(0)
            }}
          >
            Overview
          </button>
          <button type="button" onClick={() => pan(1, 0)} aria-label="Pan right">
            <Arrow direction="right" />
          </button>
          <button type="button" onClick={() => pan(0, 1)} aria-label="Pan down">
            <Arrow direction="down" />
          </button>
        </div>
        {ideal && (
          <label className="microscope-checkbox">
            <input
              type="checkbox"
              checked={compare}
              onChange={(event) => setCompare(event.target.checked)}
            />{' '}
            Compare reference
          </label>
        )}
      </div>
      <div className={`microscope-panels${compare && ideal ? ' is-comparing' : ''}`}>
        <SlidePanel
          appearance={appearance}
          title="Your section"
          center={center}
          objective={objective}
          optical={optical}
          focus={focus}
          force2D={force2D || compatible}
          annotations={annotationsForSlide}
          measurements={measurementsForSlide}
          pending={pendingPoint}
          tool={tool}
          onMove={move}
          onMark={mark}
        />
        {compare && ideal && (
          <SlidePanel
            appearance={ideal}
            title="Reference section"
            center={center}
            objective={objective}
            optical={optical}
            focus={focus}
            force2D={force2D || compatible}
            annotations={annotationsForSlide}
            measurements={measurementsForSlide}
            pending={pendingPoint}
            tool={tool}
            onMove={move}
            onMark={mark}
          />
        )}
      </div>
      <div className="microscope-optics" role="group" aria-label="Microscope optics">
        <label htmlFor={`${id}-focus`}>
          Focus{' '}
          <output>{focus === 0 ? 'In focus' : `${focus > 0 ? '+' : ''}${focus.toFixed(1)}`}</output>
          <input
            id={`${id}-focus`}
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={focus}
            onChange={(event) => setFocus(Number(event.target.value))}
          />
        </label>
        <label htmlFor={`${id}-light`}>
          {appearance.fluorescence ? 'Display gain' : 'Illumination'}{' '}
          <output>{Math.round(illumination * 100)}%</output>
          <input
            id={`${id}-light`}
            type="range"
            min="0.4"
            max="1.1"
            step="0.05"
            value={illumination}
            onChange={(event) => setIllumination(Number(event.target.value))}
          />
        </label>
        <label htmlFor={`${id}-condenser`}>
          Condenser <output>{Math.round(condenser * 100)}%</output>
          <input
            id={`${id}-condenser`}
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={condenser}
            disabled={!!appearance.fluorescence}
            onChange={(event) => setCondenser(Number(event.target.value))}
          />
        </label>
        <label htmlFor={`${id}-polarization`}>
          Crossed polarization <output>{Math.round(polarization * 100)}%</output>
          <input
            id={`${id}-polarization`}
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={polarization}
            disabled={!!appearance.fluorescence}
            onChange={(event) => setPolarization(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="microscope-tools">
        <fieldset>
          <legend>Inspect and mark</legend>
          <div className="microscope-tool-choices">
            {(['pan', 'measure', 'annotate'] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name={`${id}-tool`}
                  checked={tool === value}
                  onChange={() => {
                    setTool(value)
                    setPending(null)
                    setMarkStatus('')
                  }}
                />
                {value === 'pan' ? 'Pan' : value === 'measure' ? 'Measure' : 'Annotate'}
              </label>
            ))}
          </div>
        </fieldset>
        {tool === 'annotate' && (
          <label className="microscope-label-input" htmlFor={`${id}-annotation`}>
            Annotation label
            <input
              id={`${id}-annotation`}
              type="text"
              maxLength={160}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Folded tissue edge"
            />
          </label>
        )}
        {tool !== 'pan' && (
          <button type="button" onClick={() => mark(center)}>
            {tool === 'measure'
              ? pendingPoint
                ? 'Place second point at center'
                : 'Place first point at center'
              : 'Place annotation at center'}
          </button>
        )}
        {(annotationsForSlide.length > 0 || measurementsForSlide.length > 0 || pendingPoint) && (
          <button type="button" onClick={clearMarks}>
            Clear marks
          </button>
        )}
        <span className="microscope-position">
          Center {Math.round(center.x)}, {Math.round(center.y)} µm
        </span>
      </div>
      <p className="microscope-mark-status" role="status">
        {markStatus ||
          (tool === 'measure'
            ? 'Choose two points on the field, or use the center-point button and pan controls.'
            : tool === 'annotate'
              ? 'Enter a label, then select a point on the field.'
              : 'Measurements use synthetic model coordinates, not a calibrated specimen or monitor.')}
      </p>
      {(annotationsForSlide.length > 0 || measurementsForSlide.length > 0) && (
        <div className="microscope-mark-list">
          <h4>Field notes</h4>
          <ol>
            {annotationsForSlide.map((annotation) => (
              <li key={annotation.id}>
                {annotation.text}{' '}
                <span>
                  at {annotation.point.x.toFixed(0)}, {annotation.point.y.toFixed(0)} µm
                </span>
              </li>
            ))}
          </ol>
          <ol>
            {measurementsForSlide.map((measurement) => (
              <li key={measurement.id}>
                Measurement: {measureMicrometers(measurement.start, measurement.end).toFixed(1)} µm{' '}
                <span>in the synthetic field</span>
              </li>
            ))}
          </ol>
          <p>Marks stay in this viewer while it remains open.</p>
        </div>
      )}
      <details className="microscope-description">
        <summary>Read the slide and model limits</summary>
        <ul>
          {describeSlide(appearance).map((description) => (
            <li key={description}>{description}</li>
          ))}
        </ul>
        <p>
          This is a procedural teaching rendering, not a micrograph. The objective presets control
          the model field of view; they are not calibrated optical magnification. The whole authored
          field spans {FIELD_WIDTH_UM} × {FIELD_HEIGHT_UM} model µm. Tissue geometry and artifact
          intensity are qualitative approximations. Polarization is an illustrative cue, not a
          measured retardance model.
        </p>
        <p>
          H/E/DAB colors use{' '}
          <a href={OPTICS_PROVENANCE.url} target="_blank" rel="noreferrer">
            published RGB absorbance presets
          </a>{' '}
          with Beer–Lambert transmission. Special-stain vectors are authored approximations. DAB
          intensity does not quantify antigen concentration.
        </p>
        <label className="microscope-checkbox">
          <input
            type="checkbox"
            checked={force2D || compatible}
            disabled={force2D}
            onChange={(event) => setCompatible(event.target.checked)}
          />{' '}
          Use compatible 2D rendering
        </label>
        <p>
          Both modes sample the same cached CPU tissue tiles. WebGL2 presents the image and focus
          effect; compatible mode uses a lower-resolution canvas.
        </p>
      </details>
    </section>
  )
}

export { Microscope }
