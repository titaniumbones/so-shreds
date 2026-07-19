import type { Reading, River } from '../types'
import { simulate, type DailyWeather, type HydroParams } from './hydroModel'
import { fetchArchiveWeather, fetchForecastWeather } from '../api/openMeteo'
import { modelParams } from '../data/modelParams'

export interface ForecastPoint {
  t: number // epoch ms, midday UTC of the forecast day
  value: number // m³/s
}

export interface FlowForecast {
  points: ForecastPoint[]
  /** how well the calibrated model validated (NSE on sqrt flows, 2016+) */
  skill: number
  anchored: boolean
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
}

/** previous Oct 1 — start of the snow year, so the pack spins up correctly */
function snowYearStart(): string {
  const now = new Date()
  const y = now.getUTCMonth() >= 9 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  return `${y}-10-01`
}

/**
 * Predict the next `forecastDays` of flow by running the bucket model from
 * the start of the snow year through the weather forecast, then anchoring
 * the simulation to the latest gauge observation (multiplicative bias fix).
 */
export async function forecastFlow(
  river: River,
  observed: Reading[],
  forecastDays = 7,
): Promise<FlowForecast | null> {
  const entry = modelParams[river.station]
  if (!entry) return null

  const centroid = entry.centroid
  // ERA5 lags ~5 days; forecast past_days=14 bridges it with overlap to spare
  const [archive, recent] = await Promise.all([
    fetchArchiveWeather(centroid[0], centroid[1], snowYearStart(), isoDaysAgo(6)),
    fetchForecastWeather(centroid[0], centroid[1], 14, forecastDays),
  ])
  const seen = new Set(archive.map((d) => d.date))
  const weather: DailyWeather[] = [
    ...archive,
    ...recent.filter((d) => !seen.has(d.date)),
  ]

  const sim = simulate(entry.params as HydroParams, weather, entry.area_km2)

  // anchor: scale so the simulation matches the latest observation
  const last = observed[observed.length - 1]
  let ratio = 1
  let anchored = false
  if (last) {
    const todayISO = new Date(last.t).toISOString().slice(0, 10)
    const at = sim.find((s) => s.date === todayISO)
    if (at && at.q > 0.01 && last.value > 0) {
      ratio = Math.min(Math.max(last.value / at.q, 0.25), 4)
      anchored = true
    }
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const points = sim
    .filter((s) => s.date >= todayISO)
    .map((s) => ({
      t: Date.parse(`${s.date}T12:00:00Z`),
      value: s.q * ratio,
    }))

  return { points, skill: entry.fit.val_sqrt_nse, anchored }
}
