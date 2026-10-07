import { Link } from 'react-router-dom'
import { cartSubtotal, useCart } from '../store/cart'
import { inr } from '../utils/helpers'
import CandleImage from '../components/CandleImage'
import { FreeShippingBar, QtyControl } from '../components/CartDrawer'
import { PageHeader } from '../components/ui'

export default function Cart() {
  const { items, setQty, remove } = useCart()
  const subtotal = cartSubtotal(items)

  if (!items.length) {
    return (
      <>
        <PageHeader title="Your cart" />
        <div className="container-x py-16 text-center">
          <p className="font-serif text-2xl">Your cart is empty</p>
          <Link to="/shop" className="btn-primary mt-6">Shop candles</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Your cart" />
      <div className="container-x mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-sand border-y border-sand">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex gap-5 py-6">
              <Link to={`/product/${product.slug}`} className="h-32 w-28 shrink-0 overflow-hidden rounded-xl">
                <CandleImage product={product} />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link to={`/product/${product.slug}`} className="font-serif text-2xl font-semibold">{product.name}</Link>
                    <p className="text-sm text-cocoa-soft">{product.size} · {inr(product.price)} each</p>
                  </div>
                  <span className="font-semibold">{inr(product.price * quantity)}</span>
                </div>
                <div className="mt-auto flex items-center gap-5">
                  <QtyControl value={quantity} max={product.stock} onChange={(q) => setQty(product.id, q)} />
                  <button onClick={() => remove(product.id)} className="text-sm text-cocoa-soft underline">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-5 rounded-2xl bg-wax p-6 lg:sticky lg:top-32">
          <FreeShippingBar subtotal={subtotal} />
          <div className="flex justify-between text-lg"><span>Subtotal</span><span className="font-semibold">{inr(subtotal)}</span></div>
          <p className="text-xs text-cocoa-soft">Shipping and coupon discounts are applied at checkout.</p>
          <Link to="/checkout" className="btn-primary w-full">Proceed to checkout</Link>
          <Link to="/shop" className="block text-center text-sm underline">Continue shopping</Link>
        </aside>
      </div>
    </>
  )
}
