import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { Field } from '../components/ui'

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="container-x flex justify-center py-16">
      <div className="w-full max-w-md rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-sand">
        <h1 className="font-serif text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-cocoa-soft">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}

export function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/account'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to track orders and check out faster.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-cocoa-soft">
        New here? <Link to="/signup" state={{ from }} className="font-medium text-cocoa underline">Create an account</Link>
      </p>
    </AuthShell>
  )
}

export function Signup() {
  const register = useAuth((s) => s.register)
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/account'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setBusy(true)
    setError('')
    try {
      await register(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Save your addresses and track every order.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input required className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Email"><input type="email" required className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Mobile (optional)"><input className="input" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Field>
        <Field label="Password" hint="At least 8 characters"><input type="password" required className="input" value={form.password} onChange={set('password')} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-cocoa-soft">
        Already have an account? <Link to="/login" state={{ from }} className="font-medium text-cocoa underline">Log in</Link>
      </p>
    </AuthShell>
  )
}
