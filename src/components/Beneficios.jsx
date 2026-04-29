import { useState, useEffect, useRef } from 'react'
import clasica1 from '../assets/virtual1_c.jpg'
import clasica2 from '../assets/virtual3_c.jpg'
import clasica3 from '../assets/virtual4_c.jpg'
import clasica4 from '../assets/virtual6_c.jpg'
import clasica5 from '../assets/virtual8_c.jpg'
import clasica6 from '../assets/virtual10_c.jpg'

const cards = [
  {
    foto: clasica1,
    titulo: 'Premiación por categoría',
    items: [
      'Tricota de Champion para cada categoría',
      'Trofeo Virtual al 1er lugar',
      'Medallones para los 5 primeros lugares',
      'Medallón Finisher para los 200 primeros inscritos',
    ],
  },
  {
    foto: clasica2,
    titulo: 'Competencia y dinámicas',
    items: [
      '3 metas volantes por grupo con premios en dinero',
      'Sorpresas Virtual en cada meta',
      'Foto finish para resultados precisos',
    ],
  },
  {
    foto: clasica3,
    titulo: 'Sorteos y premios especiales',
    items: [
      '1 bicicleta Mini CIC',
      'Conjunto Virtual de alta calidad a elección',
      'Porta bolso de ruedas Double',
      'Regalos de Fundax y Vittoria',
    ],
  },
  {
    foto: clasica4,
    titulo: 'Experiencia incluida',
    items: [
      'Fotos y videos GRATIS para todos',
      'Cobertura audiovisual profesional',
    ],
  },
  {
    foto: clasica5,
    titulo: 'Ambiente del evento',
    items: [
      'Locutor en vivo',
      'DJ para animación',
      'Vasos oficiales CVBK / Virtual',
    ],
  },
  {
    foto: clasica6,
    titulo: 'Tercer tiempo',
    intro: 'Disfruta un cierre como corresponde:',
    items: [
      'Frutas y agua',
      'Pan y pastelitos',
      'Un ambiente agradable para compartir',
    ],
  },
]

function FlipCard({ foto, titulo, intro, items }) {
  const [flipped, setFlipped] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setFlipped(true), 200)
        } else {
          setFlipped(false)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative cursor-pointer"
      style={{ perspective: '1000px', minHeight: '320px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          minHeight: '320px',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Cara frontal */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <img src={foto} alt={titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
            <h3 className="text-[#f5e400] text-3xl md:text-4xl uppercase leading-tight" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
              {titulo}
            </h3>
            <p className="text-white/50 text-xs mt-3 uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed' }}>
              Toca para ver más →
            </p>
          </div>
        </div>

        {/* Cara trasera */}
        <div
          className="absolute inset-0 bg-[#111] flex flex-col items-center justify-center p-6 text-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <h3 className="text-[#f5e400] text-4xl md:text-5xl uppercase leading-tight mb-5"
            style={{
              fontFamily: 'Barlow Condensed', fontWeight: 900,
              opacity: flipped ? 1 : 0,
              transform: flipped ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
              transition: 'opacity 500ms 200ms, transform 500ms 200ms',
            }}>
            {titulo}
          </h3>
          {intro && (
            <p className="text-white/50 text-base mb-3 italic"
              style={{ opacity: flipped ? 1 : 0, transition: 'opacity 400ms 350ms' }}>
              {intro}
            </p>
          )}
          <ul className="space-y-3 w-full">
            {items.map((item, i) => (
              <li key={item} className="flex items-center justify-center gap-2"
                style={{
                  opacity: flipped ? 1 : 0,
                  transform: flipped ? 'translateZ(0) scale(1)' : i % 2 === 0 ? 'translateX(-30px) scale(0.95)' : 'translateX(30px) scale(0.95)',
                  transition: `opacity 450ms ${400 + i * 150}ms, transform 450ms ${400 + i * 150}ms`,
                }}
              >
                <span className="text-[#f5e400] text-2xl flex-shrink-0">—</span>
                <span className="text-white text-2xl md:text-3xl leading-snug" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-white/20 text-sm uppercase tracking-widest mt-5"
            style={{ fontFamily: 'Barlow Condensed', opacity: flipped ? 1 : 0, transition: `opacity 400ms ${400 + items.length * 150 + 100}ms` }}>
            Toca para ver la foto →
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Beneficios() {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-[#080808]">
      <div className="px-6 md:px-12" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        <p className="text-center text-[#f5e400] text-xs uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
          Incluido con tu inscripción
        </p>
        <h2 className="text-center text-4xl md:text-6xl text-white uppercase leading-none mb-12" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
          Todo lo que <span className="text-[#f5e400]">te llevas</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
          {cards.map((c) => (
            <FlipCard key={c.titulo} {...c} />
          ))}
        </div>
      </div>
    </section>
  )
}
