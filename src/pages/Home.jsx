import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../utils/helpers'
import ProductCard from '../components/ProductCard'
import BannerSlider from '../components/BannerSlider'
import { ErrorBox, Spinner } from '../components/ui'
import { CheckIcon, GiftIcon, HandIcon, TruckIcon, WhatsAppIcon } from '../components/Icons'
import {
  ComingSoonBadge, CustomOrderCTA, ProductRail, SectionGrid, SectionIntro, SectionTabs, WhatWeDo, whatsappLink,
} from '../components/Sections'
import { sectionBySlug, useStorefront } from '../store/storefront'

// Placeholder photos (Unsplash, free licence). Swap these for your own shoots.
const img = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`
const HERO_MAIN = img('1612293905607-b003de9e54fb', 1400)
const HERO_SIDE = img('1643122966676-29e8597257f7', 700)
const HERO_SMALL = img('1613068431228-8cb6a1e92573', 700)
const STORY_IMG = img('1643122941424-43e428ec899c', 1200)

const familyColors = {
  floral: '#E9C9CF', fresh: '#CFE0C3', spicy: '#E6B98F', sweet: '#F1E0C5', woody: '#B89A7E',
  'gift-sets': '#C98B72', trending: '#F4C9D6',
}

const vibes = [
  ['Main character energy', 'Light it, play your playlist, romanticise your Tuesday.'],
  ['Shelfie approved', 'Sculpted, pastel and pretty enough to never light.'],
  ['Desi at heart', 'Kesar kulfi, mogra, chai and sandalwood. Smells like ghar.'],
]

function ProductRow({ params }) {
  const { data, loading, error, reload } = useApi(() => api.catalog.products({ page_size: 4, ...params }), [])
  if (loading) return <Spinner />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
      {data.results.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

function SectionHead({ eyebrow, title, sub, link, linkText }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{eyebrow}</p>}
        <h2 className="section-title mt-2">{title}</h2>
        {sub && <p className="mt-1 text-cocoa-soft">{sub}</p>}
      </div>
      {link && <Link to={link} className="text-sm font-medium underline">{linkText}</Link>}
    </div>
  )
}


function DefaultHero() {
  return (
    <section className="relative overflow-hidden bg-wax">
      <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-ember-light px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cocoa">
            New drop · Trending on Insta
          </p>
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] text-cocoa sm:text-6xl lg:text-7xl">
            Light it up.<br />Make it <em className="text-ember">aesthetic.</em>
          </h1>
          <p className="mt-5 max-w-md text-lg text-cocoa-soft">
            Hand-poured soy candles for your room, your reels and your 2am overthinking. From kesar kulfi to bubble
            cubes, scents that feel like home, made for the GenZ way of living.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop?category=trending" className="btn-primary">Shop the viral drop</Link>
            <Link to="/quiz" className="btn-outline">Find my vibe</Link>
          </div>
          <p className="mt-8 text-sm text-cocoa-soft">100% soy · Small batches · Shipped across India</p>
        </div>
        <div className="grid h-[420px] grid-cols-5 grid-rows-6 gap-3 sm:h-[520px]">
          <div className="col-span-3 row-span-6 overflow-hidden rounded-3xl">
            <img src={HERO_MAIN} alt="Hand lighting a soy candle in an amber jar" className="h-full w-full object-cover" />
          </div>
          <div className="col-span-2 row-span-3 overflow-hidden rounded-3xl">
            <img src={HERO_SIDE} alt="Candles on a wooden table" className="h-full w-full object-cover" />
          </div>
          <div className="col-span-2 row-span-3 overflow-hidden rounded-3xl">
            <img src={HERO_SMALL} alt="Pillar candles with eucalyptus" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}

function BulkStrip() {
  return (
    <section className="container-x mt-16">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-ember-light p-8 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-serif text-3xl font-semibold">Corporate & bulk gifting</h3>
          <p className="mt-1 text-cocoa-soft">Custom labels with your logo and special pricing for 20+ boxes.</p>
        </div>
        <Link to="/bulk-order" className="btn-primary">Get a quote</Link>
      </div>
    </section>
  )
}

// Everything that is specific to the Candles tab (also the fallback when the backend has no sections yet).
function CandleHome() {
  const categories = useApi(() => api.catalog.categories({ section: 'candles' }), [])
  const moods = useApi(() => api.catalog.moods(), [])

  return (
    <>
      {/* Diwali specials — shown first */}
      <section className="mt-12 bg-gradient-to-b from-[#fbeee0] to-transparent py-10 sm:mt-16">
        <div className="container-x">
          <SectionHead
            eyebrow={<span className="inline-flex items-center gap-2"><GiftIcon className="h-4 w-4" /> 🪔 Diwali specials</span>}
            title="Diwali diyas & festive candles"
            sub="Hand-made diyas in sets of 4, new this season. Code DIWALI15 se 15% off."
            link="/shop?occasion=diwali"
            linkText="Shop all Diwali"
          />
          <ProductRow params={{ occasion: 'diwali', page_size: 8 }} />
        </div>
      </section>

      {/* Trending */}
      <section className="container-x mt-20">
        <SectionHead
          eyebrow="As seen on your feed"
          title="Trending on Insta"
          sub="Bubble cubes, iced-latte cups, peony bouquets. The candles everyone is posting."
          link="/shop?category=trending"
          linkText="See all trending"
        />
        <ProductRow params={{ category: 'trending', ordering: '-id' }} />
      </section>

      {/* Bestsellers */}
      <section className="container-x mt-24">
        <SectionHead eyebrow="Fan favourites" title="Bestsellers" link="/shop?ordering=-reviews_count" linkText="View all" />
        <ProductRow params={{ is_bestseller: 'true', ordering: '-reviews_count' }} />
      </section>

      {/* Shop by scent family */}
      <section className="container-x mt-24">
        <h2 className="section-title mb-8 text-center">Pick your scent family</h2>
        {categories.loading ? <Spinner /> : categories.error ? <ErrorBox error={categories.error} /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {categories.data.map((c) => (
              <Link
                key={c.slug}
                to={`/shop?category=${c.slug}`}
                className="group rounded-2xl p-5 text-center transition hover:-translate-y-1 hover:shadow-md"
                style={{ background: familyColors[c.slug] || '#F3E9DC' }}
              >
                <p className="font-serif text-2xl font-semibold text-cocoa">{c.name}</p>
                <p className="mt-1 text-xs text-cocoa-soft">{c.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Vibes */}
      <section className="container-x mt-24">
        <div className="grid gap-6 md:grid-cols-3">
          {vibes.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-sand bg-white/60 p-6">
              <p className="font-serif text-2xl font-semibold text-cocoa">{t}</p>
              <p className="mt-2 text-cocoa-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="container-x mt-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-cocoa p-8 text-cream sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ember-light">60-second vibe check</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Which candle are you?</h2>
            <p className="mt-3 max-w-md text-sand">Three quick questions and we'll match your mood to the perfect scent. No overthinking needed.</p>
            <Link to="/quiz" className="mt-6 inline-flex rounded-full bg-ember px-7 py-3 text-sm font-semibold text-white hover:bg-ember-dark">Take the quiz</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {moods.data?.map((m) => (
              <Link key={m.slug} to={`/shop?mood=${m.slug}`} className="rounded-full border border-sand/40 px-4 py-2 text-sm hover:bg-cream hover:text-cocoa">
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BannerSlider placement="home_middle" tall={false} fallback={<BulkStrip />} />

    </>
  )
}

const TRUST = [
  [HandIcon, 'Handmade in small batches'],
  [CheckIcon, 'Quality checked before dispatch'],
  [GiftIcon, 'Gift-ready packing'],
  [TruckIcon, 'Free shipping above ₹999'],
]

// "All" tab: one side-scrolling row per live section, then teasers for what's coming next.
function AllSections({ sections, onPick }) {
  const live = sections.filter((s) => s.status === 'live' && s.product_count > 0)
  const soon = sections.filter((s) => s.status === 'coming_soon')
  return (
    <div className="container-x space-y-16 pt-10">
      {live.map((s) => (
        <section key={s.slug}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title flex items-center gap-3"><span aria-hidden>{s.icon}</span> {s.name}</h2>
              {s.tagline && <p className="mt-1 text-cocoa-soft">{s.tagline}</p>}
            </div>
            <button onClick={() => onPick(s.slug)} className="shrink-0 text-sm font-medium underline">See all →</button>
          </div>
          <ProductRail params={{ section: s.slug }} />
        </section>
      ))}

      {soon.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {soon.map((s) => (
            <div key={s.slug} className="flex items-center gap-5 rounded-3xl border border-dashed border-cocoa/30 p-6" style={{ background: s.accent_color }}>
              <span className="text-5xl leading-none" aria-hidden>{s.icon}</span>
              <div className="flex-1">
                <ComingSoonBadge />
                <p className="mt-2 font-serif text-2xl font-semibold">{s.name}</p>
                {s.tagline && <p className="text-sm text-cocoa-soft">{s.tagline}</p>}
                <button onClick={() => onPick(s.slug)} className="mt-3 text-sm font-semibold underline">Know more →</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {!live.length && !soon.length && <p className="py-10 text-center text-cocoa-soft">New products coming soon.</p>}
    </div>
  )
}

// Tab for any non-candle section (3D Printing and whatever comes next).
function GeneralSection({ section }) {
  const soon = section.status === 'coming_soon'
  return (
    <div className="container-x pt-10">
      <SectionIntro section={section} />
      {soon ? (
        <div className="mb-12 rounded-3xl bg-wax p-8 text-center">
          <p className="font-serif text-2xl font-semibold">We are setting this up</p>
          <p className="mx-auto mt-2 max-w-lg text-cocoa-soft">
            Products will appear here soon.{section.allow_custom_orders ? ' You can already send us your idea for a custom order.' : ''}
          </p>
          <a href={whatsappLink(`Hi GenzinIT! Please tell me when ${section.name} is live.`)} target="_blank" rel="noreferrer"
            className="btn-outline mt-5 inline-flex items-center gap-2">
            <WhatsAppIcon className="h-4 w-4" /> Notify me on WhatsApp
          </a>
        </div>
      ) : (
        <div className="mb-16"><SectionGrid section={section} pageSize={12} /></div>
      )}
      {section.allow_custom_orders && <CustomOrderCTA section={section} />}
    </div>
  )
}

export default function Home() {
  const { sections, loaded, load } = useStorefront()
  const [params, setParams] = useSearchParams()
  useEffect(() => { load() }, [load])

  const slug = params.get('section') || ''
  const active = sectionBySlug(sections, slug)
  const activeSlug = active ? slug : ''

  // ?section=3d-printing keeps the tab in the URL, so a link can be shared on Instagram / WhatsApp.
  const pick = (next, scroll = true) => {
    setParams(next ? { section: next } : {}, { replace: true, preventScrollReset: true })
    if (scroll) document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Backend without sections (or still loading): keep the classic candle home page.
  const hasSections = sections.length > 0

  let content
  if (!loaded) content = <Spinner />
  else if (!hasSections || active?.product_type === 'candle') content = <CandleHome />
  else if (active) content = <GeneralSection section={active} />
  else content = <AllSections sections={sections} onPick={pick} />

  return (
    <>
      <BannerSlider placement="home_hero" fallback={<DefaultHero />} />

      {/* Trust strip */}
      <section className="border-y border-sand bg-cream">
        <div className="container-x grid grid-cols-2 gap-6 py-6 text-sm lg:grid-cols-4">
          {TRUST.map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-cocoa">
              <Icon className="h-6 w-6 shrink-0 text-ember" /> {text}
            </div>
          ))}
        </div>
      </section>

      {hasSections && <WhatWeDo sections={sections} onPick={pick} />}

      {hasSections && (
        <div id="explore" className="mt-16 scroll-mt-24">
          <div className="container-x mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Shop</p>
            <h2 className="section-title mt-2">Explore our products</h2>
          </div>
          <SectionTabs sections={sections} active={activeSlug} onPick={(s) => pick(s)} />
        </div>
      )}

      {content}

      {/* Story (candle brand story: not on other sections' tabs) */}
      {(!active || active.product_type === 'candle') && <>
      <section className="container-x mt-24 grid items-center gap-10 lg:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl">
          <img src={STORY_IMG} alt="Jar candles on a table" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Our story</p>
          <h2 className="section-title mt-2">Made slowly, by hand, for the GenZ home.</h2>
          <p className="mt-4 text-cocoa-soft">
            We pour every candle in small batches using natural soy wax, cotton or wooden wicks and premium fragrance
            oils. No paraffin, no shortcuts. Just clean-burning candles that turn study nights, self-care Sundays and
            festive evenings into little moments worth posting.
          </p>
          <Link to="/about" className="btn-outline mt-6">Read our story</Link>
        </div>
      </section>
      </>}
    </>
  )
}
