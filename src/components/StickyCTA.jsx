import { useEffect, useState } from 'react'

export default function StickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const viewportH = window.innerHeight
      setVisible(scrolled > viewportH * 0.8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a
        href="#inscripcion"
        className="flex items-center justify-between gap-3 bg-[#f5e400] text-black px-5 py-3.5 w-full"
        style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.05em' }}
      >
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] uppercase tracking-widest opacity-70">Inscripción</span>
          <span className="text-lg uppercase">Inscríbete · $40.000</span>
        </div>
        <span className="text-2xl">→</span>
      </a>
    </div>
  )
}
