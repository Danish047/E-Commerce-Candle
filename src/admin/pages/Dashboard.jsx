import { useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { Donut, RevenueChart } from '../components/charts'
import { AlertIcon, BoxIcon, ChevronRight, InboxIcon, ReceiptIcon, TruckIcon } from '../components/Icons'
import { Delta, Empty, ErrorState, Jar, Panel, Segmented, Skeleton, StatusBadge, cx } from '../components/kit'
import { inr, timeAgo, useQuery } from '../hooks'
import { useAdminAuth } from '../store'

const STATUS_COLORS = { pending: '#B7801C', processing: '#C8763B', shipped: '#4D6B88', delivered: '#5B7A52', cancelled: '#C9CBC2' }
const STATUS_LABELS = { pending: 'Awaiting payment', processing: 'To ship', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function Attention({ a }) {
  const items = [
    { n: a.to_ship, label: 'orders to pack and ship', to: '/admin/orders?status=processing', icon: TruckIcon },
    { n: a.awaiting_payment, label: 'waiting for payment', to: '/admin/orders?status=pending', icon: ReceiptIcon },
    { n: a.open_messages, label: 'messages to answer', to: '/admin/messages', icon: InboxIcon },
    { n: a.out_of_stock, label: 'candles sold out', to: '/admin/products?stock=out', icon: BoxIcon },
  ]
  return (
    <div className="a-panel grid grid-cols-2 divide-adm-line overflow-hidden md:grid-cols-4 md:divide-x">
      {items.map(({ n, label, to, icon: Icon }, i) => (
        <Link key={to} to={to} className={cx('group flex items-center gap-3 px-5 py-4 transition hover:bg-adm-soft', i < 2 && 'border-b border-adm-line md:border-b-0', i % 2 === 0 && 'border-r border-adm-line md:border-r-0')}>
          <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', n ? 'bg-ember-light text-ember-dark' : 'bg-adm-soft text-adm-muted')}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className={cx('tabular block text-xl font-semibold', !n && 'text-adm-muted')}>{n}</span>
            <span className="block text-xs leading-snug text-adm-muted">{label}</span>
          </span>
          <ChevronRight className="ml-auto hidden h-4 w-4 text-adm-muted opacity-0 transition group-hover:opacity-100 sm:block" />
        </Link>
      ))}
    </div>
  )
}

function Kpis({ k, days }) {
  const small = [
    { label: 'Orders', value: k.orders, change: k.orders_change },
    { label: 'Average order', value: inr(k.aov), change: k.aov_change },
    { label: 'New customers', value: k.customers, change: k.customers_change },
  ]
  return (
    <div className="flex flex-col gap-6 border-b border-adm-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-adm-muted">Revenue, last {days} days</p>
        <p className="tabular mt-1 font-serif text-5xl font-semibold leading-none">{inr(k.revenue)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-adm-muted"><Delta value={k.revenue_change} /> vs the {days} days before</p>
      </div>
      <dl className="grid grid-cols-3 gap-6 sm:gap-10">
        {small.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-adm-muted">{s.label}</dt>
            <dd className="tabular mt-1 text-xl font-semibold">{s.value}</dd>
            <dd className="mt-0.5"><Delta value={s.change} /></dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function Dashboard() {
  const [days, setDays] = useState(30)
  const { data: d, loading, error, reload } = useQuery(() => admin.dashboard(days), [days])
  const name = useAdminAuth((s) => s.user?.name?.split(' ')[0])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[2.1rem] font-semibold leading-none">{greeting()}{name ? `, ${name}` : ''}</h1>
          <p className="mt-2 text-sm text-adm-muted">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Segmented value={days} onChange={setDays}
          options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }]} />
      </div>

      {error && <ErrorState error={error} onRetry={reload} />}

      {!d ? (
        !error && <div className="space-y-5"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-[380px] rounded-2xl" /></div>
      ) : (
        <div className={cx('space-y-5 transition-opacity', loading && 'opacity-60')}>
          <Attention a={d.attention} />

          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="a-panel p-5 sm:p-6">
              <Kpis k={d.kpis} days={d.days} />
              <div className="mt-4">
                {d.kpis.orders ? <RevenueChart series={d.series} /> : (
                  <Empty icon={ReceiptIcon} title="No sales in this period yet" text="Paid and cash-on-delivery orders show up here as they come in." />
                )}
              </div>
            </section>

            <Panel title="Orders by status" action={<Link to="/admin/orders" className="text-xs font-medium text-ember-dark hover:underline">All orders</Link>}>
              <Donut centerValue={d.status_breakdown.reduce((n, s) => n + s.count, 0)} centerLabel={`orders, ${d.days} days`}
                segments={d.status_breakdown.map((s) => ({ label: STATUS_LABELS[s.status], value: s.count, color: STATUS_COLORS[s.status] }))} />
              <div className="mt-6 border-t border-adm-line pt-4">
                <p className="mb-3 text-xs text-adm-muted">How customers paid</p>
                {(() => {
                  const [on, cod] = d.payment_split.map((p) => p.revenue)
                  const total = on + cod || 1
                  return (
                    <>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-adm-soft">
                        <span className="bg-adm-ink" style={{ width: `${(on / total) * 100}%` }} />
                        <span className="bg-ember" style={{ width: `${(cod / total) * 100}%` }} />
                      </div>
                      <div className="mt-2.5 flex justify-between text-xs">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-adm-ink" />Online <b className="tabular font-semibold">{inr(on)}</b></span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ember" />COD <b className="tabular font-semibold">{inr(cod)}</b></span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Best sellers" bodyClass="p-2">
              {d.top_products.length ? (
                <ul>
                  {d.top_products.map((p, i) => {
                    const max = d.top_products[0].quantity
                    return (
                      <li key={p.id}>
                        <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-adm-soft">
                          <span className="tabular w-4 text-xs text-adm-muted">{i + 1}</span>
                          <Jar color={p.color} size={36} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{p.name}</span>
                            <span className="mt-1.5 block h-1.5 rounded-full bg-adm-soft">
                              <span className="block h-full rounded-full" style={{ width: `${(p.quantity / max) * 100}%`, background: p.color }} />
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="tabular block text-sm font-semibold">{p.quantity} sold</span>
                            <span className="tabular block text-xs text-adm-muted">{inr(p.revenue)}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : <Empty title="Nothing sold yet in this period" />}
            </Panel>

            <Panel title="Running low" action={<span className="text-xs text-adm-muted">{d.low_stock_threshold} or fewer left</span>} bodyClass="p-2">
              {d.low_stock.length ? (
                <ul>
                  {d.low_stock.map((p) => (
                    <li key={p.id}>
                      <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-adm-soft">
                        <Jar color={p.color} size={36} />
                        <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                        {p.stock === 0
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad"><AlertIcon className="h-3.5 w-3.5" />Sold out</span>
                          : <span className="tabular text-sm font-semibold text-warn">{p.stock} left</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <Empty icon={BoxIcon} title="Stock looks healthy" text="Every candle has more than the low-stock limit." />}
            </Panel>
          </div>

          <Panel title="Latest orders" action={<Link to="/admin/orders" className="text-xs font-medium text-ember-dark hover:underline">View all</Link>} bodyClass="">
            {d.recent_orders.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <tbody>
                    {d.recent_orders.map((o) => (
                      <tr key={o.id} className="a-row first:border-t-0">
                        <td className="a-td"><Link to={`/admin/orders/${o.order_number}`} className="tabular font-semibold hover:text-ember-dark">{o.order_number}</Link></td>
                        <td className="a-td">{o.customer_name}</td>
                        <td className="a-td text-adm-muted">{timeAgo(o.created_at)}</td>
                        <td className="a-td"><StatusBadge status={o.status} /></td>
                        <td className="a-td tabular text-right font-semibold">{inr(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty icon={ReceiptIcon} title="No orders yet" text="Share the store link and your first order will land here." />}
          </Panel>
        </div>
      )}
    </div>
  )
}
