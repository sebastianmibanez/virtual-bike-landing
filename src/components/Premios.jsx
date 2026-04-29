const img16 = `${import.meta.env.BASE_URL}images/virtual16.webp`

const items = [
  {
    tag: 'Premiación',
    titulo: 'Cada categoría, su champion',
    body: 'Tricota de Champion al 1° de cada categoría. Top 5 con medallón de podio. Medallón finisher para los 200 primeros inscritos.',
    img: img16,
    span: 'md:col-span-2 md:row-span-2',
    size: 'lg',
  },
  {
    tag: 'En carrera',
    titulo: 'Metas volantes + foto finish',
    body: '3 metas volantes por grupo con dinero y sorpresas Virtual. Resultados oficiales por foto finish.',
    img: null,
    span: 'md:col-span-2',
  },
  {
    tag: 'Sorteos',
    titulo: 'Premios que valen pedalear',
    body: 'Bici Mini CIC · Conjunto Virtual a elección · Porta bolso Double · Productos Vittoria y Fundax.',
    img: null,
    span: 'md:col-span-2',
  },
  {
    tag: 'Cobertura',
    titulo: 'Fotos y videos GRATIS',
    body: 'Cobertura audiovisual profesional sin costo adicional para todos los participantes.',
    img: null,
    icon: '📸',
    span: '',
  },
  {
    tag: 'Ambiente',
    titulo: 'DJ + locutor en vivo',
    body: 'Música y narración desde la largada hasta el podio. Vasos oficiales CVBK / Virtual.',
    img: null,
    span: '',
  },
  {
    tag: 'Tercer tiempo',
    titulo: 'Para celebrar la meta',
    body: 'Frutas, agua, pan y pastelitos. Ambiente para compartir al cierre de la carrera.',
    img: null,
    span: '',
  },
]

function BentoCard({ tag, titulo, body, img, icon, span = '', size }) {
  const hasImg = !!img
  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-[#0f0f0f] hover:border-[#e6c200]/40 transition-all group ${span} ${
        size === 'lg' ? 'min-h-[360px] md:min-h-[480px]' : 'min-h-[220px]'
      }`}
    >
      {hasImg && (
        <>
          <img
            src={img}
            alt={tag}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </>
      )}

      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-7">
        {icon && !hasImg && <div className="text-4xl mb-3">{icon}</div>}
        <span
          className="text-[#e6c200] text-[10px] uppercase tracking-[0.3em] mb-2"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
        >
          — {tag}
        </span>
        <h3
          className={`text-white uppercase leading-tight mb-2 ${
            size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
          }`}
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
        >
          {titulo}
        </h3>
        <p className={`text-white/70 leading-relaxed ${size === 'lg' ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>
          {body}
        </p>
      </div>
    </div>
  )
}

export default function Premios() {
  return (
    <section id="premios" className="py-20 md:py-28 bg-[#080808]">
      <div className="px-6 md:px-12" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Encabezado */}
        <div className="mb-12">
          <p
            className="text-[#e6c200] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
          >
            Este año viene con todo
          </p>
          <h2
            className="text-4xl md:text-6xl text-white uppercase leading-none"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
          >
            La experiencia <span className="text-[#e6c200]">completa</span>
          </h2>
          <p className="text-white/50 text-sm md:text-base mt-4 max-w-2xl">
            Más allá del podio y los premios en dinero, esto incluye tu inscripción a la Clásica Virtual Bike 2026.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[220px]">
          {items.map((it, i) => (
            <BentoCard key={i} {...it} />
          ))}
        </div>
      </div>
    </section>
  )
}
