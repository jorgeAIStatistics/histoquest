import { average } from '../../sim/core/units'
import type { Twin } from '../../sim/specimen/types'
import type { StationId } from '../../sim/core/events'
import { STATION_BY_ID } from './stations'
export default function TwoDStation({
  twin: t,
  station,
}: {
  twin: Twin
  station: StationId | 'overview'
}) {
  const last = t.block.sections.at(-1)
  const label = station === 'overview' ? 'Specimen journey' : STATION_BY_ID[station].label
  return (
    <div className="lab-2d-stage">
      <div className="lab-stage-label">
        <span>2D work surface</span>
        <strong>{label}</strong>
      </div>
      <svg viewBox="0 0 800 400" role="img" aria-labelledby="specimen-state-title">
        <title id="specimen-state-title">
          {label}. {t.gross.fragments} pieces; fixation {Math.round(t.fixation.crosslink * 100)}{' '}
          percent; wax support {Math.round(average(t.regions.map((r) => r.wax)) * 100)} percent;{' '}
          {t.block.sections.length} sections.
        </title>
        <defs>
          <linearGradient id="stageWax" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f9ead0" />
            <stop offset="1" stopColor="#d4bc91" />
          </linearGradient>
        </defs>
        <path d="M90 295 400 355 710 295 400 235Z" fill="var(--vellum)" stroke="var(--rule)" />
        <g transform="translate(140 80)">
          <rect
            width="160"
            height="190"
            rx="28"
            fill="var(--paper)"
            stroke="var(--ink-3)"
            strokeWidth="2"
          />
          <rect x="-7" y="-10" width="174" height="30" rx="8" fill="var(--hema)" />
          <rect x="12" y="70" width="136" height="105" rx="12" fill="var(--hema-soft)" />
          {t.regions.map((r, i) => (
            <rect
              key={i}
              x={25 + i * 12}
              y="105"
              width="12"
              height="38"
              fill={`hsl(335 45% ${78 - r.fixed * 35}%)`}
            />
          ))}
          <text x="80" y="50" textAnchor="middle" fontSize="13" fill="var(--ink)">
            {t.scenario.accession}
          </text>
        </g>
        <g transform="translate(355 120)">
          <path
            d="M0 30 75 0 165 30 165 140 75 170 0 140Z"
            fill="url(#stageWax)"
            stroke="#aa9270"
          />
          <path d="M0 30 75 60 165 30M75 60v110" fill="none" stroke="#aa9270" />
          {t.embedding.pieces.map((p, i) => (
            <ellipse
              key={p.id}
              cx={30 + (i % 3) * 32}
              cy={88 + Math.floor(i / 3) * 12}
              rx={12}
              ry={5 + Math.abs(p.rx) / 10}
              transform={`rotate(${p.rz} ${30 + (i % 3) * 32} 88)`}
              fill="var(--eosin)"
            />
          ))}
        </g>
        <g transform="translate(575 180) rotate(-15)">
          <rect width="150" height="75" rx="4" fill="var(--paper)" stroke="var(--teal)" />
          <rect x="4" y="4" width="30" height="67" fill="var(--hema-soft)" />
          {last && (
            <ellipse
              cx="94"
              cy="38"
              rx="29"
              ry={16 * (1 - last.compression)}
              fill={t.staining.hematoxylin ? 'var(--eosin-soft)' : '#e9d6ab'}
              stroke="var(--hema)"
            />
          )}
        </g>
      </svg>
      <div className="lab-field-strip">
        <div>
          <span>
            {t.frozen.prepared
              ? 'Frozen support — not chemical fixation'
              : 'Fixed tissue, surface → center'}
          </span>
          <div className="depth-field">
            {t.regions.map((r, i) => (
              <span
                key={i}
                style={{ background: `hsl(265 38% ${88 - r.fixed * 52}%)` }}
                title={`${Math.round(r.depth * 100)}% depth: ${Math.round(r.fixed * 100)}% fixed`}
              />
            ))}
          </div>
        </div>
        <div>
          <span>Exchange field</span>
          <p>
            Water {Math.round(average(t.regions.map((r) => r.water)) * 100)}% · wax{' '}
            {Math.round(average(t.regions.map((r) => r.wax)) * 100)}%
          </p>
        </div>
      </div>
      <p className="small muted">
        The same specimen and events drive both work surfaces. Use the station controls for
        keyboard, touch or pointer actions.
      </p>
    </div>
  )
}
