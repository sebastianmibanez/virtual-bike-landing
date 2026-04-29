const BASE = import.meta.env.BASE_URL

const logos = [
  { nombre: 'DronExp',           src: `${BASE}sponsors/dronexp.jpg` },
  { nombre: 'C.A.V.A',           src: `${BASE}sponsors/cava.jpg` },
  { nombre: 'Bump Lab',          src: `${BASE}sponsors/bumplab.JPG` },
  { nombre: 'ProPaint',          src: `${BASE}sponsors/propaint.jpeg` },
  { nombre: 'Shimano',           src: `${BASE}sponsors/shimano.jpg` },
  { nombre: 'CIC',               src: `${BASE}sponsors/cic.jpg` },
  { nombre: 'Vittoria',          src: `${BASE}sponsors/vittoria.jpg` },
  { nombre: 'Mutual de Seguridad', src: `${BASE}sponsors/mutual.jpg` },
]

// Tripled once for infinite scroll loop
const items = [...logos, ...logos, ...logos]

export default function SponsorStrip() {
  return (
    <div className="bg-[#080808] border-t border-b border-white/5 py-4 overflow-hidden">
      <div
        className="flex gap-10 items-center"
        style={{
          width: 'max-content',
          animation: 'sponsor-scroll 28s linear infinite',
        }}
      >
        {items.map((s, i) => (
          <div key={i} className="flex-shrink-0 h-8 flex items-center">
            <img
              src={s.src}
              alt={s.nombre}
              className="h-full w-auto object-contain"
              style={{ mixBlendMode: 'screen', filter: 'grayscale(30%) brightness(1.1)', maxWidth: '90px' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes sponsor-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}
