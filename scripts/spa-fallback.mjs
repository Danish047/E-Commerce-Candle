// Render static sites return "Not Found" when a page like /shop is opened or refreshed directly,
// because only dist/index.html exists. This copies index.html to every app route (and to 404.html)
// so deep links load the React app, which then shows the right page.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const INDEX = join(DIST, 'index.html')
if (!existsSync(INDEX)) {
  console.error('spa-fallback: dist/index.html not found, run vite build first')
  process.exit(1)
}

const ROUTES = [
  'shop', 'quiz', 'cart', 'checkout', 'login', 'signup', 'account', 'about', 'contact', 'candle-care',
  'policies/shipping', 'policies/returns', 'policies/privacy', 'policies/terms',
  'admin', 'admin/login', 'admin/orders', 'admin/products', 'admin/customers', 'admin/coupons',
  'admin/reviews', 'admin/messages', 'admin/subscribers', 'admin/collections', 'admin/quiz', 'admin/settings',
]

copyFileSync(INDEX, join(DIST, '404.html'))
for (const route of ROUTES) {
  const dir = join(DIST, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(INDEX, join(dir, 'index.html'))
}
console.log(`spa-fallback: index.html copied to 404.html and ${ROUTES.length} routes`)
