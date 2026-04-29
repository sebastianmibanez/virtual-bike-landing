import { useState, useEffect, useRef } from 'react'
import { tramosPorGenero } from '../config/categorias'
import { useVisibleInterval } from '../hooks/useVisibleInterval'

function formatCLP(n) {
  return '$' + n.toLocaleString('es-CL')
}

export default function PremiosDinero({ genero = '' }) {
  const tramos = genero === 'mujer' ? tramosPorGenero.mujer : tramosPorGenero.hombre
  const [selectedId, setSelectedId] = useState(null)
  const touchStartP = useRef(null)

  const efectivoId = selectedId && tramos.find(t => t.id === selectedId) ? selectedId : tramos[0].id
  const activeIdx = tramos.findIndex(t => t.id === efectivoId)
  const tramo = tramos[activeIdx]
  const esDamas = genero === 'mujer'

  const goTo = (idx) => {
    setSelectedId(tramos[idx].id)
  }

  useEffect(() => {
    setSelectedId(null)
  }, [genero])

  useVisibleInterval(() => {
    setSelectedId(id => {
      const cur = tramos.findIndex(t => t.id === (id && tramos.find(x => x.id === id) ? id : tramos[0].id))
      return tramos[(cur + 1) % tramos.length].id
    })
  }, 3500)

  return (
    <section id="premios-dinero" className="relative pt-36 md:pt-48 pb-24 md:pb-36 overflow-hidden">
      <div className="px-6 md:px-12" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Encabezado */}
        <div className="mb-10">
          <p className="text-[#f5e400] text-xs uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
            Premios en dinero · Clásica 2026
          </p>
          <h2 className="text-4xl md:text-6xl text-white uppercase leading-none mb-4" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
            {esDamas ? 'Premios' : 'Premios'} <span className="text-[#f5e400]">por categoría</span>
          </h2>
          <p className="text-white/50 text-sm md:text-base" style={{ maxWidth: '42rem' }}>
            {esDamas
              ? 'Los premios escalan según cuántas damas se inscriban en cada categoría. Mientras más participantes, mayor es el pozo.'
              : 'Los premios escalan según cuántos se inscriban en cada grupo. Mientras más competidores en tu categoría, más dinero reparte el podio.'
            }
          </p>
        </div>

        {/* Tabs desktop / dots mobile */}
        <div
          className="mb-8"
          onTouchStart={e => { touchStartP.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStartP.current === null) return
            const diff = touchStartP.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 40) goTo(diff > 0 ? (activeIdx + 1) % tramos.length : (activeIdx - 1 + tramos.length) % tramos.length)
            touchStartP.current = null
          }}
        >
          <div className={`hidden md:grid gap-px bg-white/5 ${esDamas ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {tramos.map((t, i) => (
              <button key={t.id} onClick={() => goTo(i)}
                className={`p-4 flex items-center justify-center text-center min-h-[52px] transition-all ${efectivoId === t.id ? 'bg-[#f5e400] text-black' : 'bg-[#0a0a0a] text-white/50 hover:text-white hover:bg-white/5'}`}>
                <span className="text-sm uppercase leading-tight" style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}>{t.subtitulo}</span>
              </button>
            ))}
          </div>
          {/* Mobile: badge visible + dots */}
          <div className="md:hidden">
            <div className="bg-white/5 px-6 py-4 mb-4 text-center">
              <span className="text-[#f5e400] text-lg uppercase leading-tight" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>{tramo.subtitulo}</span>
            </div>
            <div className="flex justify-center gap-2">
              {tramos.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-[#f5e400]' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Podio completo */}
        <div className="space-y-2">
          {tramo.puestos.map((p) => (
            <div
              key={p.lugar}
              className={`flex items-center justify-between gap-4 p-3 md:p-4 ${p.lugar === 1 ? 'bg-[#f5e400] text-black' : 'bg-black/40 text-white'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`text-3xl md:text-4xl leading-none flex-shrink-0 ${p.lugar === 1 ? 'text-black' : 'text-white/30'}`}
                  style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
                >
                  {p.lugar}°
                </div>
                <div className="flex items-baseline gap-3 min-w-0">
                  <span
                    className={`text-xl md:text-2xl uppercase leading-none flex-shrink-0 ${p.lugar === 1 ? 'text-black' : 'text-white'}`}
                    style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
                  >
                    {formatCLP(p.premio)}
                  </span>
                  <span className={`text-sm md:text-base ${p.lugar === 1 ? 'text-black/50' : 'text-white/30'}`}>+</span>
                  <span className={`text-sm md:text-base uppercase ${p.lugar === 1 ? 'text-black/80' : 'text-white/60'}`} style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
                    {p.extra}
                  </span>
                </div>
              </div>
              {p.lugar === 1 && (
                <span
                  className="bg-black text-[#f5e400] text-[10px] px-2.5 py-1 uppercase tracking-widest flex-shrink-0"
                  style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}
                >
                  Champion
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
