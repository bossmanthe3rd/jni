import { useEffect, useState } from 'react'
import { LOGO_SIZE, Wordmark } from '../icons/Wordmark'
import { NIBBLE_WORDS } from '../ui/NibbleWords'
import { fitInBlob } from '../ui/NibbleBlob'

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
 * Every face -- the lockup and each word -- is fitted to the blob on its own
 * terms: the largest box of that face's proportions the silhouette has room
 * for, centred on the spot the pack puts its logo. So they all share one
 * centre, and nothing shifts sideways or up and down on a swap.
 *
 * Fitting alone would leave the short words oversized: 3PM? has the room to
 * come out half again as tall as CRAVING?. WORD_LINE caps a line of a word at
 * a share of the blob's height -- the pitch of the lockup's own lines -- which
 * holds every word within about a tenth of the others and level with the logo
 * it takes turns with.
 *
 * INSET is the clear space kept round each face, as a share of the blob's
 * width -- about what the pack leaves between its logo and the lobes.
 */
const INSET = 0.04
const WORD_LINE = 0.19

const LOCKUP_BOX = fitInBlob(LOGO_SIZE.width / LOGO_SIZE.height, { inset: INSET })

const WORD_BOXES = Object.fromEntries(
  NIBBLE_WORDS.map((w) => {
    const [, , vw, vh] = w.viewBox.split(' ').map(Number)
    return [w.id, fitInBlob(vw / vh, { inset: INSET, maxHeight: WORD_LINE * w.lines })]
  }),
)

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
        className="absolute"
        style={{ ...LOCKUP_BOX, ...(showWord ? leaving : arriving), willChange: 'transform, opacity' }}
      >
        {/* The traced wordmark rather than the PNG: sharper, a third of the
            weight, and it lets the intro's hand-off land on exact geometry.
            data-intro-logo marks it as that landing target, which is also why
            this layer is only ever faded -- never unmounted. */}
        <Wordmark data-intro-logo="" fill={fill} className="block h-full w-full" />
      </span>

      <span
        className="absolute"
        style={{ ...WORD_BOXES[word.id], ...(showWord ? arriving : leaving), willChange: 'transform, opacity' }}
      >
        <svg viewBox={word.viewBox} className="block h-full w-full" aria-hidden="true">
          <path d={word.d} fill={fill} />
        </svg>
      </span>
    </span>
  )
}
