import { Component, Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CartDrawer from './components/layout/CartDrawer'
import RecentPurchaseToast from './components/layout/RecentPurchaseToast'
import NibbleIntro from './components/layout/NibbleIntro'
import { BlobClipDefs } from './components/ui/BlobShapes'
import HomePage from './pages/HomePage'
import { COMBO_HREF, SHOP_HREF } from './data/site'

// Route-level code splitting, mirroring the live site's chunk boundaries.
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const BundleDetailPage = lazy(() => import('./pages/BundleDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContentPage = lazy(() => import('./pages/ContentPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const ShippingReturnPage = lazy(() => import('./pages/ShippingReturnPage'))
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))

/** Matches the live site's route loading state. */
function RouteFallback() {
  return (
    <div
      className="grid min-h-[60vh] place-items-center bg-cream px-5 pt-[var(--site-header-offset)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-ink/15 border-t-ink" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/50">Loading</p>
      </div>
    </div>
  )
}

/**
 * A page that failed to render or to load -- most often a stale tab asking for
 * a chunk a newer deploy has replaced. Without this the whole app unmounts to
 * a blank screen; with it the header and footer stay up and a reload fetches
 * the current build. Keyed by pathname in App, so moving to another page
 * clears it.
 */
class RouteErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-[60vh] place-items-center bg-cream px-5 pt-[var(--site-header-offset)]" role="alert">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/50">This page didn&apos;t load</p>
          <p className="font-bold text-ink">Reload to try again. Your crate is saved.</p>
          <button type="button" className="jni-btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    )
  }
}

/** Scrolls to top on navigation, and to #hash targets when present. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // An id lookup, not querySelector: a hash like #1 or #a.b is not a valid
      // selector, and querySelector throws on it.
      let id = hash.slice(1)
      try {
        id = decodeURIComponent(id)
      } catch {
        // A malformed escape: look the raw text up instead.
      }
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <>
      <BlobClipDefs />
      <NibbleIntro />
      <SiteHeader />
      <ScrollManager />
      <main>
        <RouteErrorBoundary key={pathname}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* No flavours or combos index: picking happens at the vending
                  machine, and the combos link is the box on offer. The same
                  redirects run at the edge (vercel.json) for direct hits. */}
              <Route path="/flavours" element={<Navigate to={SHOP_HREF} replace />} />
              <Route path="/flavors" element={<Navigate to={SHOP_HREF} replace />} />
              <Route path="/flavours/:slug" element={<ProductDetailPage />} />
              <Route path="/snacks/:slug" element={<ProductDetailPage />} />
              <Route path="/combos" element={<Navigate to={COMBO_HREF} replace />} />
              <Route path="/combos/:slug" element={<BundleDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* The live site renders the same About page for /story. */}
              <Route path="/story" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/shipping" element={<ShippingReturnPage />} />
              <Route path="/shipping-and-return-policy" element={<ShippingReturnPage />} />
              <Route path="/returns" element={<ShippingReturnPage />} />
              <Route path="/refunds" element={<RefundPolicyPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/my-crates" element={<AccountPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              {/*
                ContentPage backs six real pages. The live site also used it as the
                catch-all, so any typo rendered the FAQ with a 200 and nothing ever
                said "not found" -- bad for readers and for indexing. Those six are
                now routed explicitly and everything else falls to NotFoundPage.
              */}
              <Route path="/contact" element={<ContentPage />} />
              <Route path="/terms" element={<ContentPage />} />
              <Route path="/faq" element={<ContentPage />} />
              <Route path="/ingredients" element={<ContentPage />} />
              <Route path="/sustainability" element={<ContentPage />} />
              <Route path="/press" element={<ContentPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <SiteFooter />
      <CartDrawer />
      <RecentPurchaseToast />
    </>
  )
}
