"use strict";
import { http } from './client'

// ─────────────────────────────────────────────────────────────────
// All backend endpoints live here. Pages only import `api`.
// The full request/response contract is in API_CONTRACT.md.
// ─────────────────────────────────────────────────────────────────
export const api = {
  storefront: () => http.get('/storefront/'),

  catalog: {
    // ?category=&mood=&occasion=&min_price=&max_price=&search=&ordering=&page=&page_size=
    products: (params) => http.get('/products/', params),
    product: (slug) => http.get(`/products/${slug}/`),
    related: (slug) => http.get(`/products/${slug}/related/`),
    categories: () => http.get('/categories/'),
    moods: () => http.get('/moods/'),
    occasions: () => http.get('/occasions/'),
  },

  reviews: {
    list: (slug) => http.get(`/products/${slug}/reviews/`),
    create: (slug, data) => http.post(`/products/${slug}/reviews/`, data),
  },

  quiz: {
    questions: () => http.get('/quiz/'),
    recommend: (answers) => http.post('/quiz/recommend/', { answers }),
  },

  auth: {
    register: (data) => http.post('/auth/register/', data),
    login: (data) => http.post('/auth/login/', data),
    me: () => http.get('/auth/me/'),
  },

  checkout: {
    validateCoupon: (code, subtotal) => http.post('/coupons/validate/', { code, subtotal }),
    checkPincode: (pincode) => http.get(`/pincode/${pincode}/`),
  },

  orders: {
    create: (data) => http.post('/orders/', data),
    verifyPayment: (data) => http.post('/payments/verify/', data),
    list: () => http.get('/orders/'),
    detail: (orderNumber) => http.get(`/orders/${orderNumber}/`),
  },

  misc: {
    contact: (data) => http.post('/contact/', data),
    newsletter: (email) => http.post('/newsletter/', { email }),
  },
}
