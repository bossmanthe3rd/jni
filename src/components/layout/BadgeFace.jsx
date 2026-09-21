import { useEffect, useState } from 'react'
import { Wordmark } from '../icons/Wordmark'
import { NIBBLE_WORDS } from '../ui/NibbleWords'

/**
 * What the header badge is showing right now: the logo, or one of the words
 * it asks between showings of the logo.
 *
 * The lockup always comes back between words -- the badge asks, then answers
 * with its own name -- so the rotation is logo, HUNGRY?, logo, BORED?, and on
 * round. Odd steps show a word, even steps the logo.
 *
 * Which word is on the layer therefore has to lag the step by one. Deriving it
 * from the current step advances it on the very render that starts the word
 * fading out, so the next word swaps in under a layer that is still visible
 * and you get a frame of CRAVING? on your way out of HUNGRY?. Keyed off the
 * last odd step instead, the layer holds the word it was showing all the way
 * through its own exit, and only changes over while it is fully hidden.
 */

const FIRST_HOLD = 5200   // clears the intro's own hand-off before anything moves
const LOGO_HOLD = 3400
const WORD_HOLD = 1700
const OUT_MS = 150
const IN_MS = 280

// The squash the rest of the brand moves with -- the intro drops the lockup in
// on it and .jni-btn springs on it. A cross-fade would have done the job and
// looked like every other rotator on the web.
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const SQUASHED = 'scaleY(0.72) scaleX(1.06)'

const leaving = {
  opacity: 0,
  transform: SQUASHED,
  transition: `opacity ${OUT_MS}ms ease-in, transform ${OUT_MS}ms ease-in`,
}

const arriving = {
  opacity: 1,
  transform: 'none',
  transition: `opacity ${IN_MS}ms ease-out ${OUT_MS}ms, transform ${IN_MS}ms ${POP} ${OUT_MS}ms`,
}

/**
 * The words are set to a box wider and shorter than the lockup's, and fitted
 * into it with `meet`. That single rule is what keeps the rotation even: the
 * long words land on the box's width and the short ones on its height, so
 * every word comes out within a few per cent of the same cap height instead of
 * 3PM? arriving twice the size of CRAVING?.
 *
 * Percentages are of the lockup's own slot, which is 52.4% x 63.8% of the
 * blob -- so 137% of it across is 72% of the badge, which is as wide as a word
 * can go before it runs out of blob to sit on.
 */
const WORD_WIDTH = 137
const WORD_HEIGHT = { 1: 41, 2: 85 }

function wordBox(lines) {
  const height = WORD_HEIGHT[lines] ?? WORD_HEIGHT[1]
  return {
    position: 'absolute',
    left: `${(100 - WORD_WIDTH) / 2}%`,
    top: `${(100 - height) / 2}%`,
    width: `${WORD_WIDTH}%`,
    height: `${height}%`,
    willChange: 'transform, opacity',
  }
}

export function BadgeFace({ fill }) {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)

  // Held back until the page is visible and the viewer has not asked for less
  // motion. A word swapping in a background tab is work nobody sees, and a
  // lockup that changes on a loop is exactly what reduced motion is for.
  useEffect(() => {
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sync = () => setRunning(motionOk && document.visibilityState === 'visible')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  useEffect(() => {
    if (!running) return
    const showing = step % 2 === 1
    const hold = showing ? WORD_HOLD : step === 0 ? FIRST_HOLD : LOGO_HOLD
    const t = setTimeout(() => setStep((s) => s + 1), hold)
    return () => clearTimeout(t)
  }, [running, step])

  const showWord = running && step % 2 === 1
  // floor((step - 1) / 2): the word of the last odd step, held through the
  // even step that follows it. Step 0 has never shown one, so it clamps.
  const word = NIBBLE_WORDS[Math.max(0, Math.floor((step - 1) / 2)) % NIBBLE_WORDS.length]

  return (
    <span className="relative block h-full w-full">
      <span
        className="absolute inset-0 grid place-items-center"
        style={{ ...(showWord ? leaving : arriving), willChange: 'transform, opacity' }}
      >
        {/* The traced wordmark rather than the PNG: sharper, a third of the
            weight, and it lets the intro's hand-off land on exact geometry.
            data-intro-logo marks it as that landing target, which is also why
            this layer is only ever faded -- never unmounted. */}
        <Wordmark data-intro-logo="" fill={fill} className="h-full w-auto" />
      </span>

      <span style={{ ...wordBox(word.lines), ...(showWord ? arriving : leaving) }}>
        <svg
          viewBox={word.viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          aria-hidden="true"
        >
          <path d={word.d} fill={fill} />
        </svg>
      </span>
    </span>
  )
}
