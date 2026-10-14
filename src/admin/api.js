import { API_BASE } from '../api/config'
import { useAdminAuth } from './store'

// The admin panel always talks to the real Django API (never the demo mock).
const BASE = `${API_BASE}/admin`

export class AdminError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data || {}
  }
  // Field errors from DRF: { price: ['…'] } → { price: '…' }
  get fields() {
    const out = {}
    Object.entries(this.data || {}).forEach(([k, v]) => {
      if (k !== 'detail') out[k] = Array.isArray(v) ? v[0] : String(v)
    })
    return out
  }
}

const message = (data, status) => {
  if (!data) return status >= 500 ? 'The server hit a problem. Try again in a moment.' : 'Request failed.'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const first = Object.values(data)[0]
  return Array.isArray(first) ? first[0] : 'Please check the highlighted fields.'
}

const query = (params = {}) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && q.append(k, v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

let refreshing = null
async function refreshToken() {
  const { refresh, setTokens, logout } = useAdminAuth.getState()
  if (!refresh) return false
  refreshing ??= fetch(`${BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
    .then(async (r) => {
      if (!r.ok) throw new Error('expired')
      const d = await r.json()
      setTokens(d.access, d.refresh || refresh)
      return true
    })
    .catch(() => {
      logout('Your session expired. Sign in again.')
      return false
    })
    .finally(() => setTimeout(() => (refreshing = null), 0))
  return refreshing
}

async function request(method, path, { body, params, raw, retry = true } = {}) {
  const headers = {}
  const { access } = useAdminAuth.getState()
  if (access) headers.Authorization = `Bearer ${access}`
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE}${path}${query(params)}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new AdminError(`Can't reach the server at ${API_BASE}. Is the Django backend running?`, 0)
  }

  if (res.status === 401 && retry && path !== '/auth/login/') {
    if (await refreshToken()) return request(method, path, { body, params, raw, retry: false })
  }
  if (raw && res.ok) return res
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new AdminError(message(data, res.status), res.status, data)
  return data
}

export const http = {
  get: (p, params) => request('GET', p, { params }),
  post: (p, body) => request('POST', p, { body }),
  patch: (p, body) => request('PATCH', p, { body }),
  put: (p, body) => request('PUT', p, { body }),
  del: (p) => request('DELETE', p),
}

// Downloads a CSV export with the admin token attached
export async function download(path, params, filename) {
  const res = await request('GET', path, { params, raw: true })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const crud = (base) => ({
  list: (params) => http.get(`/${base}/`, params),
  get: (id) => http.get(`/${base}/${id}/`),
  create: (data) => http.post(`/${base}/`, data),
  update: (id, data) => http.patch(`/${base}/${id}/`, data),
  remove: (id) => http.del(`/${base}/${id}/`),
})

export const admin = {
  auth: {
    login: (email, password) => http.post('/auth/login/', { email, password }),
    me: () => http.get('/auth/me/'),
    updateMe: (data) => http.patch('/auth/me/', data),
    changePassword: (data) => http.post('/auth/password/', data),
  },
  dashboard: (days) => http.get('/dashboard/', { days }),
  search: (q) => http.get('/search/', { q }),
  navCounts: () => http.get('/nav-counts/'),

  products: {
    ...crud('products'),
    duplicate: (id) => http.post(`/products/${id}/duplicate/`),
    addImage: (id, fileOrUrl) => {
      if (typeof fileOrUrl === 'string') return http.post(`/products/${id}/images/`, { url: fileOrUrl })
      const fd = new FormData()
      fd.append('image', fileOrUrl)
      return http.post(`/products/${id}/images/`, fd)
    },
    removeImage: (id, imageId) => http.del(`/products/${id}/images/${imageId}/`),
    reorderImages: (id, ids) => http.post(`/products/${id}/images/reorder/`, { ids }),
    bulk: (ids, action, extra = {}) => http.post('/products/bulk/', { ids, action, ...extra }),
  },
  categories: crud('categories'),
  moods: crud('moods'),
  occasions: crud('occasions'),
  orders: {
    list: (params) => http.get('/orders/', params),
    get: (num) => http.get(`/orders/${num}/`),
    update: (num, data) => http.patch(`/orders/${num}/`, data),
    note: (num, message) => http.post(`/orders/${num}/note/`, { message }),
    export: (params) => download('/orders/export/', params, 'orders.csv'),
  },
  coupons: crud('coupons'),
  customers: {
    list: (params) => http.get('/customers/', params),
    get: (id) => http.get(`/customers/${id}/`),
    update: (id, data) => http.patch(`/customers/${id}/`, data),
    export: (params) => download('/customers/export/', params, 'customers.csv'),
  },
  reviews: crud('reviews'),
  messages: crud('messages'),
  subscribers: { ...crud('subscribers'), export: () => download('/subscribers/export/', {}, 'subscribers.csv') },
  quiz: crud('quiz'),
  announcements: crud('announcements'),
  banners: crud('banners'),
  staff: crud('staff'),
  settings: {
    get: () => http.get('/settings/'),
    update: (data) => http.patch('/settings/', data),
  },
}
