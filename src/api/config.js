// ─── Central app config ────────────────────────────────────────────
// Use the real backend by default; set VITE_USE_MOCK=true for the local demo.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
// For local development, set VITE_API_BASE=http://localhost:8000/api in .env.
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://e-commerce-candle-backend.onrender.com/api'
export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || ''
// Cash on delivery at checkout. Keep in sync with Admin → Settings → COD.
export const COD_ENABLED = import.meta.env.VITE_COD === 'true'
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP || '918528616464'

export const BRAND = {
  name: 'GenzinIT',
  tagline: 'Hand-poured soy candles that smell like home',
  email: 'genzinit@gmail.com',
  // Put your Instagram profile here (e.g. https://www.instagram.com/yourhandle/) or set VITE_INSTAGRAM.
  // Left empty, the footer simply hides the Instagram link.
  instagram: import.meta.env.VITE_INSTAGRAM || 'https://www.instagram.com/genzinit/',
}

// Must match the backend's rules (used for display; backend is the source of truth)
export const FREE_SHIPPING_ABOVE = 999
export const SHIPPING_FEE = 79
