import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { admin } from '../api'
import { BoxIcon, EyeIcon, EyeOffIcon, PlusIcon } from '../components/Icons'
import {
  Badge, Button, Checkbox, Empty, ErrorState, Jar, PageHead, Pagination, SearchInput, Segmented, Select, TableSkeleton, Toggle, cx,
} from '../components/kit'
import { inr, useDebounced, useFilters, useQuery } from '../hooks'
import { toast } from '../store'

function StockCell({ n, low = 10 }) {
  if (n === 0) return <Badge tone="bad">Sold out</Badge>
  return <span className={cx('tabular font-medium', n <= low ? 'text-warn' : '')}>{n}</span>
}

export default function Products() {
  const [f, setF] = useFilters({ page: 1, search: '', category: '', status: '', stock: '', ordering: '-created_at' })
  const [search, setSearch] = useState(f.search)
  const ds = useDebounced(search)
  useEffect(() => { if (ds !== f.search) setF({ search: ds }) }, [ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const params = { ...f, page_size: 25 }
  const { data, loading, error, reload, setData } = useQuery(() => admin.products.list(params), [JSON.stringify(params)])
  const cats = useQuery(() => admin.categories.list(), [])
  const [picked, setPicked] = useState([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const nav = useNavigate()

  useEffect(() => setPicked([]), [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data?.results || []
  const allPicked = rows.length > 0 && rows.every((r) => picked.includes(r.id))

  const toggleVisible = async (p, is_active) => {
    setData((d) => ({ ...d, results: d.results.map((x) => (x.id === p.id ? { ...x, is_active } : x)) }))
    try {
      await admin.products.update(p.id, { is_active })
      toast.ok(is_active ? `${p.name} is live in the store` : `${p.name} is hidden from the store`)
    } catch (e) {
      toast.bad(e)
      reload()
    }
  }

  const bulk = async (action) => {
    setBulkBusy(true)
    try {
      const { updated } = await admin.products.bulk(picked, action)
      toast.ok(`${updated} product${updated === 1 ? '' : 's'} ${action === 'show' ? 'shown in the store' : action === 'hide' ? 'hidden' : 'restocked to 25'}`)
      setPicked([])
      reload()
    } catch (e) {
      toast.bad(e)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <>
      <PageHead title="Products" subtitle="Your candles, their prices and what's left on the shelf."
        actions={<Button variant="accent" icon={PlusIcon} onClick={() => nav('/admin/products/new')}>Add product</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={f.stock} onChange={(stock) => setF({ stock })}
          options={[{ value: '', label: 'All stock' }, { value: 'low', label: 'Running low' }, { value: 'out', label: 'Sold out' }]} />
        <Segmented value={f.status} onChange={(status) => setF({ status })}
          options={[{ value: '', label: 'Any visibility' }, { value: 'active', label: 'Live' }, { value: 'hidden', label: 'Hidden' }]} />
      </div>

      <section className="a-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-adm-line p-3">
          {picked.length ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="px-1 text-sm font-medium">{picked.length} selected</span>
              <Button variant="ghost" icon={EyeIcon} loading={bulkBusy} onClick={() => bulk('show')}>Show in store</Button>
              <Button variant="ghost" icon={EyeOffIcon} loading={bulkBusy} onClick={() => bulk('hide')}>Hide</Button>
              <Button variant="ghost" loading={bulkBusy} onClick={() => bulk('restock')}>Set stock to 25</Button>
              <Button variant="quiet" onClick={() => setPicked([])}>Clear</Button>
            </div>
          ) : (
            <>
              <SearchInput value={search} onChange={setSearch} placeholder="Search by name or SKU" className="min-w-[220px] flex-1" />
              <Select value={f.category} onChange={(e) => setF({ category: e.target.value })} className="w-auto" aria-label="Category">
                <option value="">All categories</option>
                {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select value={f.ordering} onChange={(e) => setF({ ordering: e.target.value })} className="w-auto" aria-label="Sort">
                <option value="-created_at">Newest first</option>
                <option value="-units_sold">Best selling</option>
                <option value="stock">Lowest stock</option>
                <option value="price">Price, low to high</option>
                <option value="-price">Price, high to low</option>
                <option value="-rating">Top rated</option>
                <option value="name">Name A–Z</option>
              </Select>
            </>
          )}
        </div>

        {error && <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>}
        {!data && loading ? <TableSkeleton cols={6} /> : data && (rows.length ? (
          <div className={cx('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
            <table className="w-full min-w-[880px]">
              <thead className="bg-adm-soft/70">
                <tr>
                  <th className="a-th w-10"><Checkbox label="Select all" checked={allPicked} indeterminate={picked.length > 0 && !allPicked}
                    onChange={(v) => setPicked(v ? rows.map((r) => r.id) : [])} /></th>
                  <th className="a-th">Product</th><th className="a-th">Category</th><th className="a-th text-right">Price</th>
                  <th className="a-th text-right">In stock</th><th className="a-th text-right">Sold</th><th className="a-th">Rating</th><th className="a-th">Live</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={cx('a-row', !p.is_active && 'text-adm-muted')}>
                    <td className="a-td"><Checkbox label={`Select ${p.name}`} checked={picked.includes(p.id)}
                      onChange={(v) => setPicked(v ? [...picked, p.id] : picked.filter((x) => x !== p.id))} /></td>
                    <td className="a-td">
                      <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <Jar color={p.color} image={p.images[0]?.src} size={44} className={cx(!p.is_active && 'opacity-50')} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium text-adm-ink hover:text-ember-dark">
                            {p.name}
                            {p.is_bestseller && <Badge tone="ember">Bestseller</Badge>}
                            {p.is_new && <Badge tone="info">New</Badge>}
                          </span>
                          <span className="block text-xs text-adm-muted">{p.sku || p.slug} · {p.size}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="a-td">{p.category_name}</td>
                    <td className="a-td tabular text-right">
                      <span className="font-medium text-adm-ink">{inr(p.price)}</span>
                      {p.compare_price && <span className="block text-xs text-adm-muted line-through">{inr(p.compare_price)}</span>}
                    </td>
                    <td className="a-td text-right"><StockCell n={p.stock} /></td>
                    <td className="a-td tabular text-right">{p.units_sold}</td>
                    <td className="a-td whitespace-nowrap text-sm">{p.reviews_count ? <>★ {p.rating.toFixed(1)} <span className="text-xs text-adm-muted">({p.reviews_count})</span></> : <span className="text-adm-muted">—</span>}</td>
                    <td className="a-td"><Toggle checked={p.is_active} onChange={(v) => toggleVisible(p, v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={BoxIcon} title={f.search || f.category || f.stock || f.status ? 'No products match' : 'Add your first candle'}
            text={f.search || f.category || f.stock || f.status ? 'Try a different search or filter.' : 'Products you add here appear in the store as soon as they are live.'}
            action={<Button variant="accent" icon={PlusIcon} onClick={() => nav('/admin/products/new')}>Add product</Button>} />
        ))}
        {data && <Pagination page={f.page} count={data.count} pageSize={25} onPage={(page) => setF({ page })} />}
      </section>
    </>
  )
}
