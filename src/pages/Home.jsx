import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../utils/helpers'
import ProductCard from '../components/ProductCard'
import CandleImage from '../components/CandleImage'
import { ErrorBox, Spinner, Stars } from '../components/ui'
import { FlameIcon, GiftIcon, HandIcon, LeafIcon, TruckIcon } from '../components/Icons'

const familyColors = {
  floral: '#E9C9CF', fresh: '#CFE0C3', spicy: '#E6B98F', sweet: '#F1E0C5', woody: '#B89A7E', 'gift-sets': '#C98B72',
}

const testimonials = [
  { name: 'Priya S., Pune', text: 'Monsoon Chai smells exactly like the first rain with a cup of chai. I have reordered three times!' },
  { name: 'Neha G., Bengaluru', text: 'Ordered 15 gift trios for my team for Diwali. Beautiful packaging and everyone loved them.' },
  { name: 'Arjun T., Delhi', text: 'Clean burn, no soot, and the scent fills my whole living room. Worth every rupee.' },
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

export default function Home() {
  const categories = useApi(() => api.catalog.categories(), [])
  const moods = useApi(() => api.catalog.moods(), [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-wax">
        <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-ember">Hand-poured · 100% Soy · Made in India</p>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] text-cocoa sm:text-6xl lg:text-7xl">
              Scents that feel<br />like <em className="text-ember">home.</em>
            </h1>
            <p className="mt-5 max-w-md text-lg text-cocoa-soft">
              Monsoon chai, nani's kitchen, mogra nights. Candles inspired by the moments and memories you love most.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">Shop candles</Link>
              <Link to="/quiz" className="btn-outline">Find my scent</Link>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-cocoa-soft">
              <Stars value={5} /> <span><b className="text-cocoa">4.8/5</b> from 500+ happy homes</span>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-6 rounded-full bg-ember-light" />
            <div className="relative h-full w-full">
              <CandleImage product={{ name: 'Monsoon Chai', color: '#C99A6B' }} flame className="!bg-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-sand bg-cream">
        <div className="container-x grid grid-cols-2 gap-6 py-6 text-sm lg:grid-cols-4">
          {[
            [LeafIcon, '100% natural soy wax'],
            [HandIcon, 'Hand-poured in small batches'],
            [FlameIcon, 'Cotton & wooden wicks, no soot'],
            [TruckIcon, 'Free shipping above ₹999'],
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-cocoa">
              <Icon className="h-6 w-6 shrink-0 text-ember" /> {text}
            </div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="container-x mt-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="section-title">Bestsellers</h2>
          <Link to="/shop?ordering=-reviews_count" className="text-sm font-medium underline">View all</Link>
        </div>
        <ProductRow params={{ is_bestseller: 'true', ordering: '-reviews_count' }} />
      </section>

      {/* Shop by scent family */}
      <section className="container-x mt-24">
        <h2 className="section-title mb-8 text-center">Shop by scent family</h2>
        {categories.loading ? <Spinner /> : categories.error ? <ErrorBox error={categories.error} /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* Quiz CTA */}
      <section className="container-x mt-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-cocoa p-8 text-cream sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ember-light">60-second Scent Quiz</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Not sure which scent is you?</h2>
            <p className="mt-3 max-w-md text-sand">Answer three quick questions and we'll match you with your perfect candle.</p>
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

      {/* Diwali gifting */}
      <section className="container-x mt-24">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ember"><GiftIcon className="h-4 w-4" /> Festive edit</p>
            <h2 className="section-title mt-2">Diwali gifting</h2>
            <p className="mt-1 text-cocoa-soft">Gift boxes, festive scents and bulk orders for your team.</p>
          </div>
          <Link to="/shop?occasion=diwali" className="text-sm font-medium underline">Shop the Diwali edit</Link>
        </div>
        <ProductRow params={{ occasion: 'diwali', ordering: '-id' }} />
      </section>

      {/* Corporate banner */}
      <section className="container-x mt-16">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-ember-light p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-serif text-3xl font-semibold">Corporate & bulk gifting</h3>
            <p className="mt-1 text-cocoa-soft">Custom labels with your logo, special pricing for 20+ boxes.</p>
          </div>
          <Link to="/contact?topic=corporate" className="btn-primary">Get a quote</Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x mt-24">
        <h2 className="section-title mb-10 text-center">Loved in 500+ homes</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-sand bg-white/60 p-6">
              <Stars value={5} />
              <blockquote className="mt-3 font-serif text-xl leading-snug text-cocoa">"{t.text}"</blockquote>
              <figcaption className="mt-4 text-sm text-cocoa-soft">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="container-x mt-24 grid items-center gap-10 lg:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl">
          <CandleImage product={{ name: 'Our studio', color: '#D9B27C' }} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Our story</p>
          <h2 className="section-title mt-2">Made slowly, by hand, with love.</h2>
          <p className="mt-4 text-cocoa-soft">
            Every candle is poured in small batches using natural soy wax, cotton or wooden wicks and premium
            fragrance oils. No paraffin, no shortcuts. Just clean-burning candles that turn everyday moments into memories.
          </p>
          <Link to="/about" className="btn-outline mt-6">Read our story</Link>
        </div>
      </section>
    </>
  )
}
