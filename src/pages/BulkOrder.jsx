import { useState } from 'react'
import { api } from '../api'
import { WHATSAPP_NUMBER } from '../api/config'

const OCCASIONS = ['Wedding / Shaadi favours', 'Corporate gifting', 'Return gifts', 'Festive (Diwali etc.)', 'Event / Party', 'Other']
const empty = { name: '', email: '', phone: '', company: '', quantity: '', occasion: OCCASIONS[0], date: '', message: '' }

// Defined outside the page so inputs keep focus while typing
function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  )
}

export default function BulkOrder() {
  const [f, setF] = useState(empty)
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ busy: false, done: '', error: '' })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const summary = () =>
    [`Bulk order enquiry`, `Occasion: ${f.occasion}`, `Quantity: ${f.quantity}`, f.date && `Needed by: ${f.date}`,
      f.company && `Company: ${f.company}`, f.message && `Details: ${f.message}`].filter(Boolean).join('\n')

  const submit = async (e) => {
    e.preventDefault()
    const err = {}
    if (!f.name.trim()) err.name = 'Required'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = 'Enter a valid email'
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, '').slice(-10))) err.phone = 'Enter a valid 10-digit mobile'
    if (!(Number(f.quantity) >= 20)) err.quantity = 'Bulk orders start at 20 pieces'
    setErrors(err)
    if (Object.keys(err).length) return
    setState({ busy: true, done: '', error: '' })
    try {
      const r = await api.misc.contact({ name: f.name, email: f.email, phone: f.phone, topic: 'bulk', message: summary() })
      setState({ busy: false, done: r?.detail || 'Thanks! We will send your quote within 24 hours.', error: '' })
      setF(empty)
    } catch (ex) {
      setState({ busy: false, done: '', error: ex.message })
    }
  }

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary())}`
  return (
    <div className="container-x grid gap-12 py-14 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Bulk & corporate</p>
        <h1 className="section-title mt-2">Candles for your big day, team or event.</h1>
        <p className="mt-4 text-cocoa-soft">Custom labels, your logo, gift boxes and special pricing from 20 pieces. Tell us what you need and we'll send a quote within 24 hours.</p>
        <ul className="mt-8 space-y-3 text-sm">
          {['Minimum 20 pieces', 'Custom scent, colour & label', 'Gift wrapping & personal notes', 'Pan-India shipping'].map((t) => (
            <li key={t} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-ember-light text-ember-dark">✓</span>{t}</li>
          ))}
        </ul>
        <a href={wa} target="_blank" rel="noreferrer" className="btn-outline mt-8">Chat on WhatsApp instead</a>
      </div>

      <form onSubmit={submit} noValidate className="grid gap-4 rounded-3xl bg-wax p-6 sm:grid-cols-2 sm:p-8">
        <FormField error={errors.name} label="Your name *"><input className="input" value={f.name} onChange={set('name')} /></FormField>
        <FormField error={errors.company} label="Company (optional)"><input className="input" value={f.company} onChange={set('company')} /></FormField>
        <FormField error={errors.email} label="Email *"><input type="email" className="input" value={f.email} onChange={set('email')} /></FormField>
        <FormField error={errors.phone} label="Mobile *"><input type="tel" className="input" value={f.phone} onChange={set('phone')} /></FormField>
        <FormField error={errors.quantity} label="Quantity *"><input type="number" min="20" className="input" value={f.quantity} onChange={set('quantity')} /></FormField>
        <FormField error={errors.date} label="Needed by"><input type="date" className="input" value={f.date} onChange={set('date')} /></FormField>
        <div className="sm:col-span-2">
          <FormField error={errors.occasion} label="Occasion">
            <select className="input" value={f.occasion} onChange={set('occasion')}>{OCCASIONS.map((o) => <option key={o}>{o}</option>)}</select>
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField error={errors.message} label="Anything else? (scent, budget, logo…)"><textarea rows={4} className="input" value={f.message} onChange={set('message')} /></FormField>
        </div>
        {state.error && <p className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}
        {state.done && <p className="rounded-xl bg-ok-soft p-3 text-sm text-ok sm:col-span-2">{state.done}</p>}
        <button disabled={state.busy} className="btn-primary sm:col-span-2 disabled:opacity-60">{state.busy ? 'Sending…' : 'Get my quote'}</button>
      </form>
    </div>
  )
}
