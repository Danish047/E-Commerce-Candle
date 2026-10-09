import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { BRAND, WHATSAPP_NUMBER } from '../api/config'
import { WhatsAppIcon } from './Icons'

// "GenZ In It." already ends with a dot, so don't add a second one after it.
const brandSentence = BRAND.name.replace(/\.$/, '')

export function WhatsAppButton() {
  const msg = encodeURIComponent(`Hi ${brandSentence}! I have a question about your candles.`)
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: '', msg: '' })
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.misc.newsletter(email)
      setStatus({ type: 'ok', msg: res.detail })
      setEmail('')
    } catch (err) {
      setStatus({ type: 'err', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <p className="font-serif text-2xl">Join the Glow List</p>
      <p className="mt-1 text-sm text-sand">New scents, festive drops and 10% off your first order.</p>
      <div className="mt-4 flex overflow-hidden rounded-full bg-cream">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-cocoa outline-none"
        />
        <button disabled={busy} className="bg-ember px-5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? '…' : 'Subscribe'}
        </button>
      </div>
      {status.msg && <p className={`mt-2 text-sm ${status.type === 'ok' ? 'text-green-300' : 'text-red-300'}`}>{status.msg}</p>}
    </form>
  )
}

export default function Footer() {
  const col = 'flex flex-col gap-2.5 text-sm text-sand'
  return (
    <footer className="mt-24 bg-cocoa text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-serif text-3xl font-bold">{BRAND.name}</p>
          <p className="mt-2 max-w-xs text-sm text-sand">{BRAND.tagline}. Small-batch, 100% soy, made in India.</p>
          <div className="mt-8"><Newsletter /></div>
        </div>
        <div className={col}>
          <p className="mb-1 font-semibold text-cream">Shop</p>
          <Link to="/shop">All Candles</Link>
          <Link to="/shop?category=trending">Trending on Insta</Link>
          <Link to="/shop?ordering=-reviews_count">Bestsellers</Link>
          <Link to="/shop?category=gift-sets">Gift Sets</Link>
          <Link to="/shop?occasion=corporate">Corporate Gifting</Link>
          <Link to="/quiz">Scent Quiz</Link>
        </div>
        <div className={col}>
          <p className="mb-1 font-semibold text-cream">Help</p>
          <Link to="/candle-care">Candle Care</Link>
          <Link to="/policies/shipping">Shipping</Link>
          <Link to="/policies/returns">Returns & Refunds</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/account">Track Order</Link>
        </div>
        <div className={col}>
          <p className="mb-1 font-semibold text-cream">Company</p>
          <Link to="/about">Our Story</Link>
          <Link to="/policies/privacy">Privacy Policy</Link>
          <Link to="/policies/terms">Terms of Service</Link>
          {BRAND.instagram && <a href={BRAND.instagram} target="_blank" rel="noreferrer">Instagram</a>}
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
        </div>
      </div>
      <div className="border-t border-cocoa-soft/40 py-5 text-center text-xs text-sand">
        © {new Date().getFullYear()} {brandSentence}. Hand-poured with love in India.
      </div>
    </footer>
  )
}
