import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="font-serif text-8xl font-semibold text-ember">404</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold">This page burned out</h1>
      <p className="mt-2 text-cocoa-soft">We couldn't find what you were looking for.</p>
      <Link to="/shop" className="btn-primary mt-8">Shop candles</Link>
    </div>
  )
}
