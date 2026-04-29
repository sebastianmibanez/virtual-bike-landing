const IconHombre = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
)

const IconMujer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
    <circle cx="12" cy="8" r="4" />
    <path d="M12 12v8M9 17h6" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" opacity="0" />
  </svg>
)

export default function GeneroSwitch({ genero, setGenero }) {
  return (
    <section id="inscripcion" className="bg-[#080808] py-16 md:py-24">
      <div className="px-6 md:px-12" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Encabezado */}
        <div className="text-center mb-12">
          <p className="text-[#e6c200] text-xs uppercase tracking-[0.3em] mb-4" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
            Reserva tu cupo
          </p>
          <h2 className="text-5xl md:text-7xl text-white uppercase leading-none mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
            Inscríbete <span className="text-[#e6c200]">ahora</span>
          </h2>
          <p className="text-white/50 text-sm md:text-base">
            Clásica Virtual Bike 2026 · 21 de Mayo · Alto Noviciado
          </p>
        </div>

        {/* Switch — mismo estilo que los 4 iconos de DiaCarrera */}
        <div>
          <p className="text-center text-white/30 text-[10px] uppercase tracking-[0.3em] mb-6" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
            Paso 1 · ¿Cómo compites?
          </p>
          <div className="grid grid-cols-2 gap-px bg-white/5" style={{ maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
            {[
              { val: 'hombre', label: 'Hombre', Icon: IconHombre },
              { val: 'mujer',  label: 'Mujer',  Icon: IconMujer  },
            ].map(({ val, label, Icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => setGenero(val)}
                className={`flex flex-col items-center gap-3 py-8 px-4 transition-all ${
                  genero === val
                    ? 'bg-[#e6c200] text-black'
                    : 'bg-[#080808] text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon />
                <span className="text-xl uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.08em' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
