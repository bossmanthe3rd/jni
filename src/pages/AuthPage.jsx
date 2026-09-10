import { useEffect, useState } from 'react'

/**
 * Login / signup form.
 *
 * The live site POSTs to /auth/login and /auth/register on its Railway backend
 * and stores a JWT in localStorage. This clone has no backend, so submitting
 * shows a notice instead of authenticating. Markup matches the original.
 */
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
      <main className="bg-cream pt-24">
        <div className="mx-auto grid min-h-[calc(100dvh-6rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="jni-card w-full max-w-md p-5 shadow-doodle md:p-6">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-teal">
              {isLogin ? 'Welcome back' : 'Join the crunch'}
            </p>
            <h1 className="mb-6 font-display text-2xl tracking-tight text-ink md:text-3xl">
              {isLogin ? 'Log in' : 'Sign up'}
            </h1>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Name"
                  required
                  className="h-12 w-full rounded-2xl border-thick border-outline bg-cream px-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/40 focus:border-teal"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                required
                className="h-12 w-full rounded-2xl border-thick border-outline bg-cream px-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/40 focus:border-teal"
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="h-12 w-full rounded-2xl border-thick border-outline bg-cream px-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/40 focus:border-teal"
              />
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
                className="ml-2 font-bold text-teal"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
