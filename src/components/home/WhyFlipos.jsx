import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { whyFeatures } from '../../data/site'
import { whyIconMap } from '../icons/WhyIcons'
import { BrandHeading, Sparkle, WaveDivider } from '../ui/Primitives'

/**
 * One feature tile. The tile floats once it has scrolled into view, and the
 * icon's own CSS animation switches to its looping variant at the same time.
 */
function FeatureTile({ feature, index }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  const Icon = whyIconMap[feature.id]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <article className="flex flex-col items-center text-center">
      <motion.div
        animate={seen ? { y: [0, -7, 0] } : { y: 0 }}
        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut', delay: index * 0.25 }}
      >
        <div
          ref={ref}
          className={`why-icon relative ${feature.loopClass} ${seen ? 'why-loop' : ''}`}
        >
          <Icon className="h-14 w-14 sm:h-24 sm:w-24 lg:h-28 lg:w-28" />

          {feature.overlay === 'keys' && (
            <span className="why-keys text-[#071A16]">
              <i />
              <i />
              <i />
            </span>
          )}
          {feature.overlay === 'burst' && (
            <span className="why-burst">
              {Array.from({ length: 6 }).map((_, i) => (
                <i key={i} style={{ '--i': i }} />
              ))}
            </span>
          )}
        </div>
      </motion.div>

      <h3 className="mt-3 font-display text-[0.8rem] leading-[1.1] text-white sm:mt-5 sm:text-lg lg:text-xl">
        {feature.lines[0]}
        <br />
        {feature.lines[1]}
      </h3>
    </article>
  )
}

export default function WhyFlipos() {
  return (
    <section
      id="why-flipos"
      className="relative overflow-hidden bg-[#071A16] pb-16 pt-8 sm:pb-20 sm:pt-12"
    >
      <div className="relative z-10 px-3 text-center sm:px-8 lg:px-12">
        <div className="relative mx-auto inline-block">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute -left-8 -top-3 sm:-left-10 sm:-top-4"
          >
            <Sparkle className="h-7 w-7 sm:h-10 sm:w-10" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute -right-8 -top-2 sm:-right-10 sm:-top-3"
          >
            <Sparkle className="h-6 w-6 sm:h-9 sm:w-9" />
          </motion.div>
          <BrandHeading as="h2" fill="#4DB8AE" className="text-[2.6rem] sm:text-6xl lg:text-7xl">
            Why Flipo&apos;s ?
          </BrandHeading>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-4 gap-2 sm:mt-16 sm:gap-10">
          {whyFeatures.map((feature, i) => (
            <FeatureTile key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>

      <WaveDivider
        fill="#F3C63B"
        className="absolute inset-x-0 -bottom-px z-20 h-12 w-full sm:h-16"
      />
    </section>
  )
}
