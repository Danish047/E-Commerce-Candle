import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { inr, useApi } from '../utils/helpers'
import CandleImage from '../components/CandleImage'
import { ErrorBox, Spinner } from '../components/ui'
import { StatusPill } from './Account'

const STEPS = ['pending', 'processing', 'shipped', 'delivered']
const LABELS = { pending: 'Order placed', processing: 'Packing', shipped: 'Shipped', delivered: 'Delivered' }

export default function OrderDetail() {
  const { orderNumber } = useParams()
  const { data: o, loading, error, reload } = useApi(() => api.orders.detail(orderNumber), [orderNumber])

  if (loading) return <Spinner />
  if (error) return <div className="container-x py-16"><ErrorBox error={error} onRetry={reload} /></div>

  const current = STEPS.indexOf(o.status)
  const a = o.shipping_address

  return (
    <div className="container-x max-w-4xl py-12">
      <Link to="/account" className="text-sm underline">← All orders</Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-serif text-4xl font-semibold">Order #{o.order_number}</h1>
        <StatusPill status={o.status} />
      </div>
      <p className="mt-1 text-sm text-cocoa-soft">
        Placed on {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
        {o.payment_method === 'cod' ? 'Cash on delivery' : `Paid online (${o.payment_status})`}
      </p>

      {o.status !== 'cancelled' && (
        <ol className="mt-10 grid grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${i <= current ? 'bg-ember' : 'bg-sand'}`} />}
              <span className={`relative z-10 h-6 w-6 rounded-full border-4 ${i <= current ? 'border-ember bg-ember' : 'border-sand bg-cream'}`} />
              <span className={`mt-2 text-xs sm:text-sm ${i <= current ? 'font-medium' : 'text-cocoa-soft'}`}>{LABELS[s]}</span>
            </li>
          ))}
        </ol>
      )}
      {o.tracking_url && (
        <a href={o.tracking_url} target="_blank" rel="noreferrer" className="btn-outline mt-6">Track shipment</a>
      )}

      <div className="mt-12 grid gap-8 md:grid-cols-[1fr_280px]">
        <ul className="divide-y divide-sand rounded-2xl border border-sand px-5">
          {o.items.map((i) => (
            <li key={i.product_id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-14 overflow-hidden rounded-lg"><CandleImage product={i} /></div>
              <div className="flex-1">
                <Link to={`/product/${i.slug}`} className="font-medium hover:underline">{i.name}</Link>
                <p className="text-xs text-cocoa-soft">{i.size} · {inr(i.price)} × {i.quantity}</p>
              </div>
              <span className="font-medium">{inr(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-6 text-sm">
          <div className="space-y-2 rounded-2xl bg-wax p-5">
            <div className="flex justify-between"><span>Subtotal</span><span>{inr(o.subtotal)}</span></div>
            {o.discount > 0 && <div className="flex justify-between text-green-700"><span>Discount {o.coupon_code && `(${o.coupon_code})`}</span><span>−{inr(o.discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{o.shipping ? inr(o.shipping) : 'Free'}</span></div>
            <div className="flex justify-between border-t border-sand pt-2 text-base font-semibold"><span>Total</span><span>{inr(o.total)}</span></div>
          </div>
          <div>
            <p className="mb-1 font-semibold">Shipping to</p>
            <p className="text-cocoa-soft">{a.name}<br />{a.line1}{a.line2 && <>, {a.line2}</>}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
          </div>
          {o.gift_note && <div><p className="mb-1 font-semibold">🎁 Gift note</p><p className="italic text-cocoa-soft">"{o.gift_note}"</p></div>}
        </div>
      </div>
    </div>
  )
}
