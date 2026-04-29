import { useState } from 'react'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SponsorStrip from './components/SponsorStrip'
import DiaCarrera from './components/DiaCarrera'
import PremiosDinero from './components/PremiosDinero'
import Dudas from './components/Dudas'
import Inscripcion from './components/Inscripcion'
import Beneficios from './components/Beneficios'
import Patrocinadores from './components/Patrocinadores'
import Footer from './components/Footer'
import StickyCTA from './components/StickyCTA'

export default function App() {
  const [genero, setGenero] = useState('')

  return (
    <div className="bg-[#080808] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <SponsorStrip />
      <DiaCarrera genero={genero} setGenero={setGenero} />
      <PremiosDinero genero={genero} />
      <Dudas />
      <Inscripcion genero={genero} setGenero={setGenero} />
      <Beneficios />
      <Patrocinadores />
      <Footer />
      <StickyCTA />
    </div>
  )
}
