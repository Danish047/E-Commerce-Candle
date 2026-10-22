import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BRAND, FREE_SHIPPING_ABOVE, RAZORPAY_KEY, SHIPPING_FEE, USE_MOCK, COD_ENABLED } from '../api/config'
import { cartSubtotal, useCart } from '../store/cart'
import { useAuth } from '../store/auth'
import { INDIAN_STATES, inr, loadScript } from '../utils/helpers'
import CandleImage from '../components/CandleImage'
import { Field } from '../components/ui'

const emptyAddress = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' }

function validate(addr, email, isGuest) {
  const e = {}
  if (isGuest && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email'
  if (!addr.name.trim()) e.name = 'Required'
  if (!/^[6-9]\d{9}$/.test(addr.phone)) e.phone = 'Enter a valid 10-digit mobile number'
  if (!addr.line1.trim()) e.line1 = 'Required'
  if (!addr.city.trim()) e.city = 'Required'
  if (!addr.state) e.state = 'Required'
  if (!/^\d{6}$/.test(addr.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
  return e
}

export default function Checkout() {
  const { items, clear } = useCart()
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email || '')
  const [addr, setAddr] = useState({ ...emptyAddress, name: user?.name || '', phone: user?.phone || '' })
  const [giftNote, setGiftNote] = useState('')
  const [isGift, setIsGift] = useState(false)
  const [payment, setPayment] = useState('razorpay')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null) // { code, discount, message }
  const [couponMsg, setCouponMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const subtotal = cartSubtotal(items)
  const discount = coupon?.discount || 0
  const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE
  const total = subtotal - discount + shipping

  if (!items.length) {
    return (
      <div className="container-x py-24 text-center">
        <p className="font-serif text-3xl">Your cart is empty</p>
        <Link to="/shop" className="btn-primary mt-6">Shop candles</Link>
      </div>
    )
  }

  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value })

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponMsg('')
    try {
      const res = await api.checkout.validateCoupon(couponInput.trim(), subtotal)
      if (res.valid) setCoupon(res)
      else { setCoupon(null); setCouponMsg(res.message) }
    } catch (e) {
      setCouponMsg(e.message)
    }
  }

  const finish = (order) => {
    sessionStorage.setItem('lastOrder', JSON.stringify(order))
    clear()
    navigate(`/order-success/${order.order_number}`)
  }

  const payWithRazorpay = async (order, rzp) => {
    // Demo mode: pretend the payment went through
    if (USE_MOCK) {
      const res = await api.orders.verifyPayment({
        order_number: order.order_number,
        razorpay_order_id: rzp.order_id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
      })
      return finish(res.order)
    }

    const ok = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
    if (!ok) throw new Error('Could not load Razorpay. Check your internet connection.')

    return new Promise((resolve, reject) => {
      const rz = new window.Razorpay({
        key: rzp.key || RAZORPAY_KEY,
        amount: rzp.amount,
        currency: rzp.currency,
        order_id: rzp.order_id,
        name: BRAND.name,
        description: `Order ${order.order_number}`,
        prefill: { name: addr.name, email: order.email, contact: addr.phone },
        theme: { color: '#C8763B' },
        handler: async (resp) => {
          try {
            const res = await api.orders.verifyPayment({ order_number: order.order_number, ...resp })
            finish(res.order)
            resolve()
          } catch (e) {
            reject(e)
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment was cancelled. Your order is saved as pending — you can try again.')) },
      })
      rz.open()
    })
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    const errs = validate(addr, email, !user)
    setErrors(errs)
    if (Object.keys(errs).length) return window.scrollTo({ top: 0, behavior: 'smooth' })

    setBusy(true)
    setServerError('')
    try {
      const res = await api.orders.create({
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        shipping_address: addr,
        email: user ? undefined : email,
        coupon_code: coupon?.code || null,
        payment_method: payment,
        gift_note: isGift ? giftNote : '',
      })
      if (payment === 'razorpay') await payWithRazorpay(res.order, res.razorpay)
      else finish(res.order)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-serif text-4xl font-semibold">Checkout</h1>
      {!user && (
        <p className="mt-2 text-sm text-cocoa-soft">
          Have an account? <Link to="/login" state={{ from: '/checkout' }} className="underline">Log in</Link> for faster checkout. Or continue as a guest.
        </p>
      )}

      <form onSubmit={placeOrder} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]" noValidate>
        <div className="space-y-10">
          {!user && (
            <section>
              <h2 className="mb-4 font-serif text-2xl font-semibold">Contact</h2>
              <Field label="Email" error={errors.email} hint="We'll send your order updates here">
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </section>
          )}

          <section>
            <h2 className="mb-4 font-serif text-2xl font-semibold">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}><input className="input" value={addr.name} onChange={set('name')} /></Field>
              <Field label="Mobile number" error={errors.phone}>
                <input className="input" inputMode="numeric" value={addr.phone}
                  onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="House / flat, street" error={errors.line1}><input className="input" value={addr.line1} onChange={set('line1')} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Area, landmark (optional)"><input className="input" value={addr.line2} onChange={set('line2')} /></Field>
              </div>
              <Field label="City" error={errors.city}><input className="input" value={addr.city} onChange={set('city')} /></Field>
              <Field label="Pincode" error={errors.pincode}>
                <input className="input" inputMode="numeric" value={addr.pincode}
                  onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="State" error={errors.state}>
                  <select className="input" value={addr.state} onChange={set('state')}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-sand p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="h-4 w-4 accent-ember" />
              <span className="font-medium">🎁 This is a gift</span>
              <span className="text-sm text-cocoa-soft">— we'll add a handwritten note and hide the price</span>
            </label>
            {isGift && (
              <textarea rows={3} maxLength={250} className="input mt-4" placeholder="Your message (max 250 characters)"
                value={giftNote} onChange={(e) => setGiftNote(e.target.value)} />
            )}
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-semibold">Payment</h2>
            <div className="space-y-3">
              {[
                ['razorpay', 'Pay online', 'UPI, cards, net banking, wallets (Razorpay)'],
                ['cod', 'Cash on delivery', 'Pay when your candles arrive'],
              ].filter(([val]) => val !== 'cod' || COD_ENABLED).map(([val, label, desc]) => (
                <label key={val} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${payment === val ? 'border-ember bg-ember-light/50' : 'border-sand'}`}>
                  <input type="radio" name="payment" value={val} checked={payment === val} onChange={() => setPayment(val)} className="mt-1 accent-ember" />
                  <div><p className="font-medium">{label}</p><p className="text-sm text-cocoa-soft">{desc}</p></div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-5 rounded-2xl bg-wax p-6 lg:sticky lg:top-32">
          <h2 className="font-serif text-2xl font-semibold">Order summary</h2>
          <ul className="space-y-4">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex items-center gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg">
                  <CandleImage product={product} />
                  <span className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center rounded-full bg-cocoa text-[10px] text-cream">{quantity}</span>
                </div>
                <div className="flex-1 text-sm"><p className="font-medium">{product.name}</p><p className="text-cocoa-soft">{product.size}</p></div>
                <span className="text-sm font-medium">{inr(product.price * quantity)}</span>
              </li>
            ))}
          </ul>

          <div>
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
                <span><b>{coupon.code}</b> applied — {coupon.message}</span>
                <button type="button" onClick={() => setCoupon(null)} className="underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className="input py-2 uppercase" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                <button type="button" onClick={applyCoupon} className="rounded-xl border border-cocoa px-4 text-sm font-semibold">Apply</button>
              </div>
            )}
            {couponMsg && <p className="mt-2 text-xs text-red-600">{couponMsg}</p>}
            {!coupon && <p className="mt-2 text-xs text-cocoa-soft">Try WELCOME10, FLAT150 or DIWALI20</p>}
          </div>

          <div className="space-y-2 border-t border-sand pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{inr(discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{shipping ? inr(shipping) : 'Free'}</span></div>
            <div className="flex justify-between border-t border-sand pt-3 text-lg font-semibold"><span>Total</span><span>{inr(total)}</span></div>
          </div>

          {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
          <button disabled={busy} className="btn-primary w-full py-4 text-base">
            {busy ? 'Placing order…' : payment === 'cod' ? `Place order · ${inr(total)}` : `Pay ${inr(total)}`}
          </button>
          <p className="text-center text-xs text-cocoa-soft">🔒 Secure checkout</p>
        </aside>
      </form>
    </div>
  )
}
