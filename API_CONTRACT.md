# API Contract

The React app calls these endpoints. The dummy backend in `src/api/mock/server.js` follows this exact contract, so the Django backend must return the **same JSON shapes**.

- **Base URL:** `VITE_API_BASE` (e.g. `http://localhost:8000/api`)
- **Auth:** JWT. Send `Authorization: Bearer <access>` on 🔒 endpoints.
- **Errors:** DRF style, e.g. `{ "detail": "message" }` or `{ "field": ["message"] }`, with a 4xx status.
- **Money:** whole rupees (integers). Razorpay `amount` is in paise.

---

## Catalog

### `GET /products/`
Query params (all optional):

| Param | Example | Notes |
|---|---|---|
| `category` | `spicy` | category slug |
| `mood` | `cosy` | mood slug |
| `occasion` | `diwali` | occasion slug |
| `search` | `chai` | name, tagline, description, notes |
| `min_price`, `max_price` | `700`, `999` | inclusive |
| `is_bestseller`, `is_new` | `true` | |
| `ordering` | `price`, `-price`, `-rating`, `-reviews_count`, `-id` | |
| `page`, `page_size` | `1`, `9` | |

Response:
```json
{ "count": 12, "next": 2, "previous": null, "results": [Product] }
```

**Product**
```json
{
  "id": 1, "slug": "monsoon-chai", "name": "Monsoon Chai",
  "tagline": "…", "description": "…",
  "price": 899, "compare_price": 1099, "size": "200g",
  "category": "spicy", "moods": ["cosy"], "occasions": ["diwali"],
  "notes": { "top": ["Petrichor"], "middle": ["Ginger"], "base": ["Tonka"] },
  "burn_time_hours": 45, "wax_type": "100% Soy", "wick_type": "Cotton", "fragrance_load": "10%",
  "stock": 34, "rating": 4.8, "reviews_count": 126,
  "is_bestseller": true, "is_new": false,
  "color": "#C99A6B", "images": ["https://res.cloudinary.com/…"]
}
```
`compare_price` can be `null`. `color` is used as a fallback when `images` is empty.

### `GET /products/{slug}/` → `Product` (404 if not found)
### `GET /products/{slug}/related/` → `[Product]` (max 4, same category or mood)
### `GET /categories/` → `[{ id, slug, name, description }]`
### `GET /moods/` → `[{ id, slug, name }]`
### `GET /occasions/` → `[{ id, slug, name }]`

---

## Reviews

### `GET /products/{slug}/reviews/` → newest first
```json
[{ "id": 1, "product_id": 1, "user_name": "Priya S.", "rating": 5, "title": "…", "comment": "…", "created_at": "2026-08-14", "verified": true }]
```
### `POST /products/{slug}/reviews/` 🔒
Body `{ "rating": 5, "title": "", "comment": "…" }` → the created review. `verified` = the user has bought this product.

---

## Scent Quiz

### `GET /quiz/`
```json
{ "questions": [{ "id": "mood", "question": "…", "options": [{ "value": "calm", "label": "Calm & relaxed" }] }] }
```
Question ids used: `mood`, `category`, `occasion`.

### `POST /quiz/recommend/`
Body `{ "answers": { "mood": "cosy", "category": "spicy", "occasion": "diwali" } }` → `{ "products": [Product, Product, Product] }`
Scoring: +3 mood match, +3 category match, +2 occasion match, then rating. Exclude gift sets.

---

## Auth

### `POST /auth/register/`
Body `{ "name", "email", "phone"?, "password" }` (password ≥ 8 chars)
### `POST /auth/login/`
Body `{ "email", "password" }` → 401 on wrong credentials

Both return:
```json
{ "access": "jwt…", "refresh": "jwt…", "user": { "id": 1, "name": "Priya", "email": "…", "phone": "…" } }
```
### `GET /auth/me/` 🔒 → `user`

---

## Checkout

### `POST /coupons/validate/`
Body `{ "code": "WELCOME10", "subtotal": 1798 }`
```json
{ "valid": true, "code": "WELCOME10", "discount": 180, "message": "10% off your first order" }
```
Invalid → `{ "valid": false, "discount": 0, "message": "Invalid coupon code" }` (status 200).

### `GET /pincode/{pincode}/`
```json
{ "pincode": "452001", "serviceable": true, "cod_available": true, "estimated_days": "4-6" }
```

---

## Orders & Payments

### `POST /orders/` (guest or 🔒)
```json
{
  "items": [{ "product_id": 1, "quantity": 2 }],
  "shipping_address": { "name", "phone", "line1", "line2", "city", "state", "pincode" },
  "email": "guest@x.com",
  "coupon_code": "WELCOME10",
  "payment_method": "razorpay",
  "gift_note": ""
}
```
`email` is required only for guests. `payment_method` is `razorpay` or `cod`.

The backend must **recalculate prices, stock, coupon and shipping** (free shipping from ₹999, otherwise ₹79). Never trust totals from the browser.

Response:
```json
{
  "order": Order,
  "razorpay": { "order_id": "order_XXXX", "amount": 159900, "currency": "INR", "key": "rzp_live_…" }
}
```
`razorpay` is `null` for COD.

**Order**
```json
{
  "id": 1, "order_number": "LUM10241", "email": "…",
  "items": [{ "product_id": 1, "slug": "monsoon-chai", "name": "Monsoon Chai", "color": "#C99A6B", "size": "200g", "price": 899, "quantity": 2, "line_total": 1798 }],
  "subtotal": 1798, "discount": 180, "coupon_code": "WELCOME10", "shipping": 0, "total": 1618,
  "shipping_address": { … }, "gift_note": "",
  "payment_method": "razorpay", "payment_status": "pending | paid | failed",
  "status": "pending | processing | shipped | delivered | cancelled",
  "tracking_url": null,
  "created_at": "2026-09-29T10:00:00Z"
}
```

### `POST /payments/verify/`
Body `{ "order_number", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }`
Verify the signature with the Razorpay secret, then mark the order `paid` + `processing`. Returns `{ "order": Order }`.

### `GET /orders/` 🔒 → `[Order]`, newest first
### `GET /orders/{order_number}/` 🔒 → `Order` (only the owner's)

---

## Misc

### `POST /contact/`
Body `{ "name", "email", "phone"?, "topic", "message" }` → `{ "detail": "Thanks! …" }`
### `POST /newsletter/`
Body `{ "email" }` → `{ "detail": "You're on the list! …" }`

---

## Admin API

The staff endpoints under `/api/admin/` (used by `src/admin/`) are documented in the candle-backend README, section "Admin API at a glance".
