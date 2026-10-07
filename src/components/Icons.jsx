const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' }
const I = (d) => ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className} aria-hidden="true">{d}</svg>
)

export const BagIcon = I(<><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></>)
export const UserIcon = I(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>)
export const SearchIcon = I(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>)
export const MenuIcon = I(<path d="M4 7h16M4 12h16M4 17h16" />)
export const CloseIcon = I(<path d="M6 6l12 12M18 6L6 18" />)
export const TruckIcon = I(<><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>)
export const LeafIcon = I(<><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15" /><path d="M5 19l8-8" /></>)
export const HandIcon = I(<><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 16l-1-3a1.5 1.5 0 0 1 2.7-1.2L8 15" /></>)
export const GiftIcon = I(<><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" /><path d="M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" /></>)
export const FlameIcon = I(<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-2 1-4 3-6 0 2 1 3 2 3 0-3 0-5 1-8z" />)
export const ClockIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const CheckIcon = I(<path d="M5 12l5 5L20 7" />)
export const WhatsAppIcon = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z" />
  </svg>
)
