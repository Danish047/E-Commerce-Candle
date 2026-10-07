import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { admin } from '../api'
import { DownloadIcon, ReceiptIcon } from '../components/Icons'
import { Button, Empty, ErrorState, Input, PageHead, Pagination, SearchInput, Segmented, Select, StatusBadge, TableSkeleton, cx } from '../components/kit'
import { fmtDateTime, inr, useDebounced, useFilters, useQuery } from '../hooks'
import { toast } from '../store'

const TABS = [
  ['', 'All'], ['processing', 'To ship'], ['pending', 'Awaiting payment'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled'],
]

export default function Orders() {
  const [f, setF] = useFilters({ page: 1, status: '', search: '', payment_method: '', payment_status: '', date_from: '', date_to: '' })
  const [search, setSearch] = useState(f.search)
  const ds = useDebounced(search)
  useEffect(() => { if (ds !== f.search) setF({ search: ds }) }, [ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const params = { ...f, page_size: 20 }
  const { data, loading, error, reload } = useQuery(() => admin.orders.list(params), [JSON.stringify(params)])
  const nav = useNavigate()
  const [exporting, setExporting] = useState(false)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const { page, ...rest } = f
      await admin.orders.export(rest)
    } catch (e) {
      toast.bad(e)
    } finally {
      setExporting(false)
    }
  }

  const counts = data?.status_counts || {}
  const filtered = f.search || f.payment_method || f.payment_status || f.date_from || f.date_to

  return (
    <>
      <PageHead title="Orders" subtitle="Pack, ship and track every order."
        actions={<Button variant="ghost" icon={DownloadIcon} loading={exporting} onClick={exportCsv}>Export CSV</Button>} />

      <div className="mb-4">
        <Segmented value={f.status} onChange={(status) => setF({ status })}
          options={TABS.map(([value, label]) => ({ value, label, count: value ? counts[value] || 0 : counts.all }))} />
      </div>

      <section className="a-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-adm-line p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Order number, name, email or phone" className="min-w-[220px] flex-1" />
          <Select value={f.payment_method} onChange={(e) => setF({ payment_method: e.target.value })} className="w-auto" aria-label="Payment method">
            <option value="">Any payment</option>
            <option value="razorpay">Paid online</option>
            <option value="cod">Cash on delivery</option>
          </Select>
          <Select value={f.payment_status} onChange={(e) => setF({ payment_status: e.target.value })} className="w-auto" aria-label="Payment status">
            <option value="">Paid or not</option>
            <option value="paid">Paid</option>
            <option value="pending">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </Select>
          <div className="flex items-center gap-1.5">
            <Input type="date" value={f.date_from} onChange={(e) => setF({ date_from: e.target.value })} className="w-[150px]" aria-label="From date" />
            <span className="text-xs text-adm-muted">to</span>
            <Input type="date" value={f.date_to} onChange={(e) => setF({ date_to: e.target.value })} className="w-[150px]" aria-label="To date" />
          </div>
          {filtered && (
            <Button variant="quiet" onClick={() => { setSearch(''); setF({ search: '', payment_method: '', payment_status: '', date_from: '', date_to: '' }) }}>
              Clear filters
            </Button>
          )}
        </div>

        {error && <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>}
        {!data && loading ? <TableSkeleton cols={6} /> : data && (
          data.results.length ? (
            <div className={cx('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
              <table className="w-full min-w-[860px]">
                <thead className="bg-adm-soft/70">
                  <tr>
                    <th className="a-th">Order</th><th className="a-th">Placed</th><th className="a-th">Customer</th>
                    <th className="a-th text-right">Items</th><th className="a-th text-right">Total</th>
                    <th className="a-th">Payment</th><th className="a-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((o) => (
                    <tr key={o.id} className="a-row cursor-pointer" onClick={() => nav(`/admin/orders/${o.order_number}`)}>
                      <td className="a-td tabular font-semibold">{o.order_number}</td>
                      <td className="a-td whitespace-nowrap text-adm-muted">{fmtDateTime(o.created_at)}</td>
                      <td className="a-td">
                        <span className="block font-medium">{o.customer_name}</span>
                        <span className="block text-xs text-adm-muted">{o.email}</span>
                      </td>
                      <td className="a-td tabular text-right">{o.items_count}</td>
                      <td className="a-td tabular text-right font-semibold">{inr(o.total)}</td>
                      <td className="a-td">
                        <span className="block text-xs text-adm-muted">{o.payment_method === 'cod' ? 'Cash on delivery' : 'Online'}</span>
                        <StatusBadge kind="payment" status={o.payment_status} />
                      </td>
                      <td className="a-td"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={ReceiptIcon} title={filtered || f.status ? 'No orders match these filters' : 'No orders yet'}
              text={filtered || f.status ? 'Try another status or clear the filters.' : 'New orders from the store will appear here.'} />
          )
        )}
        {data && <Pagination page={f.page} count={data.count} pageSize={20} onPage={(page) => setF({ page })} />}
      </section>
    </>
  )
}
