import HeroCarousel from '../components/home/HeroCarousel'
import WhyFlipos from '../components/home/WhyFlipos'
import FlavourScrollStage from '../components/home/FlavourScrollStage'
import FlavourVending from '../components/home/FlavourVending'
import Testimonials from '../components/home/Testimonials'

export default function HomePage() {
  // Temporary: ?wall=scatter|office previews the Why Flipo's wall candidates.
  const wall = new URLSearchParams(window.location.search).get('wall')
  return (
    <>
      <HeroCarousel />
      <WhyFlipos wall={wall} />
      <FlavourScrollStage />
      <FlavourVending />
      <Testimonials />
    </>
  )
}
