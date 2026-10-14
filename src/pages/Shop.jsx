import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../utils/helpers'
import ProductCard from '../components/ProductCard'
import { ErrorBox, PageHeader, Spinner } from '../components/ui'
import BannerSlider from '../components/BannerSlider'
import { CloseIcon } from '../components/Icons'

const PRICE_RANGES = [
  { label: 'Under ₹700', min: '', max: 699 },
  { label: '₹700 – ₹999', min: 700, max: 999 },
  { label: '₹1,000 & above', min: 1000, max: '' },
]
const SORTS = [
  { value: '', label: 'Featured' },
  { value: '-reviews_count', label: 'Most popular' },
  { value: '-rating', label: 'Top rated' },
  { value: '-id', label: 'Newest' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
]
const PAGE_SIZE = 9

function FilterGroup({ title, options, active, onPick }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-cocoa-soft">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.value} onClick={() => onPick(active === o.value ? '' : o.value)} className={`chip ${active === o.value ? 'chip-active' : ''}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const get = (k) => params.get(k) || ''
  const page = Number(get('page')) || 1

  const categories = useApi(() => api.catalog.categories(), [])
  const moods = useApi(() => api.catalog.moods(), [])
  const occasions = useApi(() => api.catalog.occasions(), [])

  const query = {
    category: get('category'), mood: get('mood'), occasion: get('occasion'), search: get('search'),
    min_price: get('min_price'), max_price: get('max_price'), ordering: get('ordering'), page, page_size: PAGE_SIZE,
  }
  const products = useApi(() => api.catalog.products(query), [params.toString()])

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const priceKey = `${get('min_price')}-${get('max_price')}`
  const activeCount = ['category', 'mood', 'occasion', 'search', 'min_price', 'max_price'].filter(get).length
  const catName = categories.data?.find((c) => c.slug === get('category'))?.name
  const occName = occasions.data?.find((o) => o.slug === get('occasion'))?.name
  const title = get('search') ? `Results for "${get('search')}"` : catName || occName || 'All Candles'
  const totalPages = products.data ? Math.ceil(products.data.count / PAGE_SIZE) : 1

  const filters = (
    <div className="space-y-7">
      <FilterGroup title="Scent family" active={get('category')} onPick={(v) => update({ category: v })}
        options={(categories.data || []).map((c) => ({ value: c.slug, label: c.name }))} />
      <FilterGroup title="Mood" active={get('mood')} onPick={(v) => update({ mood: v })}
        options={(moods.data || []).map((m) => ({ value: m.slug, label: m.name }))} />
      <FilterGroup title="Occasion" active={get('occasion')} onPick={(v) => update({ occasion: v })}
        options={(occasions.data || []).map((o) => ({ value: o.slug, label: o.name }))} />
      <FilterGroup title="Price" active={priceKey}
        onPick={(v) => {
          const r = PRICE_RANGES.find((p) => `${p.min}-${p.max}` === v)
          update({ min_price: r?.min ?? '', max_price: r?.max ?? '' })
        }}
        options={PRICE_RANGES.map((p) => ({ value: `${p.min}-${p.max}`, label: p.label }))} />
      {activeCount > 0 && (
        <button onClick={() => setParams(get('ordering') ? { ordering: get('ordering') } : {})} className="text-sm underline">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      <BannerSlider placement="shop_top" tall={false} className="mt-6" />
      <PageHeader eyebrow="Shop" title={title} subtitle="Hand-poured soy candles in scents inspired by Indian memories and moods." />
      <div className="container-x mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <button onClick={() => setShowFilters(true)} className="chip lg:hidden">
              Filters {activeCount > 0 && `(${activeCount})`}
            </button>
            <p className="hidden text-sm text-cocoa-soft lg:block">
              {products.data ? `${products.data.count} candle${products.data.count === 1 ? '' : 's'}` : ''}
            </p>
            <select value={get('ordering')} onChange={(e) => update({ ordering: e.target.value })}
              className="rounded-full border border-sand bg-white px-4 py-2 text-sm outline-none">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {products.loading ? <Spinner /> : products.error ? <ErrorBox error={products.error} onRetry={products.reload} /> :
            products.data.results.length === 0 ? (
              <div className="rounded-2xl bg-wax p-12 text-center">
                <p className="font-serif text-2xl">No candles match these filters</p>
                <button onClick={() => setParams({})} className="btn-outline mt-5">Clear filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
                  {products.data.results.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => { update({ page: n }); window.scrollTo(0, 0) }}
                        className={`h-10 w-10 rounded-full text-sm ${n === page ? 'bg-cocoa text-cream' : 'border border-sand'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-cocoa/40" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-serif text-2xl font-semibold">Filters</p>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters"><CloseIcon className="h-6 w-6" /></button>
            </div>
            {filters}
            <button onClick={() => setShowFilters(false)} className="btn-primary mt-8 w-full">
              Show {products.data?.count ?? ''} candles
            </button>
          </div>
        </div>
      )}
    </>
  )
}
