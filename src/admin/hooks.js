import { useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

// const { data, loading, error, reload, setData } = useQuery(() => admin.x.list(params), [deps])
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    let alive = true
    // keep old data visible while refetching so tables don't flash
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState((s) => ({ data: first.current ? null : s.data, loading: false, error })))
      .finally(() => (first.current = false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), [])
  return { ...state, reload, setData }
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// Keeps list filters in the URL so refresh/back keeps your place
export function useFilters(defaults = {}) {
  const [sp, setSp] = useSearchParams()
  const filters = { ...defaults }
  sp.forEach((v, k) => (filters[k] = v))
  const set = (patch) => {
    const next = { ...filters, ...patch }
    if (!('page' in patch)) next.page = 1
    const clean = {}
    Object.entries(next).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && String(v) !== String(defaults[k] ?? '')) clean[k] = v
    })
    setSp(clean, { replace: true })
  }
  return [filters, set]
}

export const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', opts) : '—'
export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'
export const timeAgo = (iso) => {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`
  return fmtDate(iso)
}
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const compactInr = (n) => {
  n = Number(n || 0)
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`
  return `₹${n}`
}
