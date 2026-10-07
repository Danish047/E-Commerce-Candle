import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BRAND } from '../../api/config'
import { admin } from '../api'
import { useDebounced, useQuery } from '../hooks'
import { useAdminAuth } from '../store'
import {
  BoxIcon, CloseIcon, CogIcon, ExternalIcon, HomeIcon, InboxIcon, LayersIcon, LogoutIcon, MailIcon, MenuIcon,
  ReceiptIcon, SearchIcon, SparkIcon, StarIcon, TagIcon, UsersIcon,
} from './Icons'
import { Avatar, ConfirmHost, Jar, Menu, StatusBadge, Toaster, cx } from './kit'
import { inr } from '../hooks'

const NAV = [
  { items: [{ to: '/admin', label: 'Dashboard', icon: HomeIcon, end: true }] },
  {
    title: 'Sell',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ReceiptIcon, badge: 'orders' },
      { to: '/admin/products', label: 'Products', icon: BoxIcon },
      { to: '/admin/customers', label: 'Customers', icon: UsersIcon },
      { to: '/admin/coupons', label: 'Coupons', icon: TagIcon },
    ],
  },
  {
    title: 'Engage',
    items: [
      { to: '/admin/messages', label: 'Messages', icon: InboxIcon, badge: 'messages' },
      { to: '/admin/reviews', label: 'Reviews', icon: StarIcon },
      { to: '/admin/subscribers', label: 'Newsletter', icon: MailIcon },
    ],
  },
  {
    title: 'Store',
    items: [
      { to: '/admin/collections', label: 'Collections', icon: LayersIcon },
      { to: '/admin/quiz', label: 'Scent quiz', icon: SparkIcon },
      { to: '/admin/settings', label: 'Settings', icon: CogIcon },
    ],
  },
]

function BrandMark() {
  return (
    <Link to="/admin" className="flex items-center gap-3 px-2">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] ring-1 ring-white/10">
        <span className="absolute h-5 w-5 rounded-full bg-ember/40 blur-md animate-glow" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" aria-hidden="true">
          <path d="M12 3c3.6 4.4 5.2 7 5.2 9.6a5.2 5.2 0 0 1-10.4 0C6.8 10 8.4 7.4 12 3z" fill="#F4A340" />
          <path d="M12 9.5c1.6 2 2.3 3.2 2.3 4.3a2.3 2.3 0 0 1-4.6 0c0-1.1.7-2.3 2.3-4.3z" fill="#FFE3A3" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-serif text-lg font-semibold text-white">{BRAND.name}</span>
        <span className="block text-xs text-white/45">Store admin</span>
      </span>
    </Link>
  )
}

function Sidebar({ onNavigate, counts }) {
  return (
    <nav className="flex h-full flex-col bg-adm-side px-3 pb-4 pt-5 font-ui">
      <BrandMark />
      <div className="mt-7 flex-1 space-y-6 overflow-y-auto">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.title && <p className="mb-1.5 px-3 text-xs font-medium text-white/35">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                <li key={to}>
                  <NavLink to={to} end={end} onClick={onNavigate}
                    className={({ isActive }) => cx(
                      'group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] transition',
                      isActive ? 'bg-white/[.08] text-white' : 'text-white/60 hover:bg-white/[.04] hover:text-white',
                    )}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-ember" />}
                        <Icon className={cx('h-[18px] w-[18px]', isActive ? 'text-ember' : '')} />
                        <span className="flex-1">{label}</span>
                        {badge && counts?.[badge] > 0 && (
                          <span className="tabular rounded-full bg-ember px-1.5 py-px text-[11px] font-semibold text-white">{counts[badge]}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <a href="/" target="_blank" rel="noreferrer"
        className="mt-4 flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] text-white/60 transition hover:bg-white/[.04] hover:text-white">
        <ExternalIcon className="h-[18px] w-[18px]" /> View store
      </a>
    </nav>
  )
}

function QuickSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const input = useRef()
  const box = useRef()
  const nav = useNavigate()
  const dq = useDebounced(q, 250)
  const { data } = useQuery(() => (dq.length >= 2 ? admin.search(dq) : Promise.resolve(null)), [dq])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  const go = (to) => {
    setOpen(false)
    setQ('')
    nav(to)
  }
  const empty = data && !data.orders.length && !data.products.length && !data.customers.length

  return (
    <div ref={box} className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-adm-muted" />
      <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && (setOpen(false), e.target.blur())}
        placeholder="Search orders, products, customers" aria-label="Search the admin"
        className="a-input border-transparent bg-adm-ink/[.05] pl-9 pr-12 hover:border-transparent focus:bg-white" />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-adm-line bg-white px-1.5 text-[10px] text-adm-muted sm:block">⌘K</kbd>
      {open && q.length >= 2 && data && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-adm-line bg-white p-1.5 shadow-2xl animate-rise">
          {empty && <p className="px-3 py-6 text-center text-sm text-adm-muted">Nothing matches “{q}”.</p>}
          {data.orders.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-adm-muted">Orders</p>}
          {data.orders.map((o) => (
            <button key={o.order_number} onClick={() => go(`/admin/orders/${o.order_number}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-adm-soft">
              <span className="tabular font-semibold">{o.order_number}</span>
              <span className="flex-1 truncate text-adm-muted">{o.customer_name}</span>
              <span className="tabular">{inr(o.total)}</span>
              <StatusBadge status={o.status} />
            </button>
          ))}
          {data.products.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-adm-muted">Products</p>}
          {data.products.map((p) => (
            <button key={p.id} onClick={() => go(`/admin/products/${p.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-adm-soft">
              <Jar color={p.color} size={28} />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="tabular text-xs text-adm-muted">{p.stock} in stock</span>
            </button>
          ))}
          {data.customers.length > 0 && <p className="px-3 pb-1 pt-2 text-xs text-adm-muted">Customers</p>}
          {data.customers.map((c) => (
            <button key={c.id} onClick={() => go(`/admin/customers?open=${c.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-adm-soft">
              <Avatar name={c.name} size={26} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="truncate text-xs text-adm-muted">{c.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const [drawer, setDrawer] = useState(false)
  const { user, logout } = useAdminAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const counts = useQuery(() => admin.navCounts(), [pathname])

  useEffect(() => {
    window.scrollTo(0, 0)
    setDrawer(false)
  }, [pathname])

  // keep name/role fresh (e.g. after an owner changes someone's access)
  useEffect(() => {
    admin.auth.me().then((u) => useAdminAuth.getState().setUser(u)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-adm-bg font-ui text-adm-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
        <Sidebar counts={counts.data} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-adm-side/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[268px] animate-rise">
            <Sidebar counts={counts.data} onNavigate={() => setDrawer(false)} />
            <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-5 text-white/60 hover:text-white">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-adm-line bg-adm-bg/85 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setDrawer(true)} className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-adm-ink/5 lg:hidden" aria-label="Open menu">
            <MenuIcon />
          </button>
          <QuickSearch />
          <div className="ml-auto">
            <Menu
              trigger={
                <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-adm-ink/5">
                  <Avatar name={user?.name} size={32} />
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-semibold">{user?.name}</span>
                    <span className="block text-xs capitalize text-adm-muted">{user?.role}</span>
                  </span>
                </button>
              }
              items={[
                { label: 'Profile & password', icon: CogIcon, onClick: () => nav('/admin/settings?tab=profile') },
                { label: 'Open the store', icon: ExternalIcon, onClick: () => window.open('/', '_blank') },
                { label: 'Sign out', icon: LogoutIcon, danger: true, onClick: () => logout() },
              ]}
            />
          </div>
        </header>
        <main className="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <ConfirmHost />
    </div>
  )
}
