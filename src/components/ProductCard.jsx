import { Link } from 'react-router-dom'
import CandleImage from './CandleImage'
import { Badge, Stars } from './ui'
import { useCart } from '../store/cart'
import { discountPct, inr } from '../utils/helpers'

export default function ProductCard({ product }) {
  const add = useCart((s) => s.add)
  const off = discountPct(product.price, product.compare_price)
  const soldOut = product.stock <= 0

  return (
    <div className="group flex flex-col">
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl">
        <CandleImage product={product} className="transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.occasions?.includes('diwali') && (
            <span className="rounded-full bg-gradient-to-r from-[#7a1530] to-[#c2410c] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ffe3a3] shadow-sm">🪔 Diwali Special</span>
          )}
          {product.is_bestseller && <Badge tone="dark">Bestseller</Badge>}
          {product.is_new && <Badge tone="sage">New</Badge>}
          {off > 0 && <Badge>{off}% off</Badge>}
        </div>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/70 font-semibold text-cocoa">Sold out</div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-center gap-1.5 text-xs text-cocoa-soft">
          <Stars value={product.rating} size="text-xs" />
          <span>({product.reviews_count})</span>
        </div>
        <Link to={`/product/${product.slug}`} className="mt-1 font-serif text-xl font-semibold leading-tight text-cocoa hover:text-ember">
          {product.name}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-sm text-cocoa-soft">{product.notes.top.concat(product.notes.middle).slice(0, 3).join(' · ')}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-cocoa">{inr(product.price)}</span>
          {off > 0 && <span className="text-sm text-cocoa-soft line-through">{inr(product.compare_price)}</span>}
          <span className="ml-auto text-xs text-cocoa-soft">{product.size}</span>
        </div>
        <button
          onClick={() => add(product)}
          disabled={soldOut}
          className="mt-3 rounded-full border border-cocoa py-2 text-sm font-medium text-cocoa transition hover:bg-cocoa hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
