const BASE = import.meta.env.BASE_URL

export default function Footer() {
  return (
    <footer className="pb-28 md:pb-14 pt-14 px-6 md:px-12 border-t border-white/5 bg-[#080808]">
      <div style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Top */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img
              src={`${BASE}sponsors/virtual-round.jpg`}
              alt="Virtual BK"
              className="w-11 h-11 rounded-full object-cover"
            />
            <div>
              <div
                className="text-white text-xl uppercase leading-none"
                style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
              >
                Virtual-Bike.cl
              </div>
              <div className="text-white/40 text-xs mt-1">Clásica CVBK 2026 · 21 de Mayo</div>
            </div>
          </div>

          <div className="flex gap-6 md:gap-8">
            <a
              href="https://www.instagram.com/virtual_bike_cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#e6c200] transition-colors text-sm uppercase tracking-widest"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
            >
              Instagram
            </a>
            <a
              href="https://wa.me/56999542821"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#e6c200] transition-colors text-sm uppercase tracking-widest"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
            >
              WhatsApp
            </a>
            <a
              href="https://virtual-bike.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#e6c200] transition-colors text-sm uppercase tracking-widest"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
            >
              Sitio web
            </a>
          </div>
        </div>

        {/* Marca extra + copy */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 pt-8">
          <div className="flex items-center gap-3">
            <span
              className="text-white/30 text-[10px] uppercase tracking-[0.25em]"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}
            >
              También en ropa deportiva
            </span>
            <div className="bg-white p-1.5 rounded">
              <img
                src={`${BASE}sponsors/virtual-ropa.jpg`}
                alt="Virtual Ropa"
                className="h-7 object-contain"
              />
            </div>
          </div>

          <p
            className="text-white/30 text-xs"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 600 }}
          >
            © {new Date().getFullYear()} Virtual-Bike.cl · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  )
}
