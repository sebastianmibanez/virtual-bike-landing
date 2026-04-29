const clasica3 = `${import.meta.env.BASE_URL}images/virtual15.webp`
import { useState, useEffect, useRef } from 'react'

const horariosPorGenero = {
  hombre: [
    { hora: '08:00', label: 'Acreditación', categorias: 'Todas las categorías', destacado: false },
    { hora: '09:00', label: 'Debutantes', categorias: 'Sin límite de edad', destacado: true },
    { hora: '09:20', label: 'Master C', categorias: 'Mayores de 50 años', destacado: true },
    { hora: '11:30', label: 'Competidores', categorias: 'Todo Competidor · Sub/23', destacado: true },
    { hora: '11:40', label: 'Master A y B', categorias: 'Master A (30-39) · Master B (40-49)', destacado: true },
  ],
  mujer: [
    { hora: '08:00', label: 'Acreditación', categorias: 'Todas las categorías', destacado: false },
    { hora: '09:20', label: 'Damas', categorias: 'Menor 23 · Mayor 23 · Master mayor 35', destacado: true },
  ],
  '': [
    { hora: '08:00', label: 'Acreditación', categorias: 'Todas las categorías', destacado: false },
    { hora: '09:00', label: 'Debutantes', categorias: 'Sin límite de edad', destacado: true },
    { hora: '09:20', label: 'Damas · Master C', categorias: 'Todas las categorías femeninas · Mayores de 50', destacado: true },
    { hora: '11:30', label: 'Competidores', categorias: 'Todo Competidor · Sub/23', destacado: true },
    { hora: '11:40', label: 'Master A y B', categorias: 'Master A (30-39) · Master B (40-49)', destacado: true },
  ],
}

const datos = [
  {
    label: 'Circuito',
    value: 'Alto Noviciado, Lampa',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    label: 'Vueltas',
    value: '3 giros al circuito',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
  {
    label: 'Metas volantes',
    value: '3 metas volantes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    label: 'Sistema',
    value: 'Foto finish oficial',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
]

const IconHombre = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
)
const IconMujer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="8" r="4" /><path d="M12 12v8M9 17h6" />
  </svg>
)

export default function DiaCarrera({ genero = '', setGenero }) {
  const horarios = horariosPorGenero[genero] ?? horariosPorGenero['']
  const [activeH, setActiveH] = useState(0)
  const timerH = useRef(null)
  const touchStartH = useRef(null)

  useEffect(() => {
    setActiveH(0)
  }, [genero])

  useEffect(() => {
    timerH.current = setInterval(() => {
      setActiveH(i => (i + 1) % horarios.length)
    }, 3000)
    return () => clearInterval(timerH.current)
  }, [horarios.length])
  return (
    <section id="dia-carrera" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 opacity-30">
        <img src={clasica3} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/80 via-transparent to-[#080808]/80" />
      </div>

      <div className="relative z-10 px-6 md:px-12" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Encabezado */}
        <div className="mb-14 text-center">
          <p className="text-[#f5e400] text-xs uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
            21 de Mayo · 2026
          </p>
          <h2 className="text-4xl md:text-6xl text-white uppercase leading-none" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
            El día de <span className="text-[#f5e400]">carrera</span>
          </h2>
          <p className="text-white/50 text-sm md:text-base mt-4" style={{ maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
            Una jornada completa de competencia, premios y buen ambiente en Alto Noviciado
          </p>
        </div>

        {/* Video circuito */}
        <div className="mb-8 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000' }}>
          <iframe
            src="https://www.youtube.com/embed/EF120hfcYJ4?rel=0&modestbranding=1&color=white"
            title="Circuito Clásica Virtual 2026"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>

        {/* 4 datos clave con SVG */}
        <div className="grid grid-cols-4 gap-px bg-white/5 mb-14">
          {datos.map((d) => (
            <div key={d.label} className="bg-[#080808] py-3 px-2 md:px-6 flex flex-col items-center text-center gap-1 md:gap-2">
              <span className="text-[#f5e400] opacity-70">{d.icon}</span>
              <div>
                <div className="text-white text-[10px] md:text-sm uppercase leading-tight" style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}>
                  {d.value}
                </div>
                <div className="text-white/30 text-[8px] md:text-[9px] uppercase tracking-widest mt-0.5">{d.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla horarios */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl md:text-3xl text-white uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
              Horarios <span className="text-[#f5e400]">por categoría</span>
            </h3>
            <div className="flex gap-px flex-shrink-0">
              {[
                { val: 'hombre', label: 'H', Icon: IconHombre },
                { val: 'mujer',  label: 'M', Icon: IconMujer  },
              ].map(({ val, label, Icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGenero?.(val)}
                  title={val.charAt(0).toUpperCase() + val.slice(1)}
                  className={`flex items-center gap-1.5 px-3 py-2 transition-all text-xs uppercase ${
                    genero === val
                      ? 'bg-[#f5e400] text-black'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                  style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, letterSpacing: '0.08em' }}
                >
                  <Icon />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel mobile / lista desktop */}
          <div
            className="md:hidden"
            onTouchStart={e => { touchStartH.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (touchStartH.current === null) return
              const diff = touchStartH.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 40) {
                clearInterval(timerH.current)
                setActiveH(i => diff > 0 ? (i + 1) % horarios.length : (i - 1 + horarios.length) % horarios.length)
              }
              touchStartH.current = null
            }}
          >
            {/* Slide activo */}
            <div className="bg-white/5 p-6 min-h-[110px] flex flex-col justify-center">
              <div className="flex items-center gap-4">
                <span className={`text-4xl tabular-nums ${horarios[activeH].destacado ? 'text-[#f5e400]' : 'text-white/30'}`} style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
                  {horarios[activeH].hora}
                </span>
                <div>
                  <div className="text-white text-xl uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>{horarios[activeH].label}</div>
                  <div className="text-white/50 text-sm mt-0.5">{horarios[activeH].categorias}</div>
                </div>
              </div>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {horarios.map((_, i) => (
                <button key={i} onClick={() => { clearInterval(timerH.current); setActiveH(i) }}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeH ? 'bg-[#f5e400]' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>

          {/* Lista completa en desktop */}
          <div className="hidden md:block divide-y divide-white/5">
            {horarios.map((h, i) => (
              <div key={i} className="flex items-center gap-6 py-6">
                <div className="w-20 flex-shrink-0">
                  <span className={`text-3xl leading-none tabular-nums ${h.destacado ? 'text-[#f5e400]' : 'text-white/30'}`} style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>{h.hora}</span>
                </div>
                <div className="flex-shrink-0"><div className={`w-2 h-2 rounded-full ${h.destacado ? 'bg-[#f5e400]' : 'bg-white/20'}`} /></div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xl uppercase leading-tight ${h.destacado ? 'text-white' : 'text-white/50'}`} style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}>{h.label}</div>
                  <div className="text-white/40 text-sm mt-0.5">{h.categorias}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
