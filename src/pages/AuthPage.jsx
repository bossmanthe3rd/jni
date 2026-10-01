import { useEffect, useState } from 'react'

/**
 * Login / signup form.
 *
 * The live site POSTs to /auth/login and /auth/register on its Railway backend
 * and stores a JWT in localStorage. This clone has no backend, so submitting
 * shows a notice instead of authenticating. Markup matches the original.
 */
/* 16px text: anything smaller and iOS Safari zooms the page in on focus and
   leaves it zoomed after the keyboard closes. */
const inputClass =
  'h-12 w-full rounded-2xl border-thick border-outline bg-cream px-3 text-base font-semibold text-ink outline-none transition focus:border-teal'

/* A visible label rather than a placeholder: the placeholder vanished the
   moment anyone typed, and autofill keyed off nothing. */
function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink/60">{label}</span>
      {children}
    </label>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.title = 'Log in | Just Nibble It'
  }, [])

  const isLogin = mode === 'login'

  const handleSubmit = (e) => {
    e.preventDefault()
    setNotice('This clone has no backend — auth is not wired up. See reference/CLONE-NOTES.md.')
  }

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-cream pt-[var(--site-header-offset)]">
        <div className="mx-auto grid min-h-[calc(100dvh-var(--site-header-offset))] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="jni-card w-full max-w-md p-5 shadow-doodle md:p-6">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-teal">
              {isLogin ? 'Welcome back' : 'Join the crunch'}
            </p>
            <h1 className="mb-6 font-display text-2xl tracking-tight text-ink md:text-3xl">
              {isLogin ? 'Log in' : 'Sign up'}
            </h1>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <Field label="Name">
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    required
                    className={inputClass}
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  name="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  enterKeyHint="go"
                  required
                  className={inputClass}
                />
              </Field>
              <button type="submit" className="jni-btn mt-1 w-full">
                {isLogin ? 'Log in' : 'Create account'}
              </button>
            </form>

            {notice && (
              <p className="mt-4 rounded-xl border-[2px] border-ink/15 bg-ink/5 px-3 py-2 text-xs font-bold text-ink/70">
                {notice}
              </p>
            )}

            <p className="mt-6 text-center text-sm font-medium text-ink/50">
              {isLogin ? 'New to the snack game?' : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setMode(isLogin ? 'signup' : 'login')
                  setNotice('')
                }}
                className="ml-1 inline-flex min-h-[44px] items-center px-1 font-bold text-teal"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
