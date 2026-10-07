import { useParams } from 'react-router-dom'
import { BRAND } from '../api/config'
import { PageHeader } from '../components/ui'
import NotFound from './NotFound'

// Placeholder policy text — review with your own terms before going live.
const POLICIES = {
  shipping: {
    title: 'Shipping Policy',
    body: (
      <>
        <h2>Processing time</h2>
        <p>Orders are packed and shipped within 1–2 business days. Festive season orders may take an extra day.</p>
        <h2>Delivery time</h2>
        <ul><li>Metro cities: 2–4 business days</li><li>Rest of India: 4–7 business days</li></ul>
        <h2>Shipping charges</h2>
        <p>Free shipping on orders above ₹999. A flat ₹79 applies to smaller orders.</p>
        <h2>Tracking</h2>
        <p>You'll get a tracking link by email and WhatsApp once your order ships.</p>
      </>
    ),
  },
  returns: {
    title: 'Returns & Refunds',
    body: (
      <>
        <h2>Damaged or wrong item</h2>
        <p>Candles are fragile. If your order arrives damaged or incorrect, email us an unboxing video within 48 hours of delivery and we'll send a free replacement or a full refund.</p>
        <h2>Change of mind</h2>
        <p>For hygiene reasons, we can't accept returns on used or lit candles. Unopened items can be returned within 7 days; return shipping is paid by the customer.</p>
        <h2>Refunds</h2>
        <p>Approved refunds are processed to your original payment method within 5–7 business days.</p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <p>We collect only the information needed to process your orders and improve your experience: your name, contact details, address and order history.</p>
        <h2>How we use it</h2>
        <ul><li>To deliver your orders and send updates</li><li>To send offers, only if you subscribe</li><li>To improve our website</li></ul>
        <h2>Payments</h2>
        <p>Payments are handled securely by Razorpay. We never store your card or UPI details.</p>
        <h2>Contact</h2>
        <p>For any privacy question, email {BRAND.email}.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    body: (
      <>
        <p>By using this website and placing an order, you agree to these terms.</p>
        <h2>Products</h2>
        <p>Handmade candles may vary slightly in colour and surface finish. This is part of their charm, not a defect.</p>
        <h2>Pricing</h2>
        <p>All prices are in Indian Rupees and include applicable taxes. We may change prices without notice; you pay the price shown at checkout.</p>
        <h2>Safety</h2>
        <p>Always follow our candle care guide. We are not responsible for damage caused by unsafe use.</p>
      </>
    ),
  },
}

export default function Policy() {
  const { type } = useParams()
  const policy = POLICIES[type]
  if (!policy) return <NotFound />
  return (
    <>
      <PageHeader title={policy.title} />
      <article className="prose-lite container-x mt-8 max-w-3xl">{policy.body}</article>
    </>
  )
}
