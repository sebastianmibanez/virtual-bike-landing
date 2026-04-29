import { useState, useEffect, useRef } from 'react'
import { EVENT, APERTURA } from '../config/event'
import { categoriasPorGenero } from '../config/categorias'
import { validarRut, formatRut } from '../utils/rut'
import Field from './Field'
const eventoImg = `${import.meta.env.BASE_URL}images/virtual15.webp`

const API_BASE = EVENT.apiBase

function getSessionId() {
  let sid = sessionStorage.getItem('cvbk_sid')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('cvbk_sid', sid)
  }
  return sid
}

function track(tipo) {
  fetch(`${API_BASE}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo,
      session_id: getSessionId(),
      referrer: document.referrer,
    }),
  }).catch(() => {})
}

// — Control de inscripciones —
const MODO_PRUEBA = new URLSearchParams(window.location.search).get('test') === 'cvbk26'
const INSCRIPCIONES_ABIERTAS = MODO_PRUEBA || new Date() >= APERTURA
const PAGO_HABILITADO = INSCRIPCIONES_ABIERTAS

export const beneficios = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    title: 'Medallón finisher', sub: 'Los 200 primeros inscritos',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    title: 'Fotos y videos', sub: 'Cobertura completa, sin costo',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    title: '3 metas volantes', sub: 'Premios en dinero por grupo',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
    title: 'Tercer tiempo', sub: 'Frutas, agua, pan y pastelitos',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    title: 'Sorteos', sub: 'Bici Mini CIC, ropa Virtual, más',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
    title: 'Ambiente en vivo', sub: 'DJ + locutor toda la jornada',
  },
]

const initialForm = {
  nombre: '', apellido: '', email: '', telefono: '',
  rut: '', genero: '', categoria: '', club: '', dorsal: '',
  _hp: '', // honeypot — debe quedar vacío
  _t: Date.now(), // timestamp de carga
}

const IconHombre = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
)

const IconMujer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
    <circle cx="12" cy="8" r="4" />
    <path d="M12 12v8M9 17h6" />
  </svg>
)

export default function Inscripcion({ genero, setGenero }) {
  const [form, setForm]         = useState({ ...initialForm, genero: genero || '' })
  const [paso, setPaso]         = useState(1) // 1=formulario, 2=confirmar+pagar, 3=pagado+QR
  const [inscritoId, setInscritoId] = useState(null)
  const [inscritoPagado, setInscritoPagado] = useState(null) // datos del paso 3
  const [loadingGuardar, setLoadingGuardar] = useState(false)
  const [loadingPagar, setLoadingPagar]     = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setForm(f => ({ ...f, genero: genero || '', categoria: '' }))
  }, [genero])

  // Pageview
  useEffect(() => { track('pageview') }, [])

  // Retomar pago desde link del email (?pagar=ID)
  // O detectar retorno desde Getnet (sessionStorage cvbk_pending_id)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pagarId = parseInt(params.get('pagar') || '', 10)

    if (pagarId) {
      setInscritoId(pagarId)
      setPaso(2)
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => {
        document.getElementById('inscripcion')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
      return
    }

    // Retorno desde Getnet — verificar si el pago se completó
    const pendingId = parseInt(sessionStorage.getItem('cvbk_pending_id') || '', 10)
    if (pendingId) {
      sessionStorage.removeItem('cvbk_pending_id')
      fetch(`${API_BASE}/inscrito/${pendingId}`)
        .then(r => r.json())
        .then(data => {
          if (data.estado_pago === 'pagado') {
            setInscritoPagado(data)
            setPaso(3)
            setTimeout(() => {
              document.getElementById('inscripcion')?.scrollIntoView({ behavior: 'smooth' })
            }, 300)
          } else {
            // Pago aún pendiente — mandarlo al paso 2
            setInscritoId(pendingId)
            setPaso(2)
          }
        })
        .catch(() => {}) // si falla, no hacer nada (usuario en paso 1)
    }
  }, [])

  const trackedFormStart = useRef(false)
  const handleChange = (e) => {
    if (!trackedFormStart.current) { trackedFormStart.current = true; track('formulario_inicio') }
    const { name, value } = e.target
    if (name === 'rut') {
      setForm({ ...form, rut: formatRut(value) })
      return
    }
    setForm({ ...form, [name]: value })
  }

  // Paso 1: guardar en DB sin pago
  const handleGuardar = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (form._hp) return // honeypot triggered — silently ignore
    if (Date.now() - form._t < 3000) {
      setErrorMsg('Envío demasiado rápido, intenta nuevamente')
      return
    }
    if (!validarRut(form.rut)) {
      setErrorMsg('RUT inválido — verifica el dígito verificador')
      return
    }
    setLoadingGuardar(true)
    try {
      const res = await fetch(`${API_BASE}/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar')
      setInscritoId(data.inscrito_id)
      track('reserva_ok')
      setPaso(2)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoadingGuardar(false)
    }
  }

  // Paso 2: crear orden WC y redirigir a Getnet
  const handlePagar = async () => {
    if (!PAGO_HABILITADO) return
    setLoadingPagar(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscrito_id: inscritoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al procesar pago')
      sessionStorage.setItem('cvbk_pending_id', String(inscritoId))
      window.location.href = data.redirect
    } catch (err) {
      setErrorMsg(err.message)
      setLoadingPagar(false)
    }
  }

  return (
    <section id="inscripcion" className="relative w-full">

      {/* Selector de género — encima del formulario */}
      <div className={`relative z-10 ${paso === 3 ? 'hidden' : ''}`}>
        <p className="text-center text-white/30 text-[10px] uppercase tracking-[0.3em] pt-8 pb-4" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
          Paso 1 · ¿Cómo compites?
        </p>
        <div className="grid grid-cols-2 gap-px bg-white/5" style={{ maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
          {[
            { val: 'hombre', label: 'Hombre', Icon: IconHombre },
            { val: 'mujer',  label: 'Mujer',  Icon: IconMujer  },
          ].map(({ val, label, Icon }) => (
            <button
              key={val}
              type="button"
              onClick={() => { setGenero(val); track('genero_click') }}
              className={`flex items-center justify-center gap-2 py-4 px-4 transition-all ${
                genero === val
                  ? 'bg-[#f5e400] text-black'
                  : 'bg-[#080808] text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon />
              <span className="text-lg uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.08em' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 py-16 md:py-24 px-6 md:px-12 lg:px-20" style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto' }}>

        {/* Precio + checklist */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-shrink-0">
            <div className="text-6xl md:text-7xl text-[#f5e400] leading-none" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
              $40.000
            </div>
            <p className="text-white/40 text-[10px] md:text-xs mt-2 tracking-[0.2em] uppercase">CLP · Inscripción única</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 flex-1">
            {['Medallón finisher (200 primeros)', 'Premios en dinero + sorteos', 'Fotos y videos GRATIS', '3 metas volantes por grupo', 'Tercer tiempo incluido', 'Tricota Champion al 1°'].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-[#f5e400] mt-0.5 text-xs">✓</span>
                <span className="text-white/80 text-xs md:text-sm leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PASO 1: Formulario ── */}
        {paso === 1 && (
          <div>
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/10">
              <h3 className="text-xl md:text-2xl text-white uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.04em' }}>
                Datos de inscripción
              </h3>
              <span className="text-white/30 text-[10px] uppercase tracking-widest hidden sm:block">Todos los campos son obligatorios</span>
            </div>

            <form id="cvbk-form" onSubmit={handleGuardar} className="space-y-2">
              {/* honeypot — oculto para humanos, visible para bots */}
              <input type="text" name="_hp" value={form._hp} onChange={handleChange}
                style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1} autoComplete="off" />

              {(() => {
                const accent = form.genero === 'mujer' ? 'rgba(219,112,147,0.7)' : form.genero === 'hombre' ? 'rgba(56,139,160,0.7)' : 'rgba(255,255,255,0.3)'
                const accentSolid = form.genero === 'mujer' ? '#db7093' : form.genero === 'hombre' ? '#388ba0' : 'rgba(255,255,255,0.3)'

                return (
                  <>
                    <Field label="RUT" name="rut" placeholder="12.345.678-9" value={form.rut} onChange={handleChange} required accentColor={accent} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required accentColor={accent} />
                      <Field label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} required accentColor={accent} />
                    </div>

                    <Field label="Equipo o Libre" name="club" placeholder="Nombre de tu club o 'Libre'" value={form.club} onChange={handleChange} accentColor={accent} />

                    <div className="pt-2">
                      <label className="block text-sm text-white/70 uppercase tracking-wider mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, letterSpacing: '0.15em' }}>
                        Categoría <span className="text-[#f5e400]">*</span>
                      </label>
                      <select
                        name="categoria" value={form.categoria} onChange={handleChange}
                        disabled={!form.genero} required
                        className={`w-full border-b text-white px-0 py-4 focus:outline-none transition-all text-base bg-transparent ${!form.genero ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ borderColor: form.genero ? accentSolid : 'rgba(255,255,255,0.3)' }}
                      >
                        <option value="" className="bg-[#111]">{form.genero ? 'Selecciona tu categoría' : 'Primero elige género arriba'}</option>
                        {form.genero && categoriasPorGenero[form.genero].map((c) => (
                          <option key={c} value={c} className="bg-[#111]">{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <label className="block text-sm text-white/70 uppercase tracking-wider mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, letterSpacing: '0.15em' }}>
                        Número de dorsal preferido <span className="text-[#f5e400]">*</span>
                      </label>
                      <select
                        name="dorsal" value={form.dorsal} onChange={handleChange}
                        disabled={!form.genero} required
                        className={`w-full border-b text-white px-0 py-4 focus:outline-none transition-all text-base bg-transparent ${!form.genero ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ borderColor: accent }}
                      >
                        <option value="" className="bg-[#111]">{form.genero ? 'Selecciona un número' : 'Primero elige género arriba'}</option>
                        {form.genero === 'hombre' && Array.from({ length: 30 }, (_, i) => (i + 1) * 100).map(n => (
                          <option key={n} value={n} className="bg-[#111]">{n}</option>
                        ))}
                        {form.genero === 'mujer' && Array.from({ length: 30 }, (_, i) => (i + 1) * 30).map(n => (
                          <option key={n} value={n} className="bg-[#111]">{n}</option>
                        ))}
                      </select>
                    </div>

                    <Field label="Teléfono" name="telefono" type="tel" placeholder="9 1234 5678" value={form.telefono} onChange={handleChange} required accentColor={accent} />
                    <Field label="Email" name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required accentColor={accent} />
                  </>
                )
              })()}

              {errorMsg && (
                <div className="border border-red-500/30 bg-red-500/5 text-red-400 text-sm px-4 py-3">{errorMsg}</div>
              )}

              <div className="pb-16" />
            </form>
          </div>
        )}


        {/* ── PASO 2: Confirmación + Pagar ── */}
        {paso === 2 && (
          <div>
            <div className="mb-6 pb-5 border-b border-white/10">
              <p className="text-[#f5e400] text-xs uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
                Cupo reservado ✓
              </p>
              <h3 className="text-xl md:text-2xl text-white uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
                Confirma y paga
              </h3>
            </div>

            {/* Resumen */}
            <div className="bg-white/5 border border-white/10 p-6 mb-6 space-y-3">
              {[
                ['Nombre',    `${form.nombre} ${form.apellido}`],
                ['RUT',       form.rut],
                ['Email',     form.email],
                ['Teléfono',  form.telefono],
                ['Categoría', form.categoria],
                ...(form.club ? [['Club', form.club]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed' }}>{label}</span>
                  <span className="text-white text-sm">{val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10">
                <span className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed' }}>Total</span>
                <span className="text-[#f5e400] text-xl font-black" style={{ fontFamily: 'Barlow Condensed' }}>$40.000 CLP</span>
              </div>
            </div>

            {errorMsg && (
              <div className="border border-red-500/30 bg-red-500/5 text-red-400 text-sm px-4 py-3 mb-4">{errorMsg}</div>
            )}
          </div>
        )}

        {/* ── PASO 3: Pago confirmado + QR ── */}
        {paso === 3 && inscritoPagado && (
          <div>
            <div className="mb-6 pb-5 border-b border-white/10">
              <p className="text-[#22c55e] text-xs uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
                Pago confirmado ✓
              </p>
              <h3 className="text-xl md:text-2xl text-white uppercase" style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
                ¡Estás inscrito!
              </h3>
            </div>

            <div className="bg-[#0d2010] border border-[#22c55e]/40 p-6 mb-6 text-center">
              <div className="text-[#22c55e] text-4xl font-black mb-1" style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.08em' }}>
                ✓ INSCRITO
              </div>
              <div className="text-white/40 text-xs uppercase tracking-widest">Clásica Virtual Bike 2026</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 mb-6 space-y-3">
              {[
                ['Nombre',    `${inscritoPagado.nombre} ${inscritoPagado.apellido}`],
                ['RUT',       inscritoPagado.rut],
                ['Categoría', inscritoPagado.categoria],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: 'Barlow Condensed' }}>{label}</span>
                  <span className="text-white text-sm">{val}</span>
                </div>
              ))}
            </div>

            {inscritoPagado.qr_img && (
              <div className="bg-white/5 border border-white/10 p-6 mb-6 flex flex-col items-center gap-4">
                <p className="text-[#f5e400] text-xs uppercase tracking-[0.3em]" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
                  Tu código de acreditación
                </p>
                <div className="bg-white p-3 rounded">
                  <img src={inscritoPagado.qr_img} alt="QR inscripción" width={220} height={220} />
                </div>
                <p className="text-white/30 text-xs text-center">Muestra este QR en la carpa de acreditación el día del evento</p>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 p-5">
              <p className="text-[#f5e400] text-xs uppercase tracking-[0.3em] mb-3" style={{ fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
                Información del evento
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                📅 Miércoles 21 de mayo de 2026<br />
                📌 Alto Noviciado, Región Metropolitana<br />
                🚴 Salida por categorías desde las 8:00 hrs
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ── Botón acción: full-width como selector de género ── */}
      <div className="relative z-10">
        {paso === 1 && (
          <>
            {!INSCRIPCIONES_ABIERTAS ? (
              <div className="w-full py-10 text-3xl uppercase flex items-center justify-center text-center"
                style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.08em', background: 'rgba(245,228,0,0.18)', color: 'rgba(245,228,0,0.85)' }}>
                Inscripciones desde el 1 de mayo
              </div>
            ) : (
            <button
              form="cvbk-form"
              type="submit"
              disabled={loadingGuardar}
              className="w-full bg-[#f5e400] text-black py-10 text-3xl uppercase hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.08em' }}
            >
              {loadingGuardar ? 'Guardando...' : <><span>Inscribirme a Clásica Virtual</span><span>→</span></>}
            </button>
            )}
            <p className="text-white/20 text-[10px] text-center pt-4 pb-2 uppercase tracking-widest">
              Reserva tu lugar · Pagas en el siguiente paso
            </p>
            <p className="text-white/25 text-[10px] text-center pb-4 px-6 leading-relaxed">
              Al inscribirte aceptas los{' '}
              <a href="#" className="underline text-white/40 hover:text-white/60 transition-colors">
                términos y condiciones
              </a>
              {' '}del evento. Las inscripciones no son reembolsables una vez realizado el pago. El organizador se reserva el derecho de modificar el recorrido o fecha por causas de fuerza mayor.
            </p>
          </>
        )}
        {paso === 2 && (
          <>
            {PAGO_HABILITADO ? (
              <button
                onClick={handlePagar}
                disabled={loadingPagar}
                className="w-full bg-[#f5e400] text-black py-10 text-3xl uppercase hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.08em' }}
              >
                {loadingPagar ? 'Procesando...' : <><span>Pagar $40.000</span><span>→</span></>}
              </button>
            ) : (
              <div className="w-full bg-white/10 text-white/40 py-10 text-3xl uppercase flex items-center justify-center"
                style={{ fontFamily: 'Barlow Condensed', fontWeight: 900 }}>
                Pago disponible desde el 1 de mayo
              </div>
            )}
            <button
              onClick={() => { setPaso(1); setErrorMsg('') }}
              className="w-full py-4 text-sm uppercase text-white/30 hover:text-white transition-all"
              style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, letterSpacing: '0.08em' }}
            >
              ← Editar datos
            </button>
          </>
        )}
        {paso === 3 && (
          <div className="w-full bg-[#22c55e] text-black py-10 text-3xl uppercase flex items-center justify-center gap-4"
            style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, letterSpacing: '0.08em' }}>
            ✓ Inscripción confirmada
          </div>
        )}
      </div>
    </section>
  )
}
