import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BRAND } from '../../api/config'
import { admin } from '../api'
import { EyeIcon, EyeOffIcon } from '../components/Icons'
import { Button, ErrorState, Field, Input } from '../components/kit'
import { useAdminAuth } from '../store'

function Candle() {
  return (
    <svg viewBox="0 0 220 320" className="h-auto w-[min(62%,260px)]" aria-hidden="true">
      <defs>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A340" stopOpacity=".55" />
          <stop offset="60%" stopColor="#C8763B" stopOpacity=".08" />
          <stop offset="100%" stopColor="#C8763B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wax" x1="0" x2="1">
          <stop offset="0%" stopColor="#E9D6BD" />
          <stop offset="55%" stopColor="#F6EBDC" />
          <stop offset="100%" stopColor="#D8C0A2" />
        </linearGradient>
      </defs>
      <circle cx="110" cy="70" r="95" fill="url(#halo)" className="animate-glow" />
      <g className="origin-[110px_88px] animate-flicker">
        <path d="M110 24c14 20 20 32 20 44a20 20 0 0 1-40 0c0-12 6-24 20-44z" fill="#F4A340" />
        <path d="M110 48c6 9 9 15 9 20a9 9 0 0 1-18 0c0-5 3-11 9-20z" fill="#FFE3A3" />
      </g>
      <path d="M110 88v14" stroke="#211A15" strokeWidth="3" strokeLinecap="round" />
      <rect x="40" y="100" width="140" height="200" rx="18" fill="#fff" opacity=".12" />
      <rect x="48" y="108" width="124" height="186" rx="14" fill="url(#wax)" />
      <path d="M48 124c16 8 30 0 44 6s30 6 44 0 26-4 36 2v-10a14 14 0 0 0-14-14H62a14 14 0 0 0-14 14z" fill="#fff" opacity=".45" />
      <rect x="72" y="178" width="76" height="46" rx="4" fill="#211A15" />
      <rect x="86" y="194" width="48" height="4" rx="2" fill="#F6EBDC" opacity=".85" />
      <rect x="94" y="205" width="32" height="3" rx="1.5" fill="#F6EBDC" opacity=".45" />
    </svg>
  )
}

export default function Login() {
  const { user, notice, signIn } = useAdminAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()
  const from = useLocation().state?.from || '/admin'

  if (user) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      signIn(await admin.auth.login(form.email.trim(), form.password))
      nav(from, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-adm-bg font-ui text-adm-ink lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-adm-side p-10 text-white lg:flex">
        <div className="font-serif text-2xl font-semibold">{BRAND.name}</div>
        <div className="flex flex-1 items-center justify-center"><Candle /></div>
        <p className="max-w-sm font-serif text-[1.7rem] leading-snug text-white/85">
          Every order, jar and review for the shop, in one quiet room.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <p className="mb-8 font-serif text-2xl font-semibold lg:hidden">{BRAND.name}</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight">Sign in to the admin</h1>
          <p className="mt-2 text-sm text-adm-muted">Use the staff account your store owner created for you.</p>

          <div className="mt-8 space-y-4">
            {notice && !error && <div className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{notice}</div>}
            {error && <ErrorState error={error} />}
            <Field label="Email">
              <Input type="email" autoComplete="username" required autoFocus value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-adm-muted hover:text-adm-ink">
                  {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" loading={busy} className="w-full py-2.5">Sign in</Button>
          </div>
          <p className="mt-8 text-xs leading-relaxed text-adm-muted">
            Forgot your password? Ask the store owner to reset it from Settings → Team.
          </p>
        </form>
      </div>
    </div>
  )
}
