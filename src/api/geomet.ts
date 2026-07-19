import type { GaugeSeries, Reading } from '../types'

/*
 * ECCC GeoMet OGC-API client.
 * https://api.weather.gc.ca/collections/hydrometric-realtime holds ~30 days of
 * provisional 5-minute-to-hourly readings for every active WSC station, with
 * Access-Control-Allow-Origin: * — so a static site can call it directly.
 */

const BASE = 'https://api.weather.gc.ca/collections'

interface GeoJsonFeature {
  properties: {
    DATETIME: string
    LEVEL: number | null
    DISCHARGE: number | null
  }
}

interface FeatureCollection {
  features: GeoJsonFeature[]
  numberMatched?: number
}

async function fetchAllPages(url: string, cap = 5): Promise<GeoJsonFeature[]> {
  const out: GeoJsonFeature[] = []
  let offset = 0
  const limit = 10000
  for (let page = 0; page < cap; page++) {
    const res = await fetch(`${url}&limit=${limit}&offset=${offset}`)
    if (!res.ok) throw new Error(`GeoMet ${res.status} for ${url}`)
    const json = (await res.json()) as FeatureCollection
    out.push(...json.features)
    if (json.features.length < limit) break
    offset += limit
  }
  return out
}

/** Fetch recent readings for a station. `days` up to ~30. */
export async function fetchRealtime(
  station: string,
  parameter: 'discharge' | 'level',
  days: number,
): Promise<GaugeSeries> {
  const since = new Date(Date.now() - days * 86400_000)
    .toISOString()
    .slice(0, 19)
  const url =
    `${BASE}/hydrometric-realtime/items?f=json` +
    `&STATION_NUMBER=${station}` +
    `&datetime=${since}Z/..` +
    `&sortby=DATETIME` +
    `&properties=DATETIME,LEVEL,DISCHARGE`
  const features = await fetchAllPages(url)
  const key = parameter === 'discharge' ? 'DISCHARGE' : 'LEVEL'
  const readings: Reading[] = features
    .map((f) => ({
      t: Date.parse(f.properties.DATETIME),
      value: f.properties[key] as number | null,
    }))
    // 99999 / -99999 are WSC sentinels for a malfunctioning sensor
    .filter(
      (r): r is Reading =>
        r.value != null && Math.abs(r.value) < 99990 && Number.isFinite(r.t),
    )
  return { station, parameter, readings, fetchedAt: Date.now() }
}

export interface RecordStats {
  max: { value: number; year: number } | null
  min: { value: number; year: number } | null
}

/** All-time record annual max/min discharge from the annual-statistics set. */
export async function fetchRecordStats(station: string): Promise<RecordStats> {
  const url =
    `${BASE}/hydrometric-annual-statistics/items?f=json` +
    `&STATION_NUMBER=${station}&limit=500` +
    `&properties=DATA_TYPE_EN,MAX_VALUE,MIN_VALUE,MAX_DATE,MIN_DATE`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GeoMet ${res.status}`)
  const json = (await res.json()) as {
    features: {
      properties: {
        DATA_TYPE_EN: string
        MAX_VALUE: number | null
        MIN_VALUE: number | null
        MAX_DATE: string | null
        MIN_DATE: string | null
      }
    }[]
  }
  let max: RecordStats['max'] = null
  let min: RecordStats['min'] = null
  for (const f of json.features) {
    const p = f.properties
    if (p.DATA_TYPE_EN !== 'Discharge') continue
    if (p.MAX_VALUE != null && (!max || p.MAX_VALUE > max.value))
      max = { value: p.MAX_VALUE, year: +(p.MAX_DATE?.slice(0, 4) ?? 0) }
    if (p.MIN_VALUE != null && (!min || p.MIN_VALUE < min.value))
      min = { value: p.MIN_VALUE, year: +(p.MIN_DATE?.slice(0, 4) ?? 0) }
  }
  return { max, min }
}

/** Historical daily means (for context / prediction work). */
export async function fetchDailyMeans(
  station: string,
  fromISO: string,
  toISO: string,
): Promise<Reading[]> {
  const url =
    `${BASE}/hydrometric-daily-mean/items?f=json` +
    `&STATION_NUMBER=${station}` +
    `&datetime=${fromISO}/${toISO}` +
    `&sortby=DATE` +
    `&properties=DATE,DISCHARGE`
  const features = await fetchAllPages(url)
  return (features as unknown as { properties: { DATE: string; DISCHARGE: number | null } }[])
    .map((f) => ({ t: Date.parse(f.properties.DATE), value: f.properties.DISCHARGE }))
    .filter((r): r is Reading => r.value != null)
}
