import { useMemo, useRef, useState } from 'react'
import { compactInr, inr } from '../hooks'

// Revenue over time. Area in ember, order count as quiet bars underneath; hover shows the day.
export function RevenueChart({ series = [], height = 240 }) {
  const ref = useRef()
  const [hover, setHover] = useState(null)
  const W = 720
  const H = height
  const pad = { t: 16, r: 12, b: 26, l: 48 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const { path, area, maxRev, ticks, maxOrders } = useMemo(() => {
    const maxRev = Math.max(1000, ...series.map((d) => d.revenue))
    const nice = Math.pow(10, Math.floor(Math.log10(maxRev)))
    const top = Math.ceil(maxRev / nice) * nice
    const maxOrders = Math.max(1, ...series.map((d) => d.orders))
    const x = (i) => pad.l + (series.length <= 1 ? iw / 2 : (i * iw) / (series.length - 1))
    const y = (v) => pad.t + ih - (v / top) * ih
    const pts = series.map((d, i) => [x(i), y(d.revenue)])
    // smooth curve (monotone-ish cubic)
    let path = ''
    pts.forEach(([px, py], i) => {
      if (i === 0) return (path = `M${px},${py}`)
      const [qx, qy] = pts[i - 1]
      const mx = (qx + px) / 2
      path += ` C${mx},${qy} ${mx},${py} ${px},${py}`
    })
    const area = pts.length ? `${path} L${pts.at(-1)[0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih} Z` : ''
    return { path, area, maxRev: top, maxOrders, ticks: [0, top / 2, top] }
  }, [series, ih, iw, pad.l, pad.t])

  const xAt = (i) => pad.l + (series.length <= 1 ? iw / 2 : (i * iw) / (series.length - 1))
  const yAt = (v) => pad.t + ih - (v / maxRev) * ih
  const labelEvery = Math.ceil(series.length / 6)

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - pad.l) / iw) * (series.length - 1))
    setHover(Math.max(0, Math.min(series.length - 1, i)))
  }
  const h = hover !== null ? series[hover] : null
  const barW = Math.max(2, Math.min(14, (iw / Math.max(series.length, 1)) * 0.5))

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => onMove(e.touches[0])} role="img" aria-label="Revenue by day">
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8763B" stopOpacity=".28" />
            <stop offset="100%" stopColor="#C8763B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} stroke="#E1E3DB" strokeDasharray={t ? '3 4' : ''} />
            <text x={pad.l - 8} y={yAt(t) + 4} textAnchor="end" className="fill-adm-muted text-[11px] tabular">{compactInr(t)}</text>
          </g>
        ))}
        {series.map((d, i) => (
          <rect key={d.date} x={xAt(i) - barW / 2} width={barW} y={pad.t + ih - (d.orders / maxOrders) * ih * 0.35}
            height={(d.orders / maxOrders) * ih * 0.35} rx="2" fill="#231B16" opacity={hover === i ? 0.22 : 0.08} />
        ))}
        <path d={area} fill="url(#rev-fill)" />
        <path d={path} fill="none" stroke="#C8763B" strokeWidth="2.2" strokeLinejoin="round" />
        {series.map((d, i) => i % labelEvery === 0 && (
          <text key={d.date} x={xAt(i)} y={H - 6} textAnchor="middle" className="fill-adm-muted text-[11px]">
            {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        {h && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + ih} stroke="#231B16" strokeOpacity=".25" />
            <circle cx={xAt(hover)} cy={yAt(h.revenue)} r="5" fill="#fff" stroke="#C8763B" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-adm-side px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: `clamp(0px, calc(${(xAt(hover) / W) * 100}% - 70px), calc(100% - 140px))`, width: 140 }}>
          <p className="text-white/60">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="tabular mt-0.5 text-sm font-semibold">{inr(h.revenue)}</p>
          <p className="tabular text-white/70">{h.orders} {h.orders === 1 ? 'order' : 'orders'}</p>
        </div>
      )}
    </div>
  )
}

// Donut with a legend; segments: [{ label, value, color }]
export function Donut({ segments, size = 140, centerLabel, centerValue }) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1
  const r = 52
  const C = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" style={{ width: size, height: size }} className="shrink-0 -rotate-90" role="img" aria-label={centerLabel}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#EEF0EB" strokeWidth="16" />
        {segments.map((s) => {
          const len = (s.value / total) * C
          const el = <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-offset} />
          offset += len
          return s.value ? el : null
        })}
        <g className="rotate-90" style={{ transformOrigin: '70px 70px' }}>
          <text x="70" y="68" textAnchor="middle" className="fill-adm-ink font-serif text-[26px] font-semibold tabular">{centerValue}</text>
          <text x="70" y="86" textAnchor="middle" className="fill-adm-muted text-[10px]">{centerLabel}</text>
        </g>
      </svg>
      <ul className="min-w-[140px] flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-adm-muted"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
            <span className="tabular font-medium text-adm-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
