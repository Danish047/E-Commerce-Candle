import { Link } from 'react-router-dom'
import CandleImage from '../components/CandleImage'
import { PageHeader } from '../components/ui'
import { HandIcon, LeafIcon, FlameIcon } from '../components/Icons'

export default function About() {
  return (
    <>
      <PageHeader eyebrow="Our story" title="Candles that hold memories" subtitle="Started at a kitchen table with a pot of soy wax and a jar of chai masala." />
      <div className="container-x mt-16 grid items-center gap-12 lg:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl"><CandleImage product={{ name: 'Studio', color: '#C99A6B' }} flame /></div>
        <div className="space-y-4 text-lg leading-relaxed text-cocoa-soft">
          <p>
            We believe the right scent can take you back in an instant: to the first monsoon rain, to your nani's kitchen,
            to a sunset in Goa. So we set out to bottle those feelings into candles made the slow, honest way.
          </p>
          <p>
            Every candle is hand-poured in small batches using 100% natural soy wax, lead-free cotton or wooden wicks,
            and premium, phthalate-free fragrance oils. No paraffin. No shortcuts.
          </p>
          <p>We're a small team, and every order is packed by hand with care.</p>
        </div>
      </div>

      <div className="container-x mt-20 grid gap-6 md:grid-cols-3">
        {[
          [LeafIcon, 'Clean ingredients', 'Natural soy wax that burns cleaner, longer and without black soot.'],
          [HandIcon, 'Handmade in India', 'Poured, cured and packed by hand in small batches for consistent quality.'],
          [FlameIcon, 'Honest labels', 'Every candle lists its wax, wick, burn time and fragrance load. No mystery.'],
        ].map(([Icon, title, text]) => (
          <div key={title} className="rounded-2xl bg-wax p-6">
            <Icon className="h-7 w-7 text-ember" />
            <p className="mt-4 font-serif text-2xl font-semibold">{title}</p>
            <p className="mt-2 text-cocoa-soft">{text}</p>
          </div>
        ))}
      </div>

      <div className="container-x mt-16 text-center">
        <Link to="/shop" className="btn-primary">Explore our scents</Link>
      </div>
    </>
  )
}
