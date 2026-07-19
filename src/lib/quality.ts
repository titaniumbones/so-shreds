import type { LevelBand, Quality, River } from '../types'

export function qualityAt(bands: LevelBand[], value: number): Quality {
  for (const b of bands) {
    if (value >= b.min && value < b.max) return b.quality
  }
  // above the top band = high water, below the bottom = too low
  const top = bands[bands.length - 1]
  return value >= top.max ? 'high' : 'low'
}

export const qualityLabel: Record<Quality, string> = {
  low: 'Too low',
  shoulder: 'Shoulder',
  good: 'Good to go',
  high: 'High water',
}

/** sort weight: good runs first, then shoulder, then high, then too-low */
export const qualityRank: Record<Quality, number> = {
  good: 0,
  shoulder: 1,
  high: 2,
  low: 3,
}

/** the range shown on the flow-band strip: full band envelope */
export function stripDomain(river: River): [number, number] {
  const bands = river.bands
  return [bands[0].min, bands[bands.length - 1].max]
}

export function trendOf(
  readings: { t: number; value: number }[],
  hours = 6,
): 'rising' | 'falling' | 'steady' | null {
  if (readings.length < 2) return null
  const last = readings[readings.length - 1]
  const cutoff = last.t - hours * 3600_000
  const past = readings.filter((r) => r.t <= cutoff).pop() ?? readings[0]
  if (past.t === last.t) return null
  const delta = last.value - past.value
  const rel = Math.abs(delta) / Math.max(past.value, 0.001)
  if (rel < 0.03) return 'steady'
  return delta > 0 ? 'rising' : 'falling'
}
