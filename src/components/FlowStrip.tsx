import type { River } from '../types'
import { stripDomain } from '../lib/quality'

/**
 * The signature element: the river's runnability bands drawn as a strip,
 * with a needle at the current reading. Uses a sqrt scale so the low end
 * (where minimums live) gets more room than flood range.
 */
export function FlowStrip({
  river,
  value,
}: {
  river: River
  value: number | null
}) {
  const [lo, hi] = stripDomain(river)
  const scale = (v: number) =>
    (Math.sqrt(Math.max(v - lo, 0)) / Math.sqrt(hi - lo)) * 100

  return (
    <div className="flow-strip">
      <div className="bands" aria-hidden="true">
        {river.bands.map((b, i) => (
          <span
            key={i}
            className={`band q-${b.quality}`}
            style={{ width: `${scale(b.max) - scale(b.min)}%` }}
            title={`${b.min}–${b.max} ${river.units}: ${b.quality}`}
          />
        ))}
      </div>
      {value != null && value >= lo && (
        <div className="needle-track" aria-hidden="true">
          <span
            className="needle"
            style={{ left: `${Math.min(scale(value), 100)}%` }}
          />
        </div>
      )}
      <div className="scale">
        <span>{lo}</span>
        <span>
          {hi} {river.units}
        </span>
      </div>
    </div>
  )
}
