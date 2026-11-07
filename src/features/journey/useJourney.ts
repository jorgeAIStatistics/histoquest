import { useMemo } from 'react'
import { useAppState } from '../../store/store'
import { useAllLabRuns } from '../../store/labArchive'
import { getJourney } from './journey'

export function useJourney() {
  const state = useAppState((s) => s)
  const archive = useAllLabRuns()
  const journey = useMemo(() => getJourney(state, archive.runs), [state, archive.runs])
  return { journey, archive, state }
}
