/*
 * Browser port of model/hydro.py — a parsimonious daily bucket model.
 * Parameters are calibrated offline (model/calibrate.py) against decades of
 * WSC daily flows + ERA5 weather, and shipped in src/data/modelParams.ts.
 */

export interface HydroParams {
  smax: number
  beta: number
  ddf: number
  tmelt: number
  alpha: number
  kq: number
  ks: number
  kr: number
}

export interface DailyWeather {
  date: string // YYYY-MM-DD
  precip: number // mm
  tmean: number // °C
  snowfall: number // mm water equivalent
  et0: number // mm
}

const MM_TO_CMS = 1e6 / 86400 / 1000

export interface SimPoint {
  date: string
  q: number // m³/s
}

/** Run the model over a daily weather series. Returns simulated discharge. */
export function simulate(
  p: HydroParams,
  weather: DailyWeather[],
  areaKm2: number,
): SimPoint[] {
  let snow = 0
  let soil = p.smax * 0.5
  let rq = 0
  let rs = 5
  const out: SimPoint[] = []
  for (const d of weather) {
    const precip = d.precip ?? 0
    const sf = Math.min(d.snowfall ?? 0, precip)
    const rain = precip - sf
    snow += sf
    const melt = Math.min(snow, Math.max(0, p.ddf * (d.tmean - p.tmelt)))
    snow -= melt
    const w = rain + melt
    const frac = Math.min(soil / p.smax, 1) ** p.beta
    let runoff = w * frac
    soil += w - runoff
    soil -= Math.min(soil, (d.et0 ?? 0) * Math.min(soil / p.smax, 1))
    const drain = p.kr * soil
    soil -= drain
    if (soil > p.smax) {
      runoff += soil - p.smax
      soil = p.smax
    }
    rq += p.alpha * runoff
    rs += (1 - p.alpha) * runoff + drain
    const qq = p.kq * rq
    const qs = p.ks * rs
    rq -= qq
    rs -= qs
    out.push({ date: d.date, q: (qq + qs) * areaKm2 * MM_TO_CMS })
  }
  return out
}
