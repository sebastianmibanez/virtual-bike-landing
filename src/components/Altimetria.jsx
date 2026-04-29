import { useState, useRef, useMemo } from 'react'
import elevationData from '../config/elevation.json'

const { points, totalKm, gain, minEle, maxEle } = elevationData

const markers = [
  { km: 0,    label: 'Salida',           type: 'start' },
  { km: 4.5,  label: 'Giro →',           type: 'giro' },
  { km: 12.0, label: 'Ruta 68 ①',        type: 'giro68' },
  { km: 15.6, label: 'Meta V. ①',        type: 'mv' },
  { km: 26.3, label: 'Lo Echevers ①',    type: 'echevers' },
  { km: 40.2, label: 'Ruta 68 ②',        type: 'giro68' },
  { km: 42.9, label: 'Meta V. ②',        type: 'mv' },
  { km: 54.3, label: 'Lo Echevers ②',    type: 'echevers' },
  { km: 69.0, label: 'Ruta 68 ③',        type: 'giro68' },
  { km: 72.4, label: 'Meta V. ③',        type: 'mv' },
  { km: 83.0, label: 'Lo Echevers ③',    type: 'echevers' },
  { km: 92.0, label: '→ Alto Noviciado', type: 'giro' },
  { km: 96.6, label: 'Recta final',      type: 'final' },
  { km: 98.3, label: 'Meta',             type: 'start' },
]

const typeColors = {
  start: '#4ade80',
  giro: 'rgba(255,255,255,0.35)',
  giro68: '#60a5fa',
  mv: '#f97316',
  echevers: '#c084fc',
  final: '#ef4444',
}

export default function Altimetria() {
  const [hoverIdx, setHoverIdx] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const svgRef = useRef(null)
  const fsSvgRef = useRef(null)

  const grades = useMemo(() => {
    const g = [0]
    for (let i = 1; i < points.length; i++) {
      const dKm = points[i][0] - points[i - 1][0]
      const dEle = points[i][1] - points[i - 1][1]
      g.push(dKm > 0 ? (dEle / (dKm * 1000)) * 100 : 0)
    }
    return g
  }, [])

  const W = 1000
  const padL = 20
  const padR = 20
  const H = 260
  const padTop = 55
  const padBot = 30
  const chartH = H - padTop - padBot
  const eleRange = maxEle - minEle || 1

  const toX = (km) => padL + (km / totalKm) * (W - padL - padR)
  const toY = (ele) => padTop + chartH - ((ele - minEle) / eleRange) * chartH

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`
  ).join(' ')

  const areaD = pathD + ` L${toX(points[points.length - 1][0]).toFixed(1)},${H - padBot} L0,${H - padBot} Z`

  const handleMove = (e, ref) => {
    const svg = ref?.current || svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * totalKm
    let closestIdx = 0
    let minD = Infinity
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i][0] - x)
      if (d < minD) { minD = d; closestIdx = i }
    }
    setHoverIdx(closestIdx)
  }

  const gridLines = []
  const eleStep = Math.ceil(eleRange / 4 / 10) * 10
  for (let e = Math.ceil(minEle / eleStep) * eleStep; e <= maxEle; e += eleStep) {
    gridLines.push(e)
  }

  const markerEles = useMemo(() =>
    markers.map(m => {
      let best = points[0]
      let minD = Infinity
      for (const p of points) {
        const d = Math.abs(p[0] - m.km)
        if (d < minD) { minD = d; best = p }
      }
      return best[1]
    }), [])

  const hp = hoverIdx !== null ? points[hoverIdx] : null
  const hg = hoverIdx !== null ? grades[hoverIdx] : 0

  const handleTouch = (e, ref) => {
    const svg = ref?.current || svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const touch = e.touches[0]
    const x = ((touch.clientX - rect.left) / rect.width) * totalKm
    let closestIdx = 0
    let minD = Infinity
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i][0] - x)
      if (d < minD) { minD = d; closestIdx = i }
    }
    setHoverIdx(closestIdx)
  }

  const legend = [
    { color: '#4ade80', label: 'Salida/Meta' },
    { color: '#60a5fa', label: 'Giro Ruta 68' },
    { color: '#c084fc', label: 'Lo Echevers' },
    { color: '#f97316', label: 'Meta volante' },
    { color: '#ef4444', label: 'Recta final' },
  ]

  const renderChart = (ref, gradId) => (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ cursor: 'crosshair' }}
      onMouseMove={(e) => handleMove(e, ref)}
      onTouchMove={(e) => { e.preventDefault(); handleTouch(e, ref) }}
      onMouseLeave={() => setHoverIdx(null)}
      onTouchEnd={() => setHoverIdx(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5e400" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f5e400" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridLines.map(e => (
        <g key={e}>
          <line x1="0" y1={toY(e)} x2={W} y2={toY(e)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <text x="4" y={toY(e) - 3} fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="Barlow Condensed">{e}m</text>
        </g>
      ))}

      {[0, Math.round(totalKm / 4), Math.round(totalKm / 2), Math.round(totalKm * 3 / 4), Math.round(totalKm)].map(km => (
        <text key={km} x={toX(km)} y={H - 6} fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="Barlow Condensed" textAnchor="middle">
          {km} km
        </text>
      ))}

      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke="#f5e400" strokeWidth="1.5" />

      {markers.map((m, i) => {
        const x = toX(m.km)
        const y = toY(markerEles[i])
        const color = typeColors[m.type]
        const isMain = m.type === 'start' || m.type === 'final'
        const isLower = m.type === 'mv' || m.type === 'final'
        const labelY = isLower ? padTop - 2 : padTop - 16
        const anchor = m.km < 3 ? 'start' : m.km > totalKm - 3 ? 'end' : 'middle'
        return (
          <g key={`${m.km}-${m.label}`}>
            <line x1={x} y1={y} x2={x} y2={labelY + 4} stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
            <circle cx={x} cy={y} r={isMain ? 4 : 3} fill={color} />
            <text x={x} y={labelY} fill={color} fontSize={isMain ? '10' : '8.5'} fontFamily="Barlow Condensed" fontWeight={isMain ? '800' : '600'} textAnchor={anchor} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {m.label}
            </text>
          </g>
        )
      })}

      {hp && (
        <>
          <line x1={toX(hp[0])} y1={padTop} x2={toX(hp[0])} y2={H - padBot} stroke="#f5e400" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx={toX(hp[0])} cy={toY(hp[1])} r="4" fill="#f5e400" />
          <rect x={Math.min(Math.max(toX(hp[0]) - 55, 0), W - 110)} y={Math.max(toY(hp[1]) - 28, padTop)} width="110" height="20" rx="3" fill="rgba(0,0,0,0.9)" />
          <text x={Math.min(Math.max(toX(hp[0]), 55), W - 55)} y={Math.max(toY(hp[1]) - 14, padTop + 15)} fill="#e6c200" fontSize="11" fontFamily="Barlow Condensed" fontWeight="700" textAnchor="middle">
            {hg > 0 ? '+' : ''}{hg.toFixed(1)}% · {hp[0]}km · {hp[1]}m
          </text>
        </>
      )}
    </svg>
  )

  return (
    <>
    <div className="rounded-xl overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-2 border-b border-white/5">
        {legend.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="text-white/40 text-[9px] uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="px-2 md:px-4 py-4 relative">
        <div style={{ maxHeight: '240px' }}>
          {renderChart(svgRef, 'eleGrad')}
        </div>
        {/* Fullscreen button - mobile only */}
        <button
          onClick={() => setFullscreen(true)}
          className="md:hidden absolute bottom-6 right-4 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg p-2 backdrop-blur-sm transition-all"
          aria-label="Ver altimetría en pantalla completa"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>
    </div>

    {/* Fullscreen landscape modal */}
    {fullscreen && (
      <div
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{ background: '#0a0a0a' }}
        onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false) }}
      >
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {legend.map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <span className="text-white/40 text-[9px] uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed' }}>{l.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setFullscreen(false)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 ml-4 flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-4 pb-4 min-h-0">
          {renderChart(fsSvgRef, 'eleGradFs')}
        </div>
      </div>
    )}
    </>
  )
}
