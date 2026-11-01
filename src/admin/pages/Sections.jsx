import { useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { ArrowDown, ArrowUp, EditIcon, ExternalIcon, LayersIcon, PlusIcon, TrashIcon } from '../components/Icons'
import {
  Badge, Button, Drawer, Empty, ErrorState, Field, IconButton, Input, PageHead, Select, TableSkeleton, TagInput, Textarea, Toggle,
  confirmAction,
} from '../components/kit'
import { useQuery } from '../hooks'
import { toast } from '../store'

// Sections = lines of work shown as tabs on the home page (Candles, 3D Printing, ...).
// Adding one here makes it appear in the tabs, the "What we do" cards, the menu and the shop filter.

export const SECTION_STATUS = {
  live: { label: 'Live', tone: 'ok', hint: 'Shown on the store with its products.' },
  coming_soon: { label: 'Coming soon', tone: 'warn', hint: 'Shown as a teaser. Products stay hidden until you go live.' },
  hidden: { label: 'Hidden', tone: 'neutral', hint: 'Not shown anywhere on the store.' },
}
const EMPTY = {
  name: '', slug: '', icon: '', tagline: '', description: '', image: '', accent_color: '#F3E9DC',
  product_type: 'general', spec_fields: [], allow_custom_orders: false, status: 'coming_soon',
}
const slugify = (s) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const ICONS = ['🕯️', '🖨️', '🎁', '🪔', '🧸', '🖼️', '🪴', '👕', '💍', '🧁', '📿', '🛠️']

function SectionDrawer({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { ...EMPTY, ...item } : EMPTY)
  const [slugTouched, setSlugTouched] = useState(!!item)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }))

  const save = async () => {
    setBusy(true)
    setErrors({})
    const { product_count, active_count, created_at, id, ...body } = form
    body.name = body.name.trim()
    body.slug = body.slug || slugify(body.name)
    try {
      item ? await admin.sections.update(item.id, body) : await admin.sections.create(body)
      toast.ok(item ? `${body.name} updated` : `${body.name} added`)
      onSaved()
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(e)
    } finally { setBusy(false) }
  }

  return (
    <Drawer open onClose={onClose} title={item ? `Edit ${item.name}` : 'New section'}
      subtitle="Shown as a tab on the home page and as a card in “What we do”."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={save}>{item ? 'Save' : 'Add section'}</Button></>}>
      <div className="space-y-5">
        <div className="grid grid-cols-[88px_1fr] gap-3">
          <Field label="Icon" error={errors.icon}>
            <Input value={form.icon} maxLength={8} className="text-center text-xl" onChange={set('icon')} placeholder="🖨️" />
          </Field>
          <Field label="Name" required error={errors.name}>
            <Input autoFocus value={form.name} placeholder="3D Printing"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} />
          </Field>
        </div>
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {ICONS.map((ic) => (
            <button key={ic} type="button" onClick={() => set('icon')(ic)}
              className={`grid h-8 w-8 place-items-center rounded-lg text-lg ${form.icon === ic ? 'bg-adm-ink/10 ring-1 ring-adm-ink' : 'hover:bg-adm-ink/5'}`}>{ic}</button>
          ))}
        </div>

        <Field label="Show on store" error={errors.status} hint={SECTION_STATUS[form.status]?.hint}>
          <Select value={form.status} onChange={set('status')}>
            {Object.entries(SECTION_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </Select>
        </Field>

        <Field label="Tagline" hint="One short line under the name." error={errors.tagline}>
          <Input value={form.tagline} maxLength={140} onChange={set('tagline')} placeholder="Custom 3D printed models, gifts and decor" />
        </Field>
        <Field label="Description" hint="Shown in “What we do” and at the top of the tab." error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={set('description')} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Image link" hint="Optional. Paste a Cloudinary / image URL." error={errors.image}>
            <Input value={form.image} onChange={set('image')} placeholder="https://…" />
          </Field>
          <Field label="Card colour" error={errors.accent_color}>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={set('accent_color')} className="h-10 w-10 cursor-pointer rounded-lg border border-adm-line" />
              <Input value={form.accent_color} onChange={set('accent_color')} />
            </div>
          </Field>
        </div>

        <Field label="Product details style" error={errors.product_type}
          hint={form.product_type === 'candle' ? 'Products get scent notes, burn time, wax and wick fields.' : 'Products get the detail names below (Material, Size, …).'}>
          <Select value={form.product_type} onChange={set('product_type')}>
            <option value="general">General: my own details</option>
            <option value="candle">Candles: scent notes, burn time, wax</option>
          </Select>
        </Field>
        {form.product_type === 'general' && (
          <Field label="Detail names" hint="Every product in this section gets these boxes to fill. Press Enter after each." error={errors.spec_fields}>
            <TagInput value={form.spec_fields || []} onChange={set('spec_fields')} placeholder="Material, Colour, Dimensions…" />
          </Field>
        )}

        <div className="rounded-xl border border-adm-line p-4">
          <Toggle checked={form.allow_custom_orders} onChange={set('allow_custom_orders')} label="Custom orders"
            description="Adds a “Get a quote” form and WhatsApp button on this tab. Requests arrive in Messages." />
        </div>
      </div>
    </Drawer>
  )
}

export default function Sections() {
  const { data, loading, error, reload, setData } = useQuery(() => admin.sections.list(), [])
  const [editing, setEditing] = useState(null)
  const rows = data || []

  const move = async (i, dir) => {
    const next = [...rows]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setData(next)
    try {
      await Promise.all(next.map((r, idx) => (r.sort_order !== idx ? admin.sections.update(r.id, { sort_order: idx }) : null)))
      setData(next.map((r, idx) => ({ ...r, sort_order: idx })))
    } catch (e) { toast.bad(e); reload() }
  }
  const setStatus = async (r, status) => {
    try {
      await admin.sections.update(r.id, { status })
      toast.ok(`${r.name}: ${SECTION_STATUS[status].label}`)
      reload()
    } catch (e) { toast.bad(e) }
  }
  const remove = async (r) => {
    if (r.product_count) {
      await confirmAction({ title: `${r.name} has ${r.product_count} product(s)`, text: 'Move them to another section first, or set this section to Hidden.', confirmLabel: 'OK' })
      return
    }
    if (!(await confirmAction({ title: `Delete ${r.name}?`, text: 'It has no products. The tab disappears from the store.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await admin.sections.remove(r.id)
      toast.ok(`${r.name} deleted`)
      reload()
    } catch (e) { toast.bad(e) }
  }

  return (
    <>
      <PageHead title="Sections" subtitle="Your lines of work. Each one is a tab on the home page, a card in “What we do” and a filter in the shop."
        actions={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>New section</Button>} />

      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}
      <section className="a-panel overflow-hidden">
        {loading && !data ? <TableSkeleton rows={3} cols={4} /> : rows.length === 0 ? (
          <Empty icon={LayersIcon} title="No sections yet" text="Add Candles, 3D Printing or anything else you sell."
            action={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>New section</Button>} />
        ) : (
          <ul className="divide-y divide-adm-line">
            {rows.map((r, i) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
                <div className="flex flex-col">
                  <button className="text-adm-muted hover:text-adm-ink disabled:opacity-20" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button className="text-adm-muted hover:text-adm-ink disabled:opacity-20" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: r.accent_color }}>{r.icon || '•'}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {r.name}
                    {r.allow_custom_orders && <Badge tone="info">Custom orders</Badge>}
                  </p>
                  <p className="truncate text-xs text-adm-muted">/{r.slug}{r.tagline ? ` · ${r.tagline}` : ''}</p>
                </div>
                <Link to={`/admin/products?section=${r.id}`}
                  className="tabular rounded-full bg-adm-ink/[.05] px-2.5 py-0.5 text-xs text-adm-muted hover:text-adm-ink">
                  {r.active_count}/{r.product_count} live product{r.product_count === 1 ? '' : 's'}
                </Link>
                <Select value={r.status} onChange={(e) => setStatus(r, e.target.value)} className="!w-auto !py-1.5 text-[13px]" aria-label={`Status of ${r.name}`}>
                  {Object.entries(SECTION_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                </Select>
                <IconButton icon={ExternalIcon} label="View on store" onClick={() => window.open(`/?section=${r.slug}`, '_blank')} />
                <IconButton icon={EditIcon} label="Edit" onClick={() => setEditing(r)} />
                <IconButton icon={TrashIcon} label="Delete" onClick={() => remove(r)} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-3 text-xs text-adm-muted">
        Tip: to point a banner at a section, set its button link to <code>/?section=your-section</code>.
      </p>

      {editing && <SectionDrawer item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}
