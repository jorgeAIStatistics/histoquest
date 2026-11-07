import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { useThree } from '@react-three/fiber'
import { STATION_IDS } from '../sim/core/events'
import { Bench, Label } from './primitives'
import { prefetchStationWhenIdle, stationLoaders, type StationProps } from './stationLoaders'

const models = Object.fromEntries(
  STATION_IDS.map((station) => [station, lazy(stationLoaders[station])]),
) as Record<StationProps['station'], LazyExoticComponent<ComponentType<StationProps>>>

function LoadedModel(props: StationProps) {
  const { station } = props
  const { gl, invalidate } = useThree()
  const Model = models[station]
  useEffect(() => {
    gl.domElement.setAttribute('data-station-model', station)
    invalidate()
    const next = STATION_IDS[STATION_IDS.indexOf(station) + 1]
    const cancel = next ? prefetchStationWhenIdle(next) : () => {}
    return () => {
      gl.domElement.removeAttribute('data-station-model')
      cancel()
    }
  }, [gl, invalidate, station])
  return <Model {...props} />
}

export default function StationModel(props: StationProps) {
  return (
    <>
      <Bench />
      <Suspense fallback={<Label at={[0, 1, 0]}>Loading station model…</Label>}>
        <LoadedModel key={props.station} {...props} />
      </Suspense>
    </>
  )
}
