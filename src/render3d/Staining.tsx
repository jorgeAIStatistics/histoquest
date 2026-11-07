import type { StationId } from '../sim/core/events'
import type { InstrumentProps } from './types'
import { Box, Cylinder, Label, Slide } from './primitives'
import { COLORS } from './palette'

export default function Staining({
  twin,
  station: method,
}: InstrumentProps & { station: StationId }) {
  const immuno = method === 'ihc' || method === 'ish'
  const reagents = [
    'dewax',
    'hydrate',
    'hematoxylin',
    'differentiate',
    'blue',
    'eosin',
    'dehydrate',
    'clear',
  ]
  const colors = [
    '#a8bac2',
    '#9bbbc3',
    '#7f779d',
    '#bca5b1',
    '#5c8d91',
    '#c68aa0',
    '#c6c6b7',
    '#d0ccaf',
  ]
  const latest = twin.staining.history.at(-1)?.reagent
  const current = method === 'he' && latest ? reagents.indexOf(latest) : -1
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
        <group key={color} position={[-1.55 + index * 0.445, 0.45, 0.1]}>
          <Box size={[0.36, 0.4, 0.72]} color={color} metalness={0.2} opacity={0.85} />
          <Box size={[0.3, 0.01, 0.6]} position={[0, 0.21, 0]} color={color} roughness={0.15} />
          <Box size={[0.34, 0.08, 0.05]} position={[0, 0.28, 0.28]} color={COLORS.steel} />
        </group>
      ))}
      <group
        position={[current < 0 ? 0 : -1.55 + current * 0.445, current < 0 ? 1.35 : 0.92, 0.05]}
      >
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
          <Label at={[-1.7, 0.15, 0]}>
            {method === 'ish'
              ? 'Pretreatment → probe → washes → controls'
              : 'Retrieval → primary → detection → controls'}
          </Label>
        </group>
      )}
      <Label at={[0, 0.12, 1]}>
        {method === 'ish'
          ? 'ISH teaching program · inspect probe and controls below'
          : immuno
            ? `${twin.ihc.marker} · ${twin.ihc.valid ? 'controls supported' : 'controls not established'}`
            : method === 'special'
              ? `${twin.staining.protocol || 'Select a protocol'} · ${latest ?? 'no steps recorded'}`
              : (latest ?? 'Set the first reagent step below')}
      </Label>
    </group>
  )
}
