// ─── Central app config ────────────────────────────────────────────
// Use the real backend by default; set VITE_USE_MOCK=true for the local demo.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
// For local development, set VITE_API_BASE=http://localhost:8000/api in .env.
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://e-commerce-candle-backend.onrender.com/api'
export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || ''
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP || '918528616464'

export const BRAND = {
  name: 'GenZ In It.',
  tagline: 'Hand-poured soy candles that smell like home',
  email: 'genzinit@gmail.com',
  instagram: 'https://genzinit.com/',
}

// Must match the backend's rules (used for display; backend is the source of truth)
export const FREE_SHIPPING_ABOVE = 999
export const SHIPPING_FEE = 79
