import { useState, useEffect, useCallback } from 'react'
import clasica1 from '../assets/clasica1.jpg'
import clasica2 from '../assets/clasica2.jpg'
import clasica3 from '../assets/clasica3.jpg'
import clasica4 from '../assets/clasica4.jpg'
import clasica5 from '../assets/clasica5.jpg'
import clasica6 from '../assets/clasica6.jpg'
import clasica7 from '../assets/clasica7.jpg'

const imagenes = [
  { src: clasica1, alt: 'Clásica VBK' },
  { src: clasica2, alt: 'Clásica VBK' },
  { src: clasica3, alt: 'Clásica VBK' },
  { src: clasica4, alt: 'Clásica VBK' },
  { src: clasica5, alt: 'Clásica VBK' },
  { src: clasica6, alt: 'Clásica VBK' },
  { src: clasica7, alt: 'Clásica VBK' },
]

export default function Galeria() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % imagenes.length), [])
  const prev = () => setCurrent(c => (c - 1 + imagenes.length) % imagenes.length)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 4500)
    return () => clearInterval(timer)
  }, [next, paused])

  return (
    <section id="galeria" className="py-28 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p
            className="text-[#f5e400] text-sm uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
          >
            Ediciones anteriores
          </p>
          <h2
            className="text-6xl md:text-8xl text-white uppercase"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
          >
            Galería
          </h2>
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Imagen principal */}
          <div className="relative overflow-hidden aspect-[16/9] md:aspect-[21/9] mb-3">
            {imagenes.map((img, i) => (
              <img
                key={i}
                src={img.src}
                alt={img.alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  i === current ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Controles */}
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#f5e400] text-white hover:text-black w-12 h-12 flex items-center justify-center transition-all text-2xl font-bold backdrop-blur-sm"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#f5e400] text-white hover:text-black w-12 h-12 flex items-center justify-center transition-all text-2xl font-bold backdrop-blur-sm"
            >
              ›
            </button>
            <div
              className="absolute bottom-4 right-4 text-white/60 text-xs"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
            >
              {current + 1} / {imagenes.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-7 gap-2">
            {imagenes.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative overflow-hidden aspect-square transition-all duration-200 ${
                  i === current ? 'ring-2 ring-[#f5e400]' : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
