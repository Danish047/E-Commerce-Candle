import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AdminLayout from './components/AdminLayout'
import { Empty } from './components/kit'
import { FlameIcon } from './components/Icons'
import { useAdminAuth } from './store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderView from './pages/OrderView'
import Products from './pages/Products'
import ProductEditor from './pages/ProductEditor'
import Customers from './pages/Customers'
import Coupons from './pages/Coupons'
import Reviews from './pages/Reviews'
import Messages from './pages/Messages'
import Subscribers from './pages/Subscribers'
import Collections from './pages/Collections'
import Quiz from './pages/Quiz'
import Banners from './pages/Banners'
import Settings from './pages/Settings'

function RequireAdmin({ children }) {
  const user = useAdminAuth((s) => s.user)
  const loc = useLocation()
  if (!user) return <Navigate to="/admin/login" replace state={{ from: loc.pathname + loc.search }} />
  return children
}

function AdminNotFound() {
  return (
    <section className="a-panel">
      <Empty icon={FlameIcon} title="This page burned out" text="The link may be old, or the item was deleted."
        action={<a href="/admin" className="a-btn-primary">Back to dashboard</a>} />
    </section>
  )
}

export default function AdminApp() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Admin · Lumière & Co.'
    return () => { document.title = prev }
  }, [])

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderNumber" element={<OrderView />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="messages" element={<Messages />} />
        <Route path="subscribers" element={<Subscribers />} />
        <Route path="collections" element={<Collections />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="banners" element={<Banners />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Routes>
  )
}
