import HeroCarousel from '../components/home/HeroCarousel'
import WhyFlipos from '../components/home/WhyFlipos'
import FlavourScrollStage from '../components/home/FlavourScrollStage'
import FlavourGrid from '../components/home/FlavourGrid'
import Testimonials from '../components/home/Testimonials'

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <WhyFlipos />
      <FlavourScrollStage />
      <FlavourGrid />
      <Testimonials />
    </>
  )
}
