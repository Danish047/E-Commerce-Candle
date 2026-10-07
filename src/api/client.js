import { API_BASE, USE_MOCK } from './config'
import { mockRequest } from './mock/server'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem('auth') || '{}')?.state?.access || null
  } catch {
    return null
  }
}

const buildQuery = (params = {}) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

// Pull a readable message out of a DRF error response
const errorMessage = (data, fallback) => {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const first = Object.values(data)[0]
  return Array.isArray(first) ? first[0] : fallback
}

async function request(method, path, { body, params } = {}) {
  if (USE_MOCK) return mockRequest(method, path, { body, params, token: getToken() })

  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(`Can't reach the server at ${API_BASE}. Is the Django backend running?`, 0)
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(errorMessage(data, 'Something went wrong'), res.status, data)
  return data
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
}
