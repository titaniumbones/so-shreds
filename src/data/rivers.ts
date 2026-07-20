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
    gaugeNote:
      'Dam-controlled; flow steps when GRCA changes the release. Actual gorge flow ≈ Shand release plus the Irvine at Salem — add the two gauges when the Irvine is running.',
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
    // old site: min 4.6, good 8–50; WCA/riverapp: ideal 30–60, 80–120 is
    // big-water Class III–IV — merged below
    bands: [
      { min: 0, max: 4.6, quality: 'low' },
      { min: 4.6, max: 8, quality: 'shoulder' },
      { min: 8, max: 60, quality: 'good' },
      { min: 60, max: 120, quality: 'shoulder' },
      { min: 120, max: 300, quality: 'high' },
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
    name: 'Middle Credit',
    section: 'Terra Cotta to Glen Williams to Norval',
    slug: 'middlecredit',
    station: '02HB018',
    stationName: 'Credit River at Boston Mills',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class I–II · moving-water tour with the Glen Williams play spot',
    // bands estimated from Boston Mills statistics (median annual max ≈ 30,
    // median annual min ≈ 1.9 m³/s) — no published thresholds found
    bands: [
      { min: 0, max: 4, quality: 'low' },
      { min: 4, max: 7, quality: 'shoulder' },
      { min: 7, max: 30, quality: 'good' },
      { min: 30, max: 45, quality: 'shoulder' },
      { min: 45, max: 120, quality: 'high' },
    ],
    points: {
      putin: [43.7204, -79.9478],
      takeout: [43.6465, -79.8623],
    },
    hasDescription: true,
    gaugeNote:
      'Boston Mills gauge sits mid-run. Take out at Willow Park before the Norval Dam — portaging the dam crosses posted private land.',
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
    name: 'Nottawasaga River',
    section: 'Hockley Valley',
    slug: 'nottawasaga',
    station: '02ED026',
    stationName: 'Nottawasaga River at Hockley',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class I–II+ · spring swifts through the Hockley hills',
    // bands estimated from Hockley statistics (median annual max ≈ 18,
    // median annual min ≈ 0.6 m³/s) — no published thresholds found
    bands: [
      { min: 0, max: 3, quality: 'low' },
      { min: 3, max: 5, quality: 'shoulder' },
      { min: 5, max: 18, quality: 'good' },
      { min: 18, max: 28, quality: 'shoulder' },
      { min: 28, max: 80, quality: 'high' },
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
    // Paddlers quote LEVEL on this gauge. WCA: <7.5 m bump-and-grind,
    // 7.8 m doable, 8.0–8.5 m ideal, >8.5 m hazardous. Empirical rating
    // (2010–2026 daily pairs): 7.5 m ≈ 38, 7.8 m ≈ 75, 8.0 m ≈ 98 m³/s.
    bands: [
      { min: 0, max: 38, quality: 'low' },
      { min: 38, max: 75, quality: 'shoulder' },
      { min: 75, max: 155, quality: 'good' },
      { min: 155, max: 210, quality: 'shoulder' },
      { min: 210, max: 500, quality: 'high' },
    ],
    hasDescription: true,
    gaugeNote:
      'Paddlers quote water level here: below 7.5 m is bump-and-grind, 7.8 m doable, 8.0–8.5 m ideal, above 8.5 m the shoreline trees get dangerous. Bands convert those to discharge via the station rating.',
    // empirical level↔discharge rating, 2010–2026 daily pairs
    conventionScale: {
      label: 'gauge height',
      unit: 'm',
      anchors: [
        [5, 7.0],
        [9.5, 7.1],
        [14.6, 7.2],
        [38.3, 7.5],
        [98.4, 8.0],
        [122, 8.15],
      ],
    },
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
      'Course flow is set by dam release, and paddlers read the stick gauge by the parking lot: under 10 m³/s is too low, 10–18 is the usual summer release, 22–28 is race flow. The Norland gauge shown here is well downstream with no published correlation — treat it as a rough indicator and check Whitewater Ontario release schedules before driving.',
    hasDescription: true,
  },
  {
    name: 'Magnetawan River',
    section: 'Poverty Chutes · Ahmic Harbour to Maple Island',
    slug: 'magnetawan',
    station: '02EA011',
    stationName: 'Magnetawan River near Britt',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class III–V · Shield pool-drop with the Poverty Chutes',
    // Kawartha Whitewater Paddlers: runnable ~7 to 100+, ideal 40–60,
    // Feighan Falls put-in only above 60 m³/s
    bands: [
      { min: 0, max: 7, quality: 'low' },
      { min: 7, max: 25, quality: 'shoulder' },
      { min: 25, max: 100, quality: 'good' },
      { min: 100, max: 200, quality: 'shoulder' },
      { min: 200, max: 600, quality: 'high' },
    ],
    hasDescription: true,
    gaugeNote:
      'The Britt station sits at the river mouth, well below the run — the club reads it as a whole-river index, not an on-site gauge. Ideal is roughly 40–60 m³/s; the Feighan Falls put-in only works above ~60.',
  },
  {
    name: 'Middle Madawaska',
    section: 'Below Bark Lake Dam (MKC section)',
    slug: 'middlemad',
    station: '02KD004',
    stationName: 'Madawaska River at Palmer Rapids',
    parameter: 'discharge',
    units: 'm³/s',
    blurb: 'Class II–III · dam-release play run at Madawaska Kanu Centre',
    // release-fed: runs most of the summer; bands provisional, on the
    // downstream Palmer Rapids gauge
    bands: [
      { min: 0, max: 15, quality: 'low' },
      { min: 15, max: 22, quality: 'shoulder' },
      { min: 22, max: 70, quality: 'good' },
      { min: 70, max: 140, quality: 'shoulder' },
      { min: 140, max: 500, quality: 'high' },
    ],
    hasDescription: true,
    gaugeNote:
      'No public numeric gauge exists on this section — the Palmer Rapids station shown here is well downstream (below Kamaniskeg) and only loosely tracks the release. Conventions on the section itself: the scheduled summer release is ~26 m³/s (Mon–Thu, ~9:00–15:30), ~40 is a good fun level, weekend baseflow runs 5–8. Check the Shaggy Designs sensor (shaggydesigns.com/gauge/madawaska.htm), MKC, or @MADRiverLevel before driving.',
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
    // WCA / Split Rock: min ~15, ideal 30–60 (fine to ~100), washout ~225
    bands: [
      { min: 0, max: 15, quality: 'low' },
      { min: 15, max: 30, quality: 'shoulder' },
      { min: 30, max: 100, quality: 'good' },
      { min: 100, max: 225, quality: 'shoulder' },
      { min: 225, max: 500, quality: 'high' },
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
    // liquidlore: town run quoted as gauge height METRES on this station —
    // normal 2.8–4.0 m, ~3.2 m is a good medium, Catwalk surfs above 2.9 m.
    // Converted via the 2010–2026 rating: 2.8 m ≈ 59, 3.2 m ≈ 119 m³/s.
    bands: [
      { min: 0, max: 35, quality: 'low' },
      { min: 35, max: 60, quality: 'shoulder' },
      { min: 60, max: 250, quality: 'good' },
      { min: 250, max: 400, quality: 'shoulder' },
      { min: 400, max: 900, quality: 'high' },
    ],
    hasDescription: true,
    gaugeNote:
      'The town run is quoted as gauge height in metres on this station: normal 2.8–4.0 m, ~3.2 m is a good medium, the Catwalk wave surfs above 2.9 m. (The painted feet gauge on the Hwy 17 bridge is a different, unrelated scale.) The upper river runs about two days ahead of the town reading.',
    // empirical level↔discharge rating, 2010–2026 daily pairs
    conventionScale: {
      label: 'gauge height',
      unit: 'm',
      anchors: [
        [28, 2.5],
        [37, 2.6],
        [59, 2.8],
        [87, 3.0],
        [119, 3.2],
        [176, 3.5],
        [287, 4.0],
        [435, 4.5],
      ],
    },
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
      "Paddlers quote the Ottawa in feet on the OWL stick gauge below McCoys (roughly −2 ft at summer low to 20+ ft in flood; see shaggydesigns.com/gauge/ottawa.htm for a live reading). No published conversion links that scale to flow, and this Britannia station is far downstream — treat it as a broad indicator. The river runs year-round; bands here flag flood stages, not a minimum.",
    hasDescription: true,
  },
]

export const riverBySlug = (slug: string): River | undefined =>
  rivers.find((r) => r.slug === slug)
