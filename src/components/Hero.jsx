import { useState, useEffect, useCallback } from 'react'
import virtual9 from '../assets/virtual9_c.jpg'
import virtual7 from '../assets/virtual7_c.jpg'
import virtual11 from '../assets/virtual11_c.jpg'
import virtual2 from '../assets/virtual2_c.jpg'
import pidcok from '../assets/pidcok_c.jpg'

const SLIDES = [
  { img: virtual2,  label: 'Clásica VBK · 21 de Mayo' },
  { img: pidcok,    label: 'Clásica VBK · 21 de Mayo' },
  { img: virtual11, label: 'Clásica VBK · 21 de Mayo' },
  { img: virtual9,  label: 'Clásica VBK · 21 de Mayo' },
  { img: virtual7,  label: 'Clásica VBK · 21 de Mayo' },
]

const EVENT_DATE = new Date('2026-05-21T08:00:00')

function getTimeLeft(target) {
  const diff = target - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(target))
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000)
    return () => clearInterval(timer)
  }, [target])
  return timeLeft
}

function CountBox({ value, label }) {
  return (
    <div className="flex flex-col items-center min-w-[52px]">
      <span
        className="text-2xl md:text-4xl text-white tabular-nums leading-none"
        style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-1">{label}</span>
    </div>
  )
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const { days, hours, minutes, seconds } = useCountdown(EVENT_DATE)

  const goTo = useCallback((index) => {
    if (animating) return
    setAnimating(true)
    setCurrent(index)
    setTimeout(() => setAnimating(false), 700)
  }, [animating])

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo])
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo])

  useEffect(() => {
    const t = setInterval(next, 3000)
    return () => clearInterval(t)
  }, [next])

  return (
    <section className="relative w-full h-[60vw] min-h-[480px] md:h-screen overflow-hidden bg-black">
      {/* Slideshow */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={s.img} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Bloque de texto con posición propia */}
      <div className="absolute left-10 md:left-16 bottom-8 md:bottom-28 z-10 max-w-lg">
        <span
          className="text-white/55 text-xs uppercase tracking-[0.25em] mb-4 font-semibold block"
          style={{ fontFamily: 'Barlow Condensed' }}
        >
          🚴 Virtual-Bike.cl · Edición 2026
        </span>
        <h1
          className="text-3xl md:text-7xl text-white uppercase leading-tight mb-1 drop-shadow-xl"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}
        >
          Clásica <span style={{ color: '#f5e400' }}>Virtual Bike 2026</span>
        </h1>
        <p className="text-white/65 text-xs md:text-base leading-relaxed mb-3">
          21 de Mayo · La carrera que todos esperan
        </p>
        <div className="flex items-end gap-2 mb-4">
          <CountBox value={days} label="Días" />
          <span className="text-[#f5e400]/50 text-base pb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>:</span>
          <CountBox value={hours} label="Horas" />
          <span className="text-[#f5e400]/50 text-base pb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>:</span>
          <CountBox value={minutes} label="Min" />
          <span className="text-[#f5e400]/50 text-base pb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>:</span>
          <CountBox value={seconds} label="Seg" />
        </div>
        <a
          href="#inscripcion"
          className="inline-block bg-[#f5e400] text-black px-8 py-3.5 text-sm uppercase hover:bg-white transition-all duration-200 hover:scale-105 shadow-xl shadow-[#f5e400]/20"
          style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, letterSpacing: '0.08em' }}
        >
          Inscríbete aquí →
        </a>
      </div>

      {/* Flechas circulares */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 hover:border-white/60 bg-black/30 hover:bg-black/60 flex items-center justify-center text-white text-xl transition-all backdrop-blur-sm"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 hover:border-white/60 bg-black/30 hover:bg-black/60 flex items-center justify-center text-white text-xl transition-all backdrop-blur-sm"
      >
        ›
      </button>

      {/* Dots horizontales abajo-derecha */}
      <div className="absolute bottom-6 right-8 md:right-16 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-8 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

    </section>
  )
}
