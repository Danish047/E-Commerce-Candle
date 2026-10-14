// ─────────────────────────────────────────────────────────────────
// Fake backend: mimics the Django REST API using dummy JSON.
// Data you create (users, orders, reviews) is kept in localStorage.
// Delete this folder once the real backend is live.
// ─────────────────────────────────────────────────────────────────
import productsData from './products.json'
import taxonomy from './taxonomy.json'
import reviewsData from './reviews.json'
import quizData from './quiz.json'
import couponsData from './coupons.json'
import { FREE_SHIPPING_ABOVE, SHIPPING_FEE } from '../config'

class MockError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data || { detail: message }
  }
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))
const clone = (x) => JSON.parse(JSON.stringify(x))

const db = {
  read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`mockdb:${key}`)) ?? fallback
    } catch {
      return fallback
    }
  },
  write(key, value) {
    localStorage.setItem(`mockdb:${key}`, JSON.stringify(value))
  },
}

const allReviews = () => [...reviewsData, ...db.read('reviews', [])]
const allProducts = () => {
  const stock = db.read('stock', {})
  return productsData.map((p) => (stock[p.id] !== undefined ? { ...p, stock: stock[p.id] } : p))
}

const userFromToken = (token) => {
  if (!token?.startsWith('mock.')) return null
  const id = Number(token.split('.')[1])
  return db.read('users', []).find((u) => u.id === id) || null
}
const publicUser = ({ password, ...u }) => u
const requireUser = (token) => {
  const u = userFromToken(token)
  if (!u) throw new MockError('Authentication credentials were not provided.', 401)
  return u
}
const authResponse = (user) => ({
  access: `mock.${user.id}.access`,
  refresh: `mock.${user.id}.refresh`,
  user: publicUser(user),
})

const paginate = (items, page = 1, pageSize = 12) => {
  page = Number(page) || 1
  pageSize = Number(pageSize) || 12
  const start = (page - 1) * pageSize
  return {
    count: items.length,
    next: start + pageSize < items.length ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
    results: items.slice(start, start + pageSize),
  }
}

const applyCoupon = (code, subtotal) => {
  const c = couponsData.find((x) => x.code === String(code || '').trim().toUpperCase())
  if (!c) return { valid: false, discount: 0, message: 'Invalid coupon code' }
  if (subtotal < c.min_order)
    return { valid: false, discount: 0, message: `Add ₹${c.min_order - subtotal} more to use ${c.code}` }
  const discount = c.type === 'percent' ? Math.round((subtotal * c.value) / 100) : c.value
  return { valid: true, code: c.code, discount, message: c.description }
}

// ─── Route handlers ────────────────────────────────────────────────
const routes = [
  ['GET', /^\/products\/$/, ({ params }) => {
    let items = allProducts()
    const { category, mood, occasion, search, min_price, max_price, is_bestseller, is_new, ordering } = params
    if (category) items = items.filter((p) => p.category === category)
    if (mood) items = items.filter((p) => p.moods.includes(mood))
    if (occasion) items = items.filter((p) => p.occasions.includes(occasion))
    if (min_price) items = items.filter((p) => p.price >= Number(min_price))
    if (max_price) items = items.filter((p) => p.price <= Number(max_price))
    if (is_bestseller === 'true') items = items.filter((p) => p.is_bestseller)
    if (is_new === 'true') items = items.filter((p) => p.is_new)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((p) =>
        [p.name, p.tagline, p.description, ...Object.values(p.notes).flat()].join(' ').toLowerCase().includes(q)
      )
    }
    const sorters = {
      price: (a, b) => a.price - b.price,
      '-price': (a, b) => b.price - a.price,
      '-rating': (a, b) => b.rating - a.rating,
      '-reviews_count': (a, b) => b.reviews_count - a.reviews_count,
      '-id': (a, b) => b.id - a.id,
    }
    if (sorters[ordering]) items = [...items].sort(sorters[ordering])
    return paginate(items, params.page, params.page_size)
  }],

  ['GET', /^\/products\/([\w-]+)\/related\/$/, ({ match }) => {
    const p = allProducts().find((x) => x.slug === match[1])
    if (!p) throw new MockError('Not found.', 404)
    return allProducts()
      .filter((x) => x.id !== p.id && (x.category === p.category || x.moods.some((m) => p.moods.includes(m))))
      .slice(0, 4)
  }],

  ['GET', /^\/products\/([\w-]+)\/reviews\/$/, ({ match }) => {
    const p = allProducts().find((x) => x.slug === match[1])
    if (!p) throw new MockError('Not found.', 404)
    return allReviews()
      .filter((r) => r.product_id === p.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }],

  ['POST', /^\/products\/([\w-]+)\/reviews\/$/, ({ match, body, token }) => {
    const user = requireUser(token)
    const p = allProducts().find((x) => x.slug === match[1])
    if (!p) throw new MockError('Not found.', 404)
    if (!body.rating || !body.comment) throw new MockError('Rating and comment are required.', 400)
    const review = {
      id: Date.now(),
      product_id: p.id,
      user_name: user.name,
      rating: Number(body.rating),
      title: body.title || '',
      comment: body.comment,
      created_at: new Date().toISOString().slice(0, 10),
      verified: db.read('orders', []).some((o) => o.user_id === user.id && o.items.some((i) => i.product_id === p.id)),
    }
    db.write('reviews', [...db.read('reviews', []), review])
    return review
  }],

  ['GET', /^\/products\/([\w-]+)\/$/, ({ match }) => {
    const p = allProducts().find((x) => x.slug === match[1])
    if (!p) throw new MockError('Not found.', 404)
    return p
  }],

  ['GET', /^\/categories\/$/, () => taxonomy.categories],
  ['GET', /^\/moods\/$/, () => taxonomy.moods],
  ['GET', /^\/occasions\/$/, () => taxonomy.occasions],

  ['GET', /^\/storefront\/$/, () => ({
    announcements: [
      { id: 1, text: 'Bulk & corporate orders: custom labels from 20 pieces', link: '/bulk-order', bg_color: '#3B2A20', text_color: '#FBF7F1' },
      { id: 2, text: 'Free shipping above ₹999', link: '/shop', bg_color: '#3B2A20', text_color: '#FBF7F1' },
    ],
    banners: {},
  })],
  ['GET', /^\/quiz\/$/, () => quizData],
  ['POST', /^\/quiz\/recommend\/$/, ({ body }) => {
    const { mood, category, occasion } = body.answers || {}
    const scored = allProducts()
      .filter((p) => p.category !== 'gift-sets')
      .map((p) => ({
        p,
        score: (p.moods.includes(mood) ? 3 : 0) + (p.category === category ? 3 : 0) + (p.occasions.includes(occasion) ? 2 : 0) + p.rating / 10,
      }))
      .sort((a, b) => b.score - a.score)
    return { products: scored.slice(0, 3).map((s) => s.p) }
  }],

  ['POST', /^\/auth\/register\/$/, ({ body }) => {
    const { name, email, password, phone } = body
    if (!name || !email || !password) throw new MockError('Name, email and password are required.', 400)
    if (password.length < 8) throw new MockError('Password must be at least 8 characters.', 400)
    const users = db.read('users', [])
    if (users.some((u) => u.email === email.toLowerCase()))
      throw new MockError('An account with this email already exists.', 400)
    const user = { id: users.length + 1, name, email: email.toLowerCase(), phone: phone || '', password }
    db.write('users', [...users, user])
    return authResponse(user)
  }],

  ['POST', /^\/auth\/login\/$/, ({ body }) => {
    const user = db.read('users', []).find((u) => u.email === String(body.email).toLowerCase() && u.password === body.password)
    if (!user) throw new MockError('Invalid email or password.', 401)
    return authResponse(user)
  }],

  ['GET', /^\/auth\/me\/$/, ({ token }) => publicUser(requireUser(token))],

  ['POST', /^\/coupons\/validate\/$/, ({ body }) => applyCoupon(body.code, Number(body.subtotal) || 0)],

  ['GET', /^\/pincode\/(\d{6})\/$/, ({ match }) => {
    const metro = ['11', '40', '56', '60', '70', '50', '45'].includes(match[1].slice(0, 2))
    return { pincode: match[1], serviceable: true, cod_available: true, estimated_days: metro ? '2-3' : '4-6' }
  }],

  ['POST', /^\/orders\/$/, ({ body, token }) => {
    const user = userFromToken(token)
    const { items = [], shipping_address: addr, email, coupon_code, payment_method, gift_note } = body
    if (!items.length) throw new MockError('Your cart is empty.', 400)
    const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode']
    if (!addr || required.some((k) => !addr[k])) throw new MockError('Please fill in the full shipping address.', 400)
    if (!user && !email) throw new MockError('Email is required.', 400)

    const products = allProducts()
    const stock = db.read('stock', {})
    const lines = items.map(({ product_id, quantity }) => {
      const p = products.find((x) => x.id === product_id)
      if (!p) throw new MockError('A product in your cart no longer exists.', 400)
      if (quantity > p.stock) throw new MockError(`Only ${p.stock} left of ${p.name}.`, 400)
      return { product_id: p.id, slug: p.slug, name: p.name, color: p.color, size: p.size, price: p.price, quantity, line_total: p.price * quantity }
    })
    const subtotal = lines.reduce((s, l) => s + l.line_total, 0)
    const coupon = coupon_code ? applyCoupon(coupon_code, subtotal) : { valid: false, discount: 0 }
    const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE
    const total = subtotal - coupon.discount + shipping

    lines.forEach((l) => {
      const p = products.find((x) => x.id === l.product_id)
      stock[l.product_id] = p.stock - l.quantity
    })
    db.write('stock', stock)

    const orders = db.read('orders', [])
    const order = {
      id: orders.length + 1,
      order_number: `LUM${String(10240 + orders.length + 1)}`,
      user_id: user?.id || null,
      email: user?.email || email,
      items: lines,
      subtotal,
      discount: coupon.discount,
      coupon_code: coupon.valid ? coupon.code : null,
      shipping,
      total,
      shipping_address: addr,
      gift_note: gift_note || '',
      payment_method,
      payment_status: 'pending',
      status: payment_method === 'cod' ? 'processing' : 'pending',
      created_at: new Date().toISOString(),
    }
    db.write('orders', [...orders, order])
    return {
      order,
      razorpay: payment_method === 'razorpay'
        ? { order_id: `order_mock_${order.id}`, amount: total * 100, currency: 'INR', key: 'rzp_test_mock' }
        : null,
    }
  }],

  ['POST', /^\/payments\/verify\/$/, ({ body }) => {
    const orders = db.read('orders', [])
    const order = orders.find((o) => o.order_number === body.order_number)
    if (!order) throw new MockError('Order not found.', 404)
    Object.assign(order, { payment_status: 'paid', status: 'processing', razorpay_payment_id: body.razorpay_payment_id })
    db.write('orders', orders)
    return { order }
  }],

  ['GET', /^\/orders\/$/, ({ token }) => {
    const user = requireUser(token)
    return db.read('orders', []).filter((o) => o.user_id === user.id).reverse()
  }],

  ['GET', /^\/orders\/(\w+)\/$/, ({ match, token }) => {
    const user = requireUser(token)
    const order = db.read('orders', []).find((o) => o.order_number === match[1] && o.user_id === user.id)
    if (!order) throw new MockError('Not found.', 404)
    return order
  }],

  ['POST', /^\/contact\/$/, ({ body }) => {
    if (!body.name || !body.email || !body.message) throw new MockError('Please fill in all required fields.', 400)
    return { detail: 'Thanks! We will get back to you within 24 hours.' }
  }],

  ['POST', /^\/newsletter\/$/, ({ body }) => {
    if (!/^\S+@\S+\.\S+$/.test(body.email || '')) throw new MockError('Enter a valid email.', 400)
    return { detail: "You're on the list! Check your inbox for 10% off." }
  }],
]

export async function mockRequest(method, path, { body = {}, params = {}, token } = {}) {
  await delay()
  for (const [m, re, handler] of routes) {
    const match = m === method && path.match(re)
    if (match) {
      try {
        return clone(handler({ match, body: body || {}, params: params || {}, token }))
      } catch (e) {
        if (e instanceof MockError) throw e
        throw new MockError(e.message || 'Server error', 500)
      }
    }
  }
  throw new MockError(`Mock route not found: ${method} ${path}`, 404)
}
