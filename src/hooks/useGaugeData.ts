import { useEffect, useState } from 'react'
import { fetchRealtime } from '../api/geomet'
import type { GaugeSeries } from '../types'

interface GaugeState {
  series: GaugeSeries | null
  loading: boolean
  error: string | null
}

const cache = new Map<string, GaugeSeries>()

/**
 * Load readings for a station. Cached per (station, parameter, days) for the
 * session; refetches when `days` grows past what's cached.
 */
export function useGaugeData(
  station: string,
  parameter: 'discharge' | 'level',
  days: number,
): GaugeState {
  const key = `${station}:${parameter}:${days}`
  const [state, setState] = useState<GaugeState>(() => ({
    series: cache.get(key) ?? null,
    loading: !cache.has(key),
    error: null,
  }))

  useEffect(() => {
    const hit = cache.get(key)
    if (hit && Date.now() - hit.fetchedAt < 10 * 60_000) {
      setState({ series: hit, loading: false, error: null })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchRealtime(station, parameter, days)
      .then((series) => {
        cache.set(key, series)
        if (!cancelled) setState({ series, loading: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: err.message }))
      })
    return () => {
      cancelled = true
    }
  }, [key, station, parameter, days])

  return state
}
