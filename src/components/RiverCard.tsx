import type { River } from '../types'
import { useGaugeData } from '../hooks/useGaugeData'
import { useForecast } from '../hooks/useForecast'
import { qualityAt, qualityLabel, trendOf } from '../lib/quality'
import { FlowStrip } from './FlowStrip'

const qualityIcon: Record<string, string> = {
  good: '●',
  shoulder: '◐',
  high: '▲',
  low: '○',
}

const trendArrow = { rising: '↗ rising', falling: '↘ falling', steady: '→ steady' }

export function RiverCard({ river }: { river: River }) {
  const { series, loading, error } = useGaugeData(river.station, river.parameter, 2)
  const readings = series?.readings ?? []
  const offline = !loading && !error && readings.length === 0
  // virtual gauge: only run the model when the physical gauge is offline
  const { forecast } = useForecast(river, readings, offline)
  const virtual = offline ? forecast?.history ?? [] : []
  const last =
    readings[readings.length - 1] ?? virtual[virtual.length - 1] ?? null
  const quality = last ? qualityAt(river.bands, last.value) : null
  const trend = trendOf(readings.length ? readings : virtual)

  return (
    <li>
      <a
        className="river-card"
        href={`#/${river.slug}`}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        <div className="river-card-top">
          <div>
            <h2>{river.name}</h2>
            <p className="section-label">{river.section}</p>
          </div>
          <div className="reading-now">
            {last ? (
              <>
                <div className="value">
                  {offline && '~'}
                  {last.value.toFixed(last.value < 10 ? 2 : last.value < 100 ? 1 : 0)}
                  <span className="units"> {river.units}</span>
                </div>
                <div className="trend">
                  {trend ? trendArrow[trend] : ''}
                  {offline ? ' · modelled' : ''}
                </div>
              </>
            ) : loading ? (
              <span className="card-loading">loading…</span>
            ) : error ? (
              <span className="card-error">feed error</span>
            ) : (
              <span className="card-error">gauge offline</span>
            )}
          </div>
        </div>

        <FlowStrip river={river} value={last?.value ?? null} />

        {quality && (
          <span className={`q-chip q-${quality}`}>
            <span aria-hidden="true">{qualityIcon[quality]}</span>
            {qualityLabel[quality]}
          </span>
        )}
        {error && <span className="card-error">gauge unavailable: {error}</span>}
      </a>
    </li>
  )
}
