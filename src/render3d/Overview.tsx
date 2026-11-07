import ProjectedHtml from './ProjectedHtml'
import { STATION_IDS, type StationId } from '../sim/core/events'
import { Box, Cylinder } from './primitives'
import { COLORS } from './palette'
import { STATION_NAMES } from './types'

export default function Overview({
  onStationSelect,
}: {
  onStationSelect: (station: StationId) => void
}) {
  return (
    <group>
      <Box size={[17, 0.1, 15.5]} position={[0, -1.6, 0.5]} color="#d9d5ca" roughness={1} />
      <Box size={[17, 3.4, 0.14]} position={[0, 0.05, -7.2]} color={COLORS.shell} />
      <Box size={[0.14, 3.4, 15.5]} position={[-8.5, 0.05, 0.5]} color={COLORS.shell} />
      <Box size={[10, 0.5, 0.1]} position={[-0.5, 1.2, -7.08]} color={COLORS.trim} />
      {STATION_IDS.map((station, index) => {
        const x = ((index % 4) - 1.5) * 3.85
        const z = (Math.floor(index / 4) - 1.5) * 3.5 + 0.5
        const tall = ['processing', 'drying', 'frozen'].includes(station)
        return (
          <group
            key={station}
            position={[x, -0.15, z]}
            onClick={(event) => {
              event.stopPropagation()
              onStationSelect(station)
            }}
          >
            <Box size={[3, 0.13, 2.2]} color={COLORS.dark} />
            <Box size={[2.8, 1.35, 1.9]} position={[0, -0.74, 0]} color={COLORS.shell} />
            <Box
              size={[tall ? 1.8 : 1.4, tall ? 1.1 : 0.38, 1.15]}
              position={[-0.2, tall ? 0.63 : 0.27, -0.2]}
              color={index % 3 === 0 ? COLORS.trim : COLORS.shell}
            />
            <Box size={[0.6, 0.08, 0.44]} position={[0.9, 0.13, 0.42]} color={COLORS.ink} />
            {station === 'microtomy' || station === 'frozen' ? (
              <Cylinder
                radius={0.45}
                height={0.09}
                position={[0.63, 0.75, -0.1]}
                rotation={[0, 0, Math.PI / 2]}
                color={COLORS.dark}
              />
            ) : (
              <Cylinder
                radius={0.22}
                height={0.5}
                position={[-1, 0.33, 0.25]}
                color={index > 8 ? COLORS.eosin : COLORS.water}
              />
            )}
            <ProjectedHtml position={[0, tall ? 1.6 : 1.05, 0.65]} interactive>
              <button
                className="scene-station-link"
                onClick={(event) => {
                  event.stopPropagation()
                  onStationSelect(station)
                }}
                aria-label={`Enter ${STATION_NAMES[station]} station`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {STATION_NAMES[station]}
              </button>
            </ProjectedHtml>
          </group>
        )
      })}
    </group>
  )
}
