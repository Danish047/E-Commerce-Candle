import { PageHeader } from '../components/ui'

const tips = [
  ['The first burn matters most', 'Let the wax melt all the way to the edges (usually 2–3 hours). This sets the "memory" of the candle and prevents tunnelling.'],
  ['Trim the wick', 'Trim cotton wicks to about 5 mm and wooden wicks to about 3 mm before every burn for a clean, steady flame with no soot.'],
  ['Don’t over-burn', 'Burn for a maximum of 4 hours at a time, then let it cool for at least 2 hours before relighting.'],
  ['Keep it safe', 'Place on a heat-safe surface away from curtains, fans, kids and pets. Never leave a burning candle unattended.'],
  ['Know when to stop', 'Stop burning when about 1 cm of wax is left at the bottom. Then clean the jar and reuse it — or return it for our refill discount!'],
  ['Store it well', 'Keep the lid on when not in use to protect the fragrance, and store away from direct sunlight.'],
]

export default function CandleCare() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Candle care guide" subtitle="A few simple habits for a longer, cleaner, better-smelling burn." />
      <div className="container-x mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
        {tips.map(([title, text], i) => (
          <div key={title} className="rounded-2xl border border-sand p-6">
            <span className="font-serif text-4xl text-ember">{String(i + 1).padStart(2, '0')}</span>
            <p className="mt-2 font-serif text-2xl font-semibold">{title}</p>
            <p className="mt-2 text-cocoa-soft">{text}</p>
          </div>
        ))}
      </div>
    </>
  )
}
