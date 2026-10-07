import { useEffect, useState } from 'react'
import { admin } from '../api'
import { DotsIcon, KeyIcon, PlusIcon } from '../components/Icons'
import {
  Avatar, Badge, Button, ErrorState, Field, IconButton, Input, Menu, Modal, PageHead, Panel, Segmented, Skeleton, Textarea, Toggle,
  confirmAction,
} from '../components/kit'
import { fmtDate, inr, timeAgo, useFilters, useQuery } from '../hooks'
import { toast, useAdminAuth } from '../store'

// ─── Store rules ────────────────────────────────────────────────────
function StoreTab({ isOwner }) {
  const { data, loading, error, reload, setData } = useQuery(() => admin.settings.get(), [])
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (data) setForm(data) }, [data])

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading || !form) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const dirty = JSON.stringify(form) !== JSON.stringify(data)
  const save = async () => {
    setBusy(true)
    setErrors({})
    try {
      const saved = await admin.settings.update(form)
      setData(saved)
      toast.ok('Store settings saved')
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(e)
    } finally { setBusy(false) }
  }
  const dis = !isOwner

  return (
    <div className="space-y-5 pb-20">
      {!isOwner && <p className="rounded-xl bg-info-soft px-4 py-3 text-sm text-info">Only the store owner can change these. You can see them for reference.</p>}
      <Panel title="Store details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Store name" error={errors.store_name}><Input disabled={dis} value={form.store_name} onChange={set('store_name')} /></Field>
          <Field label="Support email" hint="Customers reply here." error={errors.support_email}><Input disabled={dis} type="email" value={form.support_email} onChange={set('support_email')} /></Field>
          <Field label="Support phone" error={errors.support_phone}><Input disabled={dis} value={form.support_phone} onChange={set('support_phone')} placeholder="+91 98xxxxxxx" /></Field>
        </div>
      </Panel>

      <Panel title="Shipping">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Free shipping on orders above" error={errors.free_shipping_above}><Input disabled={dis} type="number" min="0" prefix="₹" value={form.free_shipping_above} onChange={set('free_shipping_above')} /></Field>
          <Field label="Shipping fee below that" error={errors.shipping_fee}><Input disabled={dis} type="number" min="0" prefix="₹" value={form.shipping_fee} onChange={set('shipping_fee')} /></Field>
          <Field label="Metro delivery time" hint="Days, e.g. 2-3" error={errors.metro_days}><Input disabled={dis} value={form.metro_days} onChange={set('metro_days')} /></Field>
          <Field label="Everywhere else" hint="Days, e.g. 4-6" error={errors.standard_days}><Input disabled={dis} value={form.standard_days} onChange={set('standard_days')} /></Field>
          <Field label="Metro pincode starts" hint="First two digits, comma separated (11 = Delhi, 40 = Mumbai…)" error={errors.metro_prefixes} className="sm:col-span-2">
            <Input disabled={dis} value={form.metro_prefixes} onChange={set('metro_prefixes')} />
          </Field>
          <Field label="Pincodes you can't ship to" hint="Full pincodes or starting digits, comma separated" error={errors.blocked_pincodes} className="sm:col-span-2">
            <Textarea disabled={dis} rows={2} value={form.blocked_pincodes} onChange={set('blocked_pincodes')} placeholder="e.g. 744, 194101" />
          </Field>
        </div>
        <p className="mt-4 text-sm text-adm-muted">
          Right now: orders under {inr(form.free_shipping_above)} pay {inr(form.shipping_fee)} shipping.
        </p>
      </Panel>

      <Panel title="Payments">
        <div className="space-y-4">
          <Toggle disabled={dis} checked={form.cod_enabled} onChange={set('cod_enabled')} label="Cash on delivery" description="Let customers pay the courier when the parcel arrives." />
          {form.cod_enabled && (
            <Field label="Hide cash on delivery above" hint="Big COD orders are the ones most often refused at the door." error={errors.cod_max_order} className="max-w-xs">
              <Input disabled={dis} type="number" min="0" prefix="₹" value={form.cod_max_order} onChange={set('cod_max_order')} />
            </Field>
          )}
          <Field label="Cancel unpaid online orders after" hint="Minutes. Stock goes back on the shelf when an online payment is never finished." error={errors.unpaid_order_timeout_minutes} className="max-w-xs">
            <Input disabled={dis} type="number" min="10" value={form.unpaid_order_timeout_minutes} onChange={set('unpaid_order_timeout_minutes')} />
          </Field>
        </div>
      </Panel>

      <Panel title="Stock alerts">
        <Field label="Warn me when stock drops to" hint="Shows on the dashboard and the Products page." error={errors.low_stock_threshold} className="max-w-xs">
          <Input disabled={dis} type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
        </Field>
      </Panel>

      {isOwner && dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-adm-line bg-white/95 backdrop-blur lg:left-[248px]">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <span className="text-sm text-adm-muted">Unsaved changes</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setForm(data)}>Discard</Button>
              <Button variant="accent" loading={busy} onClick={save}>Save settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── My profile ─────────────────────────────────────────────────────
function ProfileTab() {
  const { user, setUser } = useAdminAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null)

  const saveProfile = async () => {
    setBusy('profile')
    setErrors({})
    try {
      setUser(await admin.auth.updateMe(form))
      toast.ok('Profile saved')
    } catch (e) { setErrors(e.fields || {}); toast.bad(e) }
    setBusy(null)
  }
  const savePassword = async () => {
    setErrors({})
    if (pw.new_password !== pw.confirm) return setErrors({ confirm: "The two new passwords don't match." })
    setBusy('pw')
    try {
      await admin.auth.changePassword({ current_password: pw.current_password, new_password: pw.new_password })
      setPw({ current_password: '', new_password: '', confirm: '' })
      toast.ok('Password changed')
    } catch (e) { setErrors(e.fields || {}); toast.bad(e) }
    setBusy(null)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Your profile">
        <div className="mb-5 flex items-center gap-4">
          <Avatar name={user?.name || user?.email} size={52} />
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-adm-muted">{user?.email}</p>
            <Badge tone={user?.is_superuser ? 'ember' : 'info'} className="mt-1">{user?.is_superuser ? 'Owner' : 'Staff'}</Badge>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone" error={errors.phone}><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <div className="flex justify-end"><Button variant="primary" loading={busy === 'profile'} onClick={saveProfile}>Save profile</Button></div>
        </div>
      </Panel>

      <Panel title="Change password">
        <div className="space-y-4">
          <Field label="Current password" error={errors.current_password}>
            <Input type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
          </Field>
          <Field label="New password" hint="At least 8 characters." error={errors.new_password}>
            <Input type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
          </Field>
          <Field label="New password, again" error={errors.confirm}>
            <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <Button variant="primary" icon={KeyIcon} loading={busy === 'pw'} disabled={!pw.current_password || !pw.new_password} onClick={savePassword}>Change password</Button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

// ─── Team ───────────────────────────────────────────────────────────
function MemberModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState(member ? { ...member, password: '' } : { name: '', email: '', phone: '', password: '', is_superuser: false, is_active: true })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const save = async () => {
    setBusy(true)
    setErrors({})
    const body = { name: form.name, email: form.email, phone: form.phone, is_superuser: form.is_superuser, is_active: form.is_active }
    if (form.password) body.password = form.password
    try {
      member ? await admin.staff.update(member.id, body) : await admin.staff.create(body)
      toast.ok(member ? 'Access updated' : `${form.name} can now sign in to the admin`)
      onSaved()
    } catch (e) { setErrors(e.fields || {}); toast.bad(e) }
    setBusy(false)
  }
  return (
    <Modal open onClose={onClose} title={member ? `Edit ${member.name}` : 'Add a team member'}
      subtitle={member ? null : 'Share the email and password with them yourself. They can change the password after signing in.'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={save}>{member ? 'Save' : 'Add member'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}><Input autoFocus value={form.name} onChange={set('name')} /></Field>
        <Field label="Phone" error={errors.phone}><Input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Email" required error={errors.email} className="sm:col-span-2"><Input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label={member ? 'New password' : 'Password'} required={!member} hint={member ? 'Leave empty to keep their current password.' : 'At least 8 characters.'} error={errors.password} className="sm:col-span-2">
          <Input type="text" autoComplete="off" value={form.password} onChange={set('password')} />
        </Field>
        <div className="space-y-4 sm:col-span-2">
          <Toggle checked={form.is_superuser} onChange={set('is_superuser')} label="Owner access" description="Owners can change store settings and manage the team. Staff handle orders, products and customers." />
          {member && <Toggle checked={form.is_active} onChange={set('is_active')} label="Can sign in" description="Turn off to lock them out without deleting anything." />}
        </div>
      </div>
    </Modal>
  )
}

function TeamTab() {
  const me = useAdminAuth((s) => s.user)
  const { data, loading, error, reload } = useQuery(() => admin.staff.list(), [])
  const [editing, setEditing] = useState(null)
  const remove = async (m) => {
    if (!(await confirmAction({ title: `Remove ${m.name}?`, text: 'They lose admin access straight away. Their past notes on orders stay.', confirmLabel: 'Remove access', danger: true }))) return
    try { await admin.staff.remove(m.id); toast.ok(`${m.name} removed`); reload() } catch (e) { toast.bad(e) }
  }
  return (
    <Panel title="People who can sign in here" bodyClass="p-0"
      action={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>Add member</Button>}>
      {error && <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>}
      {loading && !data ? <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : (
        <ul className="divide-y divide-adm-line">
          {(data || []).map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={m.name || m.email} size={38} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {m.name}{m.id === me?.id && <span className="text-xs text-adm-muted">(you)</span>}
                  <Badge tone={m.is_superuser ? 'ember' : 'info'}>{m.is_superuser ? 'Owner' : 'Staff'}</Badge>
                  {!m.is_active && <Badge tone="bad">Locked out</Badge>}
                </p>
                <p className="truncate text-xs text-adm-muted">{m.email}</p>
              </div>
              <p className="hidden text-right text-xs text-adm-muted sm:block">
                {m.last_login ? `Last in ${timeAgo(m.last_login)}` : 'Never signed in'}<br />Added {fmtDate(m.date_joined)}
              </p>
              <Menu trigger={<IconButton icon={DotsIcon} label="More" />} items={[
                { label: 'Edit', onClick: () => setEditing(m) },
                m.id !== me?.id && { label: 'Remove access', danger: true, onClick: () => remove(m) },
              ]} />
            </li>
          ))}
        </ul>
      )}
      {editing && <MemberModal member={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </Panel>
  )
}

export default function Settings() {
  const user = useAdminAuth((s) => s.user)
  const isOwner = !!user?.is_superuser
  const [f, setF] = useFilters({ tab: 'store' })
  const tabs = [{ value: 'store', label: 'Store' }, { value: 'profile', label: 'My account' }, isOwner && { value: 'team', label: 'Team' }].filter(Boolean)
  const tab = tabs.some((t) => t.value === f.tab) ? f.tab : 'store'

  return (
    <>
      <PageHead title="Settings" subtitle="Shipping, payments and who can use this admin." />
      <div className="mb-5"><Segmented value={tab} onChange={(t) => setF({ tab: t })} options={tabs} /></div>
      {tab === 'store' && <StoreTab isOwner={isOwner} />}
      {tab === 'profile' && <ProfileTab />}
      {tab === 'team' && <TeamTab />}
    </>
  )
}
