import type { River } from '../types'

/*
 * River definitions, ported from the old river-levels / react-river-experiments
 * repos and extended with eastern Ontario runs. All gauges are federal WSC
 * stations read live from the ECCC GeoMet API (api.weather.gc.ca), which sends
 * CORS headers — no proxy needed.
 *
 * Bands are [min, max) in the gauge's units (discharge in m³/s unless noted).
 * Sources: legacy site data, American Whitewater, paddler reports. Treat as
 * advisory — always scout.
 */

export const rivers: River[] = [
  {
    name: 'Elora Gorge',
    section: 'Grand River below Shand Dam',
    slug: 'grand',
    station: '02GA016',
    stationName: 'Grand River below Shand Dam',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–III+ · dam-released, the classic after-work run',
    bands: [
      { min: 0, max: 4.6, quality: 'low' },
      { min: 4.6, max: 8, quality: 'shoulder' },
      { min: 8, max: 50, quality: 'good' },
      { min: 50, max: 100, quality: 'shoulder' },
      { min: 100, max: 300, quality: 'high' },
    ],
    points: {
      putin: [43.4379897, -80.2842689],
      takeout: [43.662701, -80.453265],
    },
    hasDescription: true,
    gaugeNote: 'Dam-controlled; flow steps when GRCA changes the release.',
  },
  {
    name: 'Irvine River',
    section: 'Salem to Elora',
    slug: 'irvine',
    station: '02GA005',
    stationName: 'Irvine River near Salem',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–III · rain-fed gorge run, up fast and down fast',
    bands: [
      { min: 0, max: 6.5, quality: 'low' },
      { min: 6.5, max: 8, quality: 'shoulder' },
      { min: 8, max: 50, quality: 'good' },
      { min: 50, max: 80, quality: 'shoulder' },
      { min: 80, max: 200, quality: 'high' },
    ],
    points: {
      putin: [43.702321, -80.445578],
      takeout: [43.662701, -80.453265],
    },
    hasDescription: true,
  },
  {
    name: 'Lower Credit',
    section: 'Credit River at Streetsville',
    slug: 'lowercredit',
    station: '02HB029',
    stationName: 'Credit River at Streetsville',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II · urban play run, best after rain',
    bands: [
      { min: 0, max: 4.6, quality: 'low' },
      { min: 4.6, max: 8, quality: 'shoulder' },
      { min: 8, max: 50, quality: 'good' },
      { min: 50, max: 100, quality: 'shoulder' },
      { min: 100, max: 300, quality: 'high' },
    ],
    hasDescription: true,
  },
  {
    name: 'Upper Credit',
    section: 'Belfountain / Forks of the Credit',
    slug: 'uppercredit',
    station: '02HB001',
    stationName: 'Credit River near Cataract',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II+ · tight creeky run in the Forks',
    // The old site's 0.61–1.4 numbers were water LEVEL in metres on the CVC
    // Belfountain gauge. These discharge bands for the Cataract station are
    // scaled from its flow statistics (median annual max ≈ 18 m³/s) — rough.
    bands: [
      { min: 0, max: 2, quality: 'low' },
      { min: 2, max: 3.5, quality: 'shoulder' },
      { min: 3.5, max: 14, quality: 'good' },
      { min: 14, max: 20, quality: 'shoulder' },
      { min: 20, max: 60, quality: 'high' },
    ],
    points: {
      putin: [43.7962886, -80.0139645],
      takeout: [43.80232, -79.99391],
    },
    hasDescription: true,
    gaugeNote:
      'Old site read the CVC Belfountain gauge; this uses the nearby WSC Cataract station, so bands are approximate until recalibrated.',
  },
  {
    name: "Spencer Creek",
    section: 'Town section, Dundas',
    slug: 'spencertown',
    station: '02HB007',
    stationName: 'Spencer Creek at Dundas',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–III · flashy urban creek, catch it same-day',
    bands: [
      { min: 0, max: 7, quality: 'low' },
      { min: 7, max: 9, quality: 'shoulder' },
      { min: 9, max: 15, quality: 'good' },
      { min: 15, max: 100, quality: 'high' },
    ],
    hasDescription: true,
  },
  {
    name: 'Moira River',
    section: 'Latta / Foxboro',
    slug: 'moira',
    station: '02HL001',
    stationName: 'Moira River near Foxboro',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–III · spring classic east of Belleville',
    bands: [
      { min: 0, max: 15, quality: 'low' },
      { min: 15, max: 25, quality: 'shoulder' },
      { min: 25, max: 100, quality: 'good' },
      { min: 100, max: 160, quality: 'shoulder' },
      { min: 160, max: 400, quality: 'high' },
    ],
    hasDescription: true,
  },
  {
    name: 'Gull River',
    section: 'Minden Wild Water Preserve',
    slug: 'gull',
    station: '02HF002',
    stationName: 'Gull River at Norland',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class III–IV · dam-released slalom course at Minden',
    // Norland statistics: median annual min ≈ 6, median annual max ≈ 52 m³/s.
    // The old 7.8–8.4 numbers were a level scale, not Norland discharge.
    bands: [
      { min: 0, max: 8, quality: 'low' },
      { min: 8, max: 15, quality: 'shoulder' },
      { min: 15, max: 45, quality: 'good' },
      { min: 45, max: 60, quality: 'shoulder' },
      { min: 60, max: 120, quality: 'high' },
    ],
    gaugeNote:
      'Course flow is set by dam release upstream at Horseshoe Lake; the Norland gauge is well downstream and lags. Check MNR dam logs before driving.',
    hasDescription: true,
  },
  {
    name: 'Lower Madawaska',
    section: 'Palmer Rapids to Griffith',
    slug: 'madawaska',
    station: '02KD004',
    stationName: 'Madawaska River at Palmer Rapids',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–III · pool-drop granite, the club-trip classic',
    bands: [
      { min: 0, max: 15, quality: 'low' },
      { min: 15, max: 25, quality: 'shoulder' },
      { min: 25, max: 110, quality: 'good' },
      { min: 110, max: 170, quality: 'shoulder' },
      { min: 170, max: 500, quality: 'high' },
    ],
    hasDescription: true,
  },
  {
    name: 'Petawawa River',
    section: 'Town section, Petawawa',
    slug: 'petawawa',
    station: '02KB001',
    stationName: 'Petawawa River near Petawawa',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–IV · big spring water off the Algonquin dome',
    bands: [
      { min: 0, max: 30, quality: 'low' },
      { min: 30, max: 50, quality: 'shoulder' },
      { min: 50, max: 220, quality: 'good' },
      { min: 220, max: 320, quality: 'shoulder' },
      { min: 320, max: 900, quality: 'high' },
    ],
    hasDescription: true,
  },
  {
    name: 'Ottawa River',
    section: 'Main & Middle channels, Beachburg',
    slug: 'ottawa',
    station: '02KF005',
    stationName: 'Ottawa River at Britannia',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class III–IV+ · world-class big water, runnable all season',
    bands: [
      { min: 0, max: 700, quality: 'good' },
      { min: 700, max: 2200, quality: 'good' },
      { min: 2200, max: 4500, quality: 'shoulder' },
      { min: 4500, max: 10000, quality: 'high' },
    ],
    gaugeNote:
      'Paddlers usually quote the Ottawa in feet on the Lorne gauge; Britannia discharge is a downstream proxy. The river runs year-round — bands here flag flood stages, not a minimum.',
    hasDescription: true,
  },
]

export const riverBySlug = (slug: string): River | undefined =>
  rivers.find((r) => r.slug === slug)
