import { Link, useNavigate } from 'react-router-dom'
import { cartSubtotal, useCart } from '../store/cart'
import { FREE_SHIPPING_ABOVE } from '../api/config'
import { inr } from '../utils/helpers'
import CandleImage from './CandleImage'
import { CloseIcon } from './Icons'

export function QtyControl({ value, onChange, max }) {
  return (
    <div className="inline-flex items-center rounded-full border border-sand">
      <button className="px-3 py-1 text-lg leading-none" onClick={() => onChange(value - 1)} aria-label="Decrease">−</button>
      <span className="w-6 text-center text-sm">{value}</span>
      <button className="px-3 py-1 text-lg leading-none disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Increase">+</button>
    </div>
  )
}

export function FreeShippingBar({ subtotal }) {
  const left = FREE_SHIPPING_ABOVE - subtotal
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_ABOVE) * 100)
  return (
    <div>
      <p className="mb-2 text-sm text-cocoa">
        {left > 0 ? <>You're <b>{inr(left)}</b> away from free shipping</> : <>🎉 You've unlocked <b>free shipping</b></>}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const { items, isOpen, close, setQty, remove } = useCart()
  const subtotal = cartSubtotal(items)
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/40" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-sand px-6 py-5">
          <h2 className="font-serif text-2xl font-semibold">Your Cart</h2>
          <button onClick={close} aria-label="Close cart"><CloseIcon className="h-6 w-6" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-serif text-2xl">Your cart is empty</p>
            <p className="text-sm text-cocoa-soft">Let's find a scent you'll love.</p>
            <button onClick={() => { close(); navigate('/shop') }} className="btn-primary">Shop candles</button>
          </div>
        ) : (
          <>
            <div className="border-b border-sand px-6 py-4"><FreeShippingBar subtotal={subtotal} /></div>
            <ul className="flex-1 divide-y divide-sand overflow-y-auto px-6">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 py-4">
                  <Link to={`/product/${product.slug}`} onClick={close} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl">
                    <CandleImage product={product} />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link to={`/product/${product.slug}`} onClick={close} className="font-serif text-lg font-semibold leading-tight">{product.name}</Link>
                      <button onClick={() => remove(product.id)} className="text-xs text-cocoa-soft underline">Remove</button>
                    </div>
                    <span className="text-xs text-cocoa-soft">{product.size}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <QtyControl value={quantity} max={product.stock} onChange={(q) => setQty(product.id, q)} />
                      <span className="font-semibold">{inr(product.price * quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-sand px-6 py-5">
              <div className="flex justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-semibold">{inr(subtotal)}</span>
              </div>
              <p className="text-xs text-cocoa-soft">Shipping and coupons calculated at checkout.</p>
              <button onClick={() => { close(); navigate('/checkout') }} className="btn-primary w-full">Checkout</button>
              <button onClick={() => { close(); navigate('/cart') }} className="w-full text-sm underline">View full cart</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
