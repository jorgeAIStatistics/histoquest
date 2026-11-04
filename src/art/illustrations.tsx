/**
 * Custom SVG illustrations of lab objects. All are schematic drawings, not photographs.
 * Colours come from CSS variables so they follow the theme.
 */

export function Cassette({ size = 64, label = '' }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 80 64" role="img" aria-label="Tissue cassette (illustration)">
      <path d="M6 8h62l6 6v42H6z" fill="var(--hema-soft)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M6 8h16v48H6z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={28} y={14 + i * 8} width={38} height={3} rx={1.5} fill="var(--ink)" opacity={0.35} />
      ))}
      <text x="14" y="36" fontSize="7" fill="var(--ink)" textAnchor="middle" transform="rotate(-90 14 34)">{label}</text>
    </svg>
  )
}

export function Slide({ width = 160, tissue = 'var(--eosin)', label = 'HQ-0001', stained = true }: { width?: number; tissue?: string; label?: string; stained?: boolean }) {
  return (
    <svg width={width} height={width * 0.36} viewBox="0 0 200 72" role="img" aria-label="Glass slide (illustration)">
      <rect x="1" y="1" width="198" height="70" rx="3" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.2" />
      <rect x="1" y="1" width="52" height="70" rx="3" fill="var(--vellum)" stroke="var(--ink)" strokeWidth="1.2" />
      <text x="27" y="30" fontSize="9" textAnchor="middle" fill="var(--ink)">{label}</text>
      <rect x="12" y="40" width="30" height="14" fill="none" stroke="var(--ink)" strokeWidth="0.8" />
      {[14, 17, 19, 23, 26, 28, 32, 35, 38].map((x) => (
        <rect key={x} x={x} y={42} width={1.2} height={10} fill="var(--ink)" />
      ))}
      <path d="M100 18c18-6 40-2 52 10s6 26-12 28-42 4-50-8-8-24 10-30z" fill={stained ? tissue : 'none'} opacity={stained ? 0.55 : 1} stroke="var(--ink-3)" strokeWidth="0.8" strokeDasharray={stained ? undefined : '3 2'} />
      {stained && [[110, 30], [125, 38], [138, 30], [118, 46], [140, 46]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={2.2} fill="var(--hema)" />)}
    </svg>
  )
}

export function Microtome({ size = 220 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 240 180" role="img" aria-label="Rotary microtome (illustration)">
      <rect x="20" y="140" width="200" height="22" rx="4" fill="var(--vellum)" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="40" y="40" width="90" height="100" rx="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="70" y="56" width="30" height="24" rx="2" fill="var(--hema-soft)" stroke="var(--ink)" strokeWidth="1.2" />
      <rect x="76" y="80" width="18" height="14" fill="var(--amber-soft)" stroke="var(--ink)" strokeWidth="1" />
      <path d="M60 110h110l14 12H60z" fill="var(--rule)" stroke="var(--ink)" strokeWidth="1.3" />
      <path d="M72 104l40-6v6z" fill="var(--ink-3)" />
      <circle cx="180" cy="80" r="34" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="180" cy="80" r="5" fill="var(--ink)" />
      <path d="M180 80l22-22" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="204" cy="56" r="6" fill="var(--eosin)" />
    </svg>
  )
}

export function StainRack({ size = 220, dishes = ['var(--hema)', 'var(--paper)', 'var(--eosin)', 'var(--paper)', 'var(--teal)'] }: { size?: number; dishes?: string[] }) {
  return (
    <svg width={size} height={size * 0.45} viewBox="0 0 240 108" role="img" aria-label="Row of staining dishes (illustration)">
      {dishes.map((c, i) => (
        <g key={i} transform={`translate(${8 + i * 46} 30)`}>
          <rect x="0" y="10" width="40" height="56" rx="4" fill={c} opacity={0.25} stroke="var(--ink)" strokeWidth="1.3" />
          <rect x="0" y="4" width="40" height="8" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.3" />
          <rect x="6" y="20" width="28" height="40" rx="2" fill={c} opacity={0.55} />
        </g>
      ))}
    </svg>
  )
}

export function Microscope({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Light microscope (illustration)">
      <rect x="22" y="100" width="76" height="10" rx="3" fill="var(--vellum)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M78 100V40a10 10 0 0 0-10-10h-6" fill="none" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
      <rect x="40" y="14" width="14" height="34" rx="3" transform="rotate(-20 47 31)" fill="var(--hema-soft)" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="30" y="66" width="52" height="6" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="44" y="52" width="10" height="12" rx="2" fill="var(--ink-3)" />
      <circle cx="49" cy="84" r="5" fill="var(--amber)" opacity="0.6" />
    </svg>
  )
}

export function TissueBlock({ size = 80, tilt = 0 }: { size?: number; tilt?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Paraffin block (illustration)">
      <g transform={`rotate(${tilt} 40 40)`}>
        <path d="M14 26l26-12 26 12v30L40 68 14 56z" fill="var(--amber-soft)" stroke="var(--ink)" strokeWidth="1.4" />
        <path d="M14 26l26 12 26-12M40 38v30" fill="none" stroke="var(--ink)" strokeWidth="1" opacity="0.5" />
        <ellipse cx="40" cy="26" rx="10" ry="4" fill="var(--eosin)" opacity="0.6" />
      </g>
    </svg>
  )
}
