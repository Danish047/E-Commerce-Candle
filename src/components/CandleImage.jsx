// Shows the product photo, or a drawn candle jar in the product's colour
// when there is no photo yet (dummy data has none).
export default function CandleImage({ product, className = '', flame = false }) {
  const img = product?.images?.[0]
  if (img) return <img src={img} alt={product.name} loading="lazy" className={`h-full w-full object-cover ${className}`} />

  const color = product?.color || '#E6D5C0'
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-b from-wax to-sand/70 ${className}`}>
      <svg viewBox="0 0 120 150" className="h-3/4 w-3/4 drop-shadow-md" aria-label={product?.name}>
        {/* flame */}
        <g className={flame ? 'origin-[60px_40px] animate-flicker' : ''}>
          <path d="M60 14c7 10 10 16 10 22a10 10 0 0 1-20 0c0-6 3-12 10-22z" fill="#F4A340" />
          <path d="M60 26c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#FFE3A3" />
        </g>
        <line x1="60" y1="46" x2="60" y2="56" stroke="#3B2A20" strokeWidth="2" />
        {/* jar */}
        <rect x="22" y="54" width="76" height="86" rx="12" fill="#ffffff" opacity=".55" />
        <rect x="26" y="58" width="68" height="78" rx="9" fill={color} />
        <rect x="26" y="58" width="68" height="10" rx="5" fill="#fff" opacity=".35" />
        {/* label */}
        <rect x="36" y="88" width="48" height="26" rx="3" fill="#FBF7F1" />
        <rect x="44" y="96" width="32" height="3" rx="1.5" fill="#3B2A20" opacity=".7" />
        <rect x="49" y="103" width="22" height="2" rx="1" fill="#3B2A20" opacity=".35" />
        <rect x="30" y="62" width="6" height="66" rx="3" fill="#fff" opacity=".25" />
      </svg>
    </div>
  )
}
