import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { BRAND, WHATSAPP_NUMBER } from '../api/config'
import { Field, PageHeader } from '../components/ui'

export default function Contact() {
  const [params] = useSearchParams()
  const corporate = params.get('topic') === 'corporate'
  const [form, setForm] = useState({
    name: '', email: '', phone: '', topic: corporate ? 'Corporate gifting' : 'General',
    message: corporate ? 'Hi! I would like a quote for ___ gift boxes for my team.' : '',
  })
  const [status, setStatus] = useState({ type: '', msg: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.misc.contact(form)
      setStatus({ type: 'ok', msg: res.detail })
      setForm({ ...form, message: '' })
    } catch (err) {
      setStatus({ type: 'err', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Contact" title="We'd love to hear from you" subtitle="Questions, bulk orders or just want to say hi? We usually reply within a day." />
      <div className="container-x mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input required className="input" value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><input type="email" required className="input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone (optional)"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Topic">
            <select className="input" value={form.topic} onChange={set('topic')}>
              {['General', 'Order help', 'Corporate gifting', 'Wholesale', 'Collaboration'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Message"><textarea required rows={6} className="input" value={form.message} onChange={set('message')} /></Field>
          </div>
          {status.msg && (
            <p className={`sm:col-span-2 text-sm ${status.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{status.msg}</p>
          )}
          <div className="sm:col-span-2"><button disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Send message'}</button></div>
        </form>

        <aside className="space-y-6 rounded-2xl bg-wax p-6 text-sm">
          <div><p className="font-semibold">WhatsApp</p><a className="text-cocoa-soft underline" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">Chat with us</a></div>
          <div><p className="font-semibold">Email</p><a className="text-cocoa-soft underline" href={`mailto:${BRAND.email}`}>{BRAND.email}</a></div>
          <div><p className="font-semibold">Hours</p><p className="text-cocoa-soft">Mon–Sat, 10am–7pm IST</p></div>
          <div><p className="font-semibold">Corporate gifting</p><p className="text-cocoa-soft">Custom labels with your logo and special pricing for 20+ boxes.</p></div>
        </aside>
      </div>
    </>
  )
}
