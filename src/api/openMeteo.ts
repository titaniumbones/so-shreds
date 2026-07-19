import type { DailyWeather } from '../lib/hydroModel'

/*
 * Open-Meteo (CORS-enabled, no key). Two endpoints:
 *  - archive-api: ERA5 reanalysis, ~5-day lag — used for model spin-up
 *  - api: forecast, with past_days to bridge the reanalysis lag
 */

const DAILY_VARS =
  'precipitation_sum,temperature_2m_mean,snowfall_sum,et0_fao_evapotranspiration'

interface OMDaily {
  time: string[]
  precipitation_sum: (number | null)[]
  temperature_2m_mean: (number | null)[]
  snowfall_sum: (number | null)[]
  et0_fao_evapotranspiration: (number | null)[]
}

function toDaily(d: OMDaily): DailyWeather[] {
  return d.time.map((date, i) => ({
    date,
    precip: d.precipitation_sum[i] ?? 0,
    tmean: d.temperature_2m_mean[i] ?? 0,
    // open-meteo snowfall is cm of snow; ~1cm snow ≈ 1mm water equivalent
    snowfall: (d.snowfall_sum[i] ?? 0) * 1.0,
    et0: d.et0_fao_evapotranspiration[i] ?? 0,
  }))
}

/** Past weather from ERA5 for spin-up: previous Oct 1 through the lag window. */
export async function fetchArchiveWeather(
  lat: number,
  lon: number,
  startISO: string,
  endISO: string,
): Promise<DailyWeather[]> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startISO}&end_date=${endISO}&daily=${DAILY_VARS}&timezone=UTC`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`open-meteo archive ${res.status}`)
  return toDaily((await res.json()).daily as OMDaily)
}

/** Recent observed + forecast weather (past_days bridges the ERA5 lag). */
export async function fetchForecastWeather(
  lat: number,
  lon: number,
  pastDays: number,
  forecastDays: number,
): Promise<DailyWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&past_days=${pastDays}&forecast_days=${forecastDays}&daily=${DAILY_VARS}&timezone=UTC`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`open-meteo forecast ${res.status}`)
  return toDaily((await res.json()).daily as OMDaily)
}
