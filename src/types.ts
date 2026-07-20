export type Quality = 'low' | 'shoulder' | 'good' | 'high'

/** A flow range and how runnable it is. Values in the river's gauge units (cms). */
export interface LevelBand {
  min: number
  max: number
  quality: Quality
}

/**
 * The scale paddlers actually quote for a river (OWL feet on the Ottawa,
 * gauge-height metres on the Moira…), expressed as piecewise-linear anchors
 * from the station's parameter to the conventional number.
 */
export interface ConventionScale {
  label: string
  unit: string
  /** [station value, convention value] pairs, ascending by station value */
  anchors: [number, number][]
}

export interface River {
  name: string
  /** short region / section label shown under the name */
  section: string
  slug: string
  /** WSC (Water Survey of Canada) station number, e.g. 02HB029 */
  station: string
  stationName: string
  /** which sensor to read from the hydrometric feed */
  parameter: 'discharge' | 'level'
  units: string
  /** runnability bands, ascending, in gauge units */
  bands: LevelBand[]
  /** put-in / take-out coordinates for map links */
  points?: {
    putin?: [number, number]
    takeout?: [number, number]
  }
  /** class rating etc, one line */
  blurb?: string
  /** true if a markdown description exists at public/descriptions/<slug>.md */
  hasDescription?: boolean
  /** notes about the gauge (e.g. proxy gauges, dam control) */
  gaugeNote?: string
  /** the scale paddlers quote, derived from the station value */
  conventionScale?: ConventionScale
}

export interface Reading {
  t: number // epoch ms (UTC)
  value: number
}

export interface GaugeSeries {
  station: string
  parameter: 'discharge' | 'level'
  readings: Reading[]
  fetchedAt: number
}
