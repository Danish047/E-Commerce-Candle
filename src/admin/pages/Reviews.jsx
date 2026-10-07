import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { CheckIcon, EyeIcon, EyeOffIcon, StarIcon, TrashIcon } from '../components/Icons'
import {
  Avatar, Badge, Button, Empty, ErrorState, Jar, PageHead, Pagination, SearchInput, Segmented, Select, TableSkeleton, Stars,
  confirmAction, cx,
} from '../components/kit'
import { timeAgo, useDebounced, useFilters, useQuery } from '../hooks'
import { toast } from '../store'

export default function Reviews() {
  const [f, setF] = useFilters({ page: 1, search: '', status: '', rating: '' })
  const [search, setSearch] = useState(f.search)
  const ds = useDebounced(search)
  useEffect(() => { if (ds !== f.search) setF({ search: ds }) }, [ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, reload, setData } = useQuery(() => admin.reviews.list(f), [JSON.stringify(f)])
  const rows = data?.results || []

  const setVisible = async (r, is_approved) => {
    setData((d) => ({ ...d, results: d.results.map((x) => (x.id === r.id ? { ...x, is_approved } : x)) }))
    try {
      await admin.reviews.update(r.id, { is_approved })
      toast.ok(is_approved ? 'Review is showing on the product page' : 'Review hidden from the store')
    } catch (e) {
      toast.bad(e)
      reload()
    }
  }
  const remove = async (r) => {
    if (!(await confirmAction({ title: 'Delete this review?', text: `${r.user_name}'s review of ${r.product_name} will be removed for good. Hiding it is usually enough.`, confirmLabel: 'Delete review', danger: true }))) return
    try {
      await admin.reviews.remove(r.id)
      toast.ok('Review deleted')
      reload()
    } catch (e) { toast.bad(e) }
  }

  return (
    <>
      <PageHead title="Reviews" subtitle="What customers say about each candle. Product ratings update as you hide or show reviews." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={f.status} onChange={(status) => setF({ status })}
          options={[{ value: '', label: 'All' }, { value: 'visible', label: 'Showing' }, { value: 'hidden', label: 'Hidden' }]} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search words, names or candles" className="min-w-[220px] flex-1" />
        <Select value={f.rating} onChange={(e) => setF({ rating: e.target.value })} className="w-auto">
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}
      <section className="a-panel overflow-hidden">
        {loading && !data ? <TableSkeleton rows={4} cols={3} /> : rows.length === 0 ? (
          <Empty icon={StarIcon} title="No reviews here" text={f.search || f.status || f.rating ? 'Try clearing the filters.' : 'Reviews left on product pages will show up here.'} />
        ) : (
          <ul className={cx('divide-y divide-adm-line', loading && 'opacity-60')}>
            {rows.map((r) => (
              <li key={r.id} className={cx('flex flex-col gap-4 p-5 sm:flex-row', !r.is_approved && 'bg-adm-soft/50')}>
                <div className="flex shrink-0 items-start gap-3 sm:w-56">
                  <Avatar name={r.user_name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.user_name}</p>
                    <p className="text-xs text-adm-muted">{timeAgo(r.created_at)}</p>
                    {r.verified && <Badge tone="ok" className="mt-1.5"><CheckIcon className="h-3 w-3" /> Bought it</Badge>}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    {!r.is_approved && <Badge>Hidden</Badge>}
                  </div>
                  {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                  <p className={cx('mt-1 text-sm leading-relaxed', r.is_approved ? 'text-adm-ink' : 'text-adm-muted')}>{r.comment}</p>
                  <Link to={`/admin/products/${r.product_id}`} className="mt-3 inline-flex items-center gap-2 text-xs text-adm-muted hover:text-adm-ink">
                    <Jar color={r.product_color} size={22} /> {r.product_name}
                  </Link>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  {r.is_approved
                    ? <Button variant="ghost" icon={EyeOffIcon} onClick={() => setVisible(r, false)}>Hide</Button>
                    : <Button variant="ghost" icon={EyeIcon} onClick={() => setVisible(r, true)}>Show</Button>}
                  <Button variant="quiet" icon={TrashIcon} onClick={() => remove(r)} aria-label="Delete review" />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={f.page} count={data?.count || 0} onPage={(page) => setF({ page })} />
      </section>
    </>
  )
}
