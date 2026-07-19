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
    let cancelled = false

    const refresh = (force = false) => {
      const hit = cache.get(key)
      if (!force && hit && Date.now() - hit.fetchedAt < 10 * 60_000) {
        setState({ series: hit, loading: false, error: null })
        return
      }
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
    }

    refresh()
    // gauges report ~hourly; refresh on a timer and when the tab regains focus
    const timer = setInterval(() => refresh(true), 20 * 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [key, station, parameter, days])

  return state
}
