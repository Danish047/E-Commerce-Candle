import { useEffect, useState } from 'react'
import { useStorefront } from '../store/storefront'
import SmartLink from './SmartLink'

const KEY = 'ann-closed'

export default function AnnouncementBar({ fallback = null }) {
  const { announcements: items, loaded, load } = useStorefront()
  const [closed, setClosed] = useState(() => {
    try { return sessionStorage.getItem(KEY) === '1' } catch { return false }
  })
  useEffect(() => { load() }, [load])

  if (closed) return null
  if (!items.length) return loaded ? fallback : <div className="h-8 bg-cocoa" />
  const { bg_color: bg, text_color: fg } = items[0]
  const close = () => {
    setClosed(true)
    try { sessionStorage.setItem(KEY, '1') } catch { /* private mode */ }
  }
  const Item = ({ a }) => (
    <SmartLink to={a.link} className="mx-8 inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:underline" style={{ color: a.text_color }}>
      <span aria-hidden="true">✦</span>{a.text}
    </SmartLink>
  )
  const single = items.length === 1

  return (
    <div className="relative overflow-hidden text-xs font-medium tracking-wide sm:text-sm" style={{ background: bg, color: fg }} role="region" aria-label="Announcements">
      {single ? (
        <div className="flex justify-center py-2 pr-8"><Item a={items[0]} /></div>
      ) : (
        <div className="group flex py-2 pr-8">
          {/* Two identical tracks so the loop is seamless */}
          {[0, 1].map((k) => (
            <div key={k} aria-hidden={k === 1} className="flex shrink-0 animate-marquee group-hover:[animation-play-state:paused]">
              {items.map((a) => <Item key={a.id} a={a} />)}
            </div>
          ))}
        </div>
      )}
      <button onClick={close} aria-label="Hide announcements"
        className="absolute right-0 top-0 h-full px-3 opacity-70 transition hover:opacity-100" style={{ background: bg }}>✕</button>
    </div>
  )
}
