import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CandleImage from '../../components/CandleImage'
import { admin } from '../api'
import { ChevronLeft, ChevronRight, CopyIcon, ExternalIcon, ImageIcon, LinkIcon, TrashIcon, UploadIcon } from '../components/Icons'
import {
  Button, ErrorState, Field, Input, Menu, PageHead, Panel, Select, Skeleton, TagInput, Textarea, Toggle, confirmAction, cx,
} from '../components/kit'
import { inr, useQuery } from '../hooks'
import { toast } from '../store'
import { DotsIcon } from '../components/Icons'

const BLANK = {
  name: '', tagline: '', description: '', price: '', compare_price: '', size: '200g', sku: '', category: '',
  moods: [], occasions: [], notes: { top: [], middle: [], base: [] }, burn_time_hours: 45, wax_type: '100% Soy',
  wick_type: 'Cotton', fragrance_load: '10%', stock: 0, color: '#C99A6B', is_active: true, is_bestseller: false, is_new: true, slug: '',
}
const SWATCHES = ['#C99A6B', '#D9B27C', '#E8A87C', '#B8C4A9', '#EFE3C8', '#9E4F5A', '#7E8F9E', '#5E4B3C', '#F2D0C4', '#C9B6D9']

function Chips({ options = [], value = [], onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id)
        return (
          <button key={o.id} type="button" onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
            aria-pressed={on}
            className={cx('rounded-full border px-3 py-1 text-[13px] transition',
              on ? 'border-adm-ink bg-adm-ink text-white' : 'border-adm-line bg-white text-adm-muted hover:border-adm-ink/40 hover:text-adm-ink')}>
            {o.name}
          </button>
        )
      })}
    </div>
  )
}

function Photos({ product, queued, setQueued, onChange }) {
  const input = useRef()
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')
  const [drag, setDrag] = useState(false)
  const images = product?.images || []

  const upload = async (files) => {
    files = [...files].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    if (!product) return setQueued([...queued, ...files])
    setBusy(true)
    try {
      let latest = images
      for (const file of files) latest = await admin.products.addImage(product.id, file)
      onChange(latest)
      toast.ok(files.length > 1 ? `${files.length} photos added` : 'Photo added')
    } catch (e) {
      toast.bad(e)
    } finally {
      setBusy(false)
    }
  }
  const addUrl = async () => {
    if (!url.trim()) return
    if (!product) return toast.bad('Save the product first, then add photo links.')
    try {
      onChange(await admin.products.addImage(product.id, url.trim()))
      setUrl('')
    } catch (e) { toast.bad(e) }
  }
  const remove = async (img) => {
    try { onChange(await admin.products.removeImage(product.id, img.id)) } catch (e) { toast.bad(e) }
  }
  const move = async (i, dir) => {
    const ids = images.map((x) => x.id)
    ;[ids[i], ids[i + dir]] = [ids[i + dir], ids[i]]
    try { onChange(await admin.products.reorderImages(product.id, ids)) } catch (e) { toast.bad(e) }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <figure key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-adm-soft ring-1 ring-adm-line">
            <img src={img.src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-adm-side/80 px-1.5 py-0.5 text-[11px] text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="flex gap-1">
                {i > 0 && <button type="button" onClick={() => move(i, -1)} aria-label="Move earlier" className="grid h-7 w-7 place-items-center rounded-md bg-white/90"><ChevronLeft className="h-4 w-4" /></button>}
                {i < images.length - 1 && <button type="button" onClick={() => move(i, 1)} aria-label="Move later" className="grid h-7 w-7 place-items-center rounded-md bg-white/90"><ChevronRight className="h-4 w-4" /></button>}
              </span>
              <button type="button" onClick={() => remove(img)} aria-label="Remove photo" className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-bad"><TrashIcon className="h-4 w-4" /></button>
            </div>
          </figure>
        ))}
        {queued.map((f, i) => (
          <figure key={i} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-adm-line">
            <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover opacity-70" />
            <button type="button" onClick={() => setQueued(queued.filter((_, j) => j !== i))} aria-label="Remove" className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-white/90 text-bad"><TrashIcon className="h-4 w-4" /></button>
            <span className="absolute inset-x-0 bottom-0 bg-adm-side/70 py-1 text-center text-[11px] text-white">Uploads on save</span>
          </figure>
        ))}
        <button type="button" onClick={() => input.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files) }}
          className={cx('flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center text-xs transition',
            drag ? 'border-ember bg-ember-light/50 text-ember-dark' : 'border-adm-line text-adm-muted hover:border-adm-ink/30 hover:text-adm-ink')}>
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <UploadIcon className="h-5 w-5" />}
          <span>{busy ? 'Uploading…' : <>Drop photos<br />or click</>}</span>
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-adm-muted" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image link (Cloudinary, Drive, etc.)" className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
        </div>
        <Button variant="ghost" onClick={addUrl} disabled={!url.trim()}>Add link</Button>
      </div>
      {!images.length && !queued.length && (
        <p className="mt-3 flex items-center gap-2 text-xs text-adm-muted"><ImageIcon className="h-4 w-4" />No photos yet, so the store shows a jar drawn in this product's colour.</p>
      )}
    </div>
  )
}

export default function ProductEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const tax = useQuery(() => Promise.all([admin.categories.list(), admin.moods.list(), admin.occasions.list()]), [])
  const [cats, moods, occasions] = tax.data || []
  const loaded = useQuery(() => (isNew ? Promise.resolve(null) : admin.products.get(id)), [id])

  const [form, setForm] = useState(BLANK)
  const [original, setOriginal] = useState(BLANK)
  const [images, setImages] = useState([])
  const [queued, setQueued] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loaded.data) {
      const p = { ...BLANK, ...loaded.data, compare_price: loaded.data.compare_price ?? '' }
      setForm(p)
      setOriginal(p)
      setImages(loaded.data.images)
    } else if (isNew) {
      setForm(BLANK)
      setOriginal(BLANK)
      setImages([])
    }
  }, [loaded.data, isNew])

  useEffect(() => {
    if (isNew && cats?.length && !form.category) setForm((f) => ({ ...f, category: cats[0].id }))
  }, [cats, isNew]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(original) || queued.length > 0, [form, original, queued])
  useEffect(() => {
    const warn = (e) => dirty && (e.preventDefault(), (e.returnValue = ''))
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (e.target.type === 'number' ? e.target.value : e.target.value) : e }))
  const setNote = (layer) => (v) => setForm((f) => ({ ...f, notes: { ...f.notes, [layer]: v } }))

  const save = async () => {
    setSaving(true)
    setErrors({})
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      compare_price: form.compare_price === '' ? null : Number(form.compare_price),
      stock: Number(form.stock) || 0,
      burn_time_hours: Number(form.burn_time_hours) || 0,
      category: Number(form.category),
    }
    ;['images', 'rating', 'reviews_count', 'units_sold', 'created_at', 'updated_at', 'category_name', 'id'].forEach((k) => delete payload[k])
    if (isNew && !payload.slug) delete payload.slug
    try {
      let saved = isNew ? await admin.products.create(payload) : await admin.products.update(id, payload)
      for (const file of queued) saved = { ...saved, images: await admin.products.addImage(saved.id, file) }
      setQueued([])
      toast.ok(isNew ? `${saved.name} added` : 'Changes saved')
      const next = { ...BLANK, ...saved, compare_price: saved.compare_price ?? '' }
      setForm(next)
      setOriginal(next)
      setImages(saved.images)
      if (isNew) nav(`/admin/products/${saved.id}`, { replace: true })
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(Object.keys(e.fields || {}).length ? 'Some fields need attention.' : e)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete ${form.name}?`, danger: true, confirmLabel: 'Delete product',
      text: 'If anyone has ordered it, it will be hidden from the store instead, so past orders stay intact.',
    })
    if (!ok) return
    try {
      const res = await admin.products.remove(id)
      toast.ok(res?.detail || `${form.name} deleted`)
      nav('/admin/products')
    } catch (e) { toast.bad(e) }
  }

  const duplicate = async () => {
    try {
      const copy = await admin.products.duplicate(id)
      toast.ok('Copy created. It stays hidden until you make it live.')
      nav(`/admin/products/${copy.id}`)
    } catch (e) { toast.bad(e) }
  }

  if (loaded.error) return <ErrorState error={loaded.error} onRetry={loaded.reload} />
  if ((!isNew && !loaded.data) || !tax.data) return <div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-[520px] rounded-2xl" /></div>

  const off = form.compare_price && Number(form.compare_price) > Number(form.price) ? Math.round((1 - form.price / form.compare_price) * 100) : 0
  const preview = { ...form, images: images.map((i) => i.src) }

  return (
    <div className="pb-24">
      <PageHead back={{ to: '/admin/products', label: 'Products' }} title={isNew ? 'New product' : form.name || 'Untitled'}
        actions={!isNew && <>
          {original.is_active && <a href={`/product/${original.slug}`} target="_blank" rel="noreferrer" className="a-btn-ghost"><ExternalIcon className="h-4 w-4" />View in store</a>}
          <Menu trigger={<button className="a-btn-ghost px-2.5" aria-label="More actions"><DotsIcon /></button>}
            items={[{ label: 'Duplicate', icon: CopyIcon, onClick: duplicate }, { label: 'Delete product', icon: TrashIcon, danger: true, onClick: remove }]} />
        </>} />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Panel title="Basics">
            <div className="space-y-4">
              <Field label="Name" required error={errors.name}><Input value={form.name} onChange={set('name')} placeholder="Monsoon Chai" error={errors.name} /></Field>
              <Field label="One-line story" hint="Shown under the name on product cards." error={errors.tagline}>
                <Input value={form.tagline} onChange={set('tagline')} placeholder="First rain, a steaming cup, nowhere to be." />
              </Field>
              <Field label="Description" error={errors.description}><Textarea rows={5} value={form.description} onChange={set('description')} /></Field>
            </div>
          </Panel>

          <Panel title="Photos">
            <Photos product={isNew ? null : { id, images }} queued={queued} setQueued={setQueued} onChange={setImages} />
          </Panel>

          <Panel title="Fragrance">
            <div className="grid gap-4 sm:grid-cols-3">
              {['top', 'middle', 'base'].map((layer) => (
                <Field key={layer} label={`${layer[0].toUpperCase()}${layer.slice(1)} notes`} hint={layer === 'top' ? 'Press Enter or comma after each' : ''}>
                  <TagInput value={form.notes?.[layer] || []} onChange={setNote(layer)} placeholder={{ top: 'Cardamom', middle: 'Ginger', base: 'Tonka' }[layer]} />
                </Field>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Moods"><Chips options={moods} value={form.moods} onChange={set('moods')} /></Field>
              <Field label="Good for"><Chips options={occasions} value={form.occasions} onChange={set('occasions')} /></Field>
            </div>
          </Panel>

          <Panel title="Candle details">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Size"><Input value={form.size} onChange={set('size')} /></Field>
              <Field label="Burn time (hours)" error={errors.burn_time_hours}><Input type="number" min="0" value={form.burn_time_hours} onChange={set('burn_time_hours')} /></Field>
              <Field label="Fragrance load"><Input value={form.fragrance_load} onChange={set('fragrance_load')} /></Field>
              <Field label="Wax"><Input list="wax" value={form.wax_type} onChange={set('wax_type')} /></Field>
              <Field label="Wick"><Input list="wick" value={form.wick_type} onChange={set('wick_type')} /></Field>
            </div>
            <datalist id="wax">{['100% Soy', 'Soy-Coconut blend', 'Beeswax', 'Coconut-Apricot'].map((x) => <option key={x} value={x} />)}</datalist>
            <datalist id="wick">{['Cotton', 'Wooden', 'Crackling wood'].map((x) => <option key={x} value={x} />)}</datalist>
          </Panel>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <section className="a-panel overflow-hidden">
            <div className="aspect-[4/3] bg-cream"><CandleImage product={preview} flame /></div>
            <div className="p-4">
              <p className="font-serif text-xl font-semibold leading-tight">{form.name || 'Product name'}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-adm-muted">{form.tagline || 'One-line story'}</p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="tabular font-semibold">{inr(form.price)}</span>
                {off > 0 && <><span className="tabular text-xs text-adm-muted line-through">{inr(form.compare_price)}</span><span className="text-xs font-semibold text-ok">{off}% off</span></>}
              </p>
            </div>
          </section>

          <Panel title="Visibility">
            <div className="space-y-4">
              <Toggle label="Live in the store" description="Turn off to hide it without deleting." checked={form.is_active} onChange={set('is_active')} />
              <Toggle label="Bestseller badge" checked={form.is_bestseller} onChange={set('is_bestseller')} />
              <Toggle label="New arrival badge" checked={form.is_new} onChange={set('is_new')} />
            </div>
          </Panel>

          <Panel title="Price & stock">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" required error={errors.price}><Input prefix="₹" type="number" min="0" value={form.price} onChange={set('price')} error={errors.price} /></Field>
              <Field label="MRP" error={errors.compare_price}><Input prefix="₹" type="number" min="0" value={form.compare_price} onChange={set('compare_price')} placeholder="Optional" error={errors.compare_price} /></Field>
              <Field label="In stock" error={errors.stock}><Input type="number" min="0" value={form.stock} onChange={set('stock')} className="tabular" /></Field>
              <Field label="SKU"><Input value={form.sku} onChange={set('sku')} placeholder="LUM-013" /></Field>
            </div>
          </Panel>

          <Panel title="Organise">
            <div className="space-y-4">
              <Field label="Category" required error={errors.category}>
                <Select value={form.category} onChange={set('category')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
              </Field>
              <Field label="Jar colour" hint="Used when there's no photo, and for thumbnails here." error={errors.color}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SWATCHES.map((c) => (
                    <button key={c} type="button" onClick={() => set('color')(c)} aria-label={c}
                      className={cx('h-7 w-7 rounded-full ring-offset-2 transition', form.color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-adm-ink' : 'ring-1 ring-adm-line')}
                      style={{ background: c }} />
                  ))}
                  <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full ring-1 ring-adm-line" title="Custom colour"
                    style={{ background: 'conic-gradient(#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f87171)' }}>
                    <input type="color" value={form.color} onChange={set('color')} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                </div>
              </Field>
              <Field label="Web address" hint={`/product/${form.slug || 'made-from-the-name'}`} error={errors.slug}>
                <Input value={form.slug} onChange={(e) => set('slug')(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="Made from the name" />
              </Field>
            </div>
          </Panel>
        </aside>
      </div>

      <div className={cx('fixed inset-x-0 bottom-0 z-20 border-t border-adm-line bg-white/95 backdrop-blur transition-transform lg:left-[248px]',
        dirty || isNew ? 'translate-y-0' : 'translate-y-full')}>
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-sm text-adm-muted">{isNew ? 'New product, not saved yet' : 'You have unsaved changes'}</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => (isNew ? nav('/admin/products') : (setForm(original), setQueued([])))}>{isNew ? 'Cancel' : 'Discard'}</Button>
            <Button variant="accent" loading={saving} onClick={save}>{isNew ? 'Add product' : 'Save changes'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
