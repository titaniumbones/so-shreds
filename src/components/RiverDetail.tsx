import { useEffect, useState } from 'react'
import { marked } from 'marked'
import type { River } from '../types'
import { fetchRecordStats, type RecordStats } from '../api/geomet'
import { useGaugeData } from '../hooks/useGaugeData'
import { useForecast } from '../hooks/useForecast'
import { qualityAt, qualityLabel, toConvention, trendOf } from '../lib/quality'
import { FlowStrip } from './FlowStrip'
import { DischargeChart } from './DischargeChart'
import { JournalSection } from './JournalSection'

const fmtFlow = (v: number) =>
  v >= 100
    ? Math.round(v).toLocaleString()
    : v.toFixed(v < 10 ? 2 : 1)

const RANGES = [
  { days: 2, label: '2 days' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
]

export function RiverDetail({ river }: { river: River }) {
  const [days, setDays] = useState(7)
  const { series, loading, error } = useGaugeData(river.station, river.parameter, days)
  const readings = series?.readings ?? []
  const { forecast } = useForecast(river, readings, !loading)
  const gaugeOffline = !loading && !error && readings.length === 0
  const virtual = gaugeOffline ? forecast?.history ?? [] : []
  const last =
    readings[readings.length - 1] ?? virtual[virtual.length - 1] ?? null
  const quality = last ? qualityAt(river.bands, last.value) : null
  const trend = trendOf(readings.length ? readings : virtual)
  const [description, setDescription] = useState<string | null>(null)
  const [records, setRecords] = useState<RecordStats | null>(null)

  useEffect(() => {
    let cancelled = false
    setRecords(null)
    fetchRecordStats(river.station)
      .then((r) => {
        if (!cancelled) setRecords(r)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [river.station])

  useEffect(() => {
    setDescription(null)
    if (!river.hasDescription) return
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}descriptions/${river.slug}.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`))))
      .then((md) => {
        if (!cancelled) setDescription(marked.parse(md, { async: false }))
      })
      .catch(() => {
        if (!cancelled) setDescription(null)
      })
    return () => {
      cancelled = true
    }
  }, [river])

  return (
    <main>
      <a className="detail-back" href="#/">
        ← All rivers
      </a>
      <header className="detail-header">
        <div>
          <h1>{river.name}</h1>
          <p className="section-label">
            {river.section}
            {river.blurb ? ` · ${river.blurb}` : ''}
          </p>
        </div>
        <div className="detail-reading">
          {last && (
            <>
              <div className="value">
                {gaugeOffline && '~'}
                {last.value.toFixed(last.value < 10 ? 2 : last.value < 100 ? 1 : 0)}
                <span className="units"> {river.units}</span>
              </div>
              {river.conventionScale && (
                <div className="trend">
                  ≈ {toConvention(river.conventionScale, last.value).toFixed(1)}{' '}
                  {river.conventionScale.unit} {river.conventionScale.label}
                </div>
              )}
              <div>
                {quality && (
                  <span className={`q-chip q-${quality}`}>{qualityLabel[quality]}</span>
                )}{' '}
                {trend && <span className="trend">{trend}</span>}
                {gaugeOffline && <span className="trend"> · modelled</span>}
              </div>
            </>
          )}
        </div>
      </header>

      <FlowStrip river={river} value={last?.value ?? null} />

      {river.gaugeNote && <p className="gauge-note">{river.gaugeNote}</p>}

      <section className="chart-panel">
        <div className="chart-controls" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              aria-pressed={days === r.days}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
        {loading && readings.length === 0 ? (
          <p className="card-loading">Loading gauge data…</p>
        ) : error && readings.length === 0 ? (
          <p className="card-error">
            Couldn't reach the gauge feed ({error}). Try reloading.
          </p>
        ) : (
          <DischargeChart
            river={river}
            readings={readings}
            forecast={
              gaugeOffline
                ? [...(forecast?.history ?? []), ...(forecast?.points ?? [])]
                : forecast?.points ?? []
            }
          />
        )}
        {gaugeOffline && forecast && (
          <p className="card-error">
            The physical gauge is offline, so everything shown is a{' '}
            <strong>modelled estimate</strong> — our calibrated rainfall-runoff
            model run on observed and forecast weather, with no gauge to anchor
            it. Treat the numbers as rough.
          </p>
        )}
        {forecast && !gaugeOffline && (
          <p className="station-line">
            Dashed line: experimental 7-day flow prediction — a small
            rainfall-runoff model driven by the Open-Meteo weather forecast for
            the catchment, anchored to the latest reading. Validation skill
            (NSE√, 2016+): {forecast.skill.toFixed(2)}. Trust it for "rising or
            falling", not for exact numbers.
          </p>
        )}
        {records && (records.max || records.min) && (
          <p className="station-line">
            Station records:
            {records.max &&
              ` high ${fmtFlow(records.max.value)} ${river.units} (${records.max.year})`}
            {records.max && records.min && ' · '}
            {records.min &&
              `low ${fmtFlow(records.min.value)} ${river.units} (${records.min.year})`}
          </p>
        )}
        <p className="station-line">
          Station {river.station} — {river.stationName}. Provisional data from{' '}
          <a
            href={`https://wateroffice.ec.gc.ca/report/real_time_e.html?stn=${river.station}`}
            target="_blank"
            rel="noreferrer"
          >
            Water Survey of Canada
          </a>
          .
        </p>
      </section>

      {river.points && (
        <nav className="map-links" aria-label="Map links">
          {river.points.putin && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${river.points.putin[0]},${river.points.putin[1]}`}
              target="_blank"
              rel="noreferrer"
            >
              Directions to put-in
            </a>
          )}
          {river.points.takeout && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${river.points.takeout[0]},${river.points.takeout[1]}`}
              target="_blank"
              rel="noreferrer"
            >
              Directions to take-out
            </a>
          )}
        </nav>
      )}

      <JournalSection
        river={river}
        currentLevel={readings.length ? last?.value ?? null : null}
      />

      {description && (
        <article
          className="description"
          // trusted content: our own markdown files in the repo
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </main>
  )
}
