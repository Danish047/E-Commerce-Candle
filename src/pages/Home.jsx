import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../utils/helpers'
import ProductCard from '../components/ProductCard'
import BannerSlider from '../components/BannerSlider'
import { ErrorBox, Spinner } from '../components/ui'
import { FlameIcon, GiftIcon, HandIcon, LeafIcon, TruckIcon } from '../components/Icons'

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

export default function Home() {
  const categories = useApi(() => api.catalog.categories(), [])
  const moods = useApi(() => api.catalog.moods(), [])

  return (
    <>
      <BannerSlider placement="home_hero" fallback={<DefaultHero />} />

      {/* Trust strip */}
      <section className="border-y border-sand bg-cream">
        <div className="container-x grid grid-cols-2 gap-6 py-6 text-sm lg:grid-cols-4">
          {[
            [LeafIcon, '100% natural soy wax'],
            [HandIcon, 'Hand-poured in small batches'],
            [FlameIcon, 'Clean burn, no soot'],
            [TruckIcon, 'Free shipping above ₹999'],
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-cocoa">
              <Icon className="h-6 w-6 shrink-0 text-ember" /> {text}
            </div>
          ))}
        </div>
      </section>

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

      {/* Story */}
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
    </>
  )
}
