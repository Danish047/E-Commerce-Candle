import { Link, useParams } from 'react-router-dom'
import { inr } from '../utils/helpers'
import { useAuth } from '../store/auth'
import { CheckIcon } from '../components/Icons'

export default function OrderSuccess() {
  const { orderNumber } = useParams()
  const user = useAuth((s) => s.user)
  let order = null
  try {
    order = JSON.parse(sessionStorage.getItem('lastOrder'))
  } catch { /* ignore */ }
  if (order?.order_number !== orderNumber) order = null

  return (
    <div className="container-x flex flex-col items-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <CheckIcon className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-serif text-5xl font-semibold">Thank you!</h1>
      <p className="mt-3 text-lg text-cocoa-soft">Your order <b className="text-cocoa">#{orderNumber}</b> is confirmed.</p>
      {order && (
        <div className="mt-10 w-full max-w-md rounded-2xl bg-wax p-6 text-left text-sm">
          {order.items.map((i) => (
            <div key={i.product_id} className="flex justify-between py-1">
              <span>{i.name} × {i.quantity}</span><span>{inr(i.line_total)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-sand pt-3 text-base font-semibold">
            <span>Total {order.payment_method === 'cod' ? '(pay on delivery)' : '(paid)'}</span><span>{inr(order.total)}</span>
          </div>
          <p className="mt-4 text-cocoa-soft">
            Shipping to {order.shipping_address.name}, {order.shipping_address.city} {order.shipping_address.pincode}.
            A confirmation has been sent to {order.email}.
          </p>
        </div>
      )}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {user && <Link to={`/account/orders/${orderNumber}`} className="btn-outline">Track order</Link>}
        <Link to="/shop" className="btn-primary">Continue shopping</Link>
      </div>
    </div>
  )
}
