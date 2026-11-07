import { useId, useMemo, useState } from 'react'
import { representation, updateBlockFace } from '../../sim/models/sectioning'
import type { Twin } from '../../sim/specimen/types'
export default function EmbeddingPrediction({ twin }: { twin: Twin }) {
  const id = useId()
  const [additionalDepth, setAdditionalDepth] = useState(0)
  const preview = useMemo(() => {
    const next = structuredClone(twin)
    next.block.trimmed += Math.min(additionalDepth, twin.block.remaining)
    next.embedding.representation = representation(next)
    updateBlockFace(next)
    return next
  }, [twin, additionalDepth])
  const side = Math.round(Math.sqrt(preview.block.face.length))
  const max = Math.max(1, ...preview.block.face)
  return (
    <section className="embedding-prediction">
      <h3>Preview a deeper cutting plane</h3>
      <p>
        Inspect the modeled plane before consuming tissue. Pieces at different depths or tilts can
        enter the plane at different times; reaching one piece may spend material from another.
      </p>
      <label htmlFor={id}>
        Additional facing depth:{' '}
        <output htmlFor={id}>{Math.min(additionalDepth, twin.block.remaining)} µm</output>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={Math.max(0, twin.block.remaining)}
        step={1}
        value={Math.min(additionalDepth, twin.block.remaining)}
        onChange={(e) => setAdditionalDepth(Number(e.target.value))}
      />
      <svg
        viewBox={`0 0 ${side * 24} ${side * 24}`}
        width="180"
        height="180"
        role="img"
        aria-label={`Predicted face at ${preview.block.trimmed} micrometers depth; ${Math.round(preview.embedding.representation * 100)} percent geometric plane representation. Darker cells contain more remaining tissue.`}
      >
        {preview.block.face.map((value, index) => (
          <g key={index}>
            <rect
              x={(index % side) * 24 + 1}
              y={Math.floor(index / side) * 24 + 1}
              width={22}
              height={22}
              fill={value > 0 ? 'var(--hema)' : 'var(--vellum)'}
              fillOpacity={value > 0 ? 0.25 + (0.75 * value) / max : 1}
              stroke="var(--rule)"
            />
            <text
              x={(index % side) * 24 + 12}
              y={Math.floor(index / side) * 24 + 15}
              textAnchor="middle"
              fontSize={7}
              fill={value / max > 0.4 ? 'var(--paper)' : 'var(--ink)'}
            >
              {value > 0 ? Math.round(value) : '—'}
            </text>
          </g>
        ))}
      </svg>
      <p className="small">
        Cell labels show synthetic remaining depth in µm. This is a coarse geometric heightfield,
        not a calibrated tissue measurement. Moving this preview does not trim the real practice
        block.
      </p>
    </section>
  )
}
