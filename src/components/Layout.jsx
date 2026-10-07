import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer, { WhatsAppButton } from './Footer'
import CartDrawer from './CartDrawer'
import { USE_MOCK } from '../api/config'
import { useAuth } from '../store/auth'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export function RequireAuth({ children }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream font-sans text-cocoa">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      {USE_MOCK && (
        <div className="fixed bottom-5 left-5 z-30 rounded-full bg-cocoa/80 px-3 py-1 text-[11px] text-cream">
          Demo mode · dummy data
        </div>
      )}
    </div>
  )
}
