import { useEffect, useRef, useState } from 'react'
import { useStorefront } from '../store/storefront'
import SmartLink from './SmartLink'

function useCountdown(end) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!end) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [end])
  if (!end) return null
  const ms = Math.max(0, new Date(end) - now)
  const s = Math.floor(ms / 1000)
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]
}

function Countdown({ end, color }) {
  const parts = useCountdown(end)
  if (!parts) return null
  return (
    <div className="mt-6 flex gap-2" style={{ color }} aria-label="Offer ends in">
      {parts.map((v, i) => (
        <div key={i} className="min-w-[56px] rounded-xl bg-black/25 px-2 py-1.5 text-center backdrop-blur-sm">
          <div className="font-serif text-2xl font-semibold tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest opacity-80">{['days', 'hrs', 'min', 'sec'][i]}</div>
        </div>
      ))}
    </div>
  )
}

const ALIGN = { left: 'items-start text-left', center: 'items-center text-center mx-auto', right: 'items-end text-right ml-auto' }

function Slide({ b, active, tall, eager }) {
  return (
    <div className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!active}>
      <picture className="absolute inset-0">
        {b.image_mobile && <source media="(max-width: 640px)" srcSet={b.image_mobile} />}
        <img src={b.image_desktop} alt={b.alt_text || b.title} loading={eager ? 'eager' : 'lazy'}
          className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${active ? 'scale-105' : 'scale-100'}`} />
      </picture>
      <div className="absolute inset-0 bg-black" style={{ opacity: (b.overlay_opacity ?? 35) / 100 }} />
      <div className={`relative flex h-full items-center ${tall ? 'container-x' : 'px-6 sm:px-10'}`}>
        <div key={active ? 'on' : 'off'} className={`flex max-w-xl flex-col ${ALIGN[b.text_align] || ALIGN.left} ${active ? 'animate-reveal' : ''}`} style={{ color: b.text_color }}>
          {b.badge_text && (
            <span className="mb-4 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-sm">{b.badge_text}</span>
          )}
          <h2 className={`font-serif font-semibold leading-[1.05] ${tall ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`}>{b.title}</h2>
          {b.subtitle && <p className="mt-4 max-w-md text-base opacity-90 sm:text-lg">{b.subtitle}</p>}
          {b.show_countdown && <Countdown end={b.end_at} color={b.text_color} />}
          {(b.primary_btn_text || b.secondary_btn_text) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {b.primary_btn_text && (
                <SmartLink to={b.primary_btn_link} className="rounded-full bg-cream px-7 py-3 text-sm font-semibold text-cocoa transition hover:-translate-y-0.5 hover:shadow-lg">{b.primary_btn_text}</SmartLink>
              )}
              {b.secondary_btn_text && (
                <SmartLink to={b.secondary_btn_link} className="rounded-full border border-current px-7 py-3 text-sm font-semibold transition hover:bg-white/15">{b.secondary_btn_text}</SmartLink>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Renders the live banners for a placement; shows `fallback` when there are none. */
export default function BannerSlider({ placement, fallback = null, tall = true, interval = 6000, className = 'mt-16' }) {
  const { banners, loaded, load } = useStorefront()
  const list = banners[placement] || []
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const touch = useRef(null)
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (list.length < 2 || paused) return
    const t = setTimeout(() => setI((n) => (n + 1) % list.length), interval)
    return () => clearTimeout(t)
  }, [i, list.length, paused, interval])

  if (!loaded) return tall ? <div className="h-[460px] animate-pulse bg-wax sm:h-[560px]" /> : null
  if (!list.length) return fallback
  const go = (d) => setI((n) => (n + d + list.length) % list.length)
  const cur = i % list.length

  const slider = (
    <section className={`relative overflow-hidden bg-cocoa ${tall ? 'h-[460px] sm:h-[560px]' : 'h-[260px] rounded-3xl sm:h-[300px]'}`}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0)
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
      aria-roledescription="carousel">
      {list.map((b, k) => <Slide key={b.id} b={b} active={k === cur} tall={tall} eager={k === 0} />)}
      {list.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous banner" className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40 sm:block">‹</button>
          <button onClick={() => go(1)} aria-label="Next banner" className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40 sm:block">›</button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {list.map((b, k) => (
              <button key={b.id} onClick={() => setI(k)} aria-label={`Banner ${k + 1}`}
                className={`h-2 rounded-full bg-white transition-all ${k === cur ? 'w-7' : 'w-2 opacity-50 hover:opacity-80'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  )
  return tall ? slider : <div className={`container-x ${className}`}>{slider}</div>
}
