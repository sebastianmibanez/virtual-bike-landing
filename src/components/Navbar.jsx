import { useState, useEffect } from 'react'

const links = [
  { label: 'Día de carrera', href: '#dia-carrera' },
  { label: 'Premios', href: '#premios-dinero' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Galería', href: '#galeria' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#080808]/95 backdrop-blur-md border-b border-white/5 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="px-4 flex items-center justify-between" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}sponsors/virtual-round.jpg`} alt="Virtual BK" className="w-9 h-9 rounded-full object-cover" />
          <span
            className="font-condensed font-800 text-xl tracking-wider text-white uppercase"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}
          >
            Virtual-Bike.cl
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest font-medium"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#inscripcion"
            className="bg-[#f5e400] text-black font-bold px-6 py-2 rounded-full text-sm uppercase tracking-wider hover:bg-[#ffe500] transition-all"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}
          >
            Inscríbete
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          <div className={`w-6 h-0.5 bg-white mb-1.5 transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-6 h-0.5 bg-white mb-1.5 transition-all ${open ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-0.5 bg-white transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#080808]/98 border-t border-white/5 px-4 py-6 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-gray-300 text-lg uppercase tracking-widest"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#inscripcion"
            onClick={() => setOpen(false)}
            className="bg-[#f5e400] text-black font-bold px-6 py-3 rounded-full text-center uppercase tracking-wider mt-2"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 800 }}
          >
            Inscríbete — $40.000
          </a>
        </div>
      )}
    </nav>
  )
}
