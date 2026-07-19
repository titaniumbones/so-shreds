import { useMemo, useRef, useState } from 'react'
import type { Reading, River } from '../types'

/*
 * Time-series chart: discharge line over runnability band washes,
 * hairline grid, crosshair + tooltip on hover. Plain SVG, no chart lib.
 */

const W = 900
const H = 280
const PAD = { top: 12, right: 14, bottom: 26, left: 48 }

const bandFill: Record<string, string> = {
  good: 'var(--q-good-wash)',
  shoulder: 'var(--q-shoulder-wash)',
  high: 'var(--q-high-wash)',
  low: 'var(--q-low-wash)',
}

function niceTicks(lo: number, hi: number, n = 5): number[] {
  const span = hi - lo
  if (span <= 0) return [lo]
  const step0 = span / n
  const mag = 10 ** Math.floor(Math.log10(step0))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? mag * 10
  const start = Math.ceil(lo / step) * step
  const out: number[] = []
  for (let v = start; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6))
  return out
}

export function DischargeChart({
  river,
  readings,
  forecast = [],
}: {
  river: River
  readings: Reading[]
  forecast?: Reading[]
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)

  const { xOf, yOf, path, forecastPath, yTicks, xTicks, tMin, tMax, yMax } = useMemo(() => {
    const t0 = readings[0]?.t ?? 0
    const lastObs = readings[readings.length - 1]
    const t1 = forecast.length
      ? forecast[forecast.length - 1].t
      : lastObs?.t ?? 1
    const vMax = Math.max(
      ...readings.map((r) => r.value),
      ...forecast.map((r) => r.value),
    )
    // headroom above the max reading; include the top of the good band when close
    const yTop = vMax * 1.15
    const xOf = (t: number) =>
      PAD.left + ((t - t0) / Math.max(t1 - t0, 1)) * (W - PAD.left - PAD.right)
    const yOf = (v: number) =>
      H - PAD.bottom - (v / yTop) * (H - PAD.top - PAD.bottom)
    const path = readings
      .map((r, i) => `${i ? 'L' : 'M'}${xOf(r.t).toFixed(1)},${yOf(r.value).toFixed(1)}`)
      .join('')
    // dashed continuation: last observation -> forecast days
    const fPts = lastObs ? [lastObs, ...forecast.filter((f) => f.t > lastObs.t)] : forecast
    const forecastPath = fPts
      .map((r, i) => `${i ? 'L' : 'M'}${xOf(r.t).toFixed(1)},${yOf(r.value).toFixed(1)}`)
      .join('')
    const yTicks = niceTicks(0, yTop)
    // day boundaries as x ticks
    const xTicks: number[] = []
    const d = new Date(t0)
    d.setHours(0, 0, 0, 0)
    for (let t = d.getTime(); t <= t1; t += 86400_000) {
      if (t >= t0) xTicks.push(t)
    }
    // thin to at most 8 labels
    const stride = Math.ceil(xTicks.length / 8)
    return {
      xOf,
      yOf,
      path,
      forecastPath,
      yTicks,
      xTicks: xTicks.filter((_, i) => i % stride === 0),
      tMin: t0,
      tMax: t1,
      yMax: yTop,
    }
  }, [readings, forecast])

  const hoverSet = useMemo(
    () => (forecast.length ? [...readings, ...forecast] : readings),
    [readings, forecast],
  )
  const hovered = useMemoHover(hoverSet, hoverX, tMin, tMax)

  if (readings.length === 0) return null

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect()
    const fx = ((e.clientX - rect.left) / rect.width) * W
    if (fx < PAD.left || fx > W - PAD.right) return setHoverX(null)
    setHoverX(fx)
  }

  const fmtDay = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={`${river.parameter} at ${river.stationName}, recent readings`}
      onPointerMove={onMove}
      onPointerLeave={() => setHoverX(null)}
    >
      {/* runnability washes */}
      {river.bands.map((b, i) => {
        const y1 = yOf(Math.min(b.max, yMax))
        const y2 = yOf(Math.min(b.min, yMax))
        if (b.min >= yMax) return null
        return (
          <rect
            key={i}
            x={PAD.left}
            width={W - PAD.left - PAD.right}
            y={y1}
            height={Math.max(y2 - y1, 0)}
            fill={bandFill[b.quality]}
          />
        )
      })}

      {/* grid + y axis labels */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke="var(--grid)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={yOf(v) + 4}
            textAnchor="end"
            fontSize="11.5"
            fill="var(--ink-3)"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {v}
          </text>
        </g>
      ))}

      {/* x axis day labels */}
      {xTicks.map((t) => (
        <text
          key={t}
          x={xOf(t)}
          y={H - 8}
          textAnchor="middle"
          fontSize="11.5"
          fill="var(--ink-3)"
        >
          {fmtDay(t)}
        </text>
      ))}

      {/* baseline */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={yOf(0)}
        y2={yOf(0)}
        stroke="var(--axis)"
        strokeWidth="1"
      />

      {/* "now" divider between observed and predicted */}
      {forecast.length > 0 && readings.length > 0 && (
        <g>
          <line
            x1={xOf(readings[readings.length - 1].t)}
            x2={xOf(readings[readings.length - 1].t)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--axis)"
            strokeWidth="1"
          />
          <text
            x={xOf(readings[readings.length - 1].t) + 6}
            y={PAD.top + 12}
            fontSize="11"
            fill="var(--ink-3)"
          >
            forecast →
          </text>
        </g>
      )}

      {/* the series */}
      <path d={path} fill="none" stroke="var(--river)" strokeWidth="2" strokeLinejoin="round" />

      {/* predicted flow, dashed */}
      {forecastPath && (
        <path
          d={forecastPath}
          fill="none"
          stroke="var(--river)"
          strokeWidth="2"
          strokeDasharray="6 5"
          strokeLinejoin="round"
          opacity="0.85"
        />
      )}

      {/* crosshair + tooltip */}
      {hovered && (
        <g pointerEvents="none">
          <line
            x1={xOf(hovered.t)}
            x2={xOf(hovered.t)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--axis)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={xOf(hovered.t)}
            cy={yOf(hovered.value)}
            r="4"
            fill="var(--river)"
            stroke="var(--surface)"
            strokeWidth="2"
          />
          <Tooltip
            x={xOf(hovered.t)}
            y={yOf(hovered.value)}
            lines={[
              `${hovered.value.toFixed(hovered.value < 10 ? 2 : 1)} ${river.units}`,
              new Date(hovered.t).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            ]}
          />
        </g>
      )}
    </svg>
  )
}

function useMemoHover(
  readings: Reading[],
  hoverX: number | null,
  tMin: number,
  tMax: number,
): Reading | null {
  return useMemo(() => {
    if (hoverX == null || readings.length === 0) return null
    const frac = (hoverX - PAD.left) / (W - PAD.left - PAD.right)
    const t = tMin + frac * (tMax - tMin)
    // binary search nearest reading
    let lo = 0
    let hi = readings.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (readings[mid].t < t) lo = mid
      else hi = mid
    }
    return Math.abs(readings[lo].t - t) < Math.abs(readings[hi].t - t)
      ? readings[lo]
      : readings[hi]
  }, [readings, hoverX, tMin, tMax])
}

function Tooltip({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  const w = 128
  const h = 40
  const left = x + 12 + w > W - PAD.right ? x - w - 12 : x + 12
  const top = Math.max(Math.min(y - h / 2, H - PAD.bottom - h), PAD.top)
  return (
    <g>
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx="6"
        fill="var(--surface-raised)"
        stroke="var(--hairline)"
      />
      <text x={left + 10} y={top + 17} fontSize="12.5" fontWeight="600" fill="var(--ink)"
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {lines[0]}
      </text>
      <text x={left + 10} y={top + 32} fontSize="11" fill="var(--ink-3)">
        {lines[1]}
      </text>
    </g>
  )
}
