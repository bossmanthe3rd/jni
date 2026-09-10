import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

/**
 * Account / order history.
 *
 * On the live site this is gated behind the JWT from the Railway backend and
 * lists real orders. Without a backend the clone shows the logged-out state,
 * which is what an anonymous visitor sees on the real site too.
 */
export default function AccountPage() {
  useEffect(() => {
    document.title = 'Your account | Just Nibble It'
  }, [])

  return (
    <div className="min-w-0 flex-grow">
      <main className="box-border grid min-h-[100dvh] w-full place-items-center bg-cream px-4 pb-10 pt-[calc(var(--site-header-offset)+1rem)]">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl text-ink md:text-4xl">You are not logged in.</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">
            Log in to see your crates, orders and delivery updates.
          </p>
          <Link to="/auth" className="jni-btn mt-5">
            <ShoppingBag size={16} /> Log in
          </Link>
        </div>
      </main>
    </div>
  )
}
