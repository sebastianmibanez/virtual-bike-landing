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
  const svgRef = useRef(null)

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
  const H = 240
  const padTop = 42
  const padBot = 30
  const chartH = H - padTop - padBot
  const eleRange = maxEle - minEle || 1

  const toX = (km) => (km / totalKm) * W
  const toY = (ele) => padTop + chartH - ((ele - minEle) / eleRange) * chartH

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`
  ).join(' ')

  const areaD = pathD + ` L${toX(points[points.length - 1][0]).toFixed(1)},${H - padBot} L0,${H - padBot} Z`

  const handleMove = (e) => {
    const svg = svgRef.current
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

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-2 border-b border-white/5">
        {[
          { color: '#4ade80', label: 'Salida/Meta' },
          { color: '#60a5fa', label: 'Giro Ruta 68' },
          { color: '#c084fc', label: 'Lo Echevers' },
          { color: '#f97316', label: 'Meta volante' },
          { color: '#ef4444', label: 'Recta final' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="text-white/40 text-[9px] uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="px-2 md:px-4 py-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 'auto', maxHeight: '240px', cursor: 'crosshair' }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5e400" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f5e400" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map(e => (
            <g key={e}>
              <line x1="0" y1={toY(e)} x2={W} y2={toY(e)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              <text x="4" y={toY(e) - 3} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Barlow Condensed">{e}m</text>
            </g>
          ))}

          {[0, Math.round(totalKm / 4), Math.round(totalKm / 2), Math.round(totalKm * 3 / 4), Math.round(totalKm)].map(km => (
            <text key={km} x={toX(km)} y={H - 8} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Barlow Condensed" textAnchor="middle">
              {km} km
            </text>
          ))}

          <path d={areaD} fill="url(#eleGrad)" />
          <path d={pathD} fill="none" stroke="#f5e400" strokeWidth="1.5" />

          {/* Reference markers */}
          {markers.map((m, i) => {
            const x = toX(m.km)
            const y = toY(markerEles[i])
            const color = typeColors[m.type]
            const isMain = m.type === 'start' || m.type === 'final'
            return (
              <g key={`${m.km}-${m.label}`}>
                <line x1={x} y1={y} x2={x} y2={padTop - 4} stroke={color} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                <circle cx={x} cy={y} r={isMain ? 3.5 : 2.5} fill={color} />
                <text
                  x={x}
                  y={padTop - 8}
                  fill={color}
                  fontSize={isMain ? '8.5' : '7'}
                  fontFamily="Barlow Condensed"
                  fontWeight={isMain ? '800' : '600'}
                  textAnchor="middle"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}
                >
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
              <text x={Math.min(Math.max(toX(hp[0]), 55), W - 55)} y={Math.max(toY(hp[1]) - 14, padTop + 15)} fill="#f5e400" fontSize="10" fontFamily="Barlow Condensed" fontWeight="700" textAnchor="middle">
                {hg > 0 ? '+' : ''}{hg.toFixed(1)}% · {hp[0]}km · {hp[1]}m
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
