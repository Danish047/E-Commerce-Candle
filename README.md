# Lumière & Co. — Frontend (store + admin panel)

React + Vite + Tailwind. Two apps in one build:

- **Storefront** at `/`: calls the real API by default; set `VITE_USE_MOCK=true` to use dummy JSON.
- **Admin panel** at `/admin`: dashboard, orders, products and photos, customers, coupons, reviews, messages, newsletter, collections, scent quiz, settings and team. It always talks to the real backend.

The backend is a separate project: **candle-backend** (Django). Its README covers setup, Razorpay and deployment.

## Run it

```bash
npm install
cp .env.example .env     # on Windows: copy .env.example .env
npm run dev
```
Open http://localhost:5173

## Connect to the backend

In `.env`:
```
VITE_USE_MOCK=false
VITE_API_BASE=http://localhost:8000/api
VITE_RAZORPAY_KEY=rzp_test_xxxxxxxx
```
Restart `npm run dev`. The storefront calls the public API endpoints described in `API_CONTRACT.md`; the admin panel continues to call its separate `/api/admin/` endpoints. Set `VITE_USE_MOCK=true` when you want to run the storefront without a backend.

## Admin panel

1. Start the backend (see the candle-backend README) and create your owner login:
   `python manage.py seed_store --owner you@yourmail.com --password "ChooseAStrongOne"`
2. Make sure `VITE_API_BASE` points at it, then open http://localhost:5173/admin and sign in.

- Owners can do everything, including store settings and adding staff (Settings → Team). Staff can run orders, products, customers, coupons, reviews and messages.
- Press `Ctrl K` / `⌘ K` anywhere in the admin to jump to an order, product or customer.
- Admin code lives in `src/admin/` and is loaded only when someone visits `/admin`, so shoppers never download it.
- The admin login is separate from shopper accounts: signing in on the store does not sign you into the admin.

## Where things are

```
src/
├── api/
│   ├── config.js        ← mock switch, brand name, shipping rules, WhatsApp number
│   ├── index.js         ← every API call the app makes (one place)
│   ├── client.js        ← fetch + JWT; routes to mock or real server
│   └── mock/            ← dummy JSON + fake backend (delete later)
├── admin/               ← admin panel: api.js, store.js, components/, pages/
├── store/               ← cart and login state (Zustand)
├── components/          ← Navbar, Footer, CartDrawer, ProductCard, CandleImage…
└── pages/               ← Home, Shop, ProductDetail, Quiz, Cart, Checkout,
                           OrderSuccess, Login/Signup, Account, OrderDetail,
                           About, Contact, CandleCare, Policy, NotFound
```

## Try it in demo mode

Set `VITE_USE_MOCK=true` in `.env` and restart the dev server.

- Coupons: `WELCOME10`, `FLAT150` (above ₹999), `DIWALI20` (above ₹1,999)
- Online payment is simulated in demo mode, so orders go through instantly.
- Sign up with any email to see My Orders, order tracking and reviews.
- Demo data you create is stored in your browser. Clear site data to reset.

## Customise

- Brand name, email, Instagram: `src/api/config.js`
- Colours and fonts: `tailwind.config.js`
- Products: in demo mode `src/api/mock/products.json`; with the backend, the admin panel
- Product photos: add URLs to `images` in each product. Until then, a drawn candle jar in the product's `color` is shown.

## Deploy (Vercel, free)

Import the repo in Vercel → Framework: Vite → add the `.env` values in project settings (`VITE_USE_MOCK=false`, `VITE_API_BASE=https://api.yourdomain.com/api`, `VITE_RAZORPAY_KEY`).
Add your Vercel domain to `CORS_ALLOWED_ORIGINS` in the backend.
`vercel.json` is already included so page refreshes work on every route.
