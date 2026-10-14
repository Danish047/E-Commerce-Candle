import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BRAND } from '../api/config'
import { cartCount, useCart } from '../store/cart'
import { useAuth } from '../store/auth'
import AnnouncementBar from './AnnouncementBar'
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from './Icons'

const links = [
  { to: '/shop', label: 'Shop All' },
  { to: '/shop?category=gift-sets', label: 'Gift Sets' },
  { to: '/shop?occasion=diwali', label: 'Diwali' },
  { to: '/quiz', label: 'Scent Quiz' },
  { to: '/bulk-order', label: 'Bulk Order' },
  { to: '/about', label: 'Our Story' },
]

export default function Navbar() {
  const count = useCart((s) => cartCount(s.items))
  const openCart = useCart((s) => s.open)
  const user = useAuth((s) => s.user)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { pathname, search: qs } = useLocation()

  useEffect(() => {
    setMenu(false)
    setSearch(false)
  }, [pathname, qs])

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/shop?search=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar fallback={
        <div className="bg-cocoa py-2 text-center text-xs tracking-wide text-cream">
          Free shipping above ₹999 · Use <b>WELCOME10</b> for 10% off your first order
        </div>
      } />
      <nav className="border-b border-sand/70 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <button className="lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <MenuIcon className="h-6 w-6" />
          </button>
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-cocoa">{BRAND.name}</Link>

          <div className="ml-8 hidden gap-7 lg:flex">
            {links.map((l) => (
              <NavLink key={l.label} to={l.to} className="text-sm font-medium text-cocoa-soft transition hover:text-ember">
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-4 text-cocoa">
            <button onClick={() => setSearch((s) => !s)} aria-label="Search"><SearchIcon /></button>
            <Link to={user ? '/account' : '/login'} aria-label="Account" className="flex items-center gap-1.5">
              <UserIcon />
              <span className="hidden text-sm sm:inline">{user ? user.name.split(' ')[0] : 'Login'}</span>
            </Link>
            <button onClick={openCart} className="relative" aria-label="Open cart">
              <BagIcon className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {search && (
          <form onSubmit={submit} className="mx-auto max-w-7xl px-4 pb-4">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scents like chai, rose, lavender…"
              className="w-full rounded-full border border-sand bg-white px-5 py-3 text-sm outline-none focus:border-ember"
            />
          </form>
        )}
      </nav>

      {/* Mobile menu */}
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-cocoa/40" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-cream p-6 shadow-xl">
            <button onClick={() => setMenu(false)} aria-label="Close menu" className="mb-6"><CloseIcon className="h-6 w-6" /></button>
            <div className="flex flex-col gap-5">
              {links.map((l) => (
                <Link key={l.label} to={l.to} className="font-serif text-2xl text-cocoa">{l.label}</Link>
              ))}
              <hr className="border-sand" />
              <Link to="/candle-care" className="text-cocoa-soft">Candle Care</Link>
              <Link to="/contact" className="text-cocoa-soft">Contact</Link>
              <Link to={user ? '/account' : '/login'} className="text-cocoa-soft">{user ? 'My Account' : 'Login / Sign up'}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
