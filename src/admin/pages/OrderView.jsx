import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BRAND } from '../../api/config'
import { admin } from '../api'
import { CheckIcon, DotsIcon, LinkIcon, PhoneIcon, PrintIcon, TruckIcon } from '../components/Icons'
import {
  Avatar, Button, ErrorState, Field, IconButton, Input, Jar, Menu, Modal, PageHead, Panel, Skeleton, StatusBadge,
  Textarea, confirmAction, cx,
} from '../components/kit'
import { fmtDateTime, inr, timeAgo, useQuery } from '../hooks'
import { toast } from '../store'

const STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'processing', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]
const RANK = { pending: 0, processing: 1, shipped: 2, delivered: 3 }

function Progress({ o }) {
  if (o.status === 'cancelled') {
    return <div className="rounded-xl bg-adm-soft px-4 py-3 text-sm text-adm-muted">This order was cancelled. Its stock went back on the shelf.</div>
  }
  const at = RANK[o.status]
  return (
    <ol className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i <= at
        return (
          <li key={s.key} className={cx('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
            <span className="flex flex-col items-center gap-1.5">
              <span className={cx('grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ring-4 ring-white',
                done ? 'bg-ok text-white' : 'bg-adm-soft text-adm-muted')}>
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cx('text-xs', done ? 'font-medium text-adm-ink' : 'text-adm-muted')}>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span className={cx('mx-2 mb-5 h-0.5 flex-1 rounded', i < at ? 'bg-ok' : 'bg-adm-line')} />}
          </li>
        )
      })}
    </ol>
  )
}

function printSlip(o) {
  const a = o.shipping_address
  const rows = o.items.map((i) => `<tr><td>${i.name} <small>${i.size}</small></td><td>${i.quantity}</td><td>₹${i.price.toLocaleString('en-IN')}</td><td>₹${i.line_total.toLocaleString('en-IN')}</td></tr>`).join('')
  const w = window.open('', '_blank', 'width=720,height=900')
  w.document.write(`<!doctype html><html><head><title>${o.order_number}</title><style>
    body{font:14px/1.5 system-ui,sans-serif;color:#231B16;padding:40px;max-width:680px;margin:auto}
    h1{font:600 28px Georgia,serif;margin:0} .muted{color:#6F665E} table{width:100%;border-collapse:collapse;margin:24px 0}
    th,td{text-align:left;padding:8px 0;border-bottom:1px solid #E1E3DB} th:nth-child(n+2),td:nth-child(n+2){text-align:right}
    .grid{display:flex;justify-content:space-between;gap:24px;margin-top:24px} .tot td{border:0;padding:3px 0} .big td{font-weight:700;font-size:16px}
    .note{margin-top:24px;padding:14px;border:1px dashed #C8763B;border-radius:8px}
  </style></head><body>
    <h1>${BRAND.name}</h1><p class="muted">${BRAND.email}</p>
    <div class="grid"><div><b>Ship to</b><br>${a.name}<br>${a.line1}${a.line2 ? '<br>' + a.line2 : ''}<br>${a.city}, ${a.state} ${a.pincode}<br>${a.phone}</div>
    <div style="text-align:right"><b>Order ${o.order_number}</b><br>${new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
    ${o.payment_method === 'cod' ? `<b>Collect ₹${o.total.toLocaleString('en-IN')} on delivery</b>` : 'Paid online'}</div></div>
    <table><thead><tr><th>Candle</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    <table class="tot"><tr><td>Subtotal</td><td>₹${o.subtotal.toLocaleString('en-IN')}</td></tr>
    ${o.discount ? `<tr><td>Discount ${o.coupon_code || ''}</td><td>−₹${o.discount.toLocaleString('en-IN')}</td></tr>` : ''}
    <tr><td>Shipping</td><td>${o.shipping ? '₹' + o.shipping : 'Free'}</td></tr><tr class="big"><td>Total</td><td>₹${o.total.toLocaleString('en-IN')}</td></tr></table>
    ${o.gift_note ? `<div class="note"><b>Gift note</b><br>${o.gift_note.replace(/</g, '&lt;')}</div>` : ''}
    <p class="muted" style="margin-top:40px">Thank you for choosing hand-poured. Trim the wick to 5 mm before every burn.</p>
    <script>window.onload=()=>window.print()</script></body></html>`)
  w.document.close()
}

export default function OrderView() {
  const { orderNumber } = useParams()
  const { data: o, error, reload, setData } = useQuery(() => admin.orders.get(orderNumber), [orderNumber])
  const [busy, setBusy] = useState(null)
  const [shipOpen, setShipOpen] = useState(false)
  const [ship, setShip] = useState({ courier: '', tracking_url: '' })
  const [note, setNote] = useState('')
  const [adminNote, setAdminNote] = useState(null)

  const update = async (patch, doneMsg, key = 'update') => {
    setBusy(key)
    try {
      const next = await admin.orders.update(orderNumber, patch)
      setData(next)
      toast.ok(doneMsg)
      return true
    } catch (e) {
      toast.bad(e)
      return false
    } finally {
      setBusy(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!o) return <div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-96 rounded-2xl" /></div>

  const a = o.shipping_address || {}
  const openShip = () => {
    setShip({ courier: o.courier || '', tracking_url: o.tracking_url || '' })
    setShipOpen(true)
  }
  const cancel = async () => {
    const ok = await confirmAction({
      title: `Cancel ${o.order_number}?`, danger: true, confirmLabel: 'Cancel order', cancelLabel: 'Keep order',
      text: `The customer gets an email, and ${o.items.reduce((n, i) => n + i.quantity, 0)} candle(s) go back into stock.${o.payment_status === 'paid' && o.payment_method === 'razorpay' ? ' Refund the payment from your Razorpay dashboard, then mark it refunded here.' : ''}`,
    })
    if (ok) update({ status: 'cancelled' }, 'Order cancelled', 'cancel')
  }
  const deliver = () => {
    const patch = { status: 'delivered' }
    if (o.payment_method === 'cod' && o.payment_status !== 'paid') patch.payment_status = 'paid'
    update(patch, o.payment_method === 'cod' ? 'Marked delivered and cash collected' : 'Marked delivered', 'deliver')
  }

  const primary = {
    pending: <Button variant="accent" icon={CheckIcon} loading={busy === 'paid'} onClick={() => update({ payment_status: 'paid', status: 'processing' }, 'Payment recorded', 'paid')}>Mark as paid</Button>,
    processing: <Button variant="accent" icon={TruckIcon} onClick={openShip}>Mark as shipped</Button>,
    shipped: <Button variant="accent" icon={CheckIcon} loading={busy === 'deliver'} onClick={deliver}>Mark as delivered</Button>,
  }[o.status]

  const menu = [
    o.status !== 'cancelled' && o.status !== 'delivered' && { label: 'Cancel order', danger: true, onClick: cancel },
    o.status === 'shipped' && { label: 'Edit tracking', icon: LinkIcon, onClick: openShip },
    o.payment_status === 'paid' && o.status === 'cancelled' && { label: 'Mark as refunded', onClick: () => update({ payment_status: 'refunded' }, 'Marked refunded') },
    { label: 'Print packing slip', icon: PrintIcon, onClick: () => printSlip(o) },
  ].filter(Boolean)

  return (
    <>
      <PageHead
        back={{ to: '/admin/orders', label: 'Orders' }}
        title={<span className="flex flex-wrap items-center gap-3">{o.order_number} <StatusBadge status={o.status} /></span>}
        subtitle={`Placed ${fmtDateTime(o.created_at)} · ${o.payment_method === 'cod' ? 'Cash on delivery' : 'Paid online'}`}
        actions={<>
          <Button variant="ghost" icon={PrintIcon} onClick={() => printSlip(o)} className="hidden sm:inline-flex">Packing slip</Button>
          {primary}
          {menu.length > 0 && <Menu trigger={<IconButton icon={DotsIcon} label="More actions" className="border border-adm-line bg-white" />} items={menu} />}
        </>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="a-panel p-5"><Progress o={o} /></section>

          <Panel title={`${o.items.reduce((n, i) => n + i.quantity, 0)} items`} bodyClass="">
            <ul className="divide-y divide-adm-line/70">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3.5">
                  <Jar color={i.color} size={44} />
                  <div className="min-w-0 flex-1">
                    {i.product_id ? <Link to={`/admin/products/${i.product_id}`} className="font-medium hover:text-ember-dark">{i.name}</Link> : <span className="font-medium">{i.name}</span>}
                    <p className="text-xs text-adm-muted">{i.size} · {inr(i.price)} each</p>
                  </div>
                  <span className="tabular text-sm text-adm-muted">× {i.quantity}</span>
                  <span className="tabular w-24 text-right font-semibold">{inr(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-adm-line bg-adm-soft/50 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-adm-muted">Subtotal</dt><dd className="tabular">{inr(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt className="text-adm-muted">Coupon {o.coupon_code}</dt><dd className="tabular text-ok">−{inr(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-adm-muted">Shipping</dt><dd className="tabular">{o.shipping ? inr(o.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-adm-line pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular">{inr(o.total)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Activity">
            <form className="mb-5 flex gap-2" onSubmit={async (e) => {
              e.preventDefault()
              if (!note.trim()) return
              try {
                const events = await admin.orders.note(orderNumber, note)
                setData({ ...o, events })
                setNote('')
              } catch (err) { toast.bad(err) }
            }}>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team, e.g. called customer about address" />
              <Button type="submit" variant="ghost" disabled={!note.trim()}>Add note</Button>
            </form>
            <ol className="relative space-y-4 border-l border-adm-line pl-5">
              {o.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-adm-muted ring-4 ring-white" />
                  <p className="text-sm">{e.message}</p>
                  <p className="text-xs text-adm-muted">{e.actor} · {timeAgo(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Customer">
            <div className="flex items-center gap-3">
              <Avatar name={a.name} size={40} />
              <div className="min-w-0">
                <p className="font-medium">{a.name}</p>
                <a href={`mailto:${o.email}`} className="block truncate text-sm text-adm-muted hover:text-ember-dark">{o.email}</a>
              </div>
            </div>
            {o.customer ? (
              <Link to={`/admin/customers?open=${o.customer.id}`} className="mt-3 block text-sm font-medium text-ember-dark hover:underline">
                {o.customer.orders_count} {o.customer.orders_count === 1 ? 'order' : 'orders'} from this customer
              </Link>
            ) : <p className="mt-3 text-sm text-adm-muted">Guest checkout</p>}
            <div className="mt-4 flex gap-2">
              <a href={`tel:${a.phone}`} className="a-btn-ghost flex-1"><PhoneIcon className="h-4 w-4" />Call</a>
              <a href={`https://wa.me/91${String(a.phone).slice(-10)}?text=${encodeURIComponent(`Hi ${a.name}, about your ${BRAND.name} order ${o.order_number}`)}`}
                target="_blank" rel="noreferrer" className="a-btn-ghost flex-1">WhatsApp</a>
            </div>
          </Panel>

          <Panel title="Ship to">
            <address className="text-sm not-italic leading-relaxed">
              {a.name}<br />{a.line1}{a.line2 && <><br />{a.line2}</>}<br />{a.city}, {a.state} {a.pincode}<br />
              <span className="text-adm-muted">{a.phone}</span>
            </address>
            {(o.tracking_url || o.courier) && (
              <div className="mt-4 rounded-xl bg-info-soft px-3.5 py-3 text-sm">
                <p className="font-medium text-info">{o.courier || 'Tracking'}</p>
                {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noreferrer" className="break-all text-xs text-info underline">{o.tracking_url}</a>}
              </div>
            )}
          </Panel>

          <Panel title="Payment">
            <div className="flex items-center justify-between">
              <span className="text-sm">{o.payment_method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</span>
              <StatusBadge kind="payment" status={o.payment_status} />
            </div>
            {o.razorpay_payment_id && <p className="tabular mt-2 break-all text-xs text-adm-muted">Payment ID {o.razorpay_payment_id}</p>}
          </Panel>

          {o.gift_note && (
            <section className="rounded-2xl border border-dashed border-ember/50 bg-ember-light/40 p-5">
              <p className="text-sm font-semibold text-ember-dark">Gift note to include</p>
              <p className="mt-1.5 whitespace-pre-line font-serif text-lg leading-snug">{o.gift_note}</p>
            </section>
          )}

          <Panel title="Private note">
            <Textarea rows={3} value={adminNote ?? o.admin_note} onChange={(e) => setAdminNote(e.target.value)} placeholder="Only staff can see this" />
            {adminNote !== null && adminNote !== o.admin_note && (
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="quiet" onClick={() => setAdminNote(null)}>Discard</Button>
                <Button loading={busy === 'note'} onClick={async () => (await update({ admin_note: adminNote }, 'Note saved', 'note')) && setAdminNote(null)}>Save note</Button>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <Modal open={shipOpen} onClose={() => setShipOpen(false)} title={o.status === 'shipped' ? 'Edit tracking' : `Ship ${o.order_number}`}
        subtitle="The customer gets an email with the tracking link."
        footer={<>
          <Button variant="ghost" onClick={() => setShipOpen(false)}>Cancel</Button>
          <Button loading={busy === 'ship'} onClick={async () => {
            const ok = await update({ status: 'shipped', ...ship }, o.status === 'shipped' ? 'Tracking updated' : 'Marked shipped', 'ship')
            if (ok) setShipOpen(false)
          }}>{o.status === 'shipped' ? 'Save tracking' : 'Mark as shipped'}</Button>
        </>}>
        <div className="space-y-4">
          <Field label="Courier">
            <Input list="couriers" value={ship.courier} onChange={(e) => setShip({ ...ship, courier: e.target.value })} placeholder="Delhivery" />
            <datalist id="couriers">{['Delhivery', 'Blue Dart', 'DTDC', 'India Post', 'Xpressbees', 'Ekart', 'Shiprocket'].map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Tracking link" hint="Optional, but customers love it.">
            <Input type="url" value={ship.tracking_url} onChange={(e) => setShip({ ...ship, tracking_url: e.target.value })} placeholder="https://www.delhivery.com/track/package/…" />
          </Field>
        </div>
      </Modal>
    </>
  )
}
