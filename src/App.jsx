import { useState, lazy, Suspense, Component } from 'react'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SponsorStrip from './components/SponsorStrip'

const DiaCarrera = lazy(() => import('./components/DiaCarrera'))
const PremiosDinero = lazy(() => import('./components/PremiosDinero'))
const Dudas = lazy(() => import('./components/Dudas'))
const Inscripcion = lazy(() => import('./components/Inscripcion'))
const Beneficios = lazy(() => import('./components/Beneficios'))
const Patrocinadores = lazy(() => import('./components/Patrocinadores'))
const Footer = lazy(() => import('./components/Footer'))
const StickyCTA = lazy(() => import('./components/StickyCTA'))

class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex items-center justify-center text-white/50 text-sm">
          Algo salió mal. Recarga la página.
        </div>
      )
    }
    return this.props.children
  }
}

function SectionFallback() {
  return <div className="min-h-[200px]" />
}

export default function App() {
  const [genero, setGenero] = useState('')

  return (
    <ErrorBoundary>
      <div className="bg-[#080808] text-white overflow-x-hidden">
        <Navbar />
        <Hero />
        <SponsorStrip />
        <Suspense fallback={<SectionFallback />}>
          <div className="relative">
            <div className="absolute inset-0">
              <img src={`${import.meta.env.BASE_URL}images/virtual15.webp`} alt="" className="w-full h-full object-cover object-bottom opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]" />
            </div>
            <div className="relative z-10">
              <DiaCarrera genero={genero} setGenero={setGenero} />
              <PremiosDinero genero={genero} />
              <Inscripcion genero={genero} setGenero={setGenero} />
            </div>
          </div>
          <Beneficios />
          <Patrocinadores />
          <Footer />
          <Dudas />
          <StickyCTA />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}
