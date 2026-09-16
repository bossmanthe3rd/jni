import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { whyFeatures } from '../../data/site'
import { BrandHeading, Sparkle, WaveDivider } from '../ui/Primitives'
import DoodleField from '../ui/DoodleField'
import BlobPanel from '../ui/BlobPanel'

/**
 * One feature tile. The tile floats once it has scrolled into view, and the
 * icon's own CSS animation switches to its looping variant at the same time.
 */
function FeatureTile({ feature, index }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

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
          {/* The real artwork, replacing the transcribed placeholder SVGs.
              Each one already carries its own ink outline and hard offset
              shadow, so it needs no treatment here. Empty alt: the h3 below
              already names the feature, and the placeholders it replaces were
              aria-hidden for the same reason. */}
          <img
            src={feature.image}
            alt=""
            width="512"
            height="512"
            loading="lazy"
            decoding="async"
            className="h-20 w-20 object-contain sm:h-24 sm:w-24 lg:h-28 lg:w-28"
          />

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

      <h3 className="mt-3 font-display text-base leading-[1.1] text-white sm:mt-5 sm:text-lg lg:text-xl">
        {feature.lines[0]}
        <br />
        {feature.lines[1]}
      </h3>

      {/* The claim under the label. Without this the section is four glyphs
          and eight words -- decorative rather than persuasive. */}
      <p className="mt-2 max-w-[24ch] text-[0.8rem] font-bold leading-snug text-white/70 sm:mt-3 sm:text-sm">
        {feature.blurb}
      </p>
    </article>
  )
}

export default function WhyFlipos() {
  return (
    <section
      id="why-flipos"
      className="relative isolate overflow-hidden bg-[#fbf6d0] pb-20 pt-8 sm:pb-32 sm:pt-12"
    >
      {/* The pack never leaves a ground flat. DoodleField mixes each ink
          toward the ground it is given, so handing it cream is what keeps the
          doodles texture behind the type rather than competition for it. */}
      <DoodleField
        flavour="jalapeno-kick"
        ground="#fbf6d0"
        intensity="medium"
        count={22}
        seed={7}
        fadeEdges={{ top: 16, bottom: 10 }}
      />

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

        {/* One field holding all four, the way a pouch holds its content --
            rather than four separate cards, which would read as tiles. */}
        <BlobPanel
          role="wide"
          bg="#0D2818"
          pad="lg"
          className="mx-auto mt-10 max-w-5xl sm:mt-16"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-4 sm:gap-10">
            {whyFeatures.map((feature, i) => (
              <FeatureTile key={feature.id} feature={feature} index={i} />
            ))}
          </div>
        </BlobPanel>
      </div>

      <div className="absolute inset-x-0 -bottom-px z-20 h-12 w-full sm:h-16">
        <WaveDivider fill="#7d1206" className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  )
}
