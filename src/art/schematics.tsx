import type { ReactNode } from 'react'
import type { SCHEMATIC_KEYS } from '../content/schema'
import { rng } from '../engine/random'

type Key = (typeof SCHEMATIC_KEYS)[number]

/** A ribbon-section base: a pink tissue section on a slide-coloured field. */
function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label={`${label}. Schematic drawing, not a photomicrograph.`}>
      <rect x="0" y="0" width="320" height="180" rx="10" fill="var(--paper)" />
      {children}
      <text x="12" y="170" fontSize="10" fill="var(--ink-3)">Schematic · not a micrograph</text>
    </svg>
  )
}

const section = 'M40 40h240v100H40z'

const nuclei = (seed = 0) => {
  const r = rng(seed + 7)
  return Array.from({ length: 34 }, (_, i) => <circle key={i} cx={50 + r() * 220} cy={50 + r() * 82} r={2.2 + r() * 1.2} fill="var(--hema)" opacity={0.75} />)
}

export const SCHEMATICS: Record<Key, () => ReactNode> = {
  'artifact-chatter': () => (
    <Field label="Section with evenly spaced parallel thick-thin bands running parallel to the knife edge">
      <path d={section} fill="var(--eosin)" opacity="0.28" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={40} y={42 + i * 6.2} width={240} height={2.6} fill="var(--eosin)" opacity={0.5} />)}
      {nuclei(1)}
      <text x="290" y="92" fontSize="10" fill="var(--ink-2)" transform="rotate(90 290 92)">knife edge ↔</text>
    </Field>
  ),
  'artifact-compression': () => (
    <Field label="Section that is shorter than the block face in the cutting direction, with crowded nuclei and wrinkles">
      <path d="M40 58h240v64H40z" fill="var(--eosin)" opacity="0.32" />
      <rect x="40" y="40" width="240" height="100" fill="none" stroke="var(--ink-3)" strokeDasharray="4 3" />
      {(() => { const r = rng(99); return Array.from({ length: 40 }, (_, i) => <circle key={i} cx={48 + r() * 226} cy={62 + r() * 56} r={2.2} fill="var(--hema)" opacity={0.8} />) })()}
      <path d="M60 60q10 30 0 60M120 60q10 30 0 60M200 60q10 30 0 60" stroke="var(--eosin)" fill="none" opacity="0.6" />
      <text x="44" y="36" fontSize="10" fill="var(--ink-2)">dashed = block face size</text>
    </Field>
  ),
  'artifact-knife-lines': () => (
    <Field label="Section with straight tears or lines running perpendicular to the knife edge, in the cutting direction">
      <path d={section} fill="var(--eosin)" opacity="0.3" />
      {nuclei(2)}
      {[92, 168, 231].map((x) => <rect key={x} x={x} y={40} width={2.5} height={100} fill="var(--paper)" />)}
      <text x="44" y="36" fontSize="10" fill="var(--ink-2)">cutting direction ↓</text>
    </Field>
  ),
  'artifact-folds': () => (
    <Field label="Section with darker overlapping fold lines where tissue doubled over on itself">
      <path d={section} fill="var(--eosin)" opacity="0.28" />
      {nuclei(3)}
      <path d="M80 40l60 100" stroke="var(--eosin)" strokeWidth="9" opacity="0.6" />
      <path d="M190 40q20 50 -10 100" stroke="var(--eosin)" strokeWidth="6" fill="none" opacity="0.55" />
    </Field>
  ),
  'artifact-holes': () => (
    <Field label="Section with irregular empty holes, mostly in the centre of the tissue">
      <path d={section} fill="var(--eosin)" opacity="0.3" />
      {nuclei(4)}
      {[[140, 80, 16, 10], [178, 96, 10, 14], [120, 104, 12, 8], [160, 70, 8, 6]].map(([x, y, rx, ry]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="var(--paper)" stroke="var(--eosin)" strokeOpacity="0.4" />
      ))}
    </Field>
  ),
  'embed-skin-ellipse': () => (
    <Field label="Skin ellipse seen from above (left) and two embedding choices: on edge showing all layers, and flat showing only one layer">
      <ellipse cx="80" cy="90" rx="50" ry="20" fill="var(--eosin-soft)" stroke="var(--ink)" />
      <path d="M30 90h100" stroke="var(--ink-3)" strokeDasharray="4 3" />
      <text x="40" y="60" fontSize="10" fill="var(--ink-2)">ellipse (top view)</text>
      <g transform="translate(160 50)">
        <rect width="64" height="80" fill="var(--amber-soft)" stroke="var(--ink)" />
        <rect x="8" y="14" width="48" height="6" fill="var(--hema)" opacity="0.8" />
        <rect x="8" y="20" width="48" height="22" fill="var(--eosin)" opacity="0.45" />
        <rect x="8" y="42" width="48" height="16" fill="var(--amber)" opacity="0.35" />
        <text x="0" y="96" fontSize="10" fill="var(--ink-2)">A: on edge</text>
      </g>
      <g transform="translate(240 50)">
        <rect width="64" height="80" fill="var(--amber-soft)" stroke="var(--ink)" />
        <ellipse cx="32" cy="40" rx="26" ry="12" fill="var(--hema)" opacity="0.5" />
        <text x="0" y="96" fontSize="10" fill="var(--ink-2)">B: flat</text>
      </g>
    </Field>
  ),
  'embed-tubular': () => (
    <Field label="A tubular structure embedded two ways: on end giving a ring-shaped cross-section, and lying flat giving a longitudinal strip">
      <g transform="translate(50 50)">
        <rect width="90" height="80" fill="var(--amber-soft)" stroke="var(--ink)" />
        <circle cx="45" cy="40" r="22" fill="none" stroke="var(--eosin)" strokeWidth="9" opacity="0.6" />
        <text x="0" y="96" fontSize="10" fill="var(--ink-2)">A: on end</text>
      </g>
      <g transform="translate(180 50)">
        <rect width="90" height="80" fill="var(--amber-soft)" stroke="var(--ink)" />
        <rect x="10" y="30" width="70" height="20" fill="var(--eosin)" opacity="0.5" />
        <text x="0" y="96" fontSize="10" fill="var(--ink-2)">B: lying flat</text>
      </g>
    </Field>
  ),
  'ihc-layers': () => (
    <Field label="Layered IHC diagram: tissue antigen, primary antibody, polymer with enzyme, and brown chromogen deposit">
      <rect x="20" y="130" width="280" height="16" fill="var(--eosin)" opacity="0.3" />
      <text x="24" y="158" fontSize="10" fill="var(--ink-2)">tissue section</text>
      {[140, 205, 270].map((x) => (
        <g key={x}>
          <path d={`M${x - 6} 130l6-12 6 12z`} fill="var(--ink)" />
          <path d={`M${x} 118v-22M${x} 96l-10-12M${x} 96l10-12`} stroke="var(--hema)" strokeWidth="4" strokeLinecap="round" />
          <path d={`M${x - 30} 70q30-20 60 0`} stroke="var(--teal)" strokeWidth="5" fill="none" />
          {[-24, -8, 8, 24].map((d) => <circle key={d} cx={x + d} cy={64 - Math.abs(d) / 3} r={4} fill="var(--amber)" />)}
          <circle cx={x} cy={40} r={9} fill="#7a4a1f" opacity="0.75" />
        </g>
      ))}
      <g fontSize="10" fill="var(--ink-2)">
        <text x="8" y="126">antigen</text>
        <text x="8" y="100">primary</text>
        <text x="8" y="72">polymer + enzyme</text>
        <text x="8" y="44">chromogen</text>
      </g>
    </Field>
  ),
}

export function Schematic({ name }: { name: Key }) {
  const render = SCHEMATICS[name]
  return <div className="demo-frame">{render ? render() : <p className="muted">Schematic unavailable.</p>}</div>
}
