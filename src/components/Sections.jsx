import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { WHATSAPP_NUMBER } from '../api/config'
import { useApi } from '../utils/helpers'
import ProductCard from './ProductCard'
import { ErrorBox, Spinner } from './ui'

// Building blocks for the multi-section home page (Candles, 3D Printing, ...).
// Sections come from the backend, so a new one added in Admin → Sections shows up here on its own.

export const whatsappLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

export function ComingSoonBadge({ className = '' }) {
  return (
    <span className={`rounded-full bg-cocoa px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cream ${className}`}>
      Coming soon
    </span>
  )
}

/** "What we do" — one card per line of work. */
export function WhatWeDo({ sections, onPick }) {
  if (!sections.length) return null
  return (
    <section className="container-x mt-14 sm:mt-20">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">What we do</p>
        <h2 className="section-title mt-2">Handmade by us, for you</h2>
      </div>
      <div className={`grid gap-4 sm:grid-cols-2 ${sections.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
        {sections.map((s) => (
          <button
            key={s.slug}
            onClick={() => onPick(s.slug)}
            className="group flex overflow-hidden rounded-3xl text-left transition hover:-translate-y-1 hover:shadow-lg"
            style={{ background: s.accent_color || '#F3E9DC' }}
          >
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none" aria-hidden>{s.icon}</span>
                {s.status === 'coming_soon' && <ComingSoonBadge />}
              </div>
              <p className="mt-4 font-serif text-3xl font-semibold text-cocoa">{s.name}</p>
              {s.tagline && <p className="mt-1 text-sm font-medium text-cocoa">{s.tagline}</p>}
              {s.description && <p className="mt-2 line-clamp-3 text-sm text-cocoa-soft">{s.description}</p>}
              <span className="mt-auto pt-5 text-sm font-semibold text-cocoa underline-offset-4 group-hover:underline">
                {s.status === 'coming_soon' ? 'Know more →' : 'Explore →'}
              </span>
            </div>
            {s.image && (
              <img src={s.image} alt="" loading="lazy" className="hidden w-2/5 object-cover sm:block" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

/** Tabs: All | Candles | 3D Printing | ... — sticky under the navbar, swipeable on mobile. */
export function SectionTabs({ sections, active, onPick }) {
  const tabs = [{ slug: '', name: 'All', icon: '✨' }, ...sections]
  return (
    <div className="sticky top-[6.25rem] z-30 border-b border-sand/70 bg-cream/95 backdrop-blur">
      <div className="container-x flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {tabs.map((t) => {
          const on = active === t.slug
          return (
            <button
              key={t.slug || 'all'}
              role="tab"
              aria-selected={on}
              onClick={() => onPick(t.slug)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                on ? 'border-cocoa bg-cocoa text-cream' : 'border-sand bg-white text-cocoa hover:border-cocoa'
              }`}
            >
              <span aria-hidden>{t.icon}</span> {t.name}
              {t.status === 'coming_soon' && <span className={`text-[10px] uppercase ${on ? 'text-sand' : 'text-ember'}`}>Soon</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A side-scrolling row of products (used on the "All" tab, one row per section). */
export function ProductRail({ params }) {
  const { data, loading, error, reload } = useApi(() => api.catalog.products({ page_size: 8, ...params }), [JSON.stringify(params)])
  if (loading) return <Spinner />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data.results.length) return <p className="text-sm text-cocoa-soft">New products coming soon.</p>
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
      {data.results.map((p) => (
        <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  )
}

/** Product grid for one section, with a link to the full list in the shop. */
export function SectionGrid({ section, pageSize = 8 }) {
  const { data, loading, error, reload } = useApi(
    () => api.catalog.products({ section: section.slug, page_size: pageSize }), [section.slug],
  )
  if (loading) return <Spinner />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data.results.length) return null
  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {data.results.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {data.count > pageSize && (
        <div className="mt-10 text-center">
          <Link to={`/shop?section=${section.slug}`} className="btn-outline">See all {data.count} in {section.name}</Link>
        </div>
      )}
    </>
  )
}

/** "Get a quote" form + WhatsApp button for made-to-order work (e.g. 3D printing). */
export function CustomOrderCTA({ section }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [state, setState] = useState({ sending: false, done: '', error: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setState({ sending: true, done: '', error: '' })
    try {
      const r = await api.misc.contact({ ...form, topic: `Custom order: ${section.name}`.slice(0, 60) })
      setState({ sending: false, done: r?.detail || 'Thanks! We will get back to you soon.', error: '' })
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setState({ sending: false, done: '', error: err?.message || 'Could not send. Please try WhatsApp.' })
    }
  }

  const wa = whatsappLink(`Hi GenzinIT! I want a custom ${section.name} order. My idea: `)

  return (
    <div className="grid gap-8 overflow-hidden rounded-3xl bg-cocoa p-6 text-cream sm:p-10 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ember-light">Made to order</p>
        <h3 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Have an idea? Get a quote.</h3>
        <ol className="mt-5 space-y-2 text-sm text-sand">
          <li><b className="text-cream">1.</b> Tell us what you need: a photo, a sketch, a file link or just an idea.</li>
          <li><b className="text-cream">2.</b> We reply with price and delivery time, usually within 24 hours.</li>
          <li><b className="text-cream">3.</b> Pay online and we make it for you.</li>
        </ol>
        <a href={wa} target="_blank" rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:brightness-95">
          Chat on WhatsApp
        </a>
        <p className="mt-2 text-xs text-sand">Photos and files are easiest to share on WhatsApp.</p>
      </div>

      {state.done ? (
        <div className="flex items-center justify-center rounded-2xl bg-cream/10 p-8 text-center text-lg">{state.done}</div>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-cream p-5 text-cocoa">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required className="input" placeholder="Your name" value={form.name} onChange={set('name')} />
            <input className="input" placeholder="Phone / WhatsApp" value={form.phone} onChange={set('phone')} />
          </div>
          <input required type="email" className="input" placeholder="Email" value={form.email} onChange={set('email')} />
          <textarea required rows={4} className="input" value={form.message} onChange={set('message')}
            placeholder="What would you like made? Size, colour, quantity, and a link to your file or photo if you have one." />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button disabled={state.sending} className="btn-primary w-full">{state.sending ? 'Sending…' : 'Request a quote'}</button>
        </form>
      )}
    </div>
  )
}

/** Header shown at the top of a single section's tab. */
export function SectionIntro({ section }) {
  return (
    <div className="mb-10 flex flex-col gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-10" style={{ background: section.accent_color || '#F3E9DC' }}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none" aria-hidden>{section.icon}</span>
          {section.status === 'coming_soon' && <ComingSoonBadge />}
        </div>
        <h2 className="mt-4 font-serif text-4xl font-semibold text-cocoa">{section.name}</h2>
        {section.tagline && <p className="mt-1 font-medium text-cocoa">{section.tagline}</p>}
        {section.description && <p className="mt-3 max-w-2xl text-cocoa-soft">{section.description}</p>}
      </div>
      {section.image && <img src={section.image} alt="" className="h-48 w-full rounded-2xl object-cover sm:w-72" />}
    </div>
  )
}
