import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { inr, useApi } from '../utils/helpers'
import { useAuth } from '../store/auth'
import { ErrorBox, Spinner } from '../components/ui'

export const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const StatusPill = ({ status }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-sand'}`}>{status}</span>
)

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const orders = useApi(() => api.orders.list(), [])

  return (
    <div className="container-x py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-cocoa-soft">My account</p>
          <h1 className="font-serif text-4xl font-semibold">Hi, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-cocoa-soft">{user.email}{user.phone && ` · ${user.phone}`}</p>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="btn-outline">Log out</button>
      </div>

      <h2 className="mt-12 mb-5 font-serif text-2xl font-semibold">My orders</h2>
      {orders.loading ? <Spinner /> : orders.error ? <ErrorBox error={orders.error} onRetry={orders.reload} /> :
        orders.data.length === 0 ? (
          <div className="rounded-2xl bg-wax p-10 text-center">
            <p className="font-serif text-2xl">No orders yet</p>
            <Link to="/shop" className="btn-primary mt-5">Start shopping</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-sand">
            {orders.data.map((o) => (
              <Link key={o.order_number} to={`/account/orders/${o.order_number}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-sand p-5 last:border-0 hover:bg-wax/60">
                <div className="min-w-32">
                  <p className="font-semibold">#{o.order_number}</p>
                  <p className="text-xs text-cocoa-soft">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <p className="flex-1 text-sm text-cocoa-soft">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                <StatusPill status={o.status} />
                <span className="w-24 text-right font-semibold">{inr(o.total)}</span>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}
