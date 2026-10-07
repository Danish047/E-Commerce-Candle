import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { DownloadIcon, MailIcon, PhoneIcon, UsersIcon } from '../components/Icons'
import {
  Avatar, Badge, Button, Drawer, Empty, ErrorState, PageHead, Pagination, SearchInput, Segmented, Select, Skeleton,
  StatusBadge, TableSkeleton, Toggle, cx,
} from '../components/kit'
import { fmtDate, inr, timeAgo, useDebounced, useFilters, useQuery } from '../hooks'
import { toast } from '../store'

function CustomerDrawer({ id, onClose, onChanged }) {
  const { data: c, loading, error, reload, setData } = useQuery(() => admin.customers.get(id), [id])
  const [busy, setBusy] = useState(false)

  const setActive = async (is_active) => {
    setBusy(true)
    try {
      await admin.customers.update(id, { is_active })
      setData((d) => ({ ...d, is_active }))
      toast.ok(is_active ? 'Account can sign in again' : 'Account blocked from signing in')
      onChanged()
    } catch (e) {
      toast.bad(e)
    } finally {
      setBusy(false)
    }
  }

  const a = c?.last_address
  const avg = c?.orders_count ? Math.round(c.total_spent / c.orders_count) : 0

  return (
    <Drawer open onClose={onClose} title={c?.name || 'Customer'} subtitle={c ? `Joined ${fmtDate(c.date_joined)}` : ' '}>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !c && <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-40" /></div>}
      {c && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={c.name || c.email} size={52} />
            <div className="min-w-0 flex-1 text-sm">
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 truncate text-adm-ink hover:text-ember-dark">
                <MailIcon className="h-4 w-4 text-adm-muted" /> {c.email}
              </a>
              {c.phone && (
                <a href={`tel:${c.phone}`} className="mt-1 flex items-center gap-2 text-adm-ink hover:text-ember-dark">
                  <PhoneIcon className="h-4 w-4 text-adm-muted" /> {c.phone}
                </a>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-adm-line rounded-xl border border-adm-line">
            {[['Orders', c.orders_count], ['Spent', inr(c.total_spent)], ['Avg. order', inr(avg)]].map(([k, v]) => (
              <div key={k} className="px-4 py-3">
                <dt className="text-xs text-adm-muted">{k}</dt>
                <dd className="tabular mt-1 font-serif text-2xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {a && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Last shipped to</h3>
              <p className="text-sm leading-relaxed text-adm-muted">
                {a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold">Orders</h3>
            {c.orders.length ? (
              <ul className="divide-y divide-adm-line rounded-xl border border-adm-line">
                {c.orders.map((o) => (
                  <li key={o.id}>
                    <Link to={`/admin/orders/${o.order_number}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-adm-soft">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-xs text-adm-muted">{fmtDate(o.created_at)} · {o.items_count} item{o.items_count === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={o.status} />
                        <span className="tabular w-20 text-right font-medium">{inr(o.total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-adm-muted">Signed up but hasn't ordered yet.</p>}
          </div>

          <div className="rounded-xl border border-adm-line p-4">
            <Toggle checked={c.is_active} disabled={busy} onChange={setActive} label="Can sign in"
              description="Turn off to block this account from logging in and placing orders." />
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default function Customers() {
  const [f, setF] = useFilters({ page: 1, search: '', segment: '', ordering: '-date_joined', open: '' })
  const [search, setSearch] = useState(f.search)
  const ds = useDebounced(search)
  useEffect(() => { if (ds !== f.search) setF({ search: ds }) }, [ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const { open, ...params } = f
  const { data, loading, error, reload } = useQuery(() => admin.customers.list(params), [JSON.stringify(params)])
  const [exporting, setExporting] = useState(false)
  const rows = data?.results || []

  const exportCsv = async () => {
    setExporting(true)
    try { await admin.customers.export({ search: f.search, segment: f.segment }) } catch (e) { toast.bad(e) }
    setExporting(false)
  }
  const openRow = (id) => setF({ open: id, page: f.page })

  return (
    <>
      <PageHead title="Customers" subtitle="Everyone who has an account, and what they've bought."
        actions={<Button variant="ghost" icon={DownloadIcon} loading={exporting} onClick={exportCsv}>Export CSV</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={f.segment} onChange={(segment) => setF({ segment })}
          options={[{ value: '', label: 'Everyone' }, { value: 'repeat', label: 'Came back' }, { value: 'no_orders', label: 'No orders yet' }]} />
      </div>

      <section className="a-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-adm-line p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Name, email or phone" className="min-w-[220px] flex-1" />
          <Select value={f.ordering} onChange={(e) => setF({ ordering: e.target.value })} className="w-auto">
            <option value="-date_joined">Newest first</option>
            <option value="-total_spent">Spent the most</option>
            <option value="-orders_count">Most orders</option>
            <option value="-last_order_at">Ordered recently</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>

        {error && <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>}
        {loading && !data ? <TableSkeleton cols={5} /> : rows.length === 0 ? (
          <Empty icon={UsersIcon} title={f.search || f.segment ? 'No one matches' : 'No customers yet'}
            text={f.search || f.segment ? 'Try a different search or segment.' : 'People who sign up on the store will show up here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="a-th">Customer</th>
                  <th className="a-th">Joined</th>
                  <th className="a-th text-right">Orders</th>
                  <th className="a-th text-right">Spent</th>
                  <th className="a-th">Last order</th>
                </tr>
              </thead>
              <tbody className={cx(loading && 'opacity-60')}>
                {rows.map((c) => (
                  <tr key={c.id} className="a-row cursor-pointer" onClick={() => openRow(c.id)}>
                    <td className="a-td">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name || c.email} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            {c.name || '—'}
                            {!c.is_active && <Badge tone="bad">Blocked</Badge>}
                            {c.orders_count >= 2 && <Badge tone="ember">Regular</Badge>}
                          </p>
                          <p className="truncate text-xs text-adm-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="a-td text-adm-muted">{fmtDate(c.date_joined)}</td>
                    <td className="a-td tabular text-right">{c.orders_count}</td>
                    <td className="a-td tabular text-right font-medium">{inr(c.total_spent)}</td>
                    <td className="a-td text-adm-muted">{c.last_order_at ? timeAgo(c.last_order_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={f.page} count={data?.count || 0} onPage={(page) => setF({ page })} />
      </section>

      {f.open && <CustomerDrawer id={f.open} onClose={() => setF({ open: '', page: f.page })} onChanged={reload} />}
    </>
  )
}
