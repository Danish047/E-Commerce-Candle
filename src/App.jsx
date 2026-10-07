import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout, { RequireAuth } from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Quiz from './pages/Quiz'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import { Login, Signup } from './pages/Auth'
import Account from './pages/Account'
import OrderDetail from './pages/OrderDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import CandleCare from './pages/CandleCare'
import Policy from './pages/Policy'
import NotFound from './pages/NotFound'

// Admin panel is split into its own bundle so shoppers never download it
const AdminApp = lazy(() => import('./admin/AdminApp'))

function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#EEF0EB]">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8763B] border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="admin/*" element={<Suspense fallback={<AdminLoading />}><AdminApp /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success/:orderNumber" element={<OrderSuccess />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="account/orders/:orderNumber" element={<RequireAuth><OrderDetail /></RequireAuth>} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="candle-care" element={<CandleCare />} />
        <Route path="policies/:type" element={<Policy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
