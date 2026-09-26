import HeroWhyZoom from '../components/home/HeroWhyZoom'
import FlavourScrollStage from '../components/home/FlavourScrollStage'
import FlavourVending from '../components/home/FlavourVending'
import Testimonials from '../components/home/Testimonials'

export default function HomePage() {
  return (
    <>
      {/* The hero and Why Flipo's, as one camera move on laptops. */}
      <HeroWhyZoom />
      <FlavourScrollStage />
      <FlavourVending />
      <Testimonials />
    </>
  )
}
