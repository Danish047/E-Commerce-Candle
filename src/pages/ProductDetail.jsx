import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { discountPct, inr, useApi } from '../utils/helpers'
import { useCart } from '../store/cart'
import { useAuth } from '../store/auth'
import CandleImage from '../components/CandleImage'
import ProductCard from '../components/ProductCard'
import { QtyControl } from '../components/CartDrawer'
import { Badge, ErrorBox, Spinner, Stars } from '../components/ui'
import { ClockIcon, FlameIcon, LeafIcon, TruckIcon } from '../components/Icons'
import NotFound from './NotFound'

function PincodeCheck() {
  const [pin, setPin] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)

  const check = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(pin)) return setRes({ error: 'Enter a valid 6-digit pincode' })
    setBusy(true)
    try {
      setRes(await api.checkout.checkPincode(pin))
    } catch (err) {
      setRes({ error: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={check} className="rounded-2xl border border-sand p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium"><TruckIcon className="h-4 w-4 text-ember" /> Check delivery</p>
      <div className="flex gap-2">
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric"
          placeholder="Enter pincode" className="input py-2" />
        <button disabled={busy} className="rounded-xl bg-cocoa px-4 text-sm font-semibold text-cream disabled:opacity-60">Check</button>
      </div>
      {res?.error && <p className="mt-2 text-xs text-red-600">{res.error}</p>}
      {res && !res.error && (
        <p className="mt-2 text-xs text-green-700">
          {res.serviceable ? `Delivery in ${res.estimated_days} days${res.cod_available ? ' · COD available' : ''}` : 'Sorry, we do not deliver here yet.'}
        </p>
      )}
    </form>
  )
}

function Reviews({ product }) {
  const user = useAuth((s) => s.user)
  const { data, loading, error, reload } = useApi(() => api.reviews.list(product.slug), [product.slug])
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      await api.reviews.create(product.slug, form)
      setForm({ rating: 5, title: '', comment: '' })
      setOpen(false)
      reload()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-20" id="reviews">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="section-title">Reviews</h2>
          <div className="mt-2 flex items-center gap-2 text-cocoa-soft">
            <Stars value={product.rating} /> <span>{product.rating} · {product.reviews_count} reviews</span>
          </div>
        </div>
        {user ? (
          <button onClick={() => setOpen((o) => !o)} className="btn-outline">Write a review</button>
        ) : (
          <Link to="/login" state={{ from: `/product/${product.slug}` }} className="btn-outline">Login to review</Link>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mb-10 space-y-4 rounded-2xl bg-wax p-6">
          <div className="flex gap-1 text-3xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}
                className={n <= form.rating ? 'text-ember' : 'text-sand'} aria-label={`${n} stars`}>★</button>
            ))}
          </div>
          <input className="input" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea required rows={4} className="input" placeholder="How did it smell? How was the burn?"
            value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button disabled={busy} className="btn-primary">{busy ? 'Posting…' : 'Post review'}</button>
        </form>
      )}

      {loading ? <Spinner /> : error ? <ErrorBox error={error} onRetry={reload} /> : data.length === 0 ? (
        <p className="text-cocoa-soft">No reviews yet. Be the first to share how it smells!</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.map((r) => (
            <article key={r.id} className="rounded-2xl border border-sand p-5">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-cocoa-soft">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm text-cocoa-soft">{r.comment}</p>
              <p className="mt-3 text-xs font-medium">{r.user_name}{r.verified && <span className="ml-2 text-green-700">✓ Verified buyer</span>}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const add = useCart((s) => s.add)
  const [qty, setQty] = useState(1)
  const { data: p, loading, error, reload } = useApi(() => api.catalog.product(slug), [slug])
  const related = useApi(() => api.catalog.related(slug), [slug])

  if (loading) return <Spinner />
  if (error?.status === 404) return <NotFound />
  if (error) return <div className="container-x py-16"><ErrorBox error={error} onRetry={reload} /></div>

  const off = discountPct(p.price, p.compare_price)
  const soldOut = p.stock <= 0

  return (
    <div className="container-x pt-8">
      <nav className="mb-6 text-sm text-cocoa-soft">
        <Link to="/" className="hover:underline">Home</Link> / <Link to="/shop" className="hover:underline">Shop</Link> / <span className="text-cocoa">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-3xl lg:sticky lg:top-32 lg:self-start">
          <CandleImage product={p} flame />
          <div className="absolute left-4 top-4 flex gap-2">
            {p.is_bestseller && <Badge tone="dark">Bestseller</Badge>}
            {p.is_new && <Badge tone="sage">New</Badge>}
          </div>
        </div>

        <div>
          <a href="#reviews" className="flex items-center gap-2 text-sm text-cocoa-soft">
            <Stars value={p.rating} /> {p.rating} ({p.reviews_count} reviews)
          </a>
          <h1 className="mt-2 font-serif text-5xl font-semibold leading-tight">{p.name}</h1>
          <p className="mt-2 text-lg italic text-cocoa-soft">{p.tagline}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{inr(p.price)}</span>
            {off > 0 && <><span className="text-lg text-cocoa-soft line-through">{inr(p.compare_price)}</span><Badge>Save {off}%</Badge></>}
          </div>
          <p className="mt-1 text-xs text-cocoa-soft">Inclusive of all taxes · {p.size}</p>

          {/* Scent notes */}
          {(() => {
            // Only show note levels that have notes; a single-level scent reads as "Fragrance".
            const levels = ['top', 'middle', 'base'].filter((k) => p.notes?.[k]?.length)
            if (!levels.length) return null
            return (
              <div className="mt-8 rounded-2xl bg-wax p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-cocoa-soft">Scent notes</p>
                {levels.map((k) => (
                  <div key={k} className="flex gap-4 border-b border-sand/70 py-2 last:border-0">
                    <span className="w-20 text-sm capitalize text-cocoa-soft">{levels.length === 1 ? 'Fragrance' : k}</span>
                    <span className="text-sm font-medium">{p.notes[k].join(', ')}</span>
                  </div>
                ))}
              </div>
            )
          })()}

          <div className="mt-6 flex items-center gap-4">
            <QtyControl value={qty} max={Math.max(1, p.stock)} onChange={(q) => setQty(Math.max(1, q))} />
            <span className={`text-sm ${p.stock < 10 ? 'text-ember' : 'text-cocoa-soft'}`}>
              {soldOut ? 'Out of stock' : p.stock < 10 ? `Only ${p.stock} left!` : 'In stock'}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button disabled={soldOut} onClick={() => add(p, qty)} className="btn-outline">Add to cart</button>
            <button disabled={soldOut} onClick={() => { add(p, qty); useCart.getState().close(); navigate('/checkout') }} className="btn-primary">Buy now</button>
          </div>

          <div className="mt-6"><PincodeCheck /></div>

          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            {[
              [ClockIcon, 'Burn time', `${p.burn_time_hours}+ hours`],
              [LeafIcon, 'Wax', p.wax_type],
              [FlameIcon, 'Wick', p.wick_type],
              [LeafIcon, 'Fragrance load', p.fragrance_load],
            ].map(([Icon, label, val]) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-ember" />
                <div><p className="text-cocoa-soft">{label}</p><p className="font-medium">{val}</p></div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-2">
            <details open className="rounded-xl border border-sand p-4">
              <summary className="cursor-pointer font-medium">Description</summary>
              <p className="mt-3 text-sm leading-relaxed text-cocoa-soft">{p.description}</p>
            </details>
            <details className="rounded-xl border border-sand p-4">
              <summary className="cursor-pointer font-medium">Candle care</summary>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cocoa-soft">
                <li>First burn: let the top melt fully to the edges (2–3 hours) to avoid tunnelling.</li>
                <li>Trim the wick to 5 mm before every burn.</li>
                <li>Never burn for more than 4 hours at a time.</li>
              </ul>
              <Link to="/candle-care" className="mt-2 inline-block text-sm underline">Full care guide</Link>
            </details>
            <details className="rounded-xl border border-sand p-4">
              <summary className="cursor-pointer font-medium">Shipping & returns</summary>
              <p className="mt-3 text-sm text-cocoa-soft">Ships in 1–2 days. Free shipping above ₹999. Damaged in transit? Send us an unboxing video within 48 hours for a free replacement.</p>
            </details>
          </div>
        </div>
      </div>

      <Reviews product={p} />

      {related.data?.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title mb-8">You may also love</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.data.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  )
}
