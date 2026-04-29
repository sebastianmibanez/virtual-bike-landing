const clasica1 = `${import.meta.env.BASE_URL}images/virtual13.webp`

const categorias = [
  {
    nombre: 'Debutantes',
    giros: 2,
    km: 60,
    largada: 'Próximamente',
    color: '#f5e400',
  },
  {
    nombre: 'Damas',
    giros: 2,
    km: 60,
    largada: 'Próximamente',
    color: '#f5e400',
  },
  {
    nombre: 'Todo Competidor',
    giros: 3,
    km: 90,
    largada: 'Próximamente',
    color: '#f5e400',
  },
  {
    nombre: 'Elite',
    giros: 4,
    km: 120,
    largada: 'Próximamente',
    color: '#f5e400',
  },
]

function CategoriaCard({ nombre, giros, km, largada, color }) {
  return (
    <div className="flex flex-col p-8">
      <div className="mb-6">
        <div
          className="text-6xl md:text-7xl leading-none"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, color }}
        >
          {giros}<span className="text-3xl md:text-4xl text-white/60 ml-1">giros</span>
        </div>
        <div
          className="text-2xl text-white/40 mt-1"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
        >
          {km} km
        </div>
      </div>

      <h3
        className="text-2xl md:text-3xl text-white uppercase mb-2"
        style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
      >
        {nombre}
      </h3>

      <div className="text-gray-400 text-sm mb-6">
        Largada: <span className="text-white/70">{largada}</span>
      </div>

      <div className="mt-auto">
        <button
          className="w-full border-t border-white/20 text-white/40 py-2.5 text-xs uppercase tracking-widest"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
        >
          Circuito próximamente
        </button>
      </div>
    </div>
  )
}

export default function Categorias() {
  return (
    <section id="categorias" className="relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0">
        <img src={clasica1} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 py-24 px-6 md:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="text-[#f5e400] text-xs uppercase tracking-[0.3em] mb-4"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
          >
            Noviciado Alto, Lampa
          </p>
          <h2
            className="text-4xl md:text-6xl lg:text-7xl text-white uppercase leading-tight"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
          >
            El desafío te espera<br />
            <span className="text-[#f5e400]">en cada kilómetro</span>
          </h2>
          <p className="text-white/50 mt-4 text-base md:text-lg">
            Elige tu categoría y demuestra de qué estás hecho
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-16">
          {categorias.map((c, i) => (
            <CategoriaCard key={i} {...c} />
          ))}
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-12 mb-14">
          {[
            { value: '4', label: 'Categorías' },
            { value: '120km', label: 'Distancia máxima' },
            { value: 'Circuito', label: 'Noviciado Alto, Lampa' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-4xl md:text-5xl text-[#f5e400]"
                style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
              >
                {s.value}
              </div>
              <div className="text-white/40 text-xs uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="#inscripcion"
            className="inline-block bg-[#f5e400] text-black px-12 py-4 text-base uppercase hover:bg-white transition-all duration-200 hover:scale-105 shadow-2xl shadow-[#f5e400]/20"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, letterSpacing: '0.08em' }}
          >
            Inscríbete aquí →
          </a>
        </div>
      </div>
    </section>
  )
}
