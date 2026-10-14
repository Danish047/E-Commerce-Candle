import { useState } from 'react'
import { admin } from '../api'
import { EditIcon, ImageIcon, PlusIcon, TrashIcon } from '../components/Icons'
import {
  Badge, Button, Drawer, Empty, ErrorState, Field, IconButton, Input, PageHead, Panel, Segmented, Select, Skeleton, Textarea, Toggle, confirmAction,
} from '../components/kit'
import { fmtDateTime, useQuery } from '../hooks'
import { toast } from '../store'

// <input type="datetime-local"> works in local time without a zone; the API wants ISO.
const toLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const toIso = (v) => (v ? new Date(v).toISOString() : null)

function scheduleState(x) {
  const now = Date.now()
  if (!x.is_active) return ['Off', 'neutral']
  if (x.start_at && new Date(x.start_at) > now) return ['Scheduled', 'info']
  if (x.end_at && new Date(x.end_at) <= now) return ['Expired', 'warn']
  return ['Live', 'ok']
}
const StateBadge = ({ x }) => { const [t, tone] = scheduleState(x); return <Badge tone={tone} dot>{t}</Badge> }
const When = ({ x }) => (
  <span className="text-xs text-adm-muted">
    {x.start_at ? fmtDateTime(x.start_at) : 'Now'} → {x.end_at ? fmtDateTime(x.end_at) : 'No end'}
  </span>
)

const PLACEMENTS = [
  { value: 'home_hero', label: 'Home hero' },
  { value: 'home_middle', label: 'Home middle' },
  { value: 'shop_top', label: 'Shop top' },
]
const NEW_ANN = { text: '', link: '', bg_color: '#3B2A20', text_color: '#FBF7F1', is_active: true, start_at: null, end_at: null, sort_order: 0 }
const NEW_BANNER = {
  placement: 'home_hero', badge_text: '', title: '', subtitle: '', image_desktop: '', image_mobile: '', alt_text: '',
  primary_btn_text: '', primary_btn_link: '', secondary_btn_text: '', secondary_btn_link: '',
  text_align: 'left', text_color: '#FFFFFF', overlay_opacity: 35, show_countdown: false,
  is_active: true, start_at: null, end_at: null, sort_order: 0,
}

function ScheduleFields({ form, set, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Show from" hint="Empty = right away" error={errors.start_at}>
        <Input type="datetime-local" value={toLocal(form.start_at)} onChange={(e) => set({ start_at: toIso(e.target.value) })} />
      </Field>
      <Field label="Hide after" hint="Empty = never" error={errors.end_at}>
        <Input type="datetime-local" value={toLocal(form.end_at)} onChange={(e) => set({ end_at: toIso(e.target.value) })} />
      </Field>
      <Field label="Order" hint="Lower shows first">
        <Input type="number" min="0" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })} />
      </Field>
      <div className="pt-6"><Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active" /></div>
    </div>
  )
}

const ColorInput = ({ value, onChange }) => (
  <div className="flex gap-2">
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-adm-line" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
)

function Editor({ kind, item, onClose, onSaved }) {
  const isBanner = kind === 'banners'
  const [form, setForm] = useState(item)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const bind = (k) => ({ value: form[k] ?? '', onChange: (e) => set({ [k]: e.target.value }), error: errors[k] })

  const save = async () => {
    setBusy(true)
    setErrors({})
    try {
      const saved = form.id ? await admin[kind].update(form.id, form) : await admin[kind].create(form)
      toast.ok(isBanner ? 'Banner saved.' : 'Announcement saved.')
      onSaved(saved)
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(e)
    } finally { setBusy(false) }
  }

  return (
    <Drawer open onClose={onClose} title={`${form.id ? 'Edit' : 'New'} ${isBanner ? 'banner' : 'announcement'}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={save}>Save</Button></>}>
      <div className="space-y-5">
        {isBanner ? (
          <>
            {form.image_desktop && (
              <div className="relative aspect-[16/7] overflow-hidden rounded-xl bg-adm-soft">
                <img src={form.image_desktop} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black" style={{ opacity: form.overlay_opacity / 100 }} />
                <div className="absolute inset-0 flex flex-col justify-center p-5" style={{ color: form.text_color, textAlign: form.text_align }}>
                  {form.badge_text && <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{form.badge_text}</span>}
                  <span className="font-serif text-2xl font-semibold">{form.title || 'Title'}</span>
                  {form.subtitle && <span className="mt-1 line-clamp-2 text-xs opacity-90">{form.subtitle}</span>}
                </div>
              </div>
            )}
            <Field label="Where"><Select {...bind('placement')}>{PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge" hint="e.g. Diwali Sale" error={errors.badge_text}><Input {...bind('badge_text')} /></Field>
              <Field label="Title" required error={errors.title}><Input {...bind('title')} /></Field>
            </div>
            <Field label="Subtitle" error={errors.subtitle}><Textarea rows={2} {...bind('subtitle')} /></Field>
            <Field label="Desktop image URL" required hint="Wide, at least 1600px" error={errors.image_desktop}><Input {...bind('image_desktop')} placeholder="https://res.cloudinary.com/…" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile image URL" hint="Optional, portrait" error={errors.image_mobile}><Input {...bind('image_mobile')} /></Field>
              <Field label="Alt text" hint="For SEO & screen readers"><Input {...bind('alt_text')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Main button text"><Input {...bind('primary_btn_text')} placeholder="Shop now" /></Field>
              <Field label="Main button link"><Input {...bind('primary_btn_link')} placeholder="/shop?occasion=diwali" /></Field>
              <Field label="Second button text"><Input {...bind('secondary_btn_text')} /></Field>
              <Field label="Second button link"><Input {...bind('secondary_btn_link')} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Text align">
                <Select {...bind('text_align')}>{['left', 'center', 'right'].map((a) => <option key={a} value={a}>{a}</option>)}</Select>
              </Field>
              <Field label="Text colour"><ColorInput value={form.text_color} onChange={(v) => set({ text_color: v })} /></Field>
              <Field label={`Darken image ${form.overlay_opacity}%`} error={errors.overlay_opacity}>
                <input type="range" min="0" max="90" value={form.overlay_opacity} onChange={(e) => set({ overlay_opacity: Number(e.target.value) })} className="mt-3 w-full accent-ember" />
              </Field>
            </div>
            <Toggle checked={form.show_countdown} onChange={(v) => set({ show_countdown: v })} label="Show countdown timer" description="Counts down to the 'Hide after' time. Great for sales." />
          </>
        ) : (
          <>
            <div className="rounded-lg px-4 py-2 text-center text-sm" style={{ background: form.bg_color, color: form.text_color }}>✦ {form.text || 'Your message'}</div>
            <Field label="Message" required error={errors.text}><Input {...bind('text')} maxLength={160} placeholder="Bulk orders: custom labels from 20 pieces" /></Field>
            <Field label="Link" hint="/bulk-order, /shop?… or https://…" error={errors.link}><Input {...bind('link')} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Background" hint="First message's colours are used for the bar"><ColorInput value={form.bg_color} onChange={(v) => set({ bg_color: v })} /></Field>
              <Field label="Text colour"><ColorInput value={form.text_color} onChange={(v) => set({ text_color: v })} /></Field>
            </div>
          </>
        )}
        <ScheduleFields form={form} set={set} errors={errors} />
      </div>
    </Drawer>
  )
}

export default function Banners() {
  const [tab, setTab] = useState('banners')
  const [editing, setEditing] = useState(null)
  const q = useQuery(() => admin[tab].list(), [tab])
  const list = q.data || []

  const remove = async (x) => {
    if (!(await confirmAction({ title: 'Delete this?', text: 'It disappears from the store right away.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await admin[tab].remove(x.id)
      q.setData((d) => d.filter((y) => y.id !== x.id))
      toast.ok('Deleted.')
    } catch (e) { toast.bad(e) }
  }
  const quickToggle = async (x) => {
    try {
      const saved = await admin[tab].update(x.id, { is_active: !x.is_active })
      q.setData((d) => d.map((y) => (y.id === saved.id ? saved : y)))
    } catch (e) { toast.bad(e) }
  }

  return (
    <>
      <PageHead title="Banners & announcements" subtitle="Control the scrolling top bar and the image banners. Schedule them for sales and festivals."
        actions={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing(tab === 'banners' ? NEW_BANNER : NEW_ANN)}>
          {tab === 'banners' ? 'New banner' : 'New announcement'}</Button>} />
      <div className="mb-4"><Segmented value={tab} onChange={setTab} options={[{ value: 'banners', label: 'Banners' }, { value: 'announcements', label: 'Top bar' }]} /></div>
      {q.error && <div className="mb-4"><ErrorState error={q.error} onRetry={q.reload} /></div>}
      {q.loading && !q.data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !list.length ? (
        <section className="a-panel"><Empty icon={ImageIcon} title="Nothing here yet" text="When nothing is live, the store shows its built-in design." /></section>
      ) : (
        <Panel bodyClass="divide-y divide-adm-line">
          {list.map((x) => (
            <div key={x.id} className="flex items-center gap-4 px-5 py-3.5">
              {tab === 'banners'
                ? <img src={x.image_desktop} alt="" className="h-14 w-24 shrink-0 rounded-lg bg-adm-soft object-cover" />
                : <span className="h-8 w-8 shrink-0 rounded-lg border border-adm-line" style={{ background: x.bg_color }} />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-adm-ink">{x.title || x.text}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <StateBadge x={x} />
                  {x.placement && <Badge>{PLACEMENTS.find((p) => p.value === x.placement)?.label}</Badge>}
                  <When x={x} />
                </div>
              </div>
              <Toggle checked={x.is_active} onChange={() => quickToggle(x)} />
              <IconButton icon={EditIcon} label="Edit" onClick={() => setEditing(x)} />
              <IconButton icon={TrashIcon} label="Delete" onClick={() => remove(x)} />
            </div>
          ))}
        </Panel>
      )}
      {editing && (
        <Editor kind={tab} item={editing} onClose={() => setEditing(null)}
          onSaved={(saved) => {
            q.setData((d) => (d.some((y) => y.id === saved.id) ? d.map((y) => (y.id === saved.id ? saved : y)) : [...d, saved]))
            setEditing(null)
          }} />
      )}
    </>
  )
}
