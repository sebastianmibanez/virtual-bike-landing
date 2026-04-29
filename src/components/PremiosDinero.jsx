import { useState, useEffect, useRef } from 'react'

const tramosPorGenero = {
  hombre: [
    {
      id: 'h-60',
      badge: '+60 inscritos',
      subtitulo: 'Cuando el grupo supera los 60 participantes',
      puestos: [
        { lugar: 1, premio: 100000, extra: 'Medallón + Tricota' },
        { lugar: 2, premio: 80000,  extra: 'Medallón' },
        { lugar: 3, premio: 70000,  extra: 'Medallón' },
        { lugar: 4, premio: 60000,  extra: 'Medallón' },
        { lugar: 5, premio: 50000,  extra: 'Medallón' },
        { lugar: 6, premio: 40000,  extra: 'Medallón' },
        { lugar: 7, premio: 40000,  extra: 'Medallón' },
      ],
    },
    {
      id: 'h-59',
      badge: '-59 inscritos',
      subtitulo: 'Entre 40 y 59 participantes en el grupo',
      puestos: [
        { lugar: 1, premio: 80000, extra: 'Medallón + Tricota' },
        { lugar: 2, premio: 70000, extra: 'Medallón' },
        { lugar: 3, premio: 60000, extra: 'Medallón' },
        { lugar: 4, premio: 50000, extra: 'Medallón' },
        { lugar: 5, premio: 40000, extra: 'Medallón' },
      ],
    },
    {
      id: 'h-39',
      badge: '-39 inscritos',
      subtitulo: 'Entre 20 y 39 participantes en el grupo',
      puestos: [
        { lugar: 1, premio: 60000, extra: 'Medallón + Tricota' },
        { lugar: 2, premio: 50000, extra: 'Medallón' },
        { lugar: 3, premio: 40000, extra: 'Medallón' },
        { lugar: 4, premio: 40000, extra: 'Medallón' },
        { lugar: 5, premio: 40000, extra: 'Medallón' },
      ],
    },
    {
      id: 'h-19',
      badge: '-19 inscritos',
      subtitulo: 'Hasta 19 participantes en el grupo',
      puestos: [
        { lugar: 1, premio: 40000, extra: 'Medallón + Tricota' },
        { lugar: 2, premio: 30000, extra: 'Medallón' },
        { lugar: 3, premio: 20000, extra: 'Medallón' },
        { lugar: 4, premio: 20000, extra: 'Medallón' },
        { lugar: 5, premio: 20000, extra: 'Medallón' },
      ],
    },
  ],
  mujer: [
    {
      id: 'd-10',
      badge: '+10 inscritas',
      subtitulo: 'Más de 10 participantes en la categoría',
      puestos: [
        { lugar: 1, premio: 50000, extra: 'Medallón + Tricota' },
        { lugar: 2, premio: 40000, extra: 'Medallón' },
        { lugar: 3, premio: 30000, extra: 'Medallón' },
        { lugar: 4, premio: 20000, extra: 'Medallón' },
        { lugar: 5, premio: 10000, extra: 'Medallón' },
      ],
    },
    {
      id: 'd-5',
      badge: '5–10 inscritas',
      subtitulo: 'Entre 5 y 10 participantes en la categoría',
      puestos: [
        { lugar: 1, premio: 40000, extra: 'Medallón + Tricota' },
        { lugar: 2, premio: 30000, extra: 'Medallón' },
        { lugar: 3, premio: 20000, extra: 'Medallón' },
        { lugar: 4, premio: 10000, extra: 'Medallón' },
        { lugar: 5, premio: 10000, extra: 'Medallón' },
      ],
    },
    {
      id: 'd-3',
      badge: '3 o menos',
      subtitulo: 'Hasta 3 participantes en la categoría',
      puestos: [
        { lugar: 1, premio: 20000, extra: 'Medallón' },
        { lugar: 2, premio: 10000, extra: 'Medallón' },
        { lugar: 3, premio: 10000, extra: 'Medallón' },
      ],
    },
  ],
}

function formatCLP(n) {
  return '$' + n.toLocaleString('es-CL')
}

export default function PremiosDinero({ genero = '' }) {
  const tramos = genero === 'mujer' ? tramosPorGenero.mujer : tramosPorGenero.hombre
  const [selectedId, setSelectedId] = useState(null)
  const timerP = useRef(null)
  const touchStartP = useRef(null)

  const efectivoId = selectedId && tramos.find(t => t.id === selectedId) ? selectedId : tramos[0].id
  const activeIdx = tramos.findIndex(t => t.id === efectivoId)
  const tramo = tramos[activeIdx]
  const esDamas = genero === 'mujer'

  const goTo = (idx) => {
    clearInterval(timerP.current)
    setSelectedId(tramos[idx].id)
  }

  useEffect(() => {
    setSelectedId(null)
  }, [genero])

  useEffect(() => {
    timerP.current = setInterval(() => {
      setSelectedId(id => {
        const cur = tramos.findIndex(t => t.id === (id && tramos.find(x => x.id === id) ? id : tramos[0].id))
        return tramos[(cur + 1) % tramos.length].id
      })
    }, 3500)
    return () => clearInterval(timerP.current)
  }, [tramos])

  return (
    <section id="premios-dinero" className="relative py-20 md:py-28 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src={`${import.meta.env.BASE_URL}images/virtual15.webp`} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative z-10 px-6 md:px-12" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>

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
                <span className="text-base uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}>{t.badge}</span>
              </button>
            ))}
          </div>
          {/* Mobile: badge visible + dots */}
          <div className="md:hidden">
            <div className="bg-white/5 px-6 py-4 mb-4 text-center">
              <span className="text-[#f5e400] text-2xl uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>{tramo.badge}</span>
            </div>
            <div className="flex justify-center gap-2">
              {tramos.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-[#f5e400]' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Encabezado del tramo */}
        <div className="mb-6">
          <h3 className="text-xl md:text-2xl text-white uppercase leading-tight" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
            {tramo.subtitulo}
          </h3>
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
                <div className="min-w-0">
                  <div
                    className={`text-xl md:text-2xl uppercase leading-none ${p.lugar === 1 ? 'text-black' : 'text-white'}`}
                    style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
                  >
                    {formatCLP(p.premio)}
                  </div>
                  <div className={`text-[11px] md:text-xs mt-1 ${p.lugar === 1 ? 'text-black/70' : 'text-white/50'}`}>
                    {p.extra}
                  </div>
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
