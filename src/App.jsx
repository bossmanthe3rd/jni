import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CartDrawer from './components/layout/CartDrawer'
import RecentPurchaseToast from './components/layout/RecentPurchaseToast'
import NibbleIntro from './components/layout/NibbleIntro'
import { BlobClipDefs } from './components/ui/BlobShapes'
import HomePage from './pages/HomePage'

// Route-level code splitting, mirroring the live site's chunk boundaries.
const CombosPage = lazy(() => import('./pages/CombosPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const BundleDetailPage = lazy(() => import('./pages/BundleDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContentPage = lazy(() => import('./pages/ContentPage'))
const FlavoursPage = lazy(() => import('./pages/FlavoursPage'))
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

/** Scrolls to top on navigation, and to #hash targets when present. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
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
  return (
    <>
      <BlobClipDefs />
      <NibbleIntro />
      <SiteHeader />
      <ScrollManager />
      <main>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/flavours" element={<FlavoursPage />} />
            <Route path="/flavours/:slug" element={<ProductDetailPage />} />
            <Route path="/snacks/:slug" element={<ProductDetailPage />} />
            <Route path="/combos" element={<CombosPage />} />
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
      </main>
      <SiteFooter />
      <CartDrawer />
      <RecentPurchaseToast />
    </>
  )
}
