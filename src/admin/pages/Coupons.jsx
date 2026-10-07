import { useState } from 'react'
import { admin } from '../api'
import { CopyIcon, DotsIcon, EditIcon, PlusIcon, TagIcon, TrashIcon } from '../components/Icons'
import {
  Badge, Button, Empty, ErrorState, Field, IconButton, Input, Menu, Modal, PageHead, Segmented, TableSkeleton, Textarea, Toggle,
  confirmAction, cx,
} from '../components/kit'
import { fmtDate, inr, useQuery } from '../hooks'
import { toast } from '../store'

const blank = {
  code: '', type: 'percent', value: 10, max_discount: '', min_order: 0, description: '',
  is_active: true, starts_at: '', expires_at: '', usage_limit: '',
}

// datetime ⇄ yyyy-mm-dd for date inputs
const toDate = (iso) => (iso ? iso.slice(0, 10) : '')
const fromDate = (d, end) => (d ? `${d}T${end ? '23:59:59' : '00:00:00'}` : null)

function state(c) {
  const now = new Date()
  if (!c.is_active) return { label: 'Paused', tone: 'neutral' }
  if (c.expires_at && new Date(c.expires_at) < now) return { label: 'Expired', tone: 'neutral' }
  if (c.starts_at && new Date(c.starts_at) > now) return { label: 'Scheduled', tone: 'info' }
  if (c.usage_limit && c.times_used >= c.usage_limit) return { label: 'Used up', tone: 'warn' }
  return { label: 'Live', tone: 'ok' }
}

const offer = (c) => (c.type === 'percent'
  ? `${c.value}% off${c.max_discount ? ` (up to ${inr(c.max_discount)})` : ''}`
  : `${inr(c.value)} off`)

function CouponForm({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(() => (coupon
    ? { ...coupon, max_discount: coupon.max_discount ?? '', usage_limit: coupon.usage_limit ?? '', starts_at: toDate(coupon.starts_at), expires_at: toDate(coupon.expires_at) }
    : blank))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  const save = async () => {
    setBusy(true)
    setErrors({})
    const body = {
      code: form.code.trim().toUpperCase(), type: form.type, value: Number(form.value) || 0,
      max_discount: form.type === 'percent' && form.max_discount !== '' ? Number(form.max_discount) : null,
      min_order: Number(form.min_order) || 0, description: form.description, is_active: form.is_active,
      starts_at: fromDate(form.starts_at), expires_at: fromDate(form.expires_at, true),
      usage_limit: form.usage_limit !== '' ? Number(form.usage_limit) : null,
    }
    try {
      const saved = coupon ? await admin.coupons.update(coupon.id, body) : await admin.coupons.create(body)
      toast.ok(coupon ? `${saved.code} updated` : `${saved.code} is ready to share`)
      onSaved()
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={coupon ? `Edit ${coupon.code}` : 'New coupon'} subtitle="Customers type the code at checkout."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={save}>{coupon ? 'Save changes' : 'Create coupon'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" required error={errors.code} className="sm:col-span-2">
          <Input value={form.code} onChange={(e) => set('code')(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="FESTIVE15" autoFocus />
        </Field>
        <Field label="Discount type" className="sm:col-span-2">
          <Segmented value={form.type} onChange={set('type')}
            options={[{ value: 'percent', label: 'Percent off' }, { value: 'flat', label: 'Flat ₹ off' }]} />
        </Field>
        <Field label={form.type === 'percent' ? 'Percent' : 'Amount'} required error={errors.value}>
          <Input type="number" min="1" prefix={form.type === 'percent' ? '%' : '₹'} value={form.value} onChange={set('value')} />
        </Field>
        {form.type === 'percent' ? (
          <Field label="Max discount" hint="Leave empty for no cap" error={errors.max_discount}>
            <Input type="number" min="0" prefix="₹" value={form.max_discount} onChange={set('max_discount')} />
          </Field>
        ) : <div className="hidden sm:block" />}
        <Field label="Minimum order" error={errors.min_order}>
          <Input type="number" min="0" prefix="₹" value={form.min_order} onChange={set('min_order')} />
        </Field>
        <Field label="Total uses allowed" hint="Leave empty for unlimited" error={errors.usage_limit}>
          <Input type="number" min="1" value={form.usage_limit} onChange={set('usage_limit')} />
        </Field>
        <Field label="Starts" error={errors.starts_at}>
          <Input type="date" value={form.starts_at} onChange={set('starts_at')} />
        </Field>
        <Field label="Ends" error={errors.expires_at}>
          <Input type="date" value={form.expires_at} onChange={set('expires_at')} />
        </Field>
        <Field label="Shown to customers" hint="e.g. “15% off for the festive season”" className="sm:col-span-2" error={errors.description}>
          <Textarea rows={2} value={form.description} onChange={set('description')} />
        </Field>
        <div className="sm:col-span-2">
          <Toggle checked={form.is_active} onChange={set('is_active')} label="Active" description="Paused codes are rejected at checkout." />
        </div>
      </div>
    </Modal>
  )
}

export default function Coupons() {
  const { data, loading, error, reload } = useQuery(() => admin.coupons.list(), [])
  const [editing, setEditing] = useState(null) // null | 'new' | coupon
  const [filter, setFilter] = useState('')
  const all = data || []
  const rows = all.filter((c) => !filter || (filter === 'live' ? state(c).label === 'Live' : state(c).label !== 'Live'))

  const toggle = async (c) => {
    try {
      await admin.coupons.update(c.id, { is_active: !c.is_active })
      toast.ok(c.is_active ? `${c.code} paused` : `${c.code} is live`)
      reload()
    } catch (e) { toast.bad(e) }
  }
  const remove = async (c) => {
    if (!(await confirmAction({ title: `Delete ${c.code}?`, text: 'Past orders keep their discount, but customers can no longer use this code.', confirmLabel: 'Delete coupon', danger: true }))) return
    try {
      await admin.coupons.remove(c.id)
      toast.ok(`${c.code} deleted`)
      reload()
    } catch (e) { toast.bad(e) }
  }
  const copy = (c) => navigator.clipboard?.writeText(c.code).then(() => toast.ok(`Copied ${c.code}`))

  return (
    <>
      <PageHead title="Coupons" subtitle="Discount codes for festivals, first orders and loyal regulars."
        actions={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>New coupon</Button>} />

      {data && all.length > 0 && (
        <div className="mb-4">
          <Segmented value={filter} onChange={setFilter} options={[
            { value: '', label: 'All', count: all.length },
            { value: 'live', label: 'Live', count: all.filter((c) => state(c).label === 'Live').length },
            { value: 'off', label: 'Not running', count: all.filter((c) => state(c).label !== 'Live').length },
          ]} />
        </div>
      )}

      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}
      {loading && !data ? <section className="a-panel"><TableSkeleton cols={4} /></section> : rows.length === 0 ? (
        <section className="a-panel">
          <Empty icon={TagIcon} title={all.length ? 'Nothing here' : 'No coupons yet'} text="Make a code, then share it on Instagram or WhatsApp."
            action={!all.length && <Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>New coupon</Button>} />
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const st = state(c)
            const pct = c.usage_limit ? Math.min(100, (c.times_used / c.usage_limit) * 100) : null
            return (
              <article key={c.id} className={cx('a-panel relative flex flex-col overflow-hidden', st.label !== 'Live' && 'opacity-80')}>
                <div className="flex items-start justify-between gap-2 border-b border-dashed border-adm-line px-5 pb-4 pt-5">
                  <div className="min-w-0">
                    <button onClick={() => copy(c)} title="Copy code"
                      className="group inline-flex items-center gap-2 font-mono text-lg font-semibold tracking-wider text-adm-ink">
                      {c.code} <CopyIcon className="h-3.5 w-3.5 text-adm-muted opacity-0 transition group-hover:opacity-100" />
                    </button>
                    <p className="mt-0.5 font-serif text-xl font-semibold text-ember-dark">{offer(c)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone={st.tone} dot>{st.label}</Badge>
                    <Menu trigger={<IconButton icon={DotsIcon} label="More" />} items={[
                      { label: 'Edit', icon: EditIcon, onClick: () => setEditing(c) },
                      { label: c.is_active ? 'Pause' : 'Turn on', onClick: () => toggle(c) },
                      { label: 'Delete', icon: TrashIcon, danger: true, onClick: () => remove(c) },
                    ]} />
                  </div>
                </div>
                <div className="flex-1 space-y-1 px-5 py-4 text-sm text-adm-muted">
                  {c.description && <p className="text-adm-ink">{c.description}</p>}
                  <p>{c.min_order ? `On orders over ${inr(c.min_order)}` : 'No minimum order'}</p>
                  {(c.starts_at || c.expires_at) && (
                    <p>{c.starts_at ? fmtDate(c.starts_at) : 'Now'} → {c.expires_at ? fmtDate(c.expires_at) : 'no end date'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 bg-adm-soft/60 px-5 py-3.5 text-sm">
                  <div>
                    <p className="text-xs text-adm-muted">Used</p>
                    <p className="tabular font-semibold">{c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</p>
                    {pct !== null && <div className="mt-1.5 h-1 rounded-full bg-adm-line"><div className="h-1 rounded-full bg-ember" style={{ width: `${pct}%` }} /></div>}
                  </div>
                  <div>
                    <p className="text-xs text-adm-muted">Sales with code</p>
                    <p className="tabular font-semibold">{inr(c.revenue)}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {editing && <CouponForm coupon={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}
