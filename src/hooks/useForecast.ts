import { useEffect, useState } from 'react'
import type { Reading, River } from '../types'
import { forecastFlow, type FlowForecast } from '../lib/forecast'

const cache = new Map<string, FlowForecast | null>()

/** Run the flow-prediction model once observations are available. */
export function useForecast(river: River, observed: Reading[]): {
  forecast: FlowForecast | null
  loading: boolean
} {
  const ready = observed.length > 0
  const [state, setState] = useState<{ forecast: FlowForecast | null; loading: boolean }>(
    { forecast: cache.get(river.station) ?? null, loading: false },
  )

  useEffect(() => {
    if (!ready) return
    if (cache.has(river.station)) {
      setState({ forecast: cache.get(river.station) ?? null, loading: false })
      return
    }
    let cancelled = false
    setState({ forecast: null, loading: true })
    forecastFlow(river, observed)
      .then((f) => {
        cache.set(river.station, f)
        if (!cancelled) setState({ forecast: f, loading: false })
      })
      .catch(() => {
        cache.set(river.station, null)
        if (!cancelled) setState({ forecast: null, loading: false })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [river.station, ready])

  return state
}
