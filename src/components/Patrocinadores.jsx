import { useState } from 'react'

const BASE = import.meta.env.BASE_URL

const logos = [
  { nombre: 'Shimano',             src: `${BASE}sponsors/shimano.jpg`,    url: null },
  { nombre: 'CIC',                 src: `${BASE}sponsors/cic.jpg`,        url: null },
  { nombre: 'Vittoria',            src: `${BASE}sponsors/vittoria.jpg`,   url: null },
  { nombre: 'Mutual de Seguridad', src: `${BASE}sponsors/mutual.jpg`,     url: null },
  { nombre: 'DronExp',             src: `${BASE}sponsors/dronexp.jpg`,    url: 'https://www.instagram.com/dronexp.cl/' },
  { nombre: 'C.A.V.A',             src: `${BASE}sponsors/cava.jpg`,       url: 'https://www.instagram.com/servicio.automotriz.cava/' },
  { nombre: 'Bump Lab',            src: `${BASE}sponsors/bumplab.JPG`,    url: 'https://www.instagram.com/bump_lab_/' },
  { nombre: 'ProPaint',            src: `${BASE}sponsors/propaint.jpeg`,  url: 'https://www.instagram.com/propaint.cl/' },
]

function LogoTile({ nombre, src, url }) {
  const [pressed, setPressed] = useState(false)
  const isBump = nombre === 'Bump Lab'

  const tile = (
    <div
      className={`relative aspect-[3/2] flex items-center justify-center p-5 overflow-hidden ${isBump ? 'bg-white' : 'bg-[#0f0f0f]'}`}
      style={{ transform: pressed ? 'scale(0.93)' : 'scale(1)', transition: pressed ? 'transform 150ms ease' : 'transform 600ms ease' }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
    >
      <img
        src={src}
        alt={nombre}
        className="max-w-full max-h-full object-contain"
        style={{
          mixBlendMode: isBump ? 'multiply' : 'screen',
          filter: pressed ? 'brightness(1.4)' : 'brightness(1.1)',
          transform: pressed ? 'scale(1.08)' : 'scale(1)',
          transition: pressed ? 'filter 150ms ease, transform 150ms ease' : 'filter 600ms ease, transform 600ms ease',
        }}
        loading="lazy"
      />
      {url && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          style={{ transition: pressed ? 'opacity 150ms ease' : 'opacity 600ms ease', opacity: pressed ? 1 : 0 }}
        >
          <span className="text-white text-xs uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
            Ver Instagram →
          </span>
        </div>
      )}
    </div>
  )

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" title={nombre} className="block">
      {tile}
    </a>
  ) : (
    <div title={nombre}>{tile}</div>
  )
}

export default function Patrocinadores() {
  return (
    <section id="auspiciadores" className="py-20 px-6 md:px-12 border-t border-white/5 bg-[#080808]">
      <div style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        <p className="text-center text-[#e6c200] text-xs uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
          Auspiciadores & Colaboradores
        </p>
        <h2 className="text-center text-3xl md:text-4xl text-white uppercase mb-12" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
          Las marcas que nos acompañan
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-white/10">
          {logos.map((s) => (
            <LogoTile key={s.nombre} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
