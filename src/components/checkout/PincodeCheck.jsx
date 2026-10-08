import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { checkPincode, cleanPin, preloadPincodes, usePincode } from '../../lib/pincode'
import '../../styles/delivery.css'

/**
 * "Deliver to [_][_][_][_][_][_] Check" -- the PIN check.
 *
 * Drawn as the six boxes an Indian postal form prints for a PIN, but it is one
 * real input underneath: typing, pasting a whole PIN, autofill and screen
 * readers all work on an ordinary field, and the boxes only show its digits.
 * It checks itself on the sixth digit; the button is there for anyone who
 * expects one, and for the keyboard.
 *
 * The answer is the bill's own rubber stamp: Next day in the stamp teal, or
 * 2-4 days in ink. The last answer is remembered (usePincode), so a PIN
 * checked on a product page is already answered in the crate and at checkout.
 *
 *   size   'compact' (drawer, FAQ answer) or 'full' (checkout)
 */

const SLOW_MS = 150

export default function PincodeCheck({ size = 'compact', className = '' }) {
  const reduce = useReducedMotion()
  const id = useId()
  const inputRef = useRef(null)
  const saved = usePincode((s) => s.result)
  const setSaved = usePincode((s) => s.setResult)

  // Editing until there is a saved answer to show; "Change PIN" goes back.
  const [editing, setEditing] = useState(!saved)
  const [value, setValue] = useState(saved?.pin ?? '')
  const [focused, setFocused] = useState(false)
  const [problem, setProblem] = useState(null) // 'invalid' | 'failed'
  const [slow, setSlow] = useState(false)
  const run = useRef(0)

  // Another PIN field on the page answered: follow it.
  useEffect(() => {
    if (saved && !focused) {
      setValue(saved.pin)
      setEditing(false)
      setProblem(null)
    }
  }, [saved, focused])

  const check = async (raw) => {
    const ticket = ++run.current
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_MS)
    try {
      const result = await checkPincode(raw)
      if (ticket !== run.current) return
      if (result.status === 'invalid') {
        setProblem('invalid')
      } else {
        setProblem(null)
        setSaved(result)
        setEditing(false)
      }
    } catch {
      if (ticket === run.current) setProblem('failed')
    } finally {
      window.clearTimeout(slowTimer)
      if (ticket === run.current) setSlow(false)
    }
  }

  const onChange = (e) => {
    const pin = cleanPin(e.target.value)
    setValue(pin)
    setProblem(null)
    if (pin.length === 6) check(pin)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    check(value)
  }

  const change = () => {
    setEditing(true)
    setValue('')
    // After the field is back in the DOM.
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const answer = !editing && saved
  const describedBy = `${id}-msg`

  return (
    <div className={`pin-check pin-check--${size} ${className}`}>
      {answer ? (
        <div className="pin-answer" role="status">
          <AnimatePresence initial={false}>
            <motion.span
              key={`${saved.pin}-${saved.status}`}
              className="pin-stamp"
              data-kind={saved.status}
              initial={reduce ? false : { scale: 1.35, rotate: -14, opacity: 0 }}
              animate={{ scale: 1, rotate: -9, opacity: 0.9 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {saved.status === 'next-day' ? 'Next day' : '2–4 days'}
            </motion.span>
          </AnimatePresence>
          <p className="pin-answer-text">
            {saved.status === 'next-day' ? (
              <>
                <b>
                  {saved.city} · {saved.pin}
                </b>
                Arrives the day after it&apos;s dispatched.
              </>
            ) : (
              <>
                <b>{saved.pin}</b>
                Arrives 2–4 days after it&apos;s dispatched.
              </>
            )}
            <button type="button" className="pin-change" onClick={change}>
              Change PIN
            </button>
          </p>
        </div>
      ) : (
        <form className="pin-form" onSubmit={onSubmit} noValidate>
          <label htmlFor={id} className="pin-label">
            Deliver to
          </label>
          <div className="pin-row">
            <div className="pin-boxes" data-focused={focused ? '' : undefined} data-bad={problem === 'invalid' ? '' : undefined}>
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className="pin-box"
                  aria-hidden="true"
                  data-caret={focused && i === Math.min(value.length, 5) ? '' : undefined}
                >
                  {value[i] ?? ''}
                </span>
              ))}
              <input
                ref={inputRef}
                id={id}
                className="pin-input"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[1-9][0-9]{5}"
                maxLength={6}
                value={value}
                onChange={onChange}
                onFocus={() => {
                  setFocused(true)
                  preloadPincodes().catch(() => {})
                }}
                onBlur={() => setFocused(false)}
                aria-invalid={problem === 'invalid' || undefined}
                aria-describedby={describedBy}
                spellCheck={false}
              />
            </div>
            <button type="submit" className="pin-go" disabled={slow}>
              {slow ? 'Checking…' : 'Check'}
            </button>
          </div>
          <p id={describedBy} className="pin-msg" role="status" data-bad={problem ? '' : undefined}>
            {problem === 'invalid'
              ? 'Enter your 6-digit PIN code.'
              : problem === 'failed'
                ? 'Couldn’t check right now. Delivery is 2–4 days anywhere in India.'
                : 'Next day in six metros, 2–4 days everywhere else.'}
          </p>
        </form>
      )}
    </div>
  )
}
